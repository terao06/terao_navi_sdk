'use client';

import { useEffect, useState } from 'react';
import ChatWidget from '@/components/ChatWidget';

export default function WidgetPage() {
  const [company_id, setCompanyId] = useState('');
  const [origin, setOrigin] = useState('');
  const [referer, setReferer] = useState('');
  const [chatTitle, setChatTitle] = useState('');
  const [chatColor, setChatColor] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // bodyのスタイルを設定
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.background = 'transparent';
    
    // URLパラメータから設定を取得
    const params = new URLSearchParams(window.location.search);
    // 直接アクセス時のデフォルト値を設定（開発/テスト用）
    const compId = params.get('company_id') || 1;
    const orig = params.get('origin') || window.location.origin;
    const ref = params.get('referer') || window.location.href;
    const title = params.get('chatTitle') || '';
    const color = params.get('chatColor') || '';
    setCompanyId(compId);
    setOrigin(orig);
    setReferer(ref);
    setChatTitle(title);
    setChatColor(color);
    setIsReady(true);

    // 親ウィンドウにメッセージを送信（読み込み完了通知）
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'widget-loaded' }, '*');
    }
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <div style={styles.container}>
      <ChatWidget 
        company_id={company_id}
        origin={origin}
        referer={referer}
        chatTitle={chatTitle}
        chatColor={chatColor}
      />
    </div>
  );
}

const styles = {
  container: {
    width: '100vw',
    height: '100vh',
    margin: 0,
    padding: 0,
    background: 'transparent',
  },
};
