<template>
  <div class="leaderboard-view-container" :style="{ height: viewportHeight }">
    <LoadingIndicator v-if="isLoading" />
    <div class="leaderboard-screen" :style="scalerStyle">
      <div class="max-consecutive-wins">
        {{ $t('titleView.maxWinStreak') }} <span class="max-wins-number">{{ userStore.profile?.max_win_streak || 0 }}</span>
      </div>
      <div class="cat-coins-display">
        <img src="/assets/images/info/cat_coin.png" alt="Cat Coin" class="cat-coin-icon-small" />
        <span class="cat-coins-number">{{ userStore.profile?.cat_coins || 0 }}</span>
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

      <!-- ランキング種類切り替えUI -->
      <div class="ranking-type-buttons">
        <button :class="{ active: activeRankingType === 'catCoins' }" @click="activeRankingType = 'catCoins'">{{ $t('leaderboardView.typeCatCoins') }}</button>
        <button :class="{ active: activeRankingType === 'winStreak' }" @click="activeRankingType = 'winStreak'">{{ $t('leaderboardView.typeWinStreak') }}</button>
      </div>

      <div v-if="!isLoading" class="ranking-table-container">
        <table class="ranking-table">
          <colgroup>
            <col style="width: 15%;" />
            <col style="width: 70%;" />
            <col style="width: 15%;" v-if="activeRankingType === 'winStreak'" />
          </colgroup>
          <thead>
            <tr v-if="activeRankingType === 'winStreak'">
              <th>{{ $t('leaderboardView.tableHeaderNo') }}</th>
              <th>{{ $t('leaderboardView.tableHeaderUserName') }}</th>
              <th>{{ $t('leaderboardView.tableHeaderWinStreak') }}</th>
            </tr>
            <tr v-else>
              <th>{{ $t('leaderboardView.tableHeaderNo') }}</th>
              <th>{{ $t('leaderboardView.tableHeaderUserNameCatCoins') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="player in displayLeaderboard" :key="player.id" :class="{ 'is-first-place': player.isFirstPlace, 'is-second-place': player.isSecondPlace, 'is-third-place': player.isThirdPlace }">
              <td>{{ player.rank }}</td>
              <template v-if="activeRankingType === 'winStreak'">
                <td class="user-info-cell">
                  <div class="user-avatar-wrapper">
                    <a v-if="player.url !== '#'" :href="player.url" target="_blank" rel="noopener noreferrer" class="avatar-link-wrapper">
                      <img v-if="player.profile_image_url" :src="player.profile_image_url" alt="avatar" class="user-avatar" />
                      <span v-else>-</span>
                    </a>
                    <template v-else>
                      <img v-if="player.profile_image_url" :src="player.profile_image_url" alt="avatar" class="user-avatar" />
                      <span v-else>-</span>
                    </template>
                  </div>
                  <div class="user-details">
                    <div class="user-name">{{ player.name }}</div>
                  </div>
                </td>
                <td class="value-cell">
                  {{ player.streak }}
                </td>
              </template>
              <template v-else>
                <td class="user-info-cell">
                  <div class="user-avatar-wrapper">
                    <a v-if="player.url !== '#'" :href="player.url" target="_blank" rel="noopener noreferrer" class="avatar-link-wrapper">
                      <img v-if="player.profile_image_url" :src="player.profile_image_url" alt="avatar" class="user-avatar" />
                      <span v-else>-</span>
                    </a>
                    <template v-else>
                      <img v-if="player.profile_image_url" :src="player.profile_image_url" alt="avatar" class="user-avatar" />
                      <span v-else>-</span>
                    </template>
                  </div>
                  <div class="user-details">
                    <div class="user-name">{{ player.name }}</div>
                    <div class="user-cat-coins">
                      <img src="/assets/images/info/cat_coin.png" alt="Cat Coin" class="cat-coin-icon" />
                      {{ player.catCoins }}
                    </div>
                  </div>
                </td>
              </template>
            </tr>
          </tbody>
        </table>
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
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useViewportHeight } from '@/composables/useViewportHeight';
import { useAudioStore } from '@/stores/audioStore';
import { supabase } from '@/supabaseClient'; // Supabaseクライアントをインポート
import { useUserStore } from '@/stores/userStore'; // userStoreをインポート
import LoadingIndicator from '@/components/LoadingIndicator.vue';

// --- リアクティブな状態とストア ---
const router = useRouter();
const { t } = useI18n();
const { viewportHeight } = useViewportHeight();
const audioStore = useAudioStore();
const userStore = useUserStore(); // userStoreを使用

const leaderboard = ref([]); // 最大連勝数ランキングデータ
const catCoinsLeaderboard = ref([]); // 猫コインランキングデータ

const isLoading = ref(true);
const error = ref(null);

const activeRankingType = ref('catCoins'); // 'catCoins' または 'winStreak'

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
 * ランキングデータをSupabaseから非同期で取得します。
 */
async function fetchLeaderboardData(type) {
  isLoading.value = true;
  error.value = null;

  try {
    let data = [];
    if (type === 'winStreak') {
      // 最大連勝数取得ロジック
      const { data: fetchedData, error: supabaseError } = await supabase
        .from('users')
        .select('id, username, max_win_streak, avatar_url')
        .not('max_win_streak', 'is', null)
        .order('max_win_streak', { ascending: false })
        .limit(30);
      if (supabaseError) throw supabaseError;
      data = fetchedData;
    } else if (type === 'catCoins') { // 猫コインランキングの取得ロジックを追加
      const { data: fetchedData, error: supabaseError } = await supabase
        .from('users')
        .select('id, username, cat_coins, avatar_url')
        .not('cat_coins', 'is', null)
        .order('cat_coins', { ascending: false })
        .limit(30);
      if (supabaseError) throw supabaseError;
      data = fetchedData;
    } else {
      // 仮のデータ（モックデータ）
      console.log(`Fetching mock data for type: ${type}`);
      data = Array.from({ length: 5 }, (_, i) => ({
        id: `mock-${type}-${i}`,
        username: `MockUser${i + 1}`,
        max_win_streak: Math.floor(Math.random() * 100),
        cat_coins: Math.floor(Math.random() * 10000),
        avatar_url: '/assets/images/info/hito_icon_1.png',
      }));
      if (type === 'catCoins') {
        data.sort((a, b) => b.cat_coins - a.cat_coins);
      } else {
        data.sort((a, b) => b.max_win_streak - a.max_win_streak);
      }
    }

    // データを整形
    const processedData = data.map(player => ({
      id: player.id,
      name: player.username,
      username: '-',
      streak: player.max_win_streak,
      catCoins: player.cat_coins, // 猫コインを追加
      url: '#',
      profile_image_url: player.avatar_url || '/assets/images/info/hito_icon_1.png',
    }));

    // 適切なrefにデータを格納
    if (type === 'winStreak') leaderboard.value = processedData;
    else catCoinsLeaderboard.value = processedData; // catCoinsLeaderboard を使用

  } catch (e) {
    console.error('ランキングの取得エラー:', e.message);
    error.value = e.message;
    // エラー時は該当するrefを空にする
    if (type === 'winStreak') leaderboard.value = [];
    else catCoinsLeaderboard.value = [];
  } finally {
    isLoading.value = false;
  }
}
/**
 * 表示用のランキングデータを生成します。
 * 常に5行表示を保証し、データが5件未満の場合はプレースホルダーで埋めます。
 */
const displayLeaderboard = computed(() => {
  let currentData = activeRankingType.value === 'winStreak' ? leaderboard.value : catCoinsLeaderboard.value;

  const rankedData = [];
  let currentRank = 1;
  let previousValue = -1; // 連勝数または猫コイン
  let sameRankCount = 0;

  currentData.forEach((player) => {
    const value = activeRankingType.value === 'winStreak' ? player.streak : player.catCoins;

    // 降順でランク付け
    const isSameRank = (value === previousValue); // 常に降順なのでシンプルに

    if (!isSameRank || previousValue === -1) { // 初回または値が異なる場合
      currentRank += sameRankCount;
      sameRankCount = 0;
    }
    rankedData.push({
      ...player,
      rank: currentRank,
      isTopRank: currentRank <= 3,
      isFirstPlace: currentRank === 1,
      isSecondPlace: currentRank === 2,
      isThirdPlace: currentRank === 3,
    });
    previousValue = value;
    sameRankCount++;
  });

  return rankedData;
});

// --- ライフサイクルフック ---
onMounted(() => {
  updateScaleFactor();
  window.addEventListener('resize', updateScaleFactor);
  // 初期ロード時に総合・最大連勝数を取得
  fetchLeaderboardData('catCoins');
  audioStore.setBgm('GB-JP-A02-2(Menu-Loop105).mp3');
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScaleFactor);
  audioStore.setBgm(null);
});

/**
 * 前の画面（タイトル画面）に戻ります。
 */
function goBack() {
  router.push('/');
}

// タブやランキングタイプが変更されたらデータを再取得
watch(activeRankingType, (newType) => { // activeTab を削除
  fetchLeaderboardData(newType);
});
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
  top: 4px;
  left: 15px; /* 左端からの位置を調整 */
  font-size: 0.6em;
  color: #333;
  z-index: 10;
  background-color: rgba(255, 255, 255, 0.6); /* 背景色 */
  padding: 3px 14px; /* パディング */
  border-radius: 8px; /* 角丸 */
  white-space: nowrap; /* テキストが改行されないように */
}

.cat-coins-display {
  position: absolute;
  top: 28px; /* 最大連勝数の下に配置 */
  left: 15px; /* 左端からの位置を調整 */
  display: flex;
  align-items: center;
  font-size: 0.6em;
  color: #333;
  z-index: 10;
  background-color: rgba(255, 255, 255, 0.6); /* 背景色 */
  padding: 3px 14px; /* パディング */
  border-radius: 8px; /* 角丸 */
  white-space: nowrap; /* テキストが改行されないように */
}

.cat-coin-icon-small {
  width: 16px;
  height: 16px;
  margin-right: 5px;
}

.cat-coins-number {
  font-weight: bold;
  color: #cc6633; /* #C63 */
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
  width: 100%;
  max-width: 285px;
}

.error-message {
  margin: 20px;
  font-size: 1.2em;
  color: #d32f2f;
}

.ranking-table-container {
  width: 100%;
  max-width: 285px;
  overflow-x: auto;
  flex-grow: 1; /* コンテナがスペースを埋めるようにする */
  overflow-y: auto; /* テーブルをスクロール可能にする */
  margin-bottom: 20px; /* 下部に余白を追加 */
  max-height: 450px; /* ランキングテーブルの最大高さを設定 */
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

.ranking-table td:first-child {
  font-size: 1.0em; /* No.の文字サイズを大きく */
  font-weight: bold;
}

.ranking-table th {
  background-color: #ffbda7; /* くすんだピンクのヘッダー */
  font-weight: bold;
  position: sticky;
  top: 0;
}

.ranking-table tbody tr:nth-child(even) {
  background-color: rgba(255, 255, 255, 0.5); /* 半透明の白に変更 */
}

.ranking-table tbody tr.is-first-place {
  background-color: #fff8a9; /* 1位: 薄い黄色 */
  font-weight: bold;
  color: #d4af37; /* ゴールド */
  border: 2px solid #d4af37;
  font-size: 1.8em; /* 1位の行全体を大きく */
}
.ranking-table tbody tr.is-second-place {
  background-color: #e2ffff; /* 2位: 薄いグレー */
  font-weight: bold;
  color: #a8a8a8; /* シルバー */
  border: 2px solid #a8a8a8;
  font-size: 1.6em; /* 2位の行全体を少し大きく */
}
.ranking-table tbody tr.is-third-place {
  background-color: #ffdbb7; /* 3位: 薄いブロンズ色 */
  font-weight: bold;
  color: #cd7f32; /* ブロンズ */
  border: 2px solid #cd7f32;
  font-size: 1.4em; /* 3位の行全体を少し大きく */
}

.user-avatar {
  width: 40px;
  height: 40px;
  background-color: white; /* 白背景 */
  border: 1px solid #ccc; /* 1pxの縁 */
  border-radius: 50%; /* 角を丸く */
}



.user-info-cell {
  display: flex;
  align-items: center;
  gap: 0px; /* アバターと詳細情報の間のスペース */
  text-align: left; /* 左寄せ */
  padding-left: 5px; /* 左パディング */
}

.user-avatar-wrapper {
  flex-shrink: 0; /* 縮小しない */
  margin-left: 7px; /* アイコンを右にずらす */
}

.user-details {
  display: flex;
  flex-direction: column;
  align-items: center; /* 中央寄せ */
  justify-content: center;
  flex-grow: 1; /* 残りのスペースを埋める */
}

.user-name {
  font-weight: bold;
  font-size: 1.6em; /* ユーザー名を調整 */
}
.user-username {
  font-size: 0.8em; /* ユーザー名を調整 */
  color: #555;
}

.user-cat-coins {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6em;
  color: #cc6633;
  font-weight: bold;
  margin-top: -8px;
  margin-right: 10px;
}

.cat-coin-icon {
  width: 24px;
  height:24px;
}

.value-cell {
  font-weight: bold;
  font-size: 1.1em !important; /* 連勝数を調整 */
  text-align: center;
}

.tab-buttons, .ranking-type-buttons {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
  width: 100%;
  max-width: 285px;
}

.tab-buttons button, .ranking-type-buttons button {
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 0.8em;
  color: #333;
  flex-grow: 1;
  border-radius: 0;
}

.tab-buttons button:first-child {
  border-top-left-radius: 5px;
  border-bottom-left-radius: 5px;
}

.tab-buttons button:last-child {
  border-top-right-radius: 5px;
  border-bottom-right-radius: 5px;
}

.ranking-type-buttons button:first-child {
  border-top-left-radius: 5px;
  border-bottom-left-radius: 5px;
}

.ranking-type-buttons button:last-child {
  border-top-right-radius: 5px;
  border-bottom-right-radius: 5px;
}

.tab-buttons button.active, .ranking-type-buttons button.active {
  background-color: #ffbda7; /* アクティブなタブ/ボタンの色 */
  color: #5c4b4b;
  font-weight: bold;
}

.ranking-table a {
  color: #c65b5b; /* ソフトで温かみのある赤 */
  text-decoration: none;
  font-weight: bold;
}

.ranking-table a:hover {
  text-decoration: underline;
}

.ranking-table tbody tr {
  height: 46px; /* 行の高さを固定 */
}
.avatar-link-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  text-decoration: none; /* リンクの下線を削除 */
  color: inherit; /* リンクの色を親から継承 */
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
  max-width: 285px;
}

.info-section {
  margin-top: 10px;
  padding: 0px;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  width: 100%;
  max-width: 285px;
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