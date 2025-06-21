import { useState } from "react";
import type { Message } from "ai/react";
import { cn } from "@/utils/cn";
import { ChevronDown, ChevronUp } from "lucide-react";

export function IntermediateStep(props: { message: Message }) {
  const parsedInput = JSON.parse(props.message.content);
  const action = parsedInput.action;
  const observation = parsedInput.observation;
  const [expanded, setExpanded] = useState(false);

  const getStepDescription = (actionName: string, args: any) => {
    switch (actionName) {
      case "search_utm_information":
        return `🔍 Searching UTM information for "${args.query || args.input || "relevant content"}"`;
      default:
        return `🤖 The agent is ${actionName.replace(/_/g, " ")}`;
    }
  };

  return (
    <div className="mr-auto bg-secondary border border-input rounded-lg p-3 max-w-[80%] mb-8 flex flex-col">
      <button
        type="button"
        className={cn(
          "text-left flex items-center gap-2 text-sm",
          expanded && "w-full",
        )}
        onClick={(e) => setExpanded(!expanded)}
      >
        <span className="flex-1">
          {getStepDescription(action.name, action.args)}
        </span>
        <span className={cn(expanded && "hidden")}>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </span>
        <span className={cn(!expanded && "hidden")}>
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        </span>
      </button>
      <div
        className={cn(
          "overflow-hidden max-h-[0px] transition-[max-height] ease-in-out text-sm mt-2",
          expanded && "max-h-[400px]",
        )}
      >
        <div className="space-y-2">
          <div className="bg-muted/50 rounded p-2">
            <div className="text-xs font-medium text-muted-foreground mb-1">
              Query:
            </div>
            <div className="text-sm">
              {action.args?.query ||
                action.args?.input ||
                JSON.stringify(action.args)}
            </div>
          </div>
          <div className="bg-muted/50 rounded p-2">
            <div className="text-xs font-medium text-muted-foreground mb-1">
              Results:
            </div>
            <div className="text-sm max-h-[200px] overflow-auto whitespace-pre-wrap">
              {observation}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
