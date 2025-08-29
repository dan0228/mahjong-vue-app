// api/ranking.js

// This is a Vercel Serverless Function that acts as a backend.
// It fetches tweets with a specific hashtag, parses them, and creates a leaderboard.

import { TwitterApi } from 'twitter-api-v2';

// Helper function to parse streak number from tweet text
const parseStreak = (text) => {
  const patterns = [
    /(?:集計用|For Tally)[:：]\s*(\d+)/i, // Full-width and half-width colon
    /(\d+)\s*連勝/,
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
  // Allow CORS for all origins for simplicity in this example.
  // In a real-world scenario, you might want to restrict this to your frontend's domain.
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  const { X_API_KEY } = process.env;

  if (!X_API_KEY) {
    return response.status(500).json({ error: 'X_API_KEY is not configured on the server.' });
  }

  try {
    // Initialize the client with your App-only Bearer Token
    const twitterClient = new TwitterApi(X_API_KEY);
    const readOnlyClient = twitterClient.readOnly;

    // Search for recent tweets with the specified hashtag
    const searchResult = await readOnlyClient.v2.search('#よんじゃん連勝数 -is:retweet', {
      'tweet.fields': ['public_metrics', 'created_at'],
      'expansions': ['author_id'],
      'user.fields': ['name', 'username', 'profile_image_url'],
      max_results: 100, // Fetch a good number of tweets to parse
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
          // Only keep the highest streak for each user
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

    // Sort by streak descending
    const sortedLeaderboard = Object.values(userStreaks).sort((a, b) => b.streak - a.streak);

    // Assign ranks and take the top 10
    const finalLeaderboard = sortedLeaderboard.slice(0, 10).map((player, index) => ({
      ...player,
      rank: index + 1,
    }));

    response.status(200).json(finalLeaderboard);

  } catch (error) {
    console.error('Error fetching from X API:', error);
    response.status(500).json({ 
      error: 'Failed to fetch data from X API.',
      details: error.message 
    });
  }
}
