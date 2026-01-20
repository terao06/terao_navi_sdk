/**
 * Terao Navi API Client
 * 
 * LLMとベクトルデータベースを活用した質問応答システムを提供するナビゲーションAPIのクライアント
 * 
 * @description
 * - 2段階認証（Basic認証 → Bearer Token）
 * - トークン自動管理（発行・更新・キャッシュ）
 * - リフレッシュトークンによる自動更新
 */

// ============================================================================
// Types
// ============================================================================

/**
 * トークンレスポンス
 */
interface TokenResponse {
  status: 'success';
  data: {
    access_token: string;
    expires_at: string;
    ttl_seconds: number;
    refresh_token: string;
    refresh_expires_at: string;
    refresh_ttl_seconds: number;
  };
}

/**
 * エラーレスポンス
 */
interface ErrorResponse {
  status: 'error';
  message: string;
  error_code?: string;
  details?: Record<string, unknown>;
}

/**
 * 質問リクエスト
 */
interface QuestionRequest {
  application_id?: number | null;
  question: string;
}

/**
 * 質問レスポンス
 */
interface QuestionResponse {
  status: 'success';
  data: {
    answer: string;
  };
}

/**
 * トークン情報（内部管理用）
 */
interface TokenInfo {
  access_token: string;
  access_expires_at: Date;
  refresh_token: string;
  refresh_expires_at: Date;
}

/**
 * クライアント設定
 */
interface TeraoNaviClientConfig {
  credential?: string; // Base64エンコード済みの "clientId:clientSecret"
  origin?: string; // 埋め込み元のorigin
  referer?: string; // 埋め込み元のフルURL
  autoRefresh?: boolean;
}

// ============================================================================
// TeraoNaviClient Class
// ============================================================================

/**
 * Terao Navi API クライアント
 * 
 * @example
 * ```typescript
 * const client = new TeraoNaviClient({
 *   baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
 * });
 * 
 * await client.authenticate();
 * const response = await client.ask({ question: '製品の使い方は？' });
 * console.log(response.data.answer);
 * ```
 */
export class TeraoNaviClient {
  private baseUrl: string;
  private credential: string; // Base64エンコード済みの認証情報
  private origin: string; // 埋め込み元のorigin
  private referer: string; // 埋め込み元のフルURL
  private autoRefresh: boolean;
  private tokenInfo: TokenInfo | null = null;

  constructor(config: TeraoNaviClientConfig) {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    
    // credentialが指定されている場合はそれを使用、なければclientIdとclientSecretをエンコード
    this.credential = config.credential || "";
    this.origin = config.origin || "";
    this.referer = config.referer || "";
    
    this.autoRefresh = config.autoRefresh ?? true;

    // URLの末尾スラッシュを削除
    this.baseUrl = this.baseUrl.replace(/\/$/, '');
  }

  /**
   * originを設定
   * @param origin 埋め込み元のorigin
   */
  setOrigin(origin: string): void {
    this.origin = origin;
  }

  /**
   * refererを設定
   * @param referer 埋め込み元のフルURL
   */
  setReferer(referer: string): void {
    this.referer = referer;
  }

  // ==========================================================================
  // Authentication Methods
  // ==========================================================================

  /**
   * Basic認証を使用してトークンを取得
   * 
   * @returns TokenResponse
   * @throws Error 認証失敗時
   */
  async authenticate(): Promise<TokenResponse> {
    if (!this.credential) {
      throw new Error('認証情報が設定されていません');
    }

    // Basic認証ヘッダー（credentialは既にBase64エンコード済み）
    const authHeader = `Basic ${this.credential}`;

    // ヘッダーを構築
    const headers: Record<string, string> = {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    };

    // originが設定されている場合は追加
    if (this.origin) {
      headers['X-Origin'] = this.origin;
    }

    // refererが設定されている場合は追加
    if (this.referer) {
      headers['X-Referer'] = this.referer;
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/token`, {
        method: 'POST',
        headers: headers,
      });

      if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(
          `認証に失敗しました (${response.status}): ${errorData.message || '不明なエラー'}`
        );
      }

      const data = await response.json() as TokenResponse;
      
      // トークン情報を保存
      this.tokenInfo = {
        access_token: data.data.access_token,
        access_expires_at: new Date(data.data.expires_at),
        refresh_token: data.data.refresh_token,
        refresh_expires_at: new Date(data.data.refresh_expires_at),
      };

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('認証中に予期しないエラーが発生しました');
    }
  }

  /**
   * リフレッシュトークンを使用して新しいトークンペアを取得
   * 
   * @returns TokenResponse
   * @throws Error トークン更新失敗時
   */
  async refreshToken(): Promise<TokenResponse> {
    if (!this.tokenInfo?.refresh_token) {
      throw new Error('リフレッシュトークンが存在しません。先に authenticate() を呼び出してください');
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.tokenInfo.refresh_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(
          `トークン更新に失敗しました (${response.status}): ${errorData.message || '不明なエラー'}`
        );
      }

      const data = await response.json() as TokenResponse;
      
      // トークン情報を更新
      this.tokenInfo = {
        access_token: data.data.access_token,
        access_expires_at: new Date(data.data.expires_at),
        refresh_token: data.data.refresh_token,
        refresh_expires_at: new Date(data.data.refresh_expires_at),
      };

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('トークン更新中に予期しないエラーが発生しました');
    }
  }

  /**
   * アクセストークンが有効かチェック
   * 
   * @param bufferSeconds トークン有効期限前のバッファ時間（秒）
   * @returns boolean
   */
  private isAccessTokenValid(bufferSeconds: number = 60): boolean {
    if (!this.tokenInfo) return false;
    
    const now = new Date();
    const expiresAt = new Date(this.tokenInfo.access_expires_at);
    const bufferTime = new Date(expiresAt.getTime() - bufferSeconds * 1000);
    
    return now < bufferTime;
  }

  /**
   * 有効なアクセストークンを取得（必要に応じて自動更新）
   * 
   * @returns string アクセストークン
   * @throws Error トークン取得失敗時
   */
  private async getValidAccessToken(): Promise<string> {
    // トークンが存在しない場合は認証
    if (!this.tokenInfo) {
      await this.authenticate();
    }

    // トークンが有効期限切れの場合は更新
    if (!this.isAccessTokenValid() && this.autoRefresh) {
      try {
        await this.refreshToken();
      } catch (error) {
        // リフレッシュ失敗時は再認証
        console.warn('トークンの更新に失敗しました。再認証します...', error);
        await this.authenticate();
      }
    }

    if (!this.tokenInfo?.access_token) {
      throw new Error('有効なアクセストークンを取得できませんでした');
    }

    return this.tokenInfo.access_token;
  }

  // ==========================================================================
  // API Methods
  // ==========================================================================

  /**
   * 質問を送信して回答を取得
   * 
   * @param request 質問リクエスト
   * @returns QuestionResponse
   * @throws Error API呼び出し失敗時
   */
  async ask(request: QuestionRequest): Promise<QuestionResponse> {
    // バリデーション
    if (!request.question || request.question.trim().length === 0) {
      throw new Error('質問内容が空です');
    }

    if (request.question.length > 1000) {
      throw new Error('質問内容は1000文字以内にしてください');
    }

    // アクセストークンを取得
    const accessToken = await this.getValidAccessToken();

    // ヘッダーを構築
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    // originが設定されている場合は追加
    if (this.origin) {
      headers['X-Origin'] = this.origin;
    }

    // refererが設定されている場合は追加
    if (this.referer) {
      headers['X-Referer'] = this.referer;
    }

    try {
      const response = await fetch(`${this.baseUrl}/ask`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(
          `API呼び出しに失敗しました (${response.status}): ${errorData.message || '不明なエラー'}`
        );
      }

      const data = await response.json() as QuestionResponse;
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('質問送信中に予期しないエラーが発生しました');
    }
  }

  /**
   * ヘルスチェック
   * 
   * @returns ヘルスチェック結果
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`ヘルスチェックに失敗しました (${response.status})`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('ヘルスチェック中に予期しないエラーが発生しました');
    }
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * 現在のトークン情報を取得
   * 
   * @returns TokenInfo | null
   */
  getTokenInfo(): TokenInfo | null {
    return this.tokenInfo;
  }

  /**
   * トークン情報をクリア
   */
  clearTokens(): void {
    this.tokenInfo = null;
  }

  /**
   * クライアント設定情報を取得
   * 
   * @returns クライアント設定（機密情報は除く）
   */
  getConfig(): { baseUrl: string; autoRefresh: boolean } {
    return {
      baseUrl: this.baseUrl,
      autoRefresh: this.autoRefresh,
    };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * TeraoNaviClientのインスタンスを生成
 * 
 * @param config クライアント設定
 * @returns TeraoNaviClient
 */
export function createTeraoNaviClient(config?: TeraoNaviClientConfig): TeraoNaviClient {
  return new TeraoNaviClient(config || {});
}

// ============================================================================
// Export Types
// ============================================================================

export type {
  TokenResponse,
  ErrorResponse,
  QuestionRequest,
  QuestionResponse,
  TokenInfo,
  TeraoNaviClientConfig,
};
