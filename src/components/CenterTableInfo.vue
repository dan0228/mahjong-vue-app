<template>
  <div class="center-table-info">
    <div class="round-info">
      <span>{{ roundWind }}{{ roundNumber }}局</span>
      <span>{{ honbaCount }}本場</span>
      <span>供託: {{ riichiSticksCount }}</span>
    </div>
    <div v-if="dealer" class="dealer-info">
      <span>現在の親: {{ dealer.name }} ({{ dealer.seatWind }})</span>
    </div>
    <div class="scores">
      <!-- GameBoard.vue の表示順 (自分、右、対面、左) に合わせてプレイヤー情報を表示 -->
      <div v-for="player in orderedPlayersForDisplay" :key="player.id" class="player-score">
        <span class="player-name">
          {{ getPlayerDisplayLabel(player) }}:
        </span>
        <span class="score-value">{{ player.score }}</span>
        <span v-if="player.isDealer && player.id !== dealer?.id" class="dealer-indicator-small"> (親)</span>
        <span v-if="player.seatWind && player.id !== dealer?.id" class="wind-indicator-small">
           ({{ player.seatWind }})
        </span>
      </div>
    </div>
    <div class="game-state-info">
      <span>残り牌山: {{ remainingTiles }}</span>
      <div class="dora-indicators">
        <span>ドラ表示:</span>
        <div v-for="(tile, index) in doraTiles" :key="index" class="tile">
          <img :src="getTileImageUrl(tile)" :alt="tileToString(tile)" />
        </div>
        <span v-if="!doraTiles || doraTiles.length === 0">(なし)</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useGameStore } from '@/stores/gameStore';

const gameStore = useGameStore();

const roundWind = computed(() => gameStore.currentRound.wind === 'east' ? '東' : '南'); // 東風戦のみなので基本は東
const roundNumber = computed(() => gameStore.currentRound.number);
const honbaCount = computed(() => gameStore.honba);
const riichiSticksCount = computed(() => gameStore.riichiSticks);
const remainingTiles = computed(() => gameStore.remainingWallTilesCount);
const doraTiles = computed(() => gameStore.revealedDoraIndicators);
const dealer = computed(() => {
  if (gameStore.dealerIndex !== null && gameStore.players[gameStore.dealerIndex]) {
    return gameStore.players[gameStore.dealerIndex];
  }
  return null;
});

// GameBoard.vue の表示順に合わせてプレイヤーを並び替える
const orderedPlayersForDisplay = computed(() => {
  const playerOrder = ['player1', 'player2', 'player3', 'player4']; // 自分(下)、右、対面(上)、左
  return playerOrder.map(id => gameStore.players.find(p => p.id === id)).filter(Boolean);
});

// 表示用のプレイヤーラベルを取得する関数
function getPlayerDisplayLabel(player) {
  if (!player) return '';
  // GameBoard.vue でのプレイヤー位置割り当てロジックに基づいて名前を返す
  // player.name を基本とし、必要に応じて seatWind や isDealer を追加表示
  // ここでは player.name をそのまま使うか、固定的な位置名を使うか選択
  // 例:
  if (player.id === 'player1') return `${player.name}(下)`;
  if (player.id === 'player2') return `${player.name}(右)`;
  if (player.id === 'player3') return `${player.name}(上)`;
  if (player.id === 'player4') return `${player.name}(左)`;
  return player.name;
  // もしくは、席風を重視する場合
  // return `${player.name} (${player.seatWind || '風未定'})`;
}

// Tile.vue や PlayerHand.vue と共通の牌画像取得ロジック
function getTileImageUrl(tile) {
  if (tile && tile.suit && tile.rank) {
    return `/assets/images/tiles/${tile.suit}${tile.rank}.png`; // 適切なパスに修正
  }
  return `/assets/images/tiles/ura.png`; // 不明な牌やエラー時
}

function tileToString(tile) {
  if (tile && tile.suit && tile.rank){
    return `${tile.suit}${tile.rank}`;
  }
  return '不明';
}
</script>

<style scoped>
.center-table-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background-color: rgba(200, 200, 200, 0.8);
  border-radius: 8px;
  font-size: 0.9em;
  color: #333;
}
.dealer-info {
  font-weight: bold;
  margin-bottom: 5px;
}
.round-info, .game-state-info {
  display: flex;
  gap: 15px;
}
.scores {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: center;
}
.player-score {
  display: flex;
  gap: 5px;
  align-items: center; /* 縦位置を揃える */
}
.dealer-indicator-small, .wind-indicator-small {
  font-size: 0.8em;
  color: #555;
  margin-left: 2px;
}
.dora-indicators {
  display: flex;
  align-items: center;
  gap: 5px;
}
.tile img {
  width: 25px; /* ドラ表示牌のサイズ調整 */
  height: auto;
}
</style>