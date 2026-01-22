/**
 * Terao Navi SDK - AI Chat Widget Loader
 * 外部HTMLから読み込まれる軽量なローダースクリプト
 * Next.jsで実装されたReactコンポーネントをiframeで埋め込む
 * 
 * data-company-id: 企業ID
 * 企業を識別するためのID
 */
(function () {
  'use strict';

  // スクリプトタグから設定を取得
  const currentScript = document.currentScript;
  const company_id = currentScript.getAttribute('data-company-id') || ''; // 企業ID
  const chatTitle = currentScript.getAttribute('data-chat-title') || ''; // チャットタイトル
  const chatColor = currentScript.getAttribute('data-chat-color') || ''; // チャット色
  const isPreview = currentScript.getAttribute('data-preview') === 'true'; // プレビューモード
  const baseUrl = currentScript.src.replace('/chat.js', '');
  const pageOrigin = window.location.origin; // 自動取得（改ざん防止のためサーバー側で検証）
  const pageUrl = window.location.href; // フルURL（Refererとして使用）

  // iframeのスタイル（プレビューモードと通常モードで切り替え）
  const styles = isPreview ? `
    .terao-navi-chat-container {
      position: relative;
      width: 100%;
      height: 500px;
      max-height: 80vh;
      z-index: 1;
      overflow: auto;
    }

    .terao-navi-chat-iframe {
      width: 100%;
      height: 640px;
      min-height: 640px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background: white;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .terao-navi-chat-iframe.loaded {
      opacity: 1;
    }
  ` : `
    .terao-navi-chat-container {
      position: fixed;
      bottom: 0;
      right: 0;
      width: 440px;
      height: 640px;
      pointer-events: none;
      z-index: 9999;
    }

    .terao-navi-chat-iframe {
      width: 100%;
      height: 100%;
      border: none;
      background: transparent;
      pointer-events: auto;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .terao-navi-chat-iframe.loaded {
      opacity: 1;
    }
  `;

  // スタイルを注入
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  // DOMが読み込まれたら実行
  function init() {
    // ターゲット要素を探す（なければ自動生成）
    let targetElement = document.getElementById('terao-navi-chat');
    if (!targetElement) {
      targetElement = document.createElement('div');
      targetElement.id = 'terao-navi-chat';
      document.body.appendChild(targetElement);
    }

    // iframeを作成
    const iframe = document.createElement('iframe');
    const params = new URLSearchParams({
      company_id: company_id,
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

    // プレビューモードの場合、コンテナを最下部にスクロール
    if (isPreview) {
      const scrollToBottom = () => {
        container.scrollTop = container.scrollHeight;
      };
      
      // 初期スクロール
      setTimeout(scrollToBottom, 100);
    }

    // iframe読み込み完了時に表示
    iframe.addEventListener('load', () => {
      // 少し遅延させてから表示（ウィジェット内部の初期化を待つ）
      setTimeout(() => {
        iframe.classList.add('loaded');
        // プレビューモードの場合、再度スクロール
        if (isPreview) {
          container.scrollTop = container.scrollHeight;
        }
      }, 100);
    });

    // メッセージイベントリスナー（将来の拡張用）
    window.addEventListener('message', (event) => {
      // セキュリティチェック
      if (event.origin !== new URL(baseUrl).origin) {
        return;
      }

      // ウィジェットからのメッセージを処理
      if (event.data.type === 'widget-loaded') {
        console.log('[Terao Navi SDK] Widget loaded successfully');
        iframe.classList.add('loaded');
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
