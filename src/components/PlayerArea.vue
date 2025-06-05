<template>
  <div :class="['player-area', positionClass, { 'is-current-turn': isCurrentTurn }]">
    <div class="player-info">
      <p>{{ player.name }} ({{ player.seatWind }}) {{ player.score }}点</p>
      <p v-if="player.isRiichi">リーチ</p>
    </div>
    <DiscardPile :tiles="player.discards" :position="position"/>
    <PlayerHand
      :player="player"
      :is-my-hand="isMyHand"
      :drawn-tile-display="drawnTileDisplay"
      :can-discard="canDiscard"
      :position="position"
      @tile-selected="onTileSelected"
    />
    <div v-if="player.melds && player.melds.length > 0" class="melds-area">
        <div v-for="(meld, index) in player.melds" :key="index" class="meld">
          <span v-for="tile in meld.tiles" :key="tile.id" class="meld-tile">
            <img :src="getTileImageUrl(tile)" :alt="tileToString(tile)" />
          </span>
        </div>
    </div>
    <!-- アクションボタンエリア -->
    <div v-if="isMyHand || gameStore.gameMode === 'allManual'" class="player-actions">
        <!-- ツモ番のアクション -->
        <button v-if="canDeclareTsumoAgari" @click="emitAction('tsumoAgari')">ツモ</button>
        <button v-if="canDeclareRiichi" @click="emitAction('riichi')">リーチ</button>
        <button v-if="canDeclareAnkan" @click="emitAction('ankan')">暗槓</button>
        <button v-if="canDeclareKakan" @click="emitAction('kakan')">加槓</button>
        <!-- 他家の打牌/加槓に対するアクション -->
        <button v-if="canDeclareRon" @click="emitAction('ron')">ロン</button>
        <button v-if="canDeclarePon" @click="emitAction('pon')">ポン</button>
        <button v-if="canDeclareMinkan" @click="emitAction('minkan')">カン</button>
        <!-- スキップボタン -->
        <button v-if="showSkipButton" @click="emitAction('skip')">スキップ</button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';
import PlayerHand from './PlayerHand.vue';
import DiscardPile from './DiscardPile.vue';
import { useGameStore } from '@/stores/gameStore';
import { getTileImageUrl, tileToString } from '@/utils/tileUtils'; // 共通ユーティリティ

const props = defineProps({
  player: { type: Object, required: true },
  position: { type: String, required: true }, // 'bottom', 'right', 'top', 'left'
  isMyHand: { type: Boolean, default: false },
  drawnTileDisplay: { type: Object, default: null },
  canDiscard: { type: Boolean, default: false },
});

const emit = defineEmits(['tile-selected', 'action-declared']);

const gameStore = useGameStore();

const positionClass = computed(() => `player-area-${props.position}`);
const isCurrentTurn = computed(() => gameStore.currentTurnPlayerId === props.player.id);

function onTileSelected(payload) {
  emit('tile-selected', payload);
}

const playerEligibility = computed(() => gameStore.playerActionEligibility[props.player.id] || {});

// 自分のターンのアクション
const canDeclareTsumoAgari = computed(() => gameStore.currentTurnPlayerId === props.player.id && playerEligibility.value.canTsumoAgari);
const canDeclareRiichi = computed(() => gameStore.currentTurnPlayerId === props.player.id && playerEligibility.value.canRiichi);
const canDeclareAnkan = computed(() => gameStore.currentTurnPlayerId === props.player.id && gameStore.canDeclareAnkan[props.player.id] !== null);
const canDeclareKakan = computed(() => gameStore.currentTurnPlayerId === props.player.id && gameStore.canDeclareKakan[props.player.id] !== null);

// 他家のアクションに対する応答
const canDeclareRon = computed(() => playerEligibility.value.canRon && gameStore.waitingForPlayerResponses.includes(props.player.id));
const canDeclarePon = computed(() => playerEligibility.value.canPon && gameStore.waitingForPlayerResponses.includes(props.player.id));
const canDeclareMinkan = computed(() => playerEligibility.value.canMinkan && gameStore.waitingForPlayerResponses.includes(props.player.id));

const showSkipButton = computed(() => gameStore.waitingForPlayerResponses.includes(props.player.id));

function emitAction(actionType) {
    let tileData = null;
    if (actionType === 'pon') tileData = playerEligibility.value.canPon;
    else if (actionType === 'minkan') tileData = playerEligibility.value.canMinkan;
    // 暗槓・加槓の場合は、GameBoard側でUI選択を挟む想定

    emit('action-declared', { playerId: props.player.id, actionType, tile: tileData });
}
</script>

<style scoped>
.player-area {
  border: 1px dashed #666;
  padding: 5px;
  display: flex;
  /* Position-specific styles will adjust flex-direction and alignment */
}
.player-area-bottom { flex-direction: column; align-items: center; }
.player-area-top { flex-direction: column-reverse; align-items: center; }
.player-area-left { flex-direction: row-reverse; align-items: center; }
.player-area-right { flex-direction: row; align-items: center; }

.player-info { font-size: 0.9em; margin-bottom: 5px; text-align: center; }
.is-current-turn { border: 2px solid gold; }
.melds-area { display: flex; gap: 5px; margin-top: 5px; }
.meld { display: flex; }
.meld-tile img { width: 20px; height: 30px; }
.player-actions {
    margin-top: 5px;
    display: flex;
    gap: 5px;
    flex-wrap: wrap; /* ボタンが多い場合に折り返す */
}
</style>