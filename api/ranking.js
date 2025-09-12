// api/ranking.js

// これはバックエンドとして機能するVercelサーバーレス関数です。
// 特定のハッシュタグを持つツイートを取得し、解析してリーダーボードを作成します。

import { TwitterApi } from 'twitter-api-v2';

// ツイート本文から連勝数を解析するためのヘルパー関数
const parseStreak = (text) => {
  const patterns = [
    /(?:集計用|For Tally)[:：]\s*(\d+)/i, // 全角および半角コロン
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  }
  return null;
};

export default async function handler(request, response) {
  // この例では簡単にするため、すべてのオリジンからのCORSを許可します。
  // 実際のアプリケーションでは、フロントエンドのドメインに制限することをお勧めします。
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  const { X_API_KEY } = process.env;

  if (!X_API_KEY) {
    return response.status(500).json({ error: 'X_API_KEYがサーバーに設定されていません。' });
  }

  try {
    // アプリ専用のBearerトークンでクライアントを初期化します
    const twitterClient = new TwitterApi(X_API_KEY);
    const readOnlyClient = twitterClient.readOnly;

    // 指定されたハッシュタグを持つ最近のツイートを検索します
    const searchResult = await readOnlyClient.v2.search('#よんじゃん連勝数 -is:retweet', {
      'tweet.fields': ['public_metrics', 'created_at'],
      'expansions': ['author_id'],
      'user.fields': ['name', 'username', 'profile_image_url'],
      max_results: 100, // 解析のために十分な数のツイートを取得します
    });

    const users = searchResult.includes.users;
    const tweets = searchResult.data.data;

    const leaderboard = [];
    const userStreaks = {};

    for (const tweet of tweets) {
      const streak = parseStreak(tweet.text);
      if (streak !== null) {
        const user = users.find(u => u.id === tweet.author_id);
        if (user) {
          // 各ユーザーの最高の連勝数のみを保持します
          if (!userStreaks[user.id] || streak > userStreaks[user.id].streak) {
            userStreaks[user.id] = {
              id: user.id,
              name: user.name,
              username: user.username,
              streak: streak,
              url: `https://x.com/${user.username}/status/${tweet.id}`,
              profile_image_url: user.profile_image_url,
            };
          }
        }
      }
    }

    // 連勝数で降順にソートします
    const sortedLeaderboard = Object.values(userStreaks).sort((a, b) => b.streak - a.streak);

    // 順位を割り当て、トップ10を取得します
    const finalLeaderboard = sortedLeaderboard.slice(0, 10).map((player, index) => ({
      ...player,
      rank: index + 1,
    }));

    // 次の3時間マーク（0, 3, 6, ... UTC）までの動的なキャッシュ時間を計算します
    const now = new Date();
    const currentHour = now.getUTCHours();
    const nextMark = Math.ceil((currentHour + 1) / 3) * 3;
    const expiryDate = new Date(now);
    expiryDate.setUTCHours(nextMark, 0, 0, 0);

    const secondsToExpiry = Math.round((expiryDate.getTime() - now.getTime()) / 1000);

    // キャッシュヘッダーを設定します。Vercelはこのレスポンスを次の3時間マークまでキャッシュします。
    response.setHeader('Cache-Control', `s-maxage=${secondsToExpiry}, stale-while-revalidate`);

    response.status(200).json(finalLeaderboard);

  } catch (error) {
    console.error('X APIからのデータ取得中にエラーが発生しました:', error);
    response.status(500).json({ 
      error: 'X APIからのデータ取得に失敗しました。',
      details: error.message 
    });
  }
}
