'use client';

import { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';

export default function ChatMessages({ messages, isTyping }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div style={styles.container}>
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
      {isTyping && <TypingIndicator />}
      <div ref={messagesEndRef} />
    </div>
  );
}

const styles = {
  container: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    background: 'linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%)',
  },
};
