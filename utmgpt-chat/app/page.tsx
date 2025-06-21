import { ChatWindow } from "@/components/ChatWindow";
import { GuideInfoBox } from "@/components/guide/GuideInfoBox";

export default function Home() {
  const InfoCard = (
    <GuideInfoBox>
      <ul>
        <li className="text-l">
          🎓
          <span className="ml-2">
            Welcome to the UTM Information Assistant! This chatbot helps you
            find information about the University of Toronto Mississauga using{" "}
            <a href="https://js.langchain.com/" target="_blank">
              LangChain.js
            </a>{" "}
            and the Vercel{" "}
            <a href="https://sdk.vercel.ai/docs" target="_blank">
              AI SDK
            </a>{" "}
            in a{" "}
            <a href="https://nextjs.org/" target="_blank">
              Next.js
            </a>{" "}
            project.
          </span>
        </li>
        {/* <li className="hidden text-l md:block">
          💻
          <span className="ml-2">
            You can find the retrieval and model logic for this use-case in{" "}
            <code>app/api/chat/retrieval/route.ts</code>.
          </span>
        </li>
        <li>
          🏫
          <span className="ml-2">
            The assistant is designed to help with UTM-related questions using
            information from the university's website and resources.
          </span>
        </li>
        <li className="hidden text-l md:block">
          🎨
          <span className="ml-2">
            The main frontend logic is found in <code>app/page.tsx</code>.
          </span>
        </li> */}
        <li className="text-l">
          👇
          <span className="ml-2">
            Try asking e.g. <code>What programs are available at UTM?</code> or{" "}
            <code>How do I apply to UTM?</code> below!
          </span>
        </li>
      </ul>
    </GuideInfoBox>
  );
  return (
    <ChatWindow
      endpoint="api/chat/retrieval_agents"
      emoji="🎓"
      placeholder="Ask me anything about the University of Toronto Mississauga!"
      emptyStateComponent={InfoCard}
      showIntermediateStepsToggle
    />
  );
}
