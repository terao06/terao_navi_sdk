/**
 * Terao Navi SDK - AI Chat Widget Loader
 * 外部HTMLから読み込まれる軽量なローダースクリプト
 * Next.jsで実装されたReactコンポーネントをiframeで埋め込む
 * 
 * data-credential: Base64エンコードされた "clientId:clientSecret"
 * Basic認証ヘッダーにそのまま使用される
 * 例: btoa("your_client_id:your_client_secret") の結果
 */
(function () {
  'use strict';

  // スクリプトタグから設定を取得
  const currentScript = document.currentScript;
  const credential = currentScript.getAttribute('data-credential') || ''; // Base64(clientId:clientSecret)
  const chatTitle = currentScript.getAttribute('data-chat-title') || '';
  const chatColor = currentScript.getAttribute('data-chat-color') || '';
  const baseUrl = currentScript.src.replace('/chat.js', '');
  const pageOrigin = window.location.origin; // 自動取得（改ざん防止のためサーバー側で検証）
  const pageUrl = window.location.href; // フルURL（Refererとして使用）

  // iframeのスタイル
  const styles = `
    .terao-navi-chat-container {
      position: fixed;
      bottom: 0;
      right: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 9999;
    }

    .terao-navi-chat-iframe {
      width: 100%;
      height: 100%;
      border: none;
      background: transparent;
      pointer-events: auto;
    }
  `;

  // スタイルを注入
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  // DOMが読み込まれたら実行
  function init() {
    // ターゲット要素を探す
    const targetElement = document.getElementById('terao-navi-chat');
    if (!targetElement) {
      console.error('Error: #terao-navi-chat element not found');
      return;
    }

    // iframeを作成
    const iframe = document.createElement('iframe');
    const params = new URLSearchParams({
      credential: credential,
      origin: pageOrigin, // 自動取得されたorigin
      referer: pageUrl, // フルURL
    });
    if (chatTitle) params.append('chatTitle', chatTitle);
    if (chatColor) params.append('chatColor', chatColor);
    
    iframe.src = `${baseUrl}/widget?${params.toString()}`;
    iframe.className = 'terao-navi-chat-iframe';
    iframe.title = 'AI Chat Widget';
    iframe.allow = 'clipboard-write';
    iframe.setAttribute('loading', 'lazy');

    // iframeコンテナを作成
    const container = document.createElement('div');
    container.className = 'terao-navi-chat-container';
    container.appendChild(iframe);

    // ターゲット要素に挿入
    targetElement.appendChild(container);

    // メッセージイベントリスナー（将来の拡張用）
    window.addEventListener('message', (event) => {
      // セキュリティチェック
      if (event.origin !== new URL(baseUrl).origin) {
        return;
      }

      // ウィジェットからのメッセージを処理
      if (event.data.type === 'widget-loaded') {
        console.log('[Terao Navi SDK] Widget loaded successfully');
      }
    });
  }

  // DOMの準備ができたら初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
