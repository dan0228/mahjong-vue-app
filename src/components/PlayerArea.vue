<template>
  <div :class="['player-area', positionClass, { 'is-current-turn': isCurrentTurn }]">
    <div :class="['player-game-elements', positionClass + '-elements']">
      <PlayerHand
        :player="player"
        :is-my-hand="isMyHand"
        :drawn-tile-display="drawnTileDisplay"
        :can-discard="canDiscard"
        :position="position"
        @tile-selected="onTileSelected"
      />
    </div>
    <div v-if="player.melds && player.melds.length > 0" class="melds-area">
        <div v-for="(meld, index) in player.melds" :key="index" class="meld">
          <span v-for="tile in meld.tiles" :key="tile.id" class="meld-tile">
            <img :src="getTileImageUrl(tile)" :alt="tileToString(tile)" />
          </span>
        </div>
    </div>
    <!-- アクションボタンエリア -->
    <div v-if="isMyHand || gameStore.gameMode === 'allManual'" :class="['player-actions', `player-actions-${position}`]">
        <!-- ツモ番のアクション -->
        <img v-if="canDeclareTsumoAgari" src="/assets/images/button/tsumo_button.png" alt="ツモ" class="action-image-button" @click="emitAction('tsumoAgari')" />
        <img v-if="canDeclareRiichi" src="/assets/images/button/riichi_button.png" alt="リーチ" class="action-image-button" @click="emitAction('riichi')" />
        <img v-if="canDeclareAnkan" src="/assets/images/button/kan_button.png" alt="暗槓" class="action-image-button" @click="emitAction('ankan')" />
        <img v-if="canDeclareKakan" src="/assets/images/button/kan_button.png" alt="加槓" class="action-image-button" @click="emitAction('kakan')" />
        <!-- 他家の打牌/加槓に対するアクション -->
        <img v-if="canDeclareRon" src="/assets/images/button/ron_button.png" alt="ロン" class="action-image-button" @click="emitAction('ron')" />
        <img v-if="canDeclarePon" src="/assets/images/button/pon_button.png" alt="ポン" class="action-image-button" @click="emitAction('pon')" />
        <img v-if="canDeclareMinkan" src="/assets/images/button/kan_button.png" alt="カン" class="action-image-button" @click="emitAction('minkan')" />
        <!-- スキップボタン -->
        <img v-if="showSkipButton" src="/assets/images/button/skip_button.png" alt="スキップ" class="action-image-button" @click="emitAction('skip')" />
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';
import PlayerHand from './PlayerHand.vue';
import { useGameStore } from '@/stores/gameStore';
import { GAME_PHASES } from '@/stores/gameStore';
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

// 自分のターンで、かつ打牌前のアクション（ツモ和了、リーチ、カン）が可能なフェーズか
const isMyTurnAndCanActBeforeDiscard = computed(() => {
  return gameStore.currentTurnPlayerId === props.player.id &&
         (gameStore.gamePhase === GAME_PHASES.AWAITING_DISCARD || gameStore.gamePhase === GAME_PHASES.AWAITING_RIICHI_DISCARD);
});

// 自分のターンのアクション
const canDeclareTsumoAgari = computed(() => isMyTurnAndCanActBeforeDiscard.value && playerEligibility.value.canTsumoAgari);
const canDeclareRiichi = computed(() => isMyTurnAndCanActBeforeDiscard.value && playerEligibility.value.canRiichi);
const canDeclareAnkan = computed(() => {
  if (!isMyTurnAndCanActBeforeDiscard.value) return false;
  const ankanInfo = gameStore.canDeclareAnkan[props.player.id];
  return ankanInfo === true || (Array.isArray(ankanInfo) && ankanInfo.length > 0);
});
const canDeclareKakan = computed(() => {
  if (!isMyTurnAndCanActBeforeDiscard.value) return false;
  const kakanInfo = gameStore.canDeclareKakan[props.player.id];
  return kakanInfo === true || (Array.isArray(kakanInfo) && kakanInfo.length > 0);
});

// 他家のアクションに対する応答
const canDeclareRon = computed(() => gameStore.activeActionPlayerId === props.player.id && playerEligibility.value.canRon);
const canDeclarePon = computed(() => gameStore.activeActionPlayerId === props.player.id && playerEligibility.value.canPon);
const canDeclareMinkan = computed(() => gameStore.activeActionPlayerId === props.player.id && playerEligibility.value.canMinkan);

const showSkipButton = computed(() => gameStore.activeActionPlayerId === props.player.id);

function emitAction(actionType) {
    let tileData = null;
    if (actionType === 'pon') tileData = playerEligibility.value.canPon;
    else if (actionType === 'minkan') tileData = playerEligibility.value.canMinkan;
    // 暗槓・加槓の場合、UIで選択された牌を渡す必要がある。
    // ここでは仮に、ストアが単一の牌オブジェクトを返しているか、
    // GameBoard側で選択UIを呼び出す前のトリガーとして機能すると想定。
    // より具体的には、カンする牌を選択するUIを別途呼び出し、その結果を渡す。
    else if (actionType === 'ankan') {
        // TODO: 暗槓する牌を選択するUIを呼び出し、tileDataにセットする
    } else if (actionType === 'kakan') {
        // TODO: 加槓する牌を選択するUIを呼び出し、tileDataにセットする
    }
    emit('action-declared', { playerId: props.player.id, actionType, tile: tileData });
}
</script>

<style scoped>
.player-area {
  padding: 5px;
  display: flex;
  flex-direction: column; /* 基本は縦積み */
  align-items: center;
  position: relative; /* アクションボタンの絶対配置の基準 */
}
.player-game-elements {
  display: flex;
  width: 100%;
  /* アクションボタンが絶対配置になるため、このエリアがボタンと重ならないようにマージン調整が必要な場合がある */
}

.player-area-bottom > .player-game-elements { flex-direction: column; align-items: center; }
.player-area-top > .player-game-elements { flex-direction: column-reverse; align-items: center; }
.player-area-left > .player-game-elements {
  flex-direction: row-reverse;
  align-items: center;
  width: fit-content; /* このコンテナも内容に合わせる */
}
.player-area-right > .player-game-elements {
  flex-direction: row;
  align-items: center;
  width: fit-content; /* このコンテナも内容に合わせる */
}

/* 左右プレイヤーのエリア全体の幅を内容に合わせる */
.player-area-left, .player-area-right {
  width: fit-content; /* 幅を内容に合わせる */
}


.player-info { font-size: 0.9em; margin-bottom: 5px; text-align: center; }
.melds-area { display: flex; gap: 5px; margin-top: 5px; }
.meld { display: flex; }
.meld-tile img { width: 20px; height: 30px; }
.player-actions {
    margin-top: 5px;
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
    justify-content: center; /* ボタンを中央揃え */
    position: absolute; /* 他の要素のレイアウトフローから切り離す */
    z-index: 30; /* 他の要素より手前に表示 */
    padding: 5px;
    border-radius: 4px;
}

/* 各ポジションごとのアクションボタンの位置調整 */
.player-actions-bottom {
  /* 自家: 手牌の右上 */
  top: -60%; /* 親エリアの上端から少し内側など、調整が必要 */
  right: -30%; /* 親エリアの右端から少し内側など、調整が必要 */
  /* transform: translate(X, Y); で微調整も可能 */
  flex-direction: row; /* ボタンを横に並べる */
  justify-content: flex-end;
  align-items: flex-start;
}
.player-actions-top {
  /* 対面: 画面から見て手牌の左下 */
  bottom: -20%;
  left: 0%;
  flex-direction: row; /* ボタンを横に並べる */
  justify-content: flex-start;
  align-items: flex-end;
}

/* アクションボタンの向き調整 */
.player-actions-left, .player-actions-right {
  flex-direction: column; /* 左右プレイヤーのボタンは縦に並べる */
  gap: 3px;
}
.player-actions-left {
  /* 左側: 画面から見て手牌の右下 */
  bottom: 70%;
  right: -230%;
  /* transform: translate(X, Y); で微調整も可能 */
  align-items: flex-end; /* ボタンを右寄せ */
  justify-content: flex-end; /* ボタンを下寄せ */
}
.player-actions-right {
  /* 右側: 画面から見て手牌の左上 */
  top: 0%;
  left: -230%;
  align-items: flex-start; /* ボタンを左寄せ */
  justify-content: flex-start; /* ボタンを上寄せ */
}
.action-image-button {
  /* ボタン画像を適切なサイズに調整 */
  width: 100px; /* 例: 幅60px (調整可能) */
  height: auto; /* 高さは自動 */
  cursor: pointer;
  transition: transform 0.15s ease, filter 0.15s ease;
  pointer-events: auto; /* クリックイベントを確実に受け取るようにする */
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.25)); /* 初期状態で少し影をつける */
}
.action-image-button:hover {
  transform: translateY(-3px); /* 少し上に浮き上がる */
  filter: drop-shadow(0 5px 5px rgba(0, 0, 0, 0.35)); /* ホバー時により濃い影をつける */
}
.action-image-button:active {
  transform: translateY(-1px); /* クリック時に少し沈む */
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.2)); /* 影を少し弱める */
}
</style>