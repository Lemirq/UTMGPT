import AppSidebar from "@/components/ChatSidebar";
import ChatInterface from "@/components/ChatInterface";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

interface ChatPageProps {
  params: {
    id: string;
  };
}

export default function ChatPage({ params }: ChatPageProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <ChatInterface chatId={params.id} />
      </SidebarInset>
    </SidebarProvider>
  );
}
