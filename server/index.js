import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config(); // .env ファイルから環境変数をロード

const app = express();
const httpServer = createServer(app);

// CORS設定
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // 環境変数からフロントエンドのURLを読み込むか、全て許可
  methods: ["GET", "POST"]
}));

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ["GET", "POST"]
  }
});

// Supabaseクライアントの初期化
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // サービスロールキーを使用
const supabase = createClient(supabaseUrl, supabaseKey);

// ルートハンドラ
app.get('/', (req, res) => {
  res.send('Mahjong Game Server is running!');
});

// Socket.io接続ハンドラ
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });

  // ここにゲームロジックを実装
  // 例: socket.on('createGame', async (callback) => { ... });
  // 例: socket.on('joinGame', async (gameId, callback) => { ... });
  // 例: socket.on('playerAction', async (actionData) => { ... });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
