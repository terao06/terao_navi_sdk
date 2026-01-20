'use client';

export default function ChatHeader({ 
  isMinimized, 
  onToggle, 
  chatTitle,
  chatColor,
}) {
  // 空文字列の場合もデフォルト値を使用
  const displayTitle = chatTitle || 'terao-navi チャット';
  
  // カスタム背景色を設定（指定がない場合はデフォルトのグラデーション）
  const backgroundColor = chatColor 
    ? chatColor 
    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  
  return (
    <div
      style={{
        ...styles.header,
        background: backgroundColor,
        ...(isMinimized ? styles.headerMinimized : {}),
      }}
      onClick={onToggle}
    >
      {!isMinimized && <div style={styles.title}>{displayTitle}</div>}
      {isMinimized && (
        <button style={styles.toggle}>
          {displayTitle}
        </button>
      )}
    </div>
  );
}

const styles = {
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
  },
  headerMinimized: {
    justifyContent: 'center',
    padding: '14px 32px',
    height: 'auto',
    width: 'auto',
    borderRadius: '30px',
    alignItems: 'center',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
  },
  title: {
    fontWeight: 600,
    fontSize: '18px',
    letterSpacing: '0.3px',
  },
  toggle: {
    background: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '0',
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    letterSpacing: '0.3px',
  },
};
