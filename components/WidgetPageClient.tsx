"use client";

import ChatWidget from "./ChatWidget";

export default function WidgetPageClient({
  title,
  color,
}: {
  title: string;
  color: string;
}) {
  return (
    <div style={styles.container}>
      <ChatWidget chatTitle={title} chatColor={color} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: "100vw",
    height: "100vh",
    margin: 0,
    padding: 0,
    background: "transparent",
  },
};
