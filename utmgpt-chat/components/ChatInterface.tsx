"use client";
import { ChatWindow } from "@/components/ChatWindow";
import { GuideInfoBox } from "@/components/guide/GuideInfoBox";
import ChatSidebar from "@/components/ChatSidebar";
import React, { useState } from "react";
import { SidebarTrigger } from "./ui/sidebar";
import { User } from "@supabase/supabase-js";

export default function ChatPage({
  chat_id,
  user,
}: {
  chat_id: string;
  user: User;
}) {
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>(
    undefined,
  );
  const InfoCard = (
    <GuideInfoBox>
      <div className="space-y-4 flex flex-col items-center justify-center">
        <div className="flex items-start gap-3">
          <div className="flex-1 text-base font-medium">
            Welcome to the{" "}
            <span className="font-semibold text-primary">
              🎓 UTM Information Assistant
            </span>
            !
            <br />
            <span className="text-muted-foreground">
              This chatbot helps you find information about the University of
              Toronto Mississauga using AI and over{" "}
              <span className="font-semibold">30,000</span> UTM documents.
            </span>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="mb-2 text-base">👇 Try asking one of these:</div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg border border-muted bg-muted px-3 py-1.5 text-sm font-medium hover:bg-primary/10 transition"
                onClick={() => {
                  const input = document.querySelector<
                    HTMLInputElement | HTMLTextAreaElement
                  >('textarea, input[type="text"]');
                  if (input) {
                    input.value = "What programs are available at UTM?";
                    input.focus();
                  }
                }}
              >
                What programs are available at UTM?
              </button>
              <button
                type="button"
                className="rounded-lg border border-muted bg-muted px-3 py-1.5 text-sm font-medium hover:bg-primary/10 transition"
                onClick={() => {
                  const input = document.querySelector<
                    HTMLInputElement | HTMLTextAreaElement
                  >('textarea, input[type="text"]');
                  if (input) {
                    input.value = "How do I apply to UTM?";
                    input.focus();
                  }
                }}
              >
                How do I apply to UTM?
              </button>
            </div>
          </div>
        </div>
      </div>
    </GuideInfoBox>
  );
  return (
    <div className="flex h-full w-full">
      <SidebarTrigger className="z-50" />
      <ChatSidebar
        selectedChatId={selectedChatId}
        onSelectChat={setSelectedChatId}
      />
      <div className="flex-1 flex flex-col h-full">
        <ChatWindow
          endpoint="api/chat/retrieval_agents"
          emoji="🎓"
          placeholder="Ask me anything about the University of Toronto Mississauga!"
          emptyStateComponent={InfoCard}
          showIntermediateStepsToggle
        />
      </div>
    </div>
  );
}
