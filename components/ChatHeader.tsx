"use client";

export default function ChatHeader({
  chatTitle,
  chatColor,
  onClose,
}: {
  chatTitle: string;
  chatColor: string;
  onClose: () => void;
}) {
  const displayTitle = chatTitle || "terao-navi チャット";
  const background = chatColor ? chatColor : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";

  return (
    <div
      style={{
        ...styles.header,
        background,
      }}
      onClick={onClose}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClose();
        }
      }}
      aria-label="Close chat"
      title="クリックして閉じる"
    >
      <div style={styles.title}>{displayTitle}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    color: "white",
    padding: "20px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    transition: "all 0.3s ease",
    userSelect: "none",
  },
  title: {
    fontWeight: 600,
    fontSize: "18px",
    letterSpacing: "0.3px",
  },
};
