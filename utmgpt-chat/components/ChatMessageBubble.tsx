import { cn } from "@/utils/cn";
import type { Message } from "ai/react";
import ReactMarkdown from "react-markdown";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

function SourcesComponent(props: { sources: any[] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!props.sources || props.sources.length === 0) return null;

  const firstThreeSources = props.sources.slice(0, 3);
  const sourcesToShow = isExpanded ? props.sources : firstThreeSources;
  const hasMoreSources = props.sources.length > 3;

  return (
    <div className="mt-3 p-2 bg-muted/30 rounded-md border border-muted">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-left"
      >
        {isExpanded ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
        <span className="mr-1">📚</span>
        {props.sources.length} source{props.sources.length !== 1 ? "s" : ""}{" "}
        from UTM
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-2">
          {sourcesToShow.map((source, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="text-muted-foreground text-xs min-w-[16px] mt-0.5">
                {i + 1}.
              </span>
              <div className="flex-1">
                <a
                  href={source.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline text-xs font-medium"
                >
                  {source.url
                    ? source.url.split("/").pop() || source.url
                    : "UTM Page"}
                </a>
                <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {source.pageContent}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ChatMessageBubble(props: {
  message: Message;
  aiEmoji?: string;
  sources: any[];
}) {
  return (
    <div
      className={cn(
        `rounded-[24px] max-w-[80%] mb-8 flex`,
        props.message.role === "user"
          ? "bg-secondary text-secondary-foreground px-4 py-2"
          : null,
        props.message.role === "user" ? "ml-auto" : "mr-auto",
      )}
    >
      {props.message.role !== "user" && (
        <div className="mr-4 border bg-secondary -mt-2 rounded-full w-10 h-10 flex-shrink-0 flex items-center justify-center">
          {props.aiEmoji}
        </div>
      )}

      <div className="flex flex-col">
        <div className="prose prose-sm max-w-none prose-gray dark:prose-invert">
          <ReactMarkdown
            components={{
              // Custom styling for different markdown elements
              h1: ({ children }) => (
                <h1 className="text-lg font-bold mb-2 mt-0">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-base font-semibold mb-2 mt-3">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-sm font-semibold mb-1 mt-2">{children}</h3>
              ),
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => (
                <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>
              ),
              li: ({ children }) => <li className="text-sm">{children}</li>,
              strong: ({ children }) => (
                <strong className="font-semibold">{children}</strong>
              ),
              em: ({ children }) => <em className="italic">{children}</em>,
              code: ({ children }) => (
                <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="bg-muted p-2 rounded-md overflow-x-auto text-xs">
                  {children}
                </pre>
              ),
            }}
          >
            {props.message.content}
          </ReactMarkdown>
        </div>

        <SourcesComponent sources={props.sources} />
      </div>
    </div>
  );
}
