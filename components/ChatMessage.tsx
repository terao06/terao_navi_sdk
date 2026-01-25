"use client";

import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import type { ChatMessage as ChatMessageType } from "./chat-types";

function formatTime(ts?: string) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function isBlockyParagraph(node: any) {
  const children = node?.children;
  if (!Array.isArray(children)) return false;
  return children.some(
    (child: any) =>
      child?.type === "element" &&
      ["pre", "ul", "ol", "blockquote", "div", "table"].includes(child?.tagName)
  );
}

export default function ChatMessage({ message, chatColor }: { message: ChatMessageType; chatColor: string }) {
  const { text, sender, timestamp } = message;
  const isUser = sender === "user";

  return (
    <div
      style={{
        ...styles.message,
        alignItems: isUser ? "flex-end" : "flex-start",
      }}
    >
      <div
        style={{
          ...styles.content,
          ...(isUser ? styles.userContent : styles.aiContent),
        }}
      >
        {sender === "ai" ? (
          <ReactMarkdown rehypePlugins={[rehypeRaw]} components={markdownComponents(chatColor)}>
            {text}
          </ReactMarkdown>
        ) : (
          <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{text}</span>
        )}
      </div>
      {timestamp ? <div style={styles.time}>{formatTime(timestamp)}</div> : null}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function markdownComponents(chatColor: string) {
  return {
    h1: ({ children }: any) => <h1 style={styles.h1}>{children}</h1>,
    h2: ({ children }: any) => <h2 style={styles.h2}>{children}</h2>,
    h3: ({ children }: any) => <h3 style={styles.h3}>{children}</h3>,
    h4: ({ children }: any) => <h4 style={styles.h4}>{children}</h4>,
    p: ({ children, node }: any) =>
      isBlockyParagraph(node) ? (
        <div style={styles.paragraph}>{children}</div>
      ) : (
        <p style={styles.paragraph}>{children}</p>
      ),
    code: ({ inline, children }: any) =>
      inline ? (
        <code style={styles.inlineCode}>{children}</code>
      ) : (
        <pre style={styles.codeBlock}>
          <code>{children}</code>
        </pre>
      ),
    ul: ({ children }: any) => <ul style={styles.list}>{children}</ul>,
    ol: ({ children }: any) => <ol style={styles.list}>{children}</ol>,
    li: ({ children }: any) => <li style={styles.listItem}>{children}</li>,
    table: ({ children }: any) => <table style={styles.table}>{children}</table>,
    thead: ({ children }: any) => <thead style={styles.thead}>{children}</thead>,
    tbody: ({ children }: any) => <tbody style={styles.tbody}>{children}</tbody>,
    tr: ({ children }: any) => <tr style={styles.tr}>{children}</tr>,
    th: ({ children }: any) => <th style={styles.th}>{children}</th>,
    td: ({ children }: any) => <td style={styles.td}>{children}</td>,
    hr: () => <hr style={styles.hr} />,
    a: ({ href, children }: any) => (
      <a href={href} style={styles.link} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
    strong: ({ children }: any) => <strong style={styles.strong}>{children}</strong>,
    em: ({ children }: any) => <em style={styles.em}>{children}</em>,
    br: () => <br />,
  };
}

const styles: Record<string, React.CSSProperties> = {
  message: {
    marginBottom: "16px",
    display: "flex",
    flexDirection: "column",
    animation: "fadeIn 0.3s ease",
  },
  content: {
    maxWidth: "80%",
    padding: "12px 16px",
    borderRadius: "16px",
    wordWrap: "break-word",
    overflowX: "auto",
    lineHeight: "1.5",
    border: "1px solid #e9ecef",
  },
  userContent: {
    background: "#f8f9fa",
    color: "#333",
  },
  aiContent: {
    background: "#f8f9fa",
    color: "#333",
  },
  time: {
    fontSize: "11px",
    color: "#999",
    marginTop: "6px",
    padding: "0 8px",
  },
  paragraph: {
    margin: "0 0 10px 0",
    lineHeight: "1.6",
  },
  h1: {
    fontSize: "1.4em",
    fontWeight: "bold",
    margin: "15px 0 10px 0",
    color: "#212529",
  },
  h2: {
    fontSize: "1.3em",
    fontWeight: "bold",
    margin: "14px 0 8px 0",
    color: "#212529",
  },
  h3: {
    fontSize: "1.2em",
    fontWeight: "bold",
    margin: "12px 0 8px 0",
    color: "#212529",
  },
  h4: {
    fontSize: "1.1em",
    fontWeight: "bold",
    margin: "10px 0 6px 0",
    color: "#212529",
  },
  hr: {
    border: "none",
    borderTop: "1px solid #e9ecef",
    margin: "14px 0",
  },
  inlineCode: {
    backgroundColor: "#e9ecef",
    padding: "2px 6px",
    borderRadius: "4px",
    fontFamily: "Monaco, Menlo, Consolas, monospace",
    fontSize: "0.9em",
    color: "#d63384",
  },
  codeBlock: {
    backgroundColor: "#f8f9fa",
    padding: "14px",
    borderRadius: "8px",
    overflow: "auto",
    margin: "10px 0",
    fontFamily: "Monaco, Menlo, Consolas, monospace",
    fontSize: "0.9em",
    lineHeight: "1.5",
    border: "1px solid #e9ecef",
  },
  list: {
    margin: "10px 0",
    paddingLeft: "24px",
    lineHeight: "1.8",
  },
  listItem: {
    marginBottom: "6px",
  },
  table: {
    borderCollapse: "collapse",
    width: "100%",
    margin: "14px 0",
    fontSize: "0.9em",
    border: "1px solid #dee2e6",
    borderRadius: "8px",
    overflow: "hidden",
  },
  thead: {
    backgroundColor: "#f1f3f5",
  },
  tbody: {
    backgroundColor: "white",
  },
  tr: {
    borderBottom: "1px solid #dee2e6",
  },
  th: {
    padding: "10px 14px",
    textAlign: "left",
    fontWeight: "bold",
    borderRight: "1px solid #dee2e6",
    color: "#495057",
  },
  td: {
    padding: "10px 14px",
    borderRight: "1px solid #dee2e6",
    verticalAlign: "top",
  },
  link: {
    color: "#667eea",
    textDecoration: "none",
    borderBottom: "1px solid #667eea",
    transition: "color 0.3s ease",
  },
  strong: {
    fontWeight: "bold",
    color: "#212529",
  },
  em: {
    fontStyle: "italic",
    color: "#495057",
  },
};
