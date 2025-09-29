<template>
  <div class="leaderboard-view-container" :style="{ height: viewportHeight }">
    <LoadingIndicator v-if="isLoading" />
    <div class="leaderboard-screen" :style="scalerStyle">
      <div class="max-consecutive-wins">
        {{ $t('titleView.maxWinStreak') }} <span class="max-wins-number">{{ userStore.profile?.max_win_streak || 0 }}</span>
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

      <!-- タブ切り替えUI -->
      <div class="tab-buttons">
        <button :class="{ active: activeTab === 'overall' }" @click="activeTab = 'overall'">{{ $t('leaderboardView.tabOverall') }}</button>
        <button :class="{ active: activeTab === 'monthly' }" @click="activeTab = 'monthly'">{{ $t('leaderboardView.tabMonthly') }}</button>
      </div>

      <!-- ランキング種類切り替えUI -->
      <div class="ranking-type-buttons">
        <button :class="{ active: activeRankingType === 'winStreak' }" @click="activeRankingType = 'winStreak'">{{ $t('leaderboardView.typeWinStreak') }}</button>
        <button :class="{ active: activeRankingType === 'avgRank' }" @click="activeRankingType = 'avgRank'">{{ $t('leaderboardView.typeAvgRank') }}</button>
      </div>

      <div v-if="!isLoading" class="ranking-table-container">
        <table class="ranking-table">
          <colgroup>
            <col style="width: 15%;" />
            <col style="width: 25%;" />
            <col style="width: 45%;;" />
            <col style="width: 15%;" />
          </colgroup>
          <thead>
            <tr>
              <th>{{ $t('leaderboardView.tableHeaderNo') }}</th>
              <th colspan="2">{{ $t('leaderboardView.tableHeaderUserName') }}</th>
              <th v-if="activeRankingType === 'winStreak'">{{ $t('leaderboardView.tableHeaderWinStreak') }}</th>
              <th v-else>{{ $t('leaderboardView.tableHeaderAvgRank') }}</th> <!-- 新しいキーを追加 -->
            </tr>
          </thead>
          <tbody>
            <tr v-for="player in displayLeaderboard" :key="player.id" :class="{ 'is-first-place': player.isFirstPlace, 'is-second-place': player.isSecondPlace, 'is-third-place': player.isThirdPlace }">
              <td>{{ player.rank }}</td>
              <td class="user-avatar-cell">
                <a v-if="player.url !== '#'" :href="player.url" target="_blank" rel="noopener noreferrer" class="avatar-link-wrapper">
                  <img v-if="player.profile_image_url" :src="player.profile_image_url" alt="avatar" class="user-avatar" />
                  <span v-else>-</span>
                </a>
                <template v-else>
                  <img v-if="player.profile_image_url" :src="player.profile_image_url" alt="avatar" class="user-avatar" />
                  <span v-else>-</span>
                </template>
              </td>
              <td class="user-name-cell">
                <div class="user-name">{{ player.name }}</div>
              </td>
              <td class="value-cell">
                <template v-if="activeRankingType === 'winStreak'">{{ player.streak }}</template>
                <template v-else>{{ player.avgRank }}</template>
              </td>
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

const leaderboard = ref([]); // 総合・最大連勝数ランキングデータ
const monthlyLeaderboard = ref([]); // 月間・最大連勝数ランキングデータ (仮)
const avgRankLeaderboard = ref([]); // 総合・平均順位ランキングデータ (仮)
const monthlyAvgRankLeaderboard = ref([]); // 月間・平均順位ランキングデータ (仮)

const isLoading = ref(true);
const error = ref(null);

const activeTab = ref('overall'); // 'overall' (総合) または 'monthly' (月間)
const activeRankingType = ref('winStreak'); // 'winStreak' (最大連勝数) または 'avgRank' (平均順位)

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
async function fetchLeaderboardData(tab, type) {
  isLoading.value = true;
  error.value = null;

  try {
    let data = [];
    if (tab === 'overall' && type === 'winStreak') {
      // 既存の最大連勝数取得ロジック
      const { data: fetchedData, error: supabaseError } = await supabase
        .from('users')
        .select('id, username, max_win_streak, avatar_url')
        .not('max_win_streak', 'is', null)
        .order('max_win_streak', { ascending: false })
        .limit(30);
      if (supabaseError) throw supabaseError;
      data = fetchedData;
    } else {
      // 仮のデータ（後で実装）
      console.log(`Fetching mock data for tab: ${tab}, type: ${type}`);
      data = Array.from({ length: 5 }, (_, i) => ({
        id: `mock-${tab}-${type}-${i}`,
        username: `MockUser${i + 1}`,
        max_win_streak: Math.floor(Math.random() * 100),
        avatar_url: '/assets/images/info/hito_icon_1.png',
        avg_rank: (Math.random() * 4 + 1).toFixed(2),
      }));
      if (type === 'avgRank') {
        data.sort((a, b) => parseFloat(a.avg_rank) - parseFloat(b.avg_rank));
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
      avgRank: player.avg_rank,
      url: '#',
      profile_image_url: player.avatar_url || '/assets/images/info/hito_icon_1.png',
    }));

    // 適切なrefにデータを格納
    if (tab === 'overall') {
      if (type === 'winStreak') leaderboard.value = processedData;
      else avgRankLeaderboard.value = processedData;
    } else { // monthly
      if (type === 'winStreak') monthlyLeaderboard.value = processedData;
      else monthlyAvgRankLeaderboard.value = processedData;
    }

  } catch (e) {
    console.error('ランキングの取得エラー:', e.message);
    error.value = e.message;
    // エラー時は該当するrefを空にする
    if (tab === 'overall') {
      if (type === 'winStreak') leaderboard.value = [];
      else avgRankLeaderboard.value = [];
    } else {
      if (type === 'winStreak') monthlyLeaderboard.value = [];
      else monthlyAvgRankLeaderboard.value = [];
    }
  } finally {
    isLoading.value = false;
  }
}

/**
 * 表示用のランキングデータを生成します。
 * 常に5行表示を保証し、データが5件未満の場合はプレースホルダーで埋めます。
 */
const displayLeaderboard = computed(() => {
  let currentData = [];
  if (activeTab.value === 'overall') {
    currentData = activeRankingType.value === 'winStreak' ? leaderboard.value : avgRankLeaderboard.value;
  } else { // monthly
    currentData = activeRankingType.value === 'winStreak' ? monthlyLeaderboard.value : monthlyAvgRankLeaderboard.value;
  }

  const rankedData = [];
  let currentRank = 1;
  let previousValue = -1; // 連勝数または平均順位
  let sameRankCount = 0;

  currentData.forEach((player) => {
    const value = activeRankingType.value === 'winStreak' ? player.streak : parseFloat(player.avgRank);

    // 平均順位は昇順、連勝数は降順でランク付け
    const isSameRank = activeRankingType.value === 'winStreak' ? (value === previousValue) : (value === previousValue);

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

  // プレースホルダーを追加
  while (rankedData.length < 30) {
    rankedData.push({
      rank: rankedData.length + 1,
      id: `placeholder-${rankedData.length}`,
      name: '-',
      username: '-',
      streak: '-',
      avgRank: '-',
      url: '#',
      profile_image_url: null
    });
  }
  return rankedData;
});

// --- ライフサイクルフック ---
onMounted(() => {
  updateScaleFactor();
  window.addEventListener('resize', updateScaleFactor);
  // 初期ロード時に総合・最大連勝数を取得
  fetchLeaderboardData('overall', 'winStreak');
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
watch([activeTab, activeRankingType], ([newTab, newType]) => {
  fetchLeaderboardData(newTab, newType);
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

.error-message {
  margin: 20px;
  font-size: 1.2em;
  color: #d32f2f;
}

.ranking-table-container {
  width: 100%;
  max-width: 260px;
  overflow-x: auto;
  flex-grow: 1; /* コンテナがスペースを埋めるようにする */
  overflow-y: auto; /* テーブルをスクロール可能にする */
  margin-bottom: 20px; /* 下部に余白を追加 */
  max-height: 410px; /* ランキングテーブルの最大高さを設定 */
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
  font-size: 0.8em; /* No.の文字サイズを大きく */
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

.user-avatar-cell {
  width: 50px;
  padding-right: 0;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background-color: white; /* 白背景 */
  border: 1px solid #ccc; /* 1pxの縁 */
  border-radius: 50%; /* 角を丸く */
}

.user-name-cell {
  line-height: 1.2;
}
.user-name {
  font-weight: bold;
  font-size: 1.2em; /* ユーザー名を調整 */
}
.user-username {
  font-size: 0.8em; /* ユーザー名を調整 */
  color: #555;
}

.value-cell {
  font-weight: bold;
  font-size: 1.1em; /* 連勝数を調整 */
  text-align: center;
}

.tab-buttons, .ranking-type-buttons {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
  width: 100%;
  max-width: 260px;
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