"use client";

import * as React from "react";
import { GraduationCap, Plus, Search } from "lucide-react";

import { ChatList } from "@/components/chat-list";
import { NavUser } from "@/components/nav-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { User } from "@supabase/supabase-js";
import { ModeToggle } from "./ui/toggle-theme";

// Sample chat data
const sampleChats = [
  {
    id: "1",
    title: "Help with React components",
    lastMessage: "How do I create a reusable button component?",
    timestamp: "2 hours ago",
  },
  {
    id: "2",
    title: "Next.js routing question",
    lastMessage: "What's the difference between app and pages router?",
    timestamp: "1 day ago",
  },
  {
    id: "3",
    title: "TypeScript best practices",
    lastMessage: "Should I use interfaces or types?",
    timestamp: "3 days ago",
  },
  {
    id: "4",
    title: "Database design help",
    lastMessage: "How to structure a many-to-many relationship?",
    timestamp: "1 week ago",
  },
  {
    id: "5",
    title: "CSS Grid vs Flexbox",
    lastMessage: "When should I use Grid over Flexbox?",
    timestamp: "2 weeks ago",
  },
];

export default function AppSidebar({
  user_data,
  props,
}: {
  user_data: User;
  props?: React.ComponentProps<typeof Sidebar>;
}) {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredChats = sampleChats.filter(
    (chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  console.log(user_data);
  // Sync user data on mount if it becomes available
  // React.useEffect(() => {
  //   if (initialUserData && !userData) {
  //     setUserData(initialUserData);
  //   }
  // }, [initialUserData, userData]);

  // const filteredChats = sampleChats.filter(
  //   (chat) =>
  //     chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //     chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()),
  // );

  if (!user_data) {
    return null; // Or a loading spinner
  }

  return (
    <Sidebar variant="inset" collapsible="offcanvas" {...props}>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <GraduationCap className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">UTMGPT</span>
            {/* <span className="truncate text-xs text-sidebar-foreground/70">
              Your AI companion
            </span> */}
          </div>
        </div>

        <div className="px-2 pb-2">
          <Button
            className="w-full justify-start gap-2"
            size="sm"
            onClick={() => (window.location.href = "/chat")}
          >
            <Plus className="size-4" />
            <span>New Chat</span>
          </Button>
        </div>

        <div className="px-2 pb-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <ChatList chats={filteredChats} />
      </SidebarContent>

      <SidebarFooter>
        <ModeToggle />
        <NavUser
          user={{
            name: user_data.user_metadata.full_name,
            avatar: user_data.user_metadata.avatar_url,
            email: user_data.user_metadata.email,
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
