import { NextRequest, NextResponse } from 'next/server';
import { TeraoNaviClient } from '@/lib/api/teraoNaviClient';

// Terao Navi APIクライアントのキャッシュ（company_id毎）
const clientCache = new Map<string, TeraoNaviClient>();

/**
 * Terao Navi APIクライアントを取得（キャッシュ対応）
 * @param company_id 企業ID
 * @param origin 埋め込み元のorigin
 * @param referer 埋め込み元のフルURL
 */
function getTeraoNaviClient(company_id: string, origin?: string, referer?: string): TeraoNaviClient {
  // キャッシュをチェック
  if (clientCache.has(company_id)) {
    const client = clientCache.get(company_id)!;
    // originとrefererを更新
    if (origin) {
      client.setOrigin(origin);
    }
    if (referer) {
      client.setReferer(referer);
    }
    return client;
  }

  // company_idを使用するクライアントを作成
  const client = new TeraoNaviClient({
    company_id: company_id,
    origin: origin,
    referer: referer,
    autoRefresh: true,
  });

  // キャッシュに保存
  clientCache.set(company_id, client);

  return client;
}

export async function POST(request: NextRequest) {
  try {
    const { message, company_id, origin, referer, application_id } = await request.json();

    // バリデーション - company_id
    if (!company_id || typeof company_id !== 'string') {
      return NextResponse.json(
        { error: '企業IDが必要です' },
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
    const client = getTeraoNaviClient(company_id, origin, referer);

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
