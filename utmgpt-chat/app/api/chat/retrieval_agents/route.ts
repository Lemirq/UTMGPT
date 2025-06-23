import { NextRequest, NextResponse } from 'next/server';
import { Message as VercelChatMessage, StreamingTextResponse } from 'ai';

import { createClient } from '@supabase/supabase-js';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/huggingface_transformers';

import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { AIMessage, BaseMessage, ChatMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { createRetrieverTool } from 'langchain/tools/retriever';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { Document } from '@langchain/core/documents';

// Removed edge runtime to support HuggingFace transformers

const convertVercelMessageToLangChainMessage = (message: VercelChatMessage) => {
  if (message.role === 'user') {
    return new HumanMessage(message.content);
  } else if (message.role === 'assistant') {
    return new AIMessage(message.content);
  } else {
    return new ChatMessage(message.content, message.role);
  }
};

const convertLangChainMessageToVercelMessage = (message: BaseMessage) => {
  if (message._getType() === 'human') {
    return { content: message.content, role: 'user' };
  } else if (message._getType() === 'ai') {
    return {
      content: message.content,
      role: 'assistant',
      tool_calls: (message as AIMessage).tool_calls,
    };
  } else {
    return { content: message.content, role: message._getType() };
  }
};

const AGENT_SYSTEM_TEMPLATE = `You are UTMGPT, an intelligent, helpful, and friendly virtual assistant for the University of Toronto Mississauga (UTM).

Your job is to provide students, parents, staff, and prospective applicants with accurate, detailed, and practical information about UTM. This includes topics such as admissions, academic programs, campus life, support services, deadlines, and policies.

You have access to a UTM Search Information Tool that retrieves official and up-to-date university data. Use this tool whenever a user asks a question related to UTM. Combine insights from this tool with your prior knowledge to give the most informative, helpful, and complete response.

Response Guidelines:

- Be comprehensive and accurate. Do not leave out helpful details.
- Anticipate related needs. For example, if a student asks about a course, also mention prerequisites, how to enroll, or common student tips.
- Explain step-by-step when walking users through processes like applying or booking an appointment.
- Use a warm, conversational tone while being professional and informative.
- Format multi-part answers clearly, using concise sections or numbered steps when appropriate.
- Always mention if something may change over time (such as admission policies), and advise users to confirm with official sources if needed.
- If you are not confident in your answer, reply honestly and suggest visiting a relevant UTM resource or office. Do not make up information.
- If a question involves a topic you have not been trained on, let the person know and guide them to utm.utoronto.ca or the appropriate department.

Behavior Rules:

- Do not give personal opinions or make speculative claims.
- Do not generate responses that include harmful, discriminatory, or inappropriate content, even if requested.
- If a question contains false or misleading assumptions, gently correct them.
- Do not answer questions about real individuals (such as professors or students) unless the data is publicly available on the UTM website.
- Do not provide help with malicious, illegal, or unethical requests.
- If a user is upset or frustrated, respond calmly and helpfully, while staying on topic.

Note:

UTMGPT was last updated based on information available up to June 20, 2025. If asked about more recent changes, politely inform the user that things may have changed and recommend checking the official UTM website or contacting support directly.`;

/**
 * This handler initializes and calls a tool calling ReAct agent with UTM-specific retrieval.
 * See the docs for more information:
 *
 * https://langchain-ai.github.io/langgraphjs/tutorials/quickstart/
 * https://js.langchain.com/docs/use_cases/question_answering/conversational_retrieval_agents
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    /**
     * We represent intermediate steps as system messages for display purposes,
     * but don't want them in the chat history.
     */
    const messages = (body.messages ?? [])
      .filter((message: VercelChatMessage) => message.role === 'user' || message.role === 'assistant')
      .map(convertVercelMessageToLangChainMessage);
    const returnIntermediateSteps = body.show_intermediate_steps;

    console.log('🤖 UTM Agent Process Started');
    console.log('💬 Messages count:', messages.length);
    console.log('🔧 Return intermediate steps:', returnIntermediateSteps);

    const chatModel = new ChatGoogleGenerativeAI({
      model: 'gemini-2.0-flash',
      temperature: 0.3,
      maxRetries: 2, // Add retry limit
      timeout: 30000, // 30 second timeout
    });

    console.log('🤖 Gemini model initialized');

    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    console.log('🗄️ Supabase client connected');

    const vectorstore = new SupabaseVectorStore(
      new HuggingFaceTransformersEmbeddings({
        model: 'Xenova/all-MiniLM-L6-v2',
        timeout: 20000, // 20 second timeout for embeddings
      }),
      {
        client,
        tableName: 'utmgpt_chunks',
        queryName: 'match_documents_uuid',
      }
    );
    console.log('🧠 Vector store initialized with HuggingFace embeddings');

    // Store sources for later retrieval using global variable
    let capturedSources: Document[] = [];

    const retriever = vectorstore.asRetriever({
      k: 15, // Further reduced to 3 for faster processing
      searchType: 'similarity',
      searchKwargs: {
        fetchK: 30, // Fetch more initially but return only top 3
      },
      callbacks: [
        {
          handleRetrieverEnd(documents) {
            console.log('📚 Agent retrieved documents:', documents.length);
            // Capture sources for response headers
            capturedSources = [...capturedSources, ...documents];

            const contextText = capturedSources
              .slice(0, 5) // top 5 docs
              .map((doc) => `SOURCE:\n${doc.pageContent}`)
              .join('\n\n');

            // Prepend it as context
            messages.unshift(new SystemMessage(`Use the following UTM context:\n\n${contextText}`));

            console.log('🔗 Captured sources count:', capturedSources.length);
          },
        },
      ],
    });

    /**
     * Wrap the retriever in a tool to present it to the agent in a
     * usable form.
     */
    const tool = createRetrieverTool(retriever, {
      name: 'search_utm_information',
      description:
        'Search UTM information. Use this when you need specific details about University of Toronto Mississauga programs, admissions, buildings, services, or policies.',
    });

    console.log('🔧 UTM search tool created');

    /**
     * Use a prebuilt LangGraph agent.
     */
    const agent = await createReactAgent({
      llm: chatModel,
      tools: [tool],
      /**
       * Modify the stock prompt in the prebuilt agent. See docs
       * for how to customize your agent:
       *
       * https://langchain-ai.github.io/langgraphjs/tutorials/quickstart/
       */
      messageModifier: new SystemMessage(AGENT_SYSTEM_TEMPLATE),
    });

    console.log('🤖 UTM ReAct agent created');

    if (!returnIntermediateSteps) {
      /**
       * For streaming mode, we need to run the agent first to capture sources,
       * then stream the final response.
       */
      console.log('🌊 Running agent to capture sources first...');

      const result = await agent.invoke(
        { messages },
        {
          recursionLimit: 5,
          configurable: { thread_id: 'utm-chat' },
        }
      );

      console.log('✅ Agent completed');
      console.log('📊 Result messages count:', result.messages.length);
      console.log('📊 Final captured sources for response:', capturedSources.length);

      // Get the final assistant message
      const finalMessage = result.messages.find((msg) => msg._getType() === 'ai' && msg.content);

      if (!finalMessage) {
        throw new Error('No final response from agent');
      }

      // Stream the final response
      const textEncoder = new TextEncoder();
      const content = finalMessage.content as string;

      const transformStream = new ReadableStream({
        start(controller) {
          // Stream the content character by character for a natural effect
          let i = 0;
          const streamInterval = setInterval(() => {
            if (i < content.length) {
              controller.enqueue(textEncoder.encode(content[i]));
              i++;
            } else {
              clearInterval(streamInterval);
              controller.close();
            }
          }, 10);
        },
      });

      // Prepare sources for response headers
      const serializedSources =
        capturedSources.length > 0
          ? Buffer.from(
              JSON.stringify(
                capturedSources.map((doc) => {
                  return {
                    pageContent: doc.pageContent.slice(0, 50) + '...',
                    metadata: doc.metadata,
                  };
                })
              )
            ).toString('base64')
          : '';

      const headers: Record<string, string> = {
        'x-message-index': (messages.length + 1).toString(),
      };

      if (serializedSources) {
        headers['x-sources'] = serializedSources;
        console.log('📤 Sending sources in headers');
      } else {
        console.log('❌ No sources to send');
      }

      return new StreamingTextResponse(transformStream, { headers });
    } else {
      /**
       * We could also pick intermediate steps out from `streamEvents` chunks, but
       * they are generated as JSON objects, so streaming and displaying them with
       * the AI SDK is more complicated.
       */
      console.log('🔄 Running agent with intermediate steps...');

      const result = await agent.invoke(
        { messages },
        {
          recursionLimit: 5,
          configurable: { thread_id: 'utm-chat' },
        }
      );

      console.log('✅ Agent completed, returning messages');
      console.log('📊 Result messages count:', result.messages.length);
      console.log('📊 Final captured sources for response:', capturedSources.length);

      // Prepare sources for response headers
      const serializedSources =
        capturedSources.length > 0
          ? Buffer.from(
              JSON.stringify(
                capturedSources.map((doc) => {
                  return {
                    pageContent: doc.pageContent.slice(0, 50) + '...',
                    metadata: doc.metadata,
                  };
                })
              )
            ).toString('base64')
          : '';

      const headers: Record<string, string> = {};

      if (serializedSources) {
        headers['x-message-index'] = (messages.length + 1).toString();
        headers['x-sources'] = serializedSources;
        console.log('📤 Sending sources in headers for intermediate steps');
      } else {
        console.log('❌ No sources to send for intermediate steps');
      }

      // Prepare sources data
      console.log('🔍 Debug captured sources structure:');
      capturedSources.forEach((doc, i) => {
        console.log(`Source ${i}:`, {
          pageContent: doc.pageContent?.slice(0, 50) + '...',
          metadata: doc.metadata,
          hasUrl: !!doc.metadata?.url,
        });
      });

      const sourcesData = capturedSources.map((doc) => {
        // Try to extract URL from different possible locations
        const url = doc.metadata?.url || doc.url || null;
        console.log('🔗 Extracting URL:', { url, metadata: doc.metadata });

        return {
          pageContent: doc.pageContent.slice(0, 100) + '...',
          metadata: doc.metadata,
          url: url,
        };
      });

      console.log('📤 Final sources data being sent:', sourcesData);

      return NextResponse.json(
        {
          messages: result.messages.map(convertLangChainMessageToVercelMessage),
          sources: sourcesData,
        },
        {
          status: 200,
        }
      );
    }
  } catch (e: any) {
    console.error('❌ UTM Agent Error:', e.message);
    console.error('🔍 Error details:', e);
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
