'use client';

import { useState, useEffect, useRef } from 'react';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';

export default function ChatWidget({ credential, origin = '', referer = '', chatTitle = '', chatColor = '' }) {
  const [isMinimized, setIsMinimized] = useState(true);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'こんにちは！何かお手伝いできることはありますか？',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleClearMessages = () => {
    setMessages([
      {
        id: 1,
        text: 'こんにちは！何かお手伝いできることはありますか？',
        sender: 'ai',
        timestamp: new Date(),
      },
    ]);
  };

  const handleSendMessage = async (messageText) => {
    // ユーザーのメッセージを追加
    const userMessage = {
      id: Date.now(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // タイピングインジケーターを表示
    setIsTyping(true);

    try {
      // APIにリクエストを送信（絶対パスを使用）
      const apiUrl = `${window.location.origin}/api/chat`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          credential: credential,
          origin: origin, // 自動取得されたorigin
          referer: referer, // フルURL
        }),
      });

      const data = await response.json();

      setIsTyping(false);

      if (data.success) {
        const aiMessage = {
          id: Date.now() + 1,
          text: data.response,
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        const errorMessage = {
          id: Date.now() + 1,
          text: 'エラーが発生しました。もう一度お試しください。',
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Chat Error:', error);
      setIsTyping(false);
      const errorMessage = {
        id: Date.now() + 1,
        text: '通信エラーが発生しました。',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  return (
    <div
      className={`chat-widget ${isMinimized ? 'minimized' : ''}`}
      style={{
        ...styles.widget,
        ...(isMinimized ? styles.widgetMinimized : {}),
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-8px)';
        e.currentTarget.style.boxShadow = isMinimized 
          ? '0 12px 40px rgba(0, 0, 0, 0.3)' 
          : '0 16px 48px rgba(0, 0, 0, 0.25)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = isMinimized 
          ? '0 4px 16px rgba(0, 0, 0, 0.2)' 
          : '0 8px 32px rgba(0, 0, 0, 0.15)';
      }}
    >
      <ChatHeader
        isMinimized={isMinimized}
        onToggle={toggleMinimize}
        chatTitle={chatTitle}
        chatColor={chatColor}
      />
      {!isMinimized && (
        <>
          <ChatMessages messages={messages} isTyping={isTyping} />
          <ChatInput 
            onSendMessage={handleSendMessage} 
            onClear={handleClearMessages}
            chatColor={chatColor}
          />
        </>
      )}
    </div>
  );
}

const styles = {
  widget: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '400px',
    height: '600px',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    zIndex: 9999,
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
    background: 'white',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  },
  widgetMinimized: {
    width: 'auto',
    height: 'auto',
    borderRadius: '30px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
  },
};
