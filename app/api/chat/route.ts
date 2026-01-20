import { NextRequest, NextResponse } from 'next/server';
import { TeraoNaviClient } from '@/lib/api/teraoNaviClient';

// Terao Navi APIクライアントのキャッシュ（credential毎）
const clientCache = new Map<string, TeraoNaviClient>();

/**
 * Terao Navi APIクライアントを取得（キャッシュ対応）
 * @param credential Base64エンコードされた "clientId:clientSecret"
 * @param origin 埋め込み元のorigin
 * @param referer 埋め込み元のフルURL
 */
function getTeraoNaviClient(credential: string, origin?: string, referer?: string): TeraoNaviClient {
  // キャッシュをチェック
  if (clientCache.has(credential)) {
    const client = clientCache.get(credential)!;
    // originとrefererを更新
    if (origin) {
      client.setOrigin(origin);
    }
    if (referer) {
      client.setReferer(referer);
    }
    return client;
  }

  // credentialをそのまま使用するクライアントを作成
  const client = new TeraoNaviClient({
    credential: credential, // Base64エンコード済み
    origin: origin,
    referer: referer,
    autoRefresh: true,
  });

  // キャッシュに保存
  clientCache.set(credential, client);

  return client;
}

export async function POST(request: NextRequest) {
  try {
    const { message, credential, origin, referer, application_id } = await request.json();

    // バリデーション - credential
    if (!credential || typeof credential !== 'string') {
      return NextResponse.json(
        { error: '認証情報が必要です' },
        { status: 401 }
      );
    }

    // バリデーション - message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: '質問内容が空です' },
        { status: 400 }
      );
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { error: '質問内容は1000文字以内にしてください' },
        { status: 400 }
      );
    }

    // Terao Navi APIクライアントを取得
    const client = getTeraoNaviClient(credential, origin, referer);

    // Terao Navi APIに質問を送信
    const response = await client.ask({
      question: message,
      application_id: application_id || null,
    });

    // 成功レスポンスを返却
    return NextResponse.json({
      success: true,
      response: response.data.answer,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Chat API Error:', error);

    // エラーメッセージの抽出
    const errorMessage =
      error instanceof Error ? error.message : 'チャット処理中にエラーが発生しました';

    // エラーステータスの判定
    let statusCode = 500;
    if (errorMessage.includes('認証')) {
      statusCode = 401;
    } else if (errorMessage.includes('質問内容')) {
      statusCode = 400;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
