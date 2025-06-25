import AppSidebar from '@/components/ChatSidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import ChatInterface from '@/components/ChatInterface';
import { createClient } from '@/utils/supabase/server';

interface ChatPageProps {
  params: {
    id: string;
  };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const s = await createClient();
  const {
    data: { user },
    error,
  } = await s.auth.getUser();

  const { data: chats, error: chatsError } = await s.from('chats').select('*').eq('user_id', user.id);

  if (error || !user) {
    console.error(error);
    return null;
  }

  return (
    <SidebarProvider>
      {user && <AppSidebar user_data={user} />}
      <SidebarInset>
        <ChatInterface chatId={params.id} />
      </SidebarInset>
    </SidebarProvider>
  );
}
