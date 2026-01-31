"use client";

import { useState } from "react";

export default function ChatInput({
  onSendMessage,
  onClear,
  chatColor,
  disabled,
}: {
  onSendMessage: (text: string) => Promise<void> | void;
  onClear: () => void;
  chatColor: string;
  disabled: boolean;
}) {
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);

  const background = chatColor ? chatColor : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";

  const handleSend = async () => {
    const message = inputValue.trim();
    if (!message || isSending || disabled) return;

    setIsSending(true);
    setInputValue("");

    try {
      await onSendMessage(message);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleClear = () => {
    if (isSending) return;
    onClear();
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
          e.currentTarget.style.borderColor = chatColor || "#667eea";
          e.currentTarget.style.boxShadow = `0 0 0 3px ${chatColor ? chatColor + "20" : "rgba(102, 126, 234, 0.1)"}`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#f0f0f0";
          e.currentTarget.style.boxShadow = "none";
        }}
        disabled={isSending || disabled}
      />

      <button
        style={{
          ...styles.button,
          background,
          ...(isSending || disabled ? styles.buttonDisabled : null),
        }}
        onClick={() => void handleSend()}
        disabled={isSending || disabled}
        title="送信"
      >
        <img src="/icons/send_black.svg" alt="送信" style={styles.icon} />
      </button>

      <button
        style={{
          ...styles.clearButton,
          background,
          ...(isSending ? styles.buttonDisabled : null),
        }}
        onClick={handleClear}
        disabled={isSending}
        title="チャット履歴をクリア"
      >
        <img src="/icons/reload_black.svg" alt="クリア" style={styles.icon} />
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "16px",
    background: "white",
    borderTop: "1px solid #f0f0f0",
    display: "flex",
    gap: "10px",
  },
  input: {
    flex: 1,
    padding: "12px 16px",
    border: "2px solid #f0f0f0",
    borderRadius: "24px",
    outline: "none",
    fontSize: "14px",
    transition: "border-color 0.3s ease",
    backgroundColor: "#fafafa",
    color: "#111111",
    caretColor: "#111111",
    opacity: 1,
  },
  button: {
    padding: "12px 16px",
    border: "none",
    borderRadius: "24px",
    color: "white",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    boxShadow: "0 2px 8px rgba(102, 126, 234, 0.3)",
  },
  clearButton: {
    padding: "12px 16px",
    border: "none",
    borderRadius: "24px",
    color: "white",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    boxShadow: "0 2px 8px rgba(102, 126, 234, 0.3)",
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  icon: {
    width: "18px",
    height: "18px",
    filter: "invert(1)",
  },
};
