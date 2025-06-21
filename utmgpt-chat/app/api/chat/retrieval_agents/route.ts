import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";

import { createClient } from "@supabase/supabase-js";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";

import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import {
  AIMessage,
  BaseMessage,
  ChatMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { createRetrieverTool } from "langchain/tools/retriever";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { Document } from "@langchain/core/documents";

// Removed edge runtime to support HuggingFace transformers

const convertVercelMessageToLangChainMessage = (message: VercelChatMessage) => {
  if (message.role === "user") {
    return new HumanMessage(message.content);
  } else if (message.role === "assistant") {
    return new AIMessage(message.content);
  } else {
    return new ChatMessage(message.content, message.role);
  }
};

const convertLangChainMessageToVercelMessage = (message: BaseMessage) => {
  if (message._getType() === "human") {
    return { content: message.content, role: "user" };
  } else if (message._getType() === "ai") {
    return {
      content: message.content,
      role: "assistant",
      tool_calls: (message as AIMessage).tool_calls,
    };
  } else {
    return { content: message.content, role: message._getType() };
  }
};

const AGENT_SYSTEM_TEMPLATE = `You are a helpful and knowledgeable assistant for the University of Toronto Mississauga (UTM). Your role is to provide detailed, comprehensive, and informative answers about UTM's programs, services, campus life, admissions, and any other university-related topics.

When answering questions:
- Be thorough and provide comprehensive information
- Include specific details, examples, and helpful context
- Explain processes step-by-step when relevant
- Mention related information that might be useful to students
- Use a friendly, conversational tone while being informative
- If providing lists or multiple points, organize them clearly
- Include practical advice and tips when appropriate

If you don't know how to answer a question or need more specific information about UTM, use the available tools to search for relevant information from the university's resources.`;

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
      .filter(
        (message: VercelChatMessage) =>
          message.role === "user" || message.role === "assistant",
      )
      .map(convertVercelMessageToLangChainMessage);
    const returnIntermediateSteps = body.show_intermediate_steps;

    console.log("🤖 UTM Agent Process Started");
    console.log("💬 Messages count:", messages.length);
    console.log("🔧 Return intermediate steps:", returnIntermediateSteps);

    const chatModel = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash",
      temperature: 0.3,
      maxRetries: 2, // Add retry limit
      timeout: 30000, // 30 second timeout
    });

    console.log("🤖 Gemini model initialized");

    const client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PRIVATE_KEY!,
    );
    console.log("🗄️ Supabase client connected");

    const vectorstore = new SupabaseVectorStore(
      new HuggingFaceTransformersEmbeddings({
        model: "Xenova/all-MiniLM-L6-v2",
        timeout: 20000, // 20 second timeout for embeddings
      }),
      {
        client,
        tableName: "utmgpt_chunks",
        queryName: "match_documents_uuid",
      },
    );
    console.log("🧠 Vector store initialized with HuggingFace embeddings");

    // Store sources for later retrieval using global variable
    let capturedSources: Document[] = [];

    const retriever = vectorstore.asRetriever({
      k: 15, // Further reduced to 3 for faster processing
      searchType: "similarity",
      searchKwargs: {
        fetchK: 30, // Fetch more initially but return only top 3
      },
      callbacks: [
        {
          handleRetrieverEnd(documents) {
            console.log("📚 Agent retrieved documents:", documents.length);
            // Capture sources for response headers
            capturedSources = [...capturedSources, ...documents];
            console.log("🔗 Captured sources count:", capturedSources.length);
          },
        },
      ],
    });

    /**
     * Wrap the retriever in a tool to present it to the agent in a
     * usable form.
     */
    const tool = createRetrieverTool(retriever, {
      name: "search_utm_information",
      description:
        "Search UTM information. Use this when you need specific details about University of Toronto Mississauga programs, admissions, buildings, services, or policies.",
    });

    console.log("🔧 UTM search tool created");

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

    console.log("🤖 UTM ReAct agent created");

    if (!returnIntermediateSteps) {
      /**
       * For streaming mode, we need to run the agent first to capture sources,
       * then stream the final response.
       */
      console.log("🌊 Running agent to capture sources first...");

      const result = await agent.invoke(
        { messages },
        {
          recursionLimit: 5,
          configurable: { thread_id: "utm-chat" },
        },
      );

      console.log("✅ Agent completed");
      console.log("📊 Result messages count:", result.messages.length);
      console.log(
        "📊 Final captured sources for response:",
        capturedSources.length,
      );

      // Get the final assistant message
      const finalMessage = result.messages.find(
        (msg) => msg._getType() === "ai" && msg.content,
      );

      if (!finalMessage) {
        throw new Error("No final response from agent");
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
                    pageContent: doc.pageContent.slice(0, 50) + "...",
                    metadata: doc.metadata,
                  };
                }),
              ),
            ).toString("base64")
          : "";

      const headers: Record<string, string> = {
        "x-message-index": (messages.length + 1).toString(),
      };

      if (serializedSources) {
        headers["x-sources"] = serializedSources;
        console.log("📤 Sending sources in headers");
      } else {
        console.log("❌ No sources to send");
      }

      return new StreamingTextResponse(transformStream, { headers });
    } else {
      /**
       * We could also pick intermediate steps out from `streamEvents` chunks, but
       * they are generated as JSON objects, so streaming and displaying them with
       * the AI SDK is more complicated.
       */
      console.log("🔄 Running agent with intermediate steps...");

      const result = await agent.invoke(
        { messages },
        {
          recursionLimit: 5,
          configurable: { thread_id: "utm-chat" },
        },
      );

      console.log("✅ Agent completed, returning messages");
      console.log("📊 Result messages count:", result.messages.length);
      console.log(
        "📊 Final captured sources for response:",
        capturedSources.length,
      );

      // Prepare sources for response headers
      const serializedSources =
        capturedSources.length > 0
          ? Buffer.from(
              JSON.stringify(
                capturedSources.map((doc) => {
                  return {
                    pageContent: doc.pageContent.slice(0, 50) + "...",
                    metadata: doc.metadata,
                  };
                }),
              ),
            ).toString("base64")
          : "";

      const headers: Record<string, string> = {};

      if (serializedSources) {
        headers["x-message-index"] = (messages.length + 1).toString();
        headers["x-sources"] = serializedSources;
        console.log("📤 Sending sources in headers for intermediate steps");
      } else {
        console.log("❌ No sources to send for intermediate steps");
      }

      // Prepare sources data
      console.log("🔍 Debug captured sources structure:");
      capturedSources.forEach((doc, i) => {
        console.log(`Source ${i}:`, {
          pageContent: doc.pageContent?.slice(0, 50) + "...",
          metadata: doc.metadata,
          hasUrl: !!doc.metadata?.url,
        });
      });

      const sourcesData = capturedSources.map((doc) => {
        // Try to extract URL from different possible locations
        const url = doc.metadata?.url || doc.url || null;
        console.log("🔗 Extracting URL:", { url, metadata: doc.metadata });

        return {
          pageContent: doc.pageContent.slice(0, 100) + "...",
          metadata: doc.metadata,
          url: url,
        };
      });

      console.log("📤 Final sources data being sent:", sourcesData);

      return NextResponse.json(
        {
          messages: result.messages.map(convertLangChainMessageToVercelMessage),
          sources: sourcesData,
        },
        {
          status: 200,
        },
      );
    }
  } catch (e: any) {
    console.error("❌ UTM Agent Error:", e.message);
    console.error("🔍 Error details:", e);
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
