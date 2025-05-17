<template>
  <div class="center-table-info">
    <div class="round-info">
      <span>{{ roundWind }}{{ roundNumber }}局</span>
      <span>{{ honbaCount }}本場</span>
      <span>供託: {{ riichiSticksCount }}</span>
    </div>
    <div class="scores">
      <div v-for="player in players" :key="player.id" class="player-score">
        <span class="player-name">{{ getPlayerPositionName(player.id) }}:</span>
        <span class="score-value">{{ player.score }}</span>
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

const players = computed(() => gameStore.players);
const roundWind = computed(() => gameStore.currentRound.wind === 'east' ? '東' : '南'); // 東風戦のみなので基本は東
const roundNumber = computed(() => gameStore.currentRound.number);
const honbaCount = computed(() => gameStore.honba);
const riichiSticksCount = computed(() => gameStore.riichiSticks);
const remainingTiles = computed(() => gameStore.remainingWallTilesCount);
const doraTiles = computed(() => gameStore.revealedDoraIndicators);

// プレイヤーIDから表示上の位置名を取得するヘルパー (GameBoard.vueのロジックと合わせる)
function getPlayerPositionName(playerId) {
  // GameBoard.vue でのプレイヤー位置割り当てロジックに基づいて名前を返す
  // ここでは仮の対応
  if (playerId === 'player1') return '自分(下)';
  if (playerId === 'player2') return '右';
  if (playerId === 'player3') return '対面(上)';
  if (playerId === 'player4') return '左';
  return playerId;
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