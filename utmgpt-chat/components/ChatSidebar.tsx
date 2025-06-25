// 'use client';
// import React, { useState } from 'react';
// import {
//   SidebarProvider,
//   Sidebar,
//   SidebarContent,
//   SidebarHeader,
//   SidebarMenu,
//   SidebarMenuItem,
//   SidebarMenuButton,
//   SidebarMenuAction,
//   SidebarFooter,
// } from './ui/sidebar';
// import { Button } from './ui/button';
// import { Pencil, Trash2, Plus, Home, MessageCircle } from 'lucide-react';
// import AuthButton from './AuthButton';
// import { ActiveLink } from './Navbar';

// // Placeholder chat data
// const initialChats = [
//   { id: '1', title: 'Math Homework Help' },
//   { id: '2', title: 'Project Brainstorm' },
//   { id: '3', title: 'Travel Planning' },
// ];

// export default function ChatSidebar({ onSelectChat, selectedChatId }: { onSelectChat?: (id: string) => void; selectedChatId?: string }) {
//   const [chats, setChats] = useState(initialChats);
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [editValue, setEditValue] = useState('');

//   function handleRename(id: string) {
//     setChats((prev) => prev.map((chat) => (chat.id === id ? { ...chat, title: editValue || chat.title } : chat)));
//     setEditingId(null);
//     setEditValue('');
//   }

//   function handleDelete(id: string) {
//     setChats((prev) => prev.filter((chat) => chat.id !== id));
//     if (onSelectChat && selectedChatId === id && chats.length > 1) {
//       const next = chats.find((c) => c.id !== id);
//       if (next) onSelectChat(next.id);
//     }
//   }

//   function handleNewChat() {
//     const newId = (Math.random() * 100000).toFixed(0);
//     const newChat = { id: newId, title: 'New Chat' };
//     setChats((prev) => [newChat, ...prev]);
//     if (onSelectChat) onSelectChat(newId);
//   }

//   return (
//     <SidebarProvider>
//       <Sidebar className='border-r h-screen flex flex-col'>
//         <SidebarHeader className='flex flex-col gap-4 p-4'>
//           <div className='flex items-center gap-2'>
//             <span className='text-2xl font-bold'>UTM-GPT</span>
//           </div>
//           <nav className='flex flex-col gap-2'>
//             <ActiveLink href='/'>
//               <Home className='w-4 h-4' /> Home
//             </ActiveLink>
//             <ActiveLink href='/chat'>
//               <MessageCircle className='w-4 h-4' /> Chat
//             </ActiveLink>
//           </nav>
//           <div className='mt-2'>
//             <AuthButton />
//           </div>
//           <div className='flex items-center justify-between mt-4'>
//             <span className='font-bold text-lg'>Chats</span>
//             <Button size='icon' variant='ghost' onClick={handleNewChat}>
//               <Plus className='w-5 h-5' />
//             </Button>
//           </div>
//         </SidebarHeader>
//         <SidebarContent className='flex-1 overflow-y-auto'>
//           <SidebarMenu>
//             {chats.map((chat) => (
//               <SidebarMenuItem key={chat.id}>
//                 {editingId === chat.id ? (
//                   <form
//                     onSubmit={(e) => {
//                       e.preventDefault();
//                       handleRename(chat.id);
//                     }}
//                     className='flex items-center w-full'>
//                     <input
//                       className='flex-1 bg-transparent border-b border-muted outline-none px-2 py-1'
//                       value={editValue}
//                       autoFocus
//                       onChange={(e) => setEditValue(e.target.value)}
//                       onBlur={() => handleRename(chat.id)}
//                     />
//                   </form>
//                 ) : (
//                   <SidebarMenuButton
//                     isActive={selectedChatId === chat.id}
//                     className='flex-1 text-left truncate'
//                     onClick={() => onSelectChat?.(chat.id)}>
//                     {chat.title}
//                   </SidebarMenuButton>
//                 )}
//                 <SidebarMenuAction
//                   className='ml-2'
//                   onClick={() => {
//                     setEditingId(chat.id);
//                     setEditValue(chat.title);
//                   }}
//                   aria-label='Rename'>
//                   <Pencil className='w-4 h-4' />
//                 </SidebarMenuAction>
//                 <SidebarMenuAction className='ml-1' onClick={() => handleDelete(chat.id)} aria-label='Delete'>
//                   <Trash2 className='w-4 h-4' />
//                 </SidebarMenuAction>
//               </SidebarMenuItem>
//             ))}
//           </SidebarMenu>
//         </SidebarContent>
//         <SidebarFooter className='p-4 text-xs text-muted-foreground'>
//           <span>UTMGPT Chat</span>
//         </SidebarFooter>
//       </Sidebar>
//     </SidebarProvider>
//   );
// }

"use client";

import * as React from "react";
import { Bot, Plus, Search } from "lucide-react";

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

const user = {
  name: "John Doe",
  email: "john@example.com",
  avatar: "/placeholder.svg?height=32&width=32",
};

export default function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredChats = sampleChats.filter(
    (chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Sidebar variant="inset" collapsible="offcanvas" {...props}>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Bot className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">AI Assistant</span>
            <span className="truncate text-xs text-sidebar-foreground/70">
              Your AI companion
            </span>
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
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
