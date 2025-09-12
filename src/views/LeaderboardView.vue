<template>
  <div class="leaderboard-view-container" :style="{ height: viewportHeight }">
    <div class="leaderboard-screen" :style="scalerStyle">
      <div class="max-consecutive-wins">
        {{ $t('titleView.maxWinStreak') }} <span class="max-wins-number">{{ gameStore.maxConsecutiveWins }}</span>
      </div>
      <div class="top-controls">
        <div class="audio-toggles">
          <label class="toggle-switch">
            <input type="checkbox" :checked="audioStore.isBgmEnabled" @change="audioStore.toggleBgm()" />
            <span class="slider round"></span>
          </label>
          <span class="toggle-label">{{ $t('shrineView.bgm') }}</span>
          <label class="toggle-switch">
            <input type="checkbox" :checked="audioStore.isSeEnabled" @change="audioStore.toggleSe()" />
            <span class="slider round"></span>
          </label>
          <span class="toggle-label">{{ $t('shrineView.sfx') }}</span>
        </div>
        <button @click="goBack" class="back-button">
          <img src="/assets/images/button/buckToTitle.png" :alt="$t('shrineView.backToTitle')" />
        </button>
      </div>

      <h1><span v-html="$t('leaderboardView.title')"></span></h1>

      <div v-if="isLoading" class="loading-message">{{ $t('leaderboardView.loading') }}</div>

      <div v-if="!isLoading" class="ranking-table-container">
        <table class="ranking-table">
          <colgroup>
            <col style="width: 12%;" />
            <col style="width: 20%;" />
            <col style="width: 38%;" />
            <col style="width: 15%;" />
            <col style="width: 15%;" />
          </colgroup>
          <thead>
            <tr>
              <th>{{ $t('leaderboardView.tableHeaderNo') }}</th>
              <th colspan="2">{{ $t('leaderboardView.tableHeaderUserName') }}</th>
              <th>{{ $t('leaderboardView.tableHeaderWinStreak') }}</th>
              <th>{{ $t('leaderboardView.tableHeaderPost') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="player in displayLeaderboard" :key="player.id">
              <td>{{ player.rank }}</td>
              <td class="user-avatar-cell">
                <img v-if="player.profile_image_url" :src="player.profile_image_url" alt="avatar" class="user-avatar" />
                <span v-else>-</span>
              </td>
              <td class="user-name-cell">
                <div class="user-name">{{ player.name }}</div>
                <div class="user-username">{{ player.username !== '-' ? '@' + player.username : '-' }}</div>
              </td>
              <td class="streak-cell">{{ player.streak }}</td>
              <td>
                <a v-if="player.url !== '#'" :href="player.url" target="_blank" rel="noopener noreferrer">{{ $t('leaderboardView.viewPost') }}</a>
                <span v-else>-</span>
              </td>
            </tr>
          </tbody>
        </table>
        <p class="update-notice" v-html="$t('leaderboardView.updateNotice')"></p>
        <div class="info-section">
          <h4>{{ $t('leaderboardView.aggregationMethodTitle') }}</h4>
          <p class="description" v-html="$t('leaderboardView.description')"></p>
          <p class="post-prompt" v-html="$t('leaderboardView.postPrompt')"></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * ランキング表示コンポーネント。
 * APIから週間ランキングデータを取得し、表示します。
 * 常に5行表示を維持し、データがない場合や取得に失敗した場合はプレースホルダーを表示します。
 * 開発環境ではモックデータを使用します。
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useViewportHeight } from '@/composables/useViewportHeight';
import { useAudioStore } from '@/stores/audioStore';
import { useGameStore } from '@/stores/gameStore';

// --- リアクティブな状態とストア ---
const router = useRouter();
const { t } = useI18n();
const { viewportHeight } = useViewportHeight();
const audioStore = useAudioStore();
const gameStore = useGameStore();

const leaderboard = ref([]); // APIから取得した生のランキングデータ
const isLoading = ref(true); // ローディング状態フラグ
const error = ref(null); // エラーメッセージ（デバッグ用）

// --- 画面のスケーリング処理 ---
const DESIGN_WIDTH = 360; // デザイン基準の幅
const DESIGN_HEIGHT = 640; // デザイン基準の高さ
const scaleFactor = ref(1); // 計算されたスケール係数

// UI要素に適用するtransformスタイル
const scalerStyle = computed(() => ({
  transform: `translate(-50%, -50%) scale(${scaleFactor.value})`
}));

/**
 * ウィンドウサイズに基づいてUIのスケール係数を計算・更新します。
 */
const updateScaleFactor = () => {
  const currentWidth = window.innerWidth;
  const currentHeight = window.innerHeight;
  const scaleX = currentWidth / DESIGN_WIDTH;
  const scaleY = currentHeight / DESIGN_HEIGHT;
  scaleFactor.value = Math.min(scaleX, scaleY);
};

/**
 * 表示用のランキングデータを生成します。
 * 常に5行表示を保証し、データが5件未満の場合はプレースホルダーで埋めます。
 */
const displayLeaderboard = computed(() => {
  const data = leaderboard.value.slice(0, 5);
  while (data.length < 5) {
    data.push({
      rank: data.length + 1,
      id: `placeholder-${data.length}`,
      name: '-',
      username: '-',
      streak: '-',
      url: '#',
      profile_image_url: ''
    });
  }
  return data;
});

// 開発環境用のモックデータ
const mockData = [
  { rank: 1, id: 'user1', name: 'ねこマスター', username: 'cat_master', streak: 50, url: '#', profile_image_url: '/assets/images/info/cat_icon_1.png' },
  { rank: 2, id: 'user2', name: 'とら', username: 'tora_chan', streak: 45, url: '#', profile_image_url: '/assets/images/info/cat_icon_2.png' },
  { rank: 3, id: 'user3', name: 'たま', username: 'tama_nyan', streak: 42, url: '#', profile_image_url: '/assets/images/info/cat_icon_3.png' }
];

/**
 * ランキングデータをAPIから非同期で取得します。
 * 開発環境ではモックデータを使用します。
 */
async function fetchLeaderboard() {
  isLoading.value = true;
  error.value = null;

  if (import.meta.env.DEV) {
    console.log('ローカル開発モードで実行中。ランキングにモックデータを使用します。');
    setTimeout(() => {
      leaderboard.value = mockData;
      isLoading.value = false;
    }, 1000);
  } else {
    try {
      const response = await fetch('/api/ranking');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('leaderboardView.fetchError'));
      }
      leaderboard.value = await response.json();
    } catch (e) {
      console.error(e);
      // エラーが発生した場合、ランキングを空にしてプレースホルダー表示にフォールバック
      leaderboard.value = [];
      error.value = e.message; // エラー情報を保持（デバッグ用）
    } finally {
      isLoading.value = false;
    }
  }
}

// --- ライフサイクルフック ---
onMounted(() => {
  updateScaleFactor();
  window.addEventListener('resize', updateScaleFactor);
  fetchLeaderboard();
  gameStore.loadCatCoins(); // 猫コインの枚数をストアから読み込む
  audioStore.setBgm('GB-JP-A02-2(Menu-Loop105).mp3');
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScaleFactor);
  audioStore.setBgm(null); // 画面を離れる際にBGMを停止
});

/**
 * 前の画面（タイトル画面）に戻ります。
 */
function goBack() {
  router.push('/');
}
</script>

<style scoped>
.leaderboard-view-container {
  position: relative;
  width: 100vw;
  overflow: hidden;
  background-image: url('/assets/images/back/back_out.png');
  background-repeat: repeat;
}

.leaderboard-screen {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 360px;
  height: 640px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  font-family: 'M PLUS Rounded 1c', sans-serif;
  color: #333;
  background-image: url('/assets/images/back/ranking.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  box-sizing: border-box;
  touch-action: none !important;
}

.max-consecutive-wins {
  position: absolute;
  top: 12px;
  left: 20px; /* 左端からの位置を調整 */
  font-size: 0.7em;
  color: #333;
  z-index: 10;
  background-color: rgba(255, 255, 255, 0.6); /* 背景色 */
  padding: 3px 14px; /* パディング */
  border-radius: 8px; /* 角丸 */
  white-space: nowrap; /* テキストが改行されないように */
}

.max-wins-number {
  font-weight: bold;
  color: #cc6633; /* #C63 */
}

.top-controls {
  position: absolute;
  top: 10px;
  right: 15px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  z-index: 10;
}

.audio-toggles {
  display: flex;
  flex-direction: row; /* 横並びにする */
  align-items: center;
  gap: 5px; /* 要素間の間隔 */
  font-size: 0.8em;
  color: #333;
  background-color: rgba(255, 255, 255, 0.6); /* 背景色 */
  padding: 5px 8px; /* パディング */
  border-radius: 8px; /* 角丸 */
  white-space: nowrap; /* テキストが改行されないように */
  margin-right: 10px; /* ボタンとの間隔 */
  margin-bottom: 40px;
  scale: 0.86; /* 少し小さくする */
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 24px;
  height: 14px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  -webkit-transition: 0.4s;
  transition: 0.4s;
  border-radius: 14px;
}

.slider:before {
  position: absolute;
  content: '';
  height: 10px;
  width: 10px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  -webkit-transition: 0.4s;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #2196f3;
}

input:focus + .slider {
  box-shadow: 0 0 1px #2196f3;
}

input:checked + .slider:before {
  -webkit-transform: translateX(10px);
  -ms-transform: translateX(10px);
  transform: translateX(10px);
}

.toggle-label {
  vertical-align: middle;
  font-size: 0.9em; /* ラベルのフォントサイズも調整 */
}

.back-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.back-button img {
  width: 60px;
  height: auto;
}

.back-button:hover img {
  opacity: 0.8;
}

h1 {
  margin-top: 50px; /* 戻るボタンのためのスペース確保 */
  margin-bottom: 5px;
  font-size: 1.65em;
}

.description {
  font-size: 0.9em;
  color: #222222;
  margin-bottom: 10px;
  margin-left: 3%;
  text-align: center;
  width: 95%;
  max-width: 280px;
}

.loading-message,
.error-message {
  margin: 20px;
  font-size: 1.2em;
}

.error-message {
  color: #d32f2f;
}

.ranking-table-container {
  width: 100%;
  max-width: 260px;
  overflow-x: auto;
  flex-grow: 1; /* コンテナがスペースを埋めるようにする */
  overflow-y: auto; /* テーブルをスクロール可能にする */
  margin-bottom: 20px; /* 下部に余白を追加 */
}

.ranking-table {
  width: 100%;
  border-collapse: separate; /* border-radiusを有効にするため */
  border-spacing: 0;
  background-color: #fffdf5; /* クリーム色の背景 */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  table-layout: fixed;
  border-radius: 8px; /* テーブルの角を丸める */
  overflow: hidden; /* 角丸を内側の要素にも適用させる */
}

.ranking-table th,
.ranking-table td {
  border-bottom: 1px solid #d6c4be; /* ソフトなピンクブラウンの境界線 */
  padding: 2px;
  text-align: center;
  vertical-align: middle;
  font-size: 0.68em;
  word-break: break-word;
  color: #5c4b4b; /* ソフトなダークブラウンのテキスト */
}

.ranking-table td {
  border-left: 1px solid #d6c4be;
  border-right: 1px solid #d6c4be;
}
.ranking-table tr:last-child td {
  border-bottom: none; /* 最終行のセルの下ボーダーを削除 */
}

.ranking-table th {
  background-color: #e1c9c1; /* くすんだピンクのヘッダー */
  font-weight: bold;
  position: sticky;
  top: 0;
}

.ranking-table tbody tr:nth-child(even) {
  background-color: #f9f5f2; /* 明るいウォームグレーの交互色 */
}

.user-avatar-cell {
  width: 50px;
  padding-right: 0;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.user-name-cell {
  line-height: 1.2;
}
.user-name {
  font-weight: bold;
}
.user-username {
  font-size: 0.9em;
  color: #555;
}

.streak-cell {
  font-weight: bold;
  font-size: 1.1em;
  text-align: center;
}

.ranking-table a {
  color: #c65b5b; /* ソフトで温かみのある赤 */
  text-decoration: none;
  font-weight: bold;
}

.ranking-table a:hover {
  text-decoration: underline;
}

.update-notice {
  font-size: 0.6em;
  color: #555;
  text-align: center;
  margin-top: 0px;
}

.description {
  font-size: 0.75em;
  color: #333;
  margin-top: 2px;
  margin-left: 0%;
  text-align: center;
  width: 100%;
  max-width: 280px;
}

.info-section {
  margin-top: 10px;
  padding: 0px;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  width: 100%;
  max-width: 280px;
}

.info-section h4 {
  font-size: 0.85em;
  font-weight: bold;
  color: #333;
  margin-bottom: 2px;
  text-align: center;
}

.post-prompt {
  font-size: 0.72em;
  color: #c65b5b;
  text-align: center;
  margin-top: 2px;
  font-weight: bold;
}
</style>