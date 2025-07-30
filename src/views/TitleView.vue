<template>
  <div class="title-view-container" :style="{ height: viewportHeight }">
    <div class="title-screen" :style="scalerStyle">
      <div class="title-background-container">
        <div class="title-background-image base-image"></div>
        <div class="title-background-image eye-blink-image"></div>
      </div>
      <h1 class="title-text">
        <span class="main-title">よんじゃん！</span>
        <span class="sub-title">~ 4牌で楽しむ本格麻雀 ~</span>
      </h1>
      <div class="audio-toggles">
        <label class="toggle-switch">
          <input type="checkbox" :checked="audioStore.isBgmEnabled" @change="audioStore.toggleBgm()">
          <span class="slider round"></span>
        </label>
        <span class="toggle-label">BGM</span>
        <label class="toggle-switch">
          <input type="checkbox" :checked="audioStore.isSeEnabled" @change="audioStore.toggleSe()">
          <span class="slider round"></span>
        </label>
        <span class="toggle-label">効果音</span>
      </div>
      <div class="max-consecutive-wins">
        🏆最大連勝数: <span class="max-wins-number">{{ gameStore.maxConsecutiveWins }}</span>
      </div>
      <div class="cat-coins">
        🪙猫コイン: <span class="cat-coins-number">{{ gameStore.catCoins }}</span>
      </div>
      <nav class="menu">
        <ul>
          <li><button @click="startGame('vsCPU')">ねこAI対戦 🐈</button></li>
          <li><button @click="goToShrine">じゃん猫神社 参拝 ⛩️</button></li>
          <li><button @click="showRulesPopup = true">ルール 📖</button></li>
          <li><button @click="showYakuListPopup = true">役一覧 🀄</button></li>
          <li><button @click="startGame('allManual')">全操作モード</button></li>
        </ul>
      </nav>

      <RulePopup v-if="showRulesPopup" @close="showRulesPopup = false" />
      <YakuListPopup v-if="showYakuListPopup" @close="showYakuListPopup = false" />
      <RulePopup v-if="showRulesPopup" @close="showRulesPopup = false" />
      <YakuListPopup v-if="showYakuListPopup" @close="showYakuListPopup = false" />
      <div class="credit">BGM by OtoLogic(CC BY 4.0)</div>
      <div class="x-account">
        <a href="https://x.com/yonjan_official" target="_blank" rel="noopener noreferrer">公式X: @yonjan_official</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores/gameStore';
import { useAudioStore } from '@/stores/audioStore';
import RulePopup from '@/components/RulePopup.vue';
import YakuListPopup from '@/components/YakuListPopup.vue';
import { useViewportHeight } from '@/composables/useViewportHeight';

const { viewportHeight } = useViewportHeight();

const router = useRouter();
const gameStore = useGameStore();
const audioStore = useAudioStore();

const showRulesPopup = ref(false);
const showYakuListPopup = ref(false);

// --- Scaling Logic ---
const DESIGN_WIDTH = 360;
const DESIGN_HEIGHT = 640;
const scaleFactor = ref(1);
const scalerStyle = computed(() => ({
  transform: `translate(-50%, -50%) scale(${scaleFactor.value})`
}));

const updateScaleFactor = () => {
  const currentWidth = window.innerWidth;
  const currentHeight = window.innerHeight;
  const scaleX = currentWidth / DESIGN_WIDTH;
  const scaleY = currentHeight / DESIGN_HEIGHT;
  scaleFactor.value = Math.min(scaleX, scaleY);
};

onMounted(() => {
  updateScaleFactor();
  window.addEventListener('resize', updateScaleFactor);
  gameStore.loadCatCoins();
  audioStore.setBgm('NES-JP-A01-2(Title-Loop115).mp3');
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScaleFactor);
  audioStore.setBgm(null); // 画面離脱時にBGMを停止
});

function startGame(mode) {
  gameStore.setGameMode(mode);
  gameStore.resetGameForNewSession();
  gameStore.initializeGame(); // ゲームを初期化し、親や風を決定
  router.push('/game');
}

function goToShrine() {
  router.push('/shrine');
}


</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;700&display=swap');

.title-view-container {
  position: relative;
  width: 100vw;
  /* height: 100vh; */ /* Replaced by dynamic height */
  overflow: hidden;
  background-image: url('/assets/images/back/back_out.png');
  background-repeat: repeat;
  touch-action: none;
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
}

.title-screen::before { /* 最背面の画像用疑似要素 */
  content: "";
  position: absolute;
  top: 60%; left: 0; right: 0; bottom: 0%;
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

.title-text { /* h1タグからクラスに変更 */
  margin-top: -20px; /* 背景画像との重なりを調整 */
  margin-bottom: 0px; /* メニューとの間隔を調整 */
  position: relative; /* z-indexを有効にするため */
  color: #B14B3F; /* 文字色を変更 */
  /* 縁取りを追加 */
  -webkit-text-stroke: 1.2px rgb(0, 0, 0); /* Safari, Chrome */
  /* text-shadowで擬似的に縁取り*/
  text-shadow:
    -1.5px -1.5px 0 white, 1.5px -1.5px 0 white, -1.5px 1.5px 0 white, 1.5px 1.5px 0 white, /* 4方向の白い影 */
    1px 1px 1px rgba(0,0,0,0.4); /* 元のドロップシャドウ */
  padding: 0px; /* 文字の周りの余白を調整 */
  line-height: 1.2; /* 行間を調整 */
  width: 100%; /* h1が横にはみ出さないように */
  z-index: 1; /* グラデーションより手前に来るように */
}

.main-title {
  display: block; /* 改行のため */
  font-size: 1.8em; /* 固定サイズに変更 */
  margin-left: 20px;
  white-space: nowrap; /* 「よんじゃん！」が途中で改行されないようにする */
  font-weight: 700; /* 少し太めに */
  animation: pop 10s infinite ease-in-out; /* ポヨン感アニメーションを適用 */
}
.sub-title {
  display: block; /* 改行のため */
  font-size: 0.9em; /* 固定サイズに変更 */
  margin-top: 1px; /* メインタイトルとの間隔 */
  color: #50927c; /* サブタイトルの色をメインより少し薄く (例) */
}

.menu ul {
  list-style: none; /* リストマーカー（点）を削除 */
  padding: 0; /* デフォルトのパディングを削除 */
  position: relative; /* z-indexを有効にするため */
  z-index: 1; /* グラデーションより手前に来るように */
}
.menu li {
  margin-bottom: 8px;
}

.menu button {
  width: 280px; /* 固定幅に設定 */
  padding: 6px 20px; /* パディング調整 */
  font-size: 1.2em;
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
  background-color: #4CAF50; /* 元のホバー時の背景色 */
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
  0%, 90% { /* ほとんどの時間は透明 (ベース画像が見える) */
    opacity: 0;
  }
  90.1%, 95% { /* 短い間だけ不透明 (瞬き画像が見える) */
    opacity: 1;
  }
}

@keyframes pop {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
}

@keyframes subtleFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); } /* わずかに上に移動 */
}

.credit {
  position: absolute;
  bottom: 30px; /* Xアカウントのリンクの上に配置 */
  width: 100%;
  text-align: center;
  font-size: 0.7em;
  color: rgba(0, 0, 0, 0.4);
  z-index: 1;
}

.x-account {
  position: absolute;
  bottom: 10px;
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

.audio-toggles {
  position: absolute;
  top: 25px;
  right: 30px;
  display: flex;
  flex-direction: row; /* 横並びにする */
  gap: 15px; /* 要素間の間隔 */
  z-index: 10;
  font-size: 0.8em;
  color: #333;
}

.max-consecutive-wins {
  position: absolute;
  top: 19px;
  left: 30px; /* 左端からの位置を調整 */
  font-size: 0.8em;
  color: #333;
  z-index: 10;
  background-color: rgba(255, 255, 255, 0.6); /* 背景色 */
  padding: 3px 14px; /* パディング */
  border-radius: 8px; /* 角丸 */
  white-space: nowrap; /* テキストが改行されないように */
}

.cat-coins {
  position: absolute;
  top: 50px; /* max-consecutive-wins の下に配置 */
  left: 30px;
  font-size: 0.8em;
  color: #333;
  z-index: 10;
  background-color: rgba(255, 255, 255, 0.6);
  padding: 3px 8px;
  border-radius: 8px;
  white-space: nowrap;
}

.cat-coins-number {
  font-weight: bold;
  color: #f59e0b; /* 黄色っぽい色 */
}

.max-wins-number {
  font-weight: bold;
  color: #CC6633; /* #C63 */
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
  -webkit-transition: .4s;
  transition: .4s;
  border-radius: 14px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 10px;
  width: 10px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  -webkit-transition: .4s;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #2196F3;
}

input:focus + .slider {
  box-shadow: 0 0 1px #2196F3;
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