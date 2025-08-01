<template>
  <transition name="popup">
    <div v-if="show" class="popup-overlay">
      <div class="popup-content" ref="popupContentRef">
        <h2>最終結果</h2>
        <div class="final-results-list">
          <div v-for="player in finalResultDetails.rankedPlayers" :key="player.name" class="player-rank-item">
            <span class="rank">{{ `${player.rank}位` }}</span>
            <span class="player-name">{{ player.name }}</span>          
            <img v-if="getPlayerIcon(player.id)" :src="getPlayerIcon(player.id)" alt="Player Icon" class="player-icon" />
            <span class="score">{{ player.score }}点</span>
          </div>
        </div>
        <p class="consecutive-wins" v-if="gameStore.gameMode !== 'allManual'">
          {{ finalResultDetails.consecutiveWins }}連勝中！
        </p>
        <div class="coin-gain" v-if="gameStore.lastCoinGain !== 0">
          <img src="/assets/images/info/cat_coin.png" alt="Cat Coin" class="cat-coin-icon">
          <span :class="{ 'positive-gain': gameStore.lastCoinGain > 0, 'negative-gain': gameStore.lastCoinGain < 0 }">
            {{ gameStore.lastCoinGain > 0 ? '+' : '' }}{{ gameStore.lastCoinGain }}
          </span>
        </div>
        <div class="actions">
          <button @click="startNewGame" class="action-button">
            <span>新しいゲームを開始</span>
            <span>(連勝継続)</span>
          </button>
          <button @click="backToTitle" class="action-button">
            <span>タイトルに戻る</span>
            <span>(連勝リセット)</span>
          </button>
        </div>
        <div class="social-share-buttons">
          <button @click="postToX" class="social-button x-post-button">
            <img src="/assets/images/info/logo-black.png" alt="X logo" class="social-logo-icon">
            <span>でシェア！</span>
          </button>
          <button @click="postToInstagram" class="social-button instagram-post-button">
            <img src="/assets/images/info/Instagram_logo.png" alt="Instagram logo" class="social-logo-icon">
            <span>でシェア！</span>
          </button>
        </div>
        <div class="share-caption">スクショも一緒に投稿してにゃ📸</div>
        <div class="timestamp">{{ formattedTimestamp }}</div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { defineProps, defineEmits, computed, ref } from 'vue';
import { useGameStore } from '@/stores/gameStore';
import { useZoomLock } from '@/composables/useZoomLock';
import html2canvas from 'html2canvas';

// ズーム防止機能を有効化
useZoomLock();

const popupContentRef = ref(null);

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  finalResultDetails: { // gameStore.finalResultDetails を想定
    type: Object,
    required: true,
    // rankedPlayers: [{ id, rank, name, score }], consecutiveWins: number
    default: () => ({ rankedPlayers: [], consecutiveWins: 0 }),
  },
});


const emit = defineEmits(['start-new-game', 'back-to-title']);
const gameStore = useGameStore();

const formattedTimestamp = computed(() => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
});

function startNewGame() {
  emit('start-new-game');
}

function backToTitle() {
  emit('back-to-title');
}

function getPlayerIcon(playerId) {
  if (playerId === 'player1') return '/assets/images/info/hito_icon_1.png'; // あなた
  if (playerId === 'player2') return '/assets/images/info/cat_icon_3.png'; // くろ
  if (playerId === 'player3') return '/assets/images/info/cat_icon_2.png'; // たま
  if (playerId === 'player4') return '/assets/images/info/cat_icon_1.png'; // とら
  return null;
}

function postToX() {
  const consecutiveWins = props.finalResultDetails.consecutiveWins;
  let tweetText = `よんじゃん！で${consecutiveWins}連勝達成！

`;
  tweetText += `#よんじゃん #よんじゃん連勝数`;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
  window.open(twitterUrl, '_blank');
}

function postToInstagram() {
  const consecutiveWins = props.finalResultDetails.consecutiveWins;
  const caption = `よんじゃん！で${consecutiveWins}連勝達成！

#よんじゃん #よんじゃん連勝数`;
  navigator.clipboard.writeText(caption).then(() => {
    alert("ポスト用メッセージをクリップボードにコピー。投稿に貼り付けられます。");
    window.open('https://www.instagram.com', '_blank');
  }).catch(err => {
    console.error('クリップボードへのコピーに失敗しました: ', err);
    alert("キャプションのコピーに失敗しました。");
  });
}
</script>

<style scoped>
.popup-overlay {
  position: absolute; /* fixedからabsoluteに変更 */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050; /* 他の要素より手前に表示 */
}
.popup-content {
  background-color: white;
  padding: 2px;
  border-radius: 10px;
  min-width: 320px;
  max-width: 95%;
  text-align: center;
  transform: scale(1); 
  box-shadow: 0 5px 20px rgba(0,0,0,0.25);
}

/* Transition styles */
.popup-enter-active, .popup-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.popup-enter-from, .popup-leave-to {
  opacity: 0;
  transform: scale(0.7);
}
.popup-content h2 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #333;
  font-size: 1.7em;
}
.final-results-list {
  color: #444;
  font-size: 1.0em;
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 5px;
  max-height: 300px;
  overflow-y: auto;
}
.player-rank-item {
  display: flex;
  align-items: center;
  padding: 2px 0;
  border-bottom: 1px dashed #eee;
}
.player-rank-item:last-child {
  border-bottom: none;
}
.rank { 
  font-weight: bold; 
  width: 40px; 
  text-align: left;
  flex-shrink: 0;
}
.player-name { 
  flex-grow: 1; 
  text-align: left; 
  margin-left: 10px;
}
.player-icon {
  width: 60px;
  height: 60px;
  margin: 0 30px;
  flex-shrink: 0;
}
.score { 
  font-weight: bold; 
  color: #007bff; 
  width: 90px; 
  text-align: right;
  flex-shrink: 0;
}
.consecutive-wins {
  font-size: 2em;
  font-weight: bold;
  color: #ff9800; /* オレンジ色 */
  margin-top: 0px;
  margin-bottom: 0px;
  margin-left: 40px;
}

.coin-gain {
  font-size: 2em;
  font-weight: bold;
  margin-bottom: 0px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.positive-gain {
  color: #f59e0b;
}

.negative-gain {
  color: #f44336; /* 赤色 */
}

.cat-coin-icon {
  width: 80px;
  height: 80px;
  margin-left: 0px;
}
.actions {
  display: flex;
  justify-content: space-around;
  gap: 15px;
}
.action-button { /* actions button から action-button にクラス名を変更 */
  padding: 12px 25px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.8em;
  transition: background-color 0.2s ease;
  display: flex; /* テキストを縦に並べるため */
  flex-direction: column; /* テキストを縦に並べるため */
  align-items: center; /* テキストを中央揃え */
  justify-content: center; /* テキストを中央揃え */
  line-height: 1.2; /* 行間調整 */
}
.action-button:first-child { /* 新しいゲームを開始 */
  background-color: #4CAF50;
  color: white;
}
.action-button:first-child:hover {
  background-color: #45a049;
}
.action-button:last-child { /* タイトルに戻る */
  background-color: #f44336;
  color: white;
}
.action-button:last-child:hover {
  background-color: #da190b;
}

.social-share-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 5px;
}

.social-button {
  background-color: transparent;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.8em;
  transition: background-color 0.2s ease, color 0.2s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.social-logo-icon {
  width: 20px;
  height: 20px;
}

.x-post-button {
  color: #1DA1F2;
  border: 1px solid #1DA1F2;
}

.x-post-button:hover {
  background-color: #1DA1F2;
  color: white;
}

.instagram-post-button {
  color: #E1306C;
  border: 1px solid #E1306C;
}

.instagram-post-button:hover {
  background-color: #E1306C;
  color: white;
}

.screenshot-button {
  color: #555;
  border: 1px solid #ccc;
}

.screenshot-button:hover {
  background-color: #f0f0f0;
}

.screenshot-icon {
  font-size: 1.2em;
}

.share-caption {
  font-size: 0.8em;
  color: #666;
  margin-top: 8px;
}

.timestamp {
  margin-top: 15px; /* 調整 */
  font-size: 0.8em;
  color: #666;
}
</style>