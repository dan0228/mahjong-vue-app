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
      <div v-for="player in orderedPlayers" :key="player.id" class="player-score">
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
import { computed, defineProps } from 'vue';
import { useGameStore } from '@/stores/gameStore';
import { getTileImageUrl, tileToString } from '@/utils/tileUtils'; // インポート

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

const props = defineProps({
  orderedPlayers: { // GameBoardから渡される表示順のプレイヤーリスト
    type: Array,
    required: true
  }
});

// 表示用のプレイヤーラベルを取得する関数
function getPlayerDisplayLabel(player) {
  if (!player) return '';
  // GameBoard.vue でのプレイヤー位置割り当てロジックに基づいて名前を返す
  // player.name を基本とし、必要に応じて seatWind や isDealer を追加表示
  // ここでは player.name をそのまま使うか、固定的な位置名を使うか選択
  // GameBoardから渡されるorderedPlayersの順序自体が位置を示唆するため、
  // ここではplayer.nameと風のみで十分かもしれません。
  return `${player.name}`;
  // もしくは、席風を重視する場合
  // return `${player.name} (${player.seatWind || '風未定'})`;
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