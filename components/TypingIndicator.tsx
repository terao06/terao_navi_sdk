"use client";

export default function TypingIndicator() {
  return (
    <div style={styles.message}>
      <div style={styles.indicator}>
        <div style={{ ...styles.dot, animationDelay: "0s" }} />
        <div style={{ ...styles.dot, animationDelay: "0.2s" }} />
        <div style={{ ...styles.dot, animationDelay: "0.4s" }} />
      </div>
      <style>{`
        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  message: {
    marginBottom: "12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  indicator: {
    display: "flex",
    gap: "4px",
    padding: "10px 14px",
    background: "white",
    border: "1px solid #e0e0e0",
    borderRadius: "18px",
    width: "fit-content",
  },
  dot: {
    width: "8px",
    height: "8px",
    background: "#999",
    borderRadius: "50%",
    animation: "typing 1.4s infinite",
  },
};
