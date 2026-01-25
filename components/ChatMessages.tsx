"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage as ChatMessageType } from "./chat-types";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";

export default function ChatMessages({
  messages,
  isTyping,
  chatColor,
}: {
  messages: ChatMessageType[];
  isTyping: boolean;
  chatColor: string;
}) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div style={styles.container}>
      {messages.map((m) => (
        <ChatMessage key={m.id} message={m} chatColor={chatColor} />
      ))}
      {isTyping ? <TypingIndicator /> : null}
      <div ref={messagesEndRef} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    background: "linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%)",
  },
};
