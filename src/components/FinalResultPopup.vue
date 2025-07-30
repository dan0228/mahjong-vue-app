<template>
  <transition name="popup">
    <div v-if="show" class="popup-overlay">
      <div class="popup-content">
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
        <div class="coin-gain" v-if="gameStore.lastCoinGain > 0">
          <img src="/assets/images/info/cat_coin.png" alt="Cat Coin" class="cat-coin-icon">+{{ gameStore.lastCoinGain }}
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
        <button @click="postToX" class="x-post-button">
          <img src="/assets/images/info/logo-black.png" alt="X logo" class="x-logo-icon">
          <span>でシェア！</span>
          <span>(スクショも一緒に投稿するにゃ📸)</span>
        </button>
        <div class="timestamp">{{ formattedTimestamp }}</div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';
import { useGameStore } from '@/stores/gameStore';
import { useZoomLock } from '@/composables/useZoomLock';

// ズーム防止機能を有効化
useZoomLock();

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
  let tweetText = `よんじゃん！で${consecutiveWins}連勝達成！\n\n`;
  tweetText += `#よんじゃん #よんじゃん連勝数`;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
  window.open(twitterUrl, '_blank');
}
</script>

<style scoped>
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050; /* ResultPopupより手前に表示する場合 */
}
.popup-content {
  background-color: white;
  padding: 30px;
  border-radius: 10px;
  min-width: 350px;
  max-width: 90%;
  text-align: center;
  transform: scale(0.85); /* ポップアップ全体を縮小して画面に収める */
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
  margin-bottom: 20px;
  color: #333;
  font-size: 1.8em;
}
.final-results-list {
  margin-bottom: 25px;
  color: #444;
  font-size: 1.1em;
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 5px;
  max-height: 300px;
  overflow-y: auto;
}
.player-rank-item {
  display: flex;
  align-items: center;
  padding: 5px 0;
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
  margin-top: 15px;
  margin-bottom: 5px;
  margin-left: 40px;
}

.coin-gain {
  font-size: 2em;
  font-weight: bold;
  color: #f59e0b;
  margin-bottom: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
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
  font-size: 0.9em;
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

.x-post-button {
  background-color: transparent; /* 背景を透明に */
  color: #1DA1F2; /* Xのブランドカラーに */
  padding: 10px 20px;
  border: 1px solid #1DA1F2; /* Xのブランドカラーのボーダー */
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.8em;
  margin: 15px auto 0 auto;
  transition: background-color 0.2s ease, color 0.2s ease;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.x-post-button .x-logo-icon {
  width: 20px;
  height: 20px;
  vertical-align: middle;
}

.x-post-button:hover {
  background-color: #1DA1F2; /* ホバー時に背景色をXのブランドカラーに */
  color: white; /* ホバー時に文字色を白に */
}

.timestamp {
  margin-top: 2px;
  font-size: 0.8em;
  color: #666;
}
</style>