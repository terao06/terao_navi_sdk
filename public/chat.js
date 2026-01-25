/**
 * Terao Navi SDK - AI Chat Widget
 *
 * 外部HTMLから読み込まれる軽量ローダー。
 * - APIへのfetch（認証/ask）は chat.js が担当
 * - 描画は Next.js 側の /widget (iframe) が担当
 * - 親(chat.js) <-> 子(iframe) は postMessage で連携
 *
 * Attributes:
 * - data-company-id: 企業ID（必須）
 * - data-application-id: アプリケーションID（任意）
 * - data-api-base-url: Terao Navi API Base URL（任意）例: https://api.example.com
 * - data-chat-title: タイトル（任意）
 * - data-chat-color: テーマ色（任意）例: #ea6666
 * - data-preview: true の場合は埋め込み表示（固定表示しない）
 */
(function () {
  'use strict';

  const currentScript = document.currentScript;
  if (!currentScript) return;

  const company_id = currentScript.getAttribute('data-company-id') || '';
  const application_id = currentScript.getAttribute('data-application-id') || '';
  const chatTitle = currentScript.getAttribute('data-chat-title') || '';
  const chatColor = currentScript.getAttribute('data-chat-color') || '';
  const isPreview = currentScript.getAttribute('data-preview') === 'true';

  const apiBaseUrl = 'http://localhost:8005';

  const initialGreeting = 'こんにちは！何かお手伝いできることはありますか？';

  const state = {
    isMinimized: !isPreview,
    isTyping: false,
    messages: [
      {
        id: 1,
        sender: 'ai',
        text: initialGreeting,
        timestamp: new Date().toISOString(),
      },
    ],
    tokenInfo: null,
  };

  const ROOT_ID = 'terao-navi-chat';
  const SDK_ORIGIN = getBaseOriginFromScriptSrc(currentScript.src);
  const widgetUrl = buildWidgetUrl(SDK_ORIGIN, chatTitle, chatColor, isPreview);
  const widgetOrigin = widgetUrl ? new URL(widgetUrl).origin : null;
  const displayTitle = chatTitle || 'terao-navi チャット';
  const themeBackground = chatColor ? chatColor : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

  function safeNowId() {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  function isValidUrl(url) {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  function normalizeApiBaseUrl(url) {
    if (!url) return '';
    if (!isValidUrl(url)) return '';
    return String(url).replace(/\/$/, '');
  }

  function getBaseOriginFromScriptSrc(src) {
    try {
      const u = new URL(src, window.location.href);
      return u.origin;
    } catch {
      return '';
    }
  }

  function buildWidgetUrl(baseOrigin, title, color, preview) {
    try {
      const u = new URL('/widget', baseOrigin || window.location.origin);
      if (title) u.searchParams.set('title', title);
      if (color) u.searchParams.set('color', color);
      if (preview) u.searchParams.set('preview', 'true');
      return u.toString();
    } catch {
      return '';
    }
  }

  function getApplicationIdValue() {
    if (!application_id) return undefined;
    const trimmed = String(application_id).trim();
    if (!trimmed) return undefined;
    const n = Number(trimmed);
    if (!Number.isFinite(n)) return undefined;
    return n;
  }

  function tokenIsValid(tokenInfo, bufferSeconds) {
    if (!tokenInfo) return false;
    const expiresAt = new Date(tokenInfo.access_expires_at);
    const bufferMs = (bufferSeconds || 60) * 1000;
    return Date.now() < expiresAt.getTime() - bufferMs;
  }

  async function authenticate() {
    try {
      const res = await fetch(`${apiBaseUrl}/auth/token`, {
        method: 'POST',
        headers: {
          'X-Company-Id': company_id,
          'Content-Type': 'application/json',
        },
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = json && json.message ? json.message : '認証に失敗しました';
        throw new Error(`認証に失敗しました (${res.status}): ${msg}`);
      }

      state.tokenInfo = {
        access_token: json.data.access_token,
        access_expires_at: json.data.expires_at,
        refresh_token: json.data.refresh_token,
        refresh_expires_at: json.data.refresh_expires_at,
      }; 
    } catch {
        const msg = json && json.message ? json.message : '認証に失敗しました';
        throw new Error(`認証に失敗しました (${res.status}): ${msg}`);
    }
  }

  async function refreshToken() {
    if (!state.tokenInfo || !state.tokenInfo.refresh_token) {
      await authenticate();
      return;
    }

    const res = await fetch(`${apiBaseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${state.tokenInfo.refresh_token}`,
        'Content-Type': 'application/json',
      },
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = json && json.message ? json.message : 'トークン更新に失敗しました';
      throw new Error(`トークン更新に失敗しました (${res.status}): ${msg}`);
    }

    state.tokenInfo = {
      access_token: json.data.access_token,
      access_expires_at: json.data.expires_at,
      refresh_token: json.data.refresh_token,
      refresh_expires_at: json.data.refresh_expires_at,
    };
  }

  async function getValidAccessToken() {
    if (!state.tokenInfo) {
      await authenticate();
      return state.tokenInfo.access_token;
    }

    if (tokenIsValid(state.tokenInfo, 60)) {
      return state.tokenInfo.access_token;
    }

    try {
      await refreshToken();
      return state.tokenInfo.access_token;
    } catch {
      await authenticate();
      return state.tokenInfo.access_token;
    }
  }

  async function ask(questionText) {
    const trimmed = String(questionText || '').trim();
    if (!trimmed) {
      throw new Error('質問内容が空です');
    }
    if (trimmed.length > 1000) {
      throw new Error('質問内容は1000文字以内にしてください');
    }

    if (!company_id) {
      throw new Error('data-company-id が未指定です。');
    }

    const token = await getValidAccessToken();

    const body = { question: trimmed };
    const appId = getApplicationIdValue();
    if (appId !== undefined) {
      body.application_id = appId;
    }

    const res = await fetch(`${apiBaseUrl}/ask`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = json && json.message ? json.message : 'API呼び出しに失敗しました';
      throw new Error(`API呼び出しに失敗しました (${res.status}): ${msg}`);
    }

    if (json && json.data && typeof json.data.answer === 'string') {
      return json.data.answer;
    }
    throw new Error('回答が取得できませんでした');
  }

  function postToWidget(iframeEl, message) {
    if (!iframeEl || !iframeEl.contentWindow) return;
    if (!widgetOrigin) return;
    try {
      iframeEl.contentWindow.postMessage(message, widgetOrigin);
    } catch {
      // ignore
    }
  }

  function setTyping(iframeEl, isTyping) {
    state.isTyping = !!isTyping;
    postToWidget(iframeEl, { type: 'TERAO_NAVI_SET_TYPING', payload: { isTyping: state.isTyping } });
  }

  function setMessages(iframeEl) {
    postToWidget(iframeEl, { type: 'TERAO_NAVI_SET_MESSAGES', payload: { messages: state.messages.slice() } });
  }

  function appendMessage(iframeEl, msg) {
    state.messages.push(msg);
    postToWidget(iframeEl, { type: 'TERAO_NAVI_APPEND_MESSAGE', payload: { message: msg } });
  }

  function setMinimized(rootEl, iframeEl, launcherBtn, minimized) {
    state.isMinimized = !!minimized;
    if (state.isMinimized) {
      iframeEl.classList.add('tn_hidden');
      if (launcherBtn) launcherBtn.classList.remove('tn_hidden');
    } else {
      iframeEl.classList.remove('tn_hidden');
      if (launcherBtn) launcherBtn.classList.add('tn_hidden');
    }
  }

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = isPreview
      ? `
        #${ROOT_ID}{position:relative;width:400px;height:600px;max-width:100%;max-height:80vh;z-index:1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;}
        #${ROOT_ID} .tn_iframe{width:100%;height:100%;border:none;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.15);background:#fff;overflow:hidden;transition:transform .3s ease,box-shadow .3s ease;transform:translateY(0);will-change:transform,box-shadow;}
        #${ROOT_ID} .tn_iframe:hover{transform:translateY(-8px);box-shadow:0 16px 48px rgba(0,0,0,.25);}
        #${ROOT_ID} .tn_hidden{display:none !important;}
      `
      : `
        #${ROOT_ID}{position:fixed;right:20px;bottom:20px;z-index:9999;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;}
        #${ROOT_ID} .tn_launcher{padding:14px 32px;border-radius:30px;background:${themeBackground};color:#fff;border:none;box-shadow:0 4px 16px rgba(0,0,0,.2);cursor:pointer;font-size:16px;font-weight:600;letter-spacing:.3px;transition:transform .3s ease,box-shadow .3s ease,filter .3s ease;line-height:1;}
        #${ROOT_ID} .tn_launcher:hover{transform:translateY(-8px);box-shadow:0 12px 40px rgba(0,0,0,.3);filter:brightness(1.02);}
        #${ROOT_ID} .tn_launcher:active{transform:scale(.98);}
        #${ROOT_ID} .tn_iframe{width:400px;height:600px;border:none;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.15);background:#fff;overflow:hidden;transition:transform .3s ease,box-shadow .3s ease;transform:translateY(0);will-change:transform,box-shadow;}
        #${ROOT_ID} .tn_iframe:hover{transform:translateY(-8px);box-shadow:0 16px 48px rgba(0,0,0,.25);}
        #${ROOT_ID} .tn_hidden{display:none !important;}
      `;
    document.head.appendChild(style);
  }

  function init() {
    injectStyles();

    let root = document.getElementById(ROOT_ID);
    if (!root) {
      root = document.createElement('div');
      root.id = ROOT_ID;
      document.body.appendChild(root);
    } else {
      // 二重挿入防止
      if (root.getAttribute('data-terao-navi-initialized') === 'true') return;
    }
    root.setAttribute('data-terao-navi-initialized', 'true');

    const iframeEl = document.createElement('iframe');
    iframeEl.className = isPreview ? 'tn_iframe' : 'tn_iframe tn_hidden';
    iframeEl.src = widgetUrl;
    iframeEl.setAttribute('title', 'Terao Navi Chat Widget');
    iframeEl.setAttribute('loading', 'lazy');

    let launcherBtn = null;
    if (!isPreview) {
      launcherBtn = document.createElement('button');
      launcherBtn.type = 'button';
      launcherBtn.className = 'tn_launcher';
      launcherBtn.setAttribute('aria-label', 'Open chat');
      launcherBtn.textContent = displayTitle;
      launcherBtn.addEventListener('click', () => setMinimized(root, iframeEl, launcherBtn, false));
      root.appendChild(launcherBtn);
    }

    root.appendChild(iframeEl);

    window.addEventListener('message', async (ev) => {
      if (!widgetOrigin || ev.origin !== widgetOrigin) return;
      const data = ev.data;
      if (!data || typeof data !== 'object' || !data.type) return;

      if (data.type === 'TERAO_NAVI_READY') {
        postToWidget(iframeEl, { type: 'TERAO_NAVI_STATE', payload: { messages: state.messages.slice(), isTyping: state.isTyping } });
        return;
      }

      if (data.type === 'TERAO_NAVI_MINIMIZE') {
        setMinimized(root, iframeEl, launcherBtn, true);
        return;
      }

      if (data.type === 'TERAO_NAVI_CLEAR') {
        state.messages = [
          {
            id: 1,
            sender: 'ai',
            text: initialGreeting,
            timestamp: new Date().toISOString(),
          },
        ];
        setMessages(iframeEl);
        return;
      }

      if (data.type === 'TERAO_NAVI_USER_SEND') {
        const text = data.payload && data.payload.text ? String(data.payload.text) : '';
        const trimmed = text.trim();
        if (!trimmed) return;

        appendMessage(iframeEl, { id: safeNowId(), sender: 'user', text: trimmed, timestamp: new Date().toISOString() });
        setTyping(iframeEl, true);

        try {
          const answer = await ask(trimmed);
          appendMessage(iframeEl, { id: safeNowId(), sender: 'ai', text: answer, timestamp: new Date().toISOString() });
        } catch (e) {
          // 仕様: エラー時は詳細を出さず、固定文言を表示する
          appendMessage(iframeEl, { id: safeNowId(), sender: 'ai', text: '現在回答ができません。', timestamp: new Date().toISOString() });
        } finally {
          setTyping(iframeEl, false);
        }
      }
    });

    // 初期表示状態
    if (!isPreview && launcherBtn) {
      setMinimized(root, iframeEl, launcherBtn, state.isMinimized);
    } else {
      // previewは常に表示
      postToWidget(iframeEl, { type: 'TERAO_NAVI_STATE', payload: { messages: state.messages.slice(), isTyping: state.isTyping } });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
