import React, { useRef, useEffect, useState } from 'react';
import { MessageCircle, X, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAdminChat } from '@/hooks/useAdminChat';
import { ChatMessage } from './chat/ChatMessage';
import { ChatInput } from './chat/ChatInput';

export const AdminChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, sendMessage, clearMessages, isLoading } = useAdminChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-md p-0 flex flex-col bg-background"
      >
        <SheetHeader className="p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <SheetTitle className="text-lg">Assistant Admin</SheetTitle>
            </div>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearMessages}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Bonjour !</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Je suis ton assistant. Je peux t'aider à gérer tes clients, rendez-vous et tâches.
              </p>
              <div className="space-y-2 w-full max-w-xs">
                <SuggestionButton onClick={() => sendMessage("Montre-moi mes clients actifs")}>
                  Voir mes clients actifs
                </SuggestionButton>
                <SuggestionButton onClick={() => sendMessage("Quels sont mes prochains RDV ?")}>
                  Prochains rendez-vous
                </SuggestionButton>
                <SuggestionButton onClick={() => sendMessage("Combien de tâches en retard ?")}>
                  Tâches en retard
                </SuggestionButton>
                <SuggestionButton onClick={() => sendMessage("Montre-moi les stats du dashboard")}>
                  Stats du dashboard
                </SuggestionButton>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
            </div>
          )}
        </ScrollArea>

        <ChatInput onSend={sendMessage} isLoading={isLoading} />
      </SheetContent>
    </Sheet>
  );
};

const SuggestionButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
}> = ({ children, onClick }) => (
  <button
    onClick={onClick}
    className="w-full text-left px-4 py-3 rounded-lg bg-muted/50 hover:bg-muted text-sm transition-colors"
  >
    {children}
  </button>
);
