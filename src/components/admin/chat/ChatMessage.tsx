import React from 'react';
import { Bot, User, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType } from '@/hooks/useAdminChat';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={cn(
      "flex gap-3 p-4",
      isUser ? "bg-muted/30" : "bg-background"
    )}>
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isUser ? "bg-primary" : "bg-primary/20"
      )}>
        {isUser ? (
          <User className="w-4 h-4 text-primary-foreground" />
        ) : (
          <Bot className="w-4 h-4 text-primary" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground mb-1">
          {isUser ? 'Vous' : 'Assistant'}
        </div>
        
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mb-2 space-y-1">
            {message.toolCalls.map((tool, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                <Wrench className="w-3 h-3" />
                <span className="font-mono">{tool.name}</span>
              </div>
            ))}
          </div>
        )}
        
        <div className="text-sm text-foreground whitespace-pre-wrap break-words">
          {message.content}
          {message.isStreaming && !message.content && (
            <span className="inline-flex gap-1">
              <span className="animate-bounce">.</span>
              <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
            </span>
          )}
          {message.isStreaming && message.content && (
            <span className="inline-block w-2 h-4 bg-primary/50 animate-pulse ml-0.5" />
          )}
        </div>
      </div>
    </div>
  );
};
