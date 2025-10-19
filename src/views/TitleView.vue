<template>
  <div class="title-view-container" :style="{ height: viewportHeight }">
    <div class="title-screen" :style="scalerStyle">
      <div class="title-background-container">
        <div class="title-background-image base-image"></div>
        <div class="title-background-image eye-blink-image"></div>
      </div>
      <img :src="$t('titleView.titleLogo')" :alt="$t('titleView.altLogo')" class="title-logo" />
      <div class="top-controls">
        <div class="top-controls-group">
          <div class="audio-toggles">
            <label class="toggle-switch">
              <input type="checkbox" :checked="audioStore.isBgmEnabled" @change="audioStore.toggleBgm()" />
              <span class="slider round"></span>
            </label>
            <span class="toggle-label">BGM</span>
            <label class="toggle-switch">
              <input type="checkbox" :checked="audioStore.isSeEnabled" @change="audioStore.toggleSe()" />
              <span class="slider round"></span>
            </label>
            <span class="toggle-label">{{ $t('titleView.sfx') }}</span>
          </div>
        </div>
        <div class="top-controls-group">
          <div class="language-selector">
            <div
              class="language-flag language-flag-ja"
              :class="{ selected: locale === 'ja' }"
              @click="locale = 'ja'"
            ></div>
            <div
              class="language-flag language-flag-en"
              :class="{ selected: locale === 'en' }"
              @click="locale = 'en'"
            ></div>
          </div>
          <button @click="showSettingsPopup = true" class="settings-button">
            <img src="/assets/images/button/setting_button.png" alt="Settings" class="settings-button-image" />
          </button>
        </div>
      </div>
      <div class="max-consecutive-wins">
        <span>{{ $t('titleView.maxWinStreak') }}</span>
        <span class="max-wins-number">{{ userStore.profile?.max_win_streak || 0 }}</span>
      </div>
      <div class="current-consecutive-wins">
        <span>{{ $t('titleView.currentWinStreak') }}</span>
        <span class="current-wins-number">{{ userStore.profile?.current_win_streak || 0 }}</span>
      </div>
      <div class="cat-coins">
        <span>{{ $t('titleView.catCoins') }}</span>
        <span class="cat-coins-number">{{ userStore.profile?.cat_coins || 0 }}</span>
      </div>
      <nav class="menu">
        <ul>
          <li>
            <button @click="showGameModeSelectionPopup = true">{{ $t('titleView.menu.catAiMatch') }}</button>
          </li>
          <li>
            <button @click="goToShrine">{{ $t('titleView.menu.shrine') }}</button>
          </li>
          <li>
            <button @click="showHowToPlayPopup = true">{{ $t('titleView.menu.howToPlay') }}</button>
          </li>
          <li>
            <button @click="showRulesPopup = true">{{ $t('titleView.menu.rules') }}</button>
          </li>
          <li>
            <button @click="showYakuListPopup = true">{{ $t('titleView.menu.handList') }}</button>
          </li>
          <li>
            <button @click="goToLeaderboard">{{ $t('titleView.menu.leaderboard') }}</button>
          </li>
        </ul>
      </nav>

      <RulePopup v-if="showRulesPopup" @close="showRulesPopup = false" />
      <YakuListPopup v-if="showYakuListPopup" @close="showYakuListPopup = false" />
      <HowToPlayPopup v-if="showHowToPlayPopup" @close="showHowToPlayPopup = false" />
      <SettingsPopup :show="showSettingsPopup" @close="showSettingsPopup = false" />
      <GameModeSelectionPopup v-if="showGameModeSelectionPopup" @close="showGameModeSelectionPopup = false" @mode-selected="onModeSelected" />
      <div class="credit">BGM by OtoLogic(CC BY 4.0)</div>
      <div class="x-account">
        <a href="https://x.com/danAllGreen" target="_blank" rel="noopener noreferrer">{{ $t('titleView.officialX') }}</a>
      </div>
      <div class="version-info">v1.7.0 | 2025.10.19</div>
    </div>
  </div>
</template>

<script setup>
/**
 * タイトル画面コンポーネント。
 * ゲームの開始、各種設定（音量、言語）、ルールや役一覧の表示、
 * 他のビュー（神社、ランキング）へのナビゲーションを担当します。
 * また、画面サイズに応じてUIが適切にスケールするように調整します。
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores/gameStore';
import { useAudioStore } from '@/stores/audioStore';
import { useUserStore } from '@/stores/userStore'; // userStoreをインポート
import RulePopup from '@/components/RulePopup.vue';
import YakuListPopup from '@/components/YakuListPopup.vue';
import HowToPlayPopup from '@/components/HowToPlayPopup.vue';
import SettingsPopup from '@/components/SettingsPopup.vue'; // ★追加
import GameModeSelectionPopup from '@/components/GameModeSelectionPopup.vue'; // ★追加
import { useViewportHeight } from '@/composables/useViewportHeight';

// --- リアクティブな状態とストア ---
const { locale } = useI18n();
const { viewportHeight } = useViewportHeight();
const router = useRouter();
const gameStore = useGameStore();
const audioStore = useAudioStore();
const userStore = useUserStore();

const showRulesPopup = ref(false);
const showYakuListPopup = ref(false);
const showHowToPlayPopup = ref(false);
const showSettingsPopup = ref(false); // ★追加：設定ポップアップの表示状態
const showGameModeSelectionPopup = ref(false); // ★追加：ゲームモード選択ポップアップの表示状態

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
  // 幅と高さのスケール比のうち、小さい方を採用して全体が収まるようにする
  scaleFactor.value = Math.min(scaleX, scaleY);
};

// --- ライフサイクルフック ---
onMounted(() => {
  // 最新のユーザー情報を取得
  userStore.fetchUserProfile({ showLoading: false }); // タイトルに戻ってきた際はスピナー不要

  // 初期スケールを設定
  updateScaleFactor();
  // ウィンドウリサイズ時にスケールを再計算
  window.addEventListener('resize', updateScaleFactor);
  // gameStore.loadCatCoins(); // userStoreから取得するため不要
});

onBeforeUnmount(() => {
  // イベントリスナーをクリーンアップ
  window.removeEventListener('resize', updateScaleFactor);
  // 画面を離れる際にBGMを停止
  audioStore.setBgm(null);
});

/**
 * ゲームを開始し、ゲーム画面に遷移します。
 * @param {string} mode - ゲームモード ('vsCPU'など)
 */
function startGame(mode) {
  gameStore.setGameMode(mode);
  gameStore.resetGameForNewSession({ keepStreak: true }); // 連勝数を維持したままゲーム状態をリセット
  gameStore.initializeGame(); // ゲームを初期化し、親や風を決定
  gameStore.showDealerDeterminationPopup = true; // 親決めポップアップを表示
  router.push('/game');
}

/**
 * 神社画面に遷移します。
 */
function goToShrine() {
  router.push('/shrine');
}

/**
 * ランキング画面に遷移します。
 */
function goToLeaderboard() {
  router.push('/leaderboard');
}

/**
 * ゲームモードが選択されたときに呼び出されます。
 * @param {string} mode - 選択されたゲームモード ('classic'または'stock')
 */
const onModeSelected = (mode) => {
  gameStore.setRuleMode(mode); // 選択されたルールモードをストアに設定
  showGameModeSelectionPopup.value = false; // ポップアップを閉じる
  startGame('vsCPU'); // 既存のstartGame関数を呼び出し、CPU対戦を開始
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;700&display=swap');

.title-view-container {
  position: relative;
  width: 100vw;
  /* height: 100vh; */ /* 動的な高さ指定に置き換え */
  overflow: hidden;
  background-image: url('/assets/images/back/back_out.png');
  background-repeat: repeat;
}

.title-screen {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 360px;
  height: 640px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-family: 'M PLUS Rounded 1c', 'Helvetica Neue', Arial, sans-serif;
  overflow-x: hidden; /* 横方向のスクロールを禁止して、はみ出しを隠す */
  box-sizing: border-box; /* padding や border を width/height に含める */
  touch-action: none !important;
}

.title-screen::before {
  /* 最背面の画像用疑似要素 */
  content: '';
  position: absolute;
  top: 60%;
  left: 0;
  right: 0;
  bottom: 0%;
  background-image: url('/assets/images/back/back_hai.png');
  background-repeat: no-repeat;
  background-position: center center;
  background-size: auto 100%; /* 高さを100%に合わせて、幅は自動調整 */
  opacity: 0.9; /* 画像の透明度を調整 */
  z-index: -1;
}

.title-background-container {
  width: 320px; /* 固定幅に設定 (360pxの約90%) */
  height: auto; /* 高さは幅に応じて自動調整 */
  aspect-ratio: 400 / 260; /* 元の画像の縦横比を維持 (400/260 は例) */
  position: relative; /* 子要素の絶対配置の基準 */
  z-index: 1; /* グラデーションより手前に来るように */
  margin-bottom: -50px; /* 画像とタイトルの間のスペース */
}

.title-background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: 100% auto; /* 画像をコンテナに合わせてリサイズ */
  background-repeat: no-repeat;
  background-position: center;
}

.base-image {
  background-image: url('/assets/images/back/title_back.png');
  z-index: 1; /* ベース画像を下に */
}

.eye-blink-image {
  background-image: url('/assets/images/back/title_back_eye.png');
  z-index: 2; /* 瞬き画像を上に */
  opacity: 0; /* 通常は非表示 */
  animation: blink-opacity 5s infinite step-start; /* 透明度で瞬きを制御 */
}

.title-logo {
  width: 100%; /* 画面幅に対する割合でサイズを調整 */
  max-width: 320px; /* 最大幅を指定 */
  height: auto; /* 高さは自動調整 */
  margin-top: -20px;
  margin-bottom: -20px;
  position: relative;
  z-index: 1;
}

.menu ul {
  list-style: none; /* リストマーカー（点）を削除 */
  padding: 0; /* デフォルトのパディングを削除 */
  position: relative; /* z-indexを有効にするため */
  z-index: 1; /* グラデーションより手前に来るように */
}
.menu li {
  margin-bottom: 7px;
}

.menu button {
  width: 220px; /* 固定幅に設定 */
  height: 36px; /* 固定高さに設定 */
  padding: 4px 20px; /* パディング調整 */
  font-size: 1.15em;
  cursor: pointer;
  border: none; /* ボーダーを削除 */
  border: 2px solid #586810; /* 元のボーダー色 */
  background-color: rgb(255, 255, 255); /* 元の背景色 */
  color: #586810; /* 元の文字色 */
  border-radius: 5px; /* 元の角丸 */
  transition: background-color 0.2s ease-in-out, transform 0.1s ease;
  animation: subtleFloat 2s ease-in-out infinite; /* ゆらぎアニメーションを適用 */
  box-shadow: 0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08); /* ボタンに影を追加 */
  border-radius: 8px;
  background: linear-gradient(#ffffff, #fff3e6);
}

.menu button:hover:not(:disabled) {
  background-color: #4caf50; /* 元のホバー時の背景色 */
  color: #39440c; /* 元のホバー時の文字色 */
  transform: translateY(-2px); /* ホバー時に少し浮き上がる効果 */
}

.menu button:active:not(:disabled) {
  transform: translateY(0px); /* クリック時に元の位置に戻す */
  box-shadow: 0 2px 3px rgba(50, 50, 93, 0.09), 0 1px 2px rgba(0, 0, 0, 0.07); /* アクティブ時の影は残すか任意 */
}

.menu button:disabled {
  border-color: #ccc; /* 元の無効化ボーダー色 */
  color: #ccc; /* 元の無効化文字色 */
  cursor: not-allowed;
  box-shadow: none; /* 無効化ボタンの影はなし */
  animation: none; /* 無効化されたボタンはアニメーションしない */
}

@keyframes blink-opacity {
  0%,
  90% {
    /* ほとんどの時間は透明 (ベース画像が見える) */
    opacity: 0;
  }
  90.1%,
  95% {
    /* 短い間だけ不透明 (瞬き画像が見える) */
    opacity: 1;
  }
}

@keyframes pop {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.04);
  }
}

@keyframes subtleFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px); /* わずかに上に移動 */
  }
}

.credit {
  position: absolute;
  bottom: 50px; /* さらに上に配置 */
  width: 100%;
  text-align: center;
  font-size: 0.7em;
  color: rgba(0, 0, 0, 0.4);
  z-index: 1;
}

.x-account {
  position: absolute;
  bottom: 30px; /* バージョン情報の上に配置 */
  width: 100%;
  text-align: center;
  font-size: 0.7em;
  z-index: 1;
}

.x-account a {
  color: #126fa8; /* Xのブランドカラー */
  text-decoration: none;
}

.x-account a:hover {
  text-decoration: underline;
}

.version-info {
  position: absolute;
  bottom: 10px;
  width: 100%;
  text-align: center;
  font-size: 0.7em;
  color: rgba(0, 0, 0, 0.4);
  z-index: 1;
}

.top-controls {
  position: absolute;
  top: 25px;
  right: 30px;
  display: flex;
  flex-direction: column; /* 縦並びに戻す */
  align-items: flex-end; /* 右寄せ */
  gap: 5px; /* グループ間の間隔 */
  z-index: 10;
}

.top-controls-group {
  display: flex;
  flex-direction: row; /* グループ内は横並び */
  align-items: center;
  gap: 10px; /* 要素間の間隔 */
}

.audio-toggles {
  display: flex;
  flex-direction: row; /* 横並びにする */
  align-items: center;
  gap: 5px; /* 要素間の間隔 */
  font-size: 0.8em;
  color: #333;
}

.language-selector {
  display: flex;
  gap: 10px;
}

.language-flag {
  width: 24px;
  height: 18px;
  cursor: pointer;
  border-radius: 4px;
  transition: opacity 0.2s ease-in-out;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.language-flag-ja {
  background-image: url('https://twemoji.maxcdn.com/v/latest/svg/1f1ef-1f1f5.svg');
}

.language-flag-en {
  background-image: url('https://twemoji.maxcdn.com/v/latest/svg/1f1fa-1f1f8.svg');
}

.language-flag:not(.selected) {
  opacity: 0.6;
}

.language-flag.selected {
  opacity: 1;
}

.settings-button {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.settings-button-image {
  width: 24px;
  height: 24px;
  opacity: 0.8;
  transition: opacity 0.2s ease-in-out;
}

.settings-button:hover .settings-button-image {
  opacity: 1;
}

.max-consecutive-wins,
.current-consecutive-wins,
.cat-coins {
  position: absolute;
  left: 20px;
  z-index: 10;
  background-color: rgba(255, 255, 255, 0.6);
  border-radius: 5px;
  white-space: nowrap;
  font-size: 0.6em;
  color: #333;
  width: 125px;
  padding: 0.6px 8px;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.max-consecutive-wins {
  top: 20px;
}

.current-consecutive-wins {
  top: 39.3px;;
}

.cat-coins {
  top: 58.1px;
}

.cat-coins-number,
.max-wins-number,
.current-wins-number {
  font-weight: bold;
}

.max-wins-number {
  color: #cc6633; /* #C63 */
}

.current-wins-number {
  color: #4caf50; /* 緑色 */
}

.cat-coins-number {
  color: #f59e0b; /* 黄色 */
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
</style>