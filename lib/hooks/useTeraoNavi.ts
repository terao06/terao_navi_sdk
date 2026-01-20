/**
 * Terao Navi API React Hooks
 * 
 * React環境でTeraoNaviClientを簡単に使用するためのカスタムフック
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  TeraoNaviClient,
  TokenInfo,
} from '@/lib/api/teraoNaviClient';

// ============================================================================
// Types
// ============================================================================

interface UseTeraoNaviOptions {
  baseUrl?: string;
  clientId?: string;
  clientSecret?: string;
  autoAuthenticate?: boolean;
}

interface UseTeraoNaviReturn {
  ask: (question: string, applicationId?: number) => Promise<string>;
  healthCheck: () => Promise<{ status: string; timestamp: string }>;
  authenticate: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearTokens: () => void;
  tokenInfo: TokenInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Terao Navi APIを使用するためのReactフック
 * 
 * @param options クライアント設定オプション
 * @returns Terao Navi API操作関数とステート
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { ask, isLoading, error } = useTeraoNavi({
 *     baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
 *     autoAuthenticate: true,
 *   });
 * 
 *   const handleAsk = async () => {
 *     const answer = await ask('製品の使い方は？');
 *     console.log(answer);
 *   };
 * 
 *   return (
 *     <div>
 *       <button onClick={handleAsk} disabled={isLoading}>
 *         質問する
 *       </button>
 *       {error && <p>エラー: {error}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useTeraoNavi(options?: UseTeraoNaviOptions): UseTeraoNaviReturn {
  const clientRef = useRef<TeraoNaviClient | null>(null);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // クライアントの初期化
  useEffect(() => {
    if (!clientRef.current) {
      clientRef.current = new TeraoNaviClient({
        autoRefresh: true,
      });
    }
  }, [options?.baseUrl, options?.clientId, options?.clientSecret]);

  // 自動認証
  useEffect(() => {
    if (options?.autoAuthenticate && !isAuthenticated && clientRef.current) {
      authenticate();
    }
  }, [options?.autoAuthenticate, isAuthenticated]);

  /**
   * 認証実行
   */
  const authenticate = useCallback(async () => {
    if (!clientRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      await clientRef.current.authenticate();
      const token = clientRef.current.getTokenInfo();
      setTokenInfo(token);
      setIsAuthenticated(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '認証に失敗しました';
      setError(errorMessage);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * トークン更新
   */
  const refreshToken = useCallback(async () => {
    if (!clientRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      await clientRef.current.refreshToken();
      const token = clientRef.current.getTokenInfo();
      setTokenInfo(token);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'トークン更新に失敗しました';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 質問送信
   */
  const ask = useCallback(
    async (question: string, applicationId?: number): Promise<string> => {
      if (!clientRef.current) {
        throw new Error('クライアントが初期化されていません');
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await clientRef.current.ask({
          question,
          application_id: applicationId || null,
        });
        return response.data.answer;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '質問送信に失敗しました';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * ヘルスチェック
   */
  const healthCheck = useCallback(async () => {
    if (!clientRef.current) {
      throw new Error('クライアントが初期化されていません');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await clientRef.current.healthCheck();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ヘルスチェックに失敗しました';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * トークンクリア
   */
  const clearTokens = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.clearTokens();
      setTokenInfo(null);
      setIsAuthenticated(false);
    }
  }, []);

  return {
    ask,
    healthCheck,
    authenticate,
    refreshToken,
    clearTokens,
    tokenInfo,
    isAuthenticated,
    isLoading,
    error,
  };
}
