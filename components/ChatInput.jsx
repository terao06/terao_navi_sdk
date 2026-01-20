'use client';

import { useState } from 'react';

export default function ChatInput({ onSendMessage, onClear, chatColor }) {
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);

  // カスタム背景色を設定（指定がない場合はデフォルトのグラデーション）
  const backgroundColor = chatColor 
    ? chatColor 
    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

  const handleSend = async () => {
    const message = inputValue.trim();
    if (!message || isSending) return;

    setIsSending(true);
    setInputValue('');

    try {
      await onSendMessage(message);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    onClear();
    setInputValue('');
  };

  return (
    <div style={styles.container}>
      <input
        type="text"
        style={styles.input}
        placeholder="質問内容を入力..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = chatColor || '#667eea';
          e.currentTarget.style.boxShadow = `0 0 0 3px ${chatColor ? chatColor + '20' : 'rgba(102, 126, 234, 0.1)'}`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#f0f0f0';
          e.currentTarget.style.boxShadow = 'none';
        }}
        disabled={isSending}
      />
      <button
        style={{
          ...styles.button,
          background: backgroundColor,
          ...(isSending ? styles.buttonDisabled : {}),
        }}
        onClick={handleSend}
        disabled={isSending}
      >
        <img 
          src="/icons/send_black.svg" 
          alt="送信" 
          style={styles.clearIcon}
        />
      </button>
      <button
        style={{
          ...styles.clearButton,
          background: backgroundColor,
        }}
        onClick={handleClear}
        disabled={isSending}
        title="チャット履歴をクリア"
      >
        <img 
          src="/icons/reload_black.svg" 
          alt="クリア" 
          style={styles.clearIcon}
        />
      </button>
    </div>
  );
}

const styles = {
  container: {
    padding: '16px',
    background: 'white',
    borderTop: '1px solid #f0f0f0',
    display: 'flex',
    gap: '10px',
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    border: '2px solid #f0f0f0',
    borderRadius: '24px',
    outline: 'none',
    fontSize: '14px',
    transition: 'border-color 0.3s ease',
    backgroundColor: '#fafafa',
  },
  button: {
    padding: '12px 16px',
    border: 'none',
    borderRadius: '24px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  clearButton: {
    padding: '12px 16px',
    border: 'none',
    borderRadius: '24px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
  },
  clearIcon: {
    width: '18px',
    height: '18px',
    filter: 'invert(1)',
  },
};
