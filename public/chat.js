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
    isMinimized: true,
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
  const PREVIEW_ROOT_ATTR = 'data-terao-navi-preview-root';
  const SDK_ORIGIN = getBaseOriginFromScriptSrc(currentScript.src);
  const widgetUrl = buildWidgetUrl(SDK_ORIGIN, chatTitle, chatColor, isPreview);
  // Note: the iframe may be redirected/reverse-proxied to a different origin.
  // We learn the real origin from postMessage events coming from the iframe.
  let widgetOrigin = widgetUrl ? new URL(widgetUrl).origin : null;
  const displayTitle = chatTitle || 'terao-navi チャット';
  const themeBackground = chatColor ? chatColor : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

  function safeNowId() {
    return Date.now() + Math.floor(Math.random() * 1000);
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
    // Use learned origin when available; fall back to '*' so the iframe can receive
    // the message even if it was redirected to a different origin.
    const targetOrigin = widgetOrigin || '*';
    try {
      iframeEl.contentWindow.postMessage(message, targetOrigin);
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
    if (rootEl) {
      if (state.isMinimized) rootEl.classList.add('tn_minimized');
      else rootEl.classList.remove('tn_minimized');
    }
    if (state.isMinimized) {
      iframeEl.classList.add('tn_hidden');
      if (launcherBtn) launcherBtn.classList.remove('tn_hidden');
    } else {
      iframeEl.classList.remove('tn_hidden');
      if (launcherBtn) launcherBtn.classList.add('tn_hidden');
    }
  }

  function getCacheBusterFromScriptSrc(src) {
    try {
      const u = new URL(src, window.location.href);
      return u.searchParams.get('v') || '';
    } catch {
      return '';
    }
  }

  function injectStylesheet() {
    const LINK_ID = 'terao-navi-chat-css';
    if (document.getElementById(LINK_ID)) return;

    let cssUrl;
    try {
      const base = SDK_ORIGIN || window.location.origin;
      cssUrl = new URL('/chat.css', base);
      const v = getCacheBusterFromScriptSrc(currentScript.src);
      if (v) cssUrl.searchParams.set('v', v);
    } catch {
      return;
    }

    const link = document.createElement('link');
    link.id = LINK_ID;
    link.rel = 'stylesheet';
    link.href = cssUrl.toString();
    document.head.appendChild(link);
  }

  function init() {
    injectStylesheet();

    let root;
    if (isPreview) {
      const mountEl = currentScript.parentElement || document.body;
      // In preview pages, host CSS often targets #terao-navi-chat and its descendants.
      // Use a dedicated class-based root scoped to the mount element to avoid interference.
      root = mountEl.querySelector(`[${PREVIEW_ROOT_ATTR}="true"]`);
      if (!root) {
        root = document.createElement('div');
        root.className = 'tn_preview_root';
        root.setAttribute(PREVIEW_ROOT_ATTR, 'true');
        mountEl.appendChild(root);
      } else {
        // Re-render if the preview script is injected multiple times
        root.classList.add('tn_preview_root');
        root.innerHTML = '';
      }

      // Ensure positioning context for absolute launcher
      try {
        const cs = window.getComputedStyle(mountEl);
        if (cs.position === 'static') {
          mountEl.style.setProperty('position', 'relative', 'important');
        }
      } catch {
        // ignore
      }
    } else {
      root = document.getElementById(ROOT_ID);
      if (!root) {
        root = document.createElement('div');
        root.id = ROOT_ID;
        document.body.appendChild(root);
      } else {
        // 二重挿入防止
        if (root.getAttribute('data-terao-navi-initialized') === 'true') return;
      }
      root.setAttribute('data-terao-navi-initialized', 'true');
    }

    // Theme (dynamic) - provided via CSS custom property
    try {
      root.style.setProperty('--tn-theme-bg', themeBackground);
    } catch {
      // ignore
    }

    const iframeEl = document.createElement('iframe');
    iframeEl.className = state.isMinimized ? 'tn_iframe tn_hidden' : 'tn_iframe';
    iframeEl.src = widgetUrl;
    iframeEl.setAttribute('title', 'Terao Navi Chat Widget');
    iframeEl.setAttribute('loading', 'lazy');

    const launcherBtn = document.createElement('button');
    launcherBtn.type = 'button';
    launcherBtn.className = isPreview ? 'tn_preview_launcher' : 'tn_launcher';
    if (!state.isMinimized) {
      launcherBtn.classList.add('tn_hidden');
    }
    launcherBtn.setAttribute('aria-label', 'Open chat');
    launcherBtn.textContent = displayTitle;
    if (isPreview) {
      // Force the launcher to bottom-right within the preview area.
      launcherBtn.style.setProperty('position', 'absolute', 'important');
      launcherBtn.style.setProperty('inset', 'auto 16px 16px auto', 'important');
      launcherBtn.style.setProperty('right', '16px', 'important');
      launcherBtn.style.setProperty('left', 'auto', 'important');
      launcherBtn.style.setProperty('top', 'auto', 'important');
      launcherBtn.style.setProperty('bottom', '16px', 'important');
      launcherBtn.style.setProperty('margin', '0', 'important');
      launcherBtn.style.setProperty('transform', 'none', 'important');
    }
    launcherBtn.addEventListener('click', () => setMinimized(root, iframeEl, launcherBtn, false));
    root.appendChild(launcherBtn);

    root.appendChild(iframeEl);

    window.addEventListener('message', async (ev) => {
      // Only accept messages coming from our iframe.
      if (!ev || ev.source !== iframeEl.contentWindow) return;

      // If the iframe is served from a different origin (redirect/proxy), update it.
      if (ev.origin && widgetOrigin !== ev.origin) {
        widgetOrigin = ev.origin;
      }

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
    setMinimized(root, iframeEl, launcherBtn, state.isMinimized);
    if (isPreview) {
      postToWidget(iframeEl, { type: 'TERAO_NAVI_STATE', payload: { messages: state.messages.slice(), isTyping: state.isTyping } });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
