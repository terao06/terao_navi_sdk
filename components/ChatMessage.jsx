'use client';

import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

export default function ChatMessage({ message }) {
  const { text, sender, timestamp } = message;
  const isUser = sender === 'user';

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      style={{
        ...styles.message,
        alignItems: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      <div
        style={{
          ...styles.content,
          ...(isUser ? styles.userContent : styles.aiContent),
        }}
      >
        <ReactMarkdown
          rehypePlugins={[rehypeRaw]}
          components={{
            p: ({ children, node }) => {
              // pタグの中にpreやulなどのブロック要素が含まれている場合はdivを使用
              const hasBlockElement = node?.children?.some(
                (child) => child.type === 'element' && 
                ['pre', 'ul', 'ol', 'blockquote', 'div', 'table'].includes(child.tagName)
              );
              return hasBlockElement ? (
                <div style={styles.paragraph}>{children}</div>
              ) : (
                <p style={styles.paragraph}>{children}</p>
              );
            },
            code: ({ inline, children }) =>
              inline ? (
                <code style={styles.inlineCode}>{children}</code>
              ) : (
                <pre style={styles.codeBlock}>
                  <code>{children}</code>
                </pre>
              ),
            ul: ({ children }) => <ul style={styles.list}>{children}</ul>,
            ol: ({ children }) => <ol style={styles.list}>{children}</ol>,
            li: ({ children }) => <li style={styles.listItem}>{children}</li>,
            table: ({ children }) => <table style={styles.table}>{children}</table>,
            thead: ({ children }) => <thead style={styles.thead}>{children}</thead>,
            tbody: ({ children }) => <tbody>{children}</tbody>,
            tr: ({ children }) => <tr style={styles.tr}>{children}</tr>,
            th: ({ children }) => <th style={styles.th}>{children}</th>,
            td: ({ children }) => <td style={styles.td}>{children}</td>,
            h1: ({ children }) => <h1 style={styles.h1}>{children}</h1>,
            h2: ({ children }) => <h2 style={styles.h2}>{children}</h2>,
            h3: ({ children }) => <h3 style={styles.h3}>{children}</h3>,
            h4: ({ children }) => <h4 style={styles.h4}>{children}</h4>,
            hr: () => <hr style={styles.hr} />,
            a: ({ href, children }) => (
              <a href={href} style={styles.link} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
            strong: ({ children }) => <strong style={styles.strong}>{children}</strong>,
            em: ({ children }) => <em style={styles.em}>{children}</em>,
            br: () => <br />,
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
      <div style={styles.time}>{formatTime(timestamp)}</div>
    </div>
  );
}

const styles = {
  message: {
    marginBottom: '16px',
    display: 'flex',
    flexDirection: 'column',
    animation: 'fadeIn 0.3s ease',
  },
  content: {
    maxWidth: '80%',
    padding: '12px 16px',
    borderRadius: '16px',
    wordWrap: 'break-word',
    overflowX: 'auto',
    lineHeight: '1.5',
  },
  userContent: {
    background: '#f8f9fa',
    color: '#333',
    border: '1px solid #e9ecef',
  },
  aiContent: {
    background: '#f8f9fa',
    color: '#333',
    border: '1px solid #e9ecef',
  },
  time: {
    fontSize: '11px',
    color: '#999',
    marginTop: '6px',
    padding: '0 8px',
  },
  paragraph: {
    margin: '0 0 10px 0',
    lineHeight: '1.6',
  },
  h1: {
    fontSize: '1.5em',
    fontWeight: 'bold',
    margin: '18px 0 10px 0',
    lineHeight: '1.3',
    color: '#333',
  },
  h2: {
    fontSize: '1.3em',
    fontWeight: 'bold',
    margin: '16px 0 10px 0',
    lineHeight: '1.3',
    color: '#333',
  },
  h3: {
    fontSize: '1.1em',
    fontWeight: 'bold',
    margin: '14px 0 8px 0',
    lineHeight: '1.3',
    color: '#333',
  },
  h4: {
    fontSize: '1em',
    fontWeight: 'bold',
    margin: '12px 0 8px 0',
    lineHeight: '1.3',
    color: '#333',
  },
  hr: {
    border: 'none',
    borderTop: '1px solid #e9ecef',
    margin: '14px 0',
  },
  inlineCode: {
    backgroundColor: '#e9ecef',
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: 'Monaco, Menlo, Consolas, monospace',
    fontSize: '0.9em',
    color: '#d63384',
  },
  codeBlock: {
    backgroundColor: '#f8f9fa',
    padding: '14px',
    borderRadius: '8px',
    overflow: 'auto',
    margin: '10px 0',
    fontFamily: 'Monaco, Menlo, Consolas, monospace',
    fontSize: '0.9em',
    lineHeight: '1.5',
    border: '1px solid #e9ecef',
  },
  list: {
    margin: '10px 0',
    paddingLeft: '24px',
    lineHeight: '1.8',
  },
  listItem: {
    marginBottom: '6px',
  },
  table: {
    borderCollapse: 'collapse',
    width: '100%',
    margin: '14px 0',
    fontSize: '0.9em',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  thead: {
    backgroundColor: '#f1f3f5',
  },
  tr: {
    borderBottom: '1px solid #dee2e6',
  },
  th: {
    padding: '10px 14px',
    textAlign: 'left',
    fontWeight: 'bold',
    borderRight: '1px solid #dee2e6',
    color: '#495057',
  },
  td: {
    padding: '10px 14px',
    borderRight: '1px solid #dee2e6',
    verticalAlign: 'top',
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
    borderBottom: '1px solid #667eea',
    transition: 'color 0.3s ease',
  },
  strong: {
    fontWeight: 'bold',
    color: '#212529',
  },
  em: {
    fontStyle: 'italic',
    color: '#495057',
  },
};
