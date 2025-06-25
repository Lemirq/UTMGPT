'use client';

import { MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';

interface Chat {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
}

export function ChatList({ chats }: { chats: Chat[] }) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Chats</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {chats.length === 0 ? (
            <SidebarMenuItem>
              <div className='flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground'>
                <MessageSquare className='size-8 mb-2 opacity-50' />
                <p>No chats found</p>
                <p className='text-xs'>Start a new conversation</p>
              </div>
            </SidebarMenuItem>
          ) : (
            chats.map((chat) => (
              <SidebarMenuItem key={chat.id}>
                <SidebarMenuButton asChild isActive={pathname === `/chat/${chat.id}`} className='h-auto py-2'>
                  <Link href={`/chat/${chat.id}`}>
                    <MessageSquare className='size-4 shrink-0' />
                    <div className='flex flex-col items-start gap-1 overflow-hidden'>
                      <span className='truncate font-medium text-sm'>{chat.title}</span>
                      <span className='truncate text-xs text-muted-foreground'>{chat.lastMessage}</span>
                      <span className='text-xs text-muted-foreground'>{chat.timestamp}</span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
