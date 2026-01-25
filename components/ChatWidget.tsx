"use client";

import { useEffect, useState } from "react";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import type { ChatMessage, ParentToWidgetMessage, WidgetToParentMessage } from "./chat-types";

export default function ChatWidget({
  chatTitle,
  chatColor,
}: {
  chatTitle: string;
  chatColor: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  function postToParent(msg: WidgetToParentMessage) {
    try {
      window.parent?.postMessage(msg);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    postToParent({ type: "TERAO_NAVI_READY" });
  }, []);

  useEffect(() => {
    function onMessage(ev: MessageEvent) {
      const data = ev.data as ParentToWidgetMessage | undefined;
      if (!data || typeof data !== "object" || !("type" in data)) return;

      if (data.type === "TERAO_NAVI_STATE") {
        setMessages(data.payload.messages || []);
        setIsTyping(!!data.payload.isTyping);
        return;
      }

      if (data.type === "TERAO_NAVI_SET_TYPING") {
        setIsTyping(!!data.payload.isTyping);
        return;
      }

      if (data.type === "TERAO_NAVI_SET_MESSAGES") {
        setMessages(data.payload.messages || []);
        return;
      }

      if (data.type === "TERAO_NAVI_APPEND_MESSAGE") {
        setMessages((prev) => [...prev, data.payload.message]);
        return;
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  async function handleSendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    postToParent({ type: "TERAO_NAVI_USER_SEND", payload: { text: trimmed } });
  }

  function handleClear() {
    postToParent({ type: "TERAO_NAVI_CLEAR" });
  }

  function handleClose() {
    postToParent({ type: "TERAO_NAVI_MINIMIZE" });
  }

  return (
    <div style={styles.container}>
      <ChatHeader chatTitle={chatTitle} chatColor={chatColor} onClose={handleClose} />
      <ChatMessages messages={messages} isTyping={isTyping} chatColor={chatColor} />
      <ChatInput onSendMessage={handleSendMessage} onClear={handleClear} chatColor={chatColor} disabled={isTyping} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    background: "white",
  },
};
