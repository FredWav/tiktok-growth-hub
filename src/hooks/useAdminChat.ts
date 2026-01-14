import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: { name: string; args: any }[];
  isStreaming?: boolean;
}

export const useAdminChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const assistantMessageId = crypto.randomUUID();
    setMessages(prev => [...prev, {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      isStreaming: true,
    }]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Non authentifié');
      }

      const messagesForApi = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ messages: messagesForApi }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur du serveur');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Pas de stream disponible');

      const decoder = new TextDecoder();
      let assistantContent = '';
      const toolCalls: { name: string; args: any }[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line === 'data: [DONE]') continue;
          if (!line.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.content) {
              assistantContent += data.content;
              setMessages(prev => prev.map(m => 
                m.id === assistantMessageId 
                  ? { ...m, content: assistantContent }
                  : m
              ));
            }
            
            if (data.tool_call) {
              toolCalls.push(data.tool_call);
              setMessages(prev => prev.map(m =>
                m.id === assistantMessageId
                  ? { ...m, toolCalls: [...toolCalls] }
                  : m
              ));
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }

      setMessages(prev => prev.map(m =>
        m.id === assistantMessageId
          ? { ...m, isStreaming: false }
          : m
      ));

      // Invalidate queries to refresh data after potential changes
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => prev.map(m =>
        m.id === assistantMessageId
          ? { 
              ...m, 
              content: `Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue'}`,
              isStreaming: false 
            }
          : m
      ));
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, queryClient]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sendMessage,
    clearMessages,
    isLoading,
  };
};
