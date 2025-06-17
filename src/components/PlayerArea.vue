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
const canDeclareAnkan = computed(() => {
  const ankanInfo = gameStore.canDeclareAnkan[props.player.id];
  // ankanInfo が true または牌オブジェクトの配列で要素がある場合にtrue
  return gameStore.currentTurnPlayerId === props.player.id &&
         (ankanInfo === true || (Array.isArray(ankanInfo) && ankanInfo.length > 0));
});
const canDeclareKakan = computed(() => {
  const kakanInfo = gameStore.canDeclareKakan[props.player.id];
  // kakanInfo が true または牌オブジェクトの配列で要素がある場合にtrue
  return gameStore.currentTurnPlayerId === props.player.id &&
         (kakanInfo === true || (Array.isArray(kakanInfo) && kakanInfo.length > 0));
});

// 他家のアクションに対する応答
const canDeclareRon = computed(() => playerEligibility.value.canRon && gameStore.waitingForPlayerResponses.includes(props.player.id));
const canDeclarePon = computed(() => playerEligibility.value.canPon && gameStore.waitingForPlayerResponses.includes(props.player.id));
const canDeclareMinkan = computed(() => playerEligibility.value.canMinkan && gameStore.waitingForPlayerResponses.includes(props.player.id));

const showSkipButton = computed(() => gameStore.waitingForPlayerResponses.includes(props.player.id));

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
  /* justify-content: center; は width: fit-content の場合、効果が薄れる */
  width: fit-content; /* このコンテナも内容に合わせる */
}
.player-area-right > .player-game-elements {
  flex-direction: row;
  align-items: center;
  /* justify-content: center; は width: fit-content の場合、効果が薄れる */
  width: fit-content; /* このコンテナも内容に合わせる */
}

/* 左右プレイヤーのエリア全体の幅を内容に合わせる */
.player-area-left, .player-area-right {
  /* max-width: 100px; */ /* この行をコメントアウトまたは削除 */
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
    z-index: 10; /* 他の要素より手前に表示 */
    background-color: rgba(0,0,0,0.1); /* ボタンエリアの背景を少し暗くして視認性向上 (任意) */
    padding: 5px;
    border-radius: 4px;
}

/* 各ポジションごとのアクションボタンの位置調整 */
.player-actions-bottom {
  /* 自家: 手牌の右上 */
  top: -50%; /* 親エリアの上端から少し内側など、調整が必要 */
  right: -20%; /* 親エリアの右端から少し内側など、調整が必要 */
  /* transform: translate(X, Y); で微調整も可能 */
  flex-direction: row; /* ボタンを横に並べる */
  justify-content: flex-end;
  align-items: flex-start;
}
.player-actions-top {
  /* 対面: 画面から見て手牌の左下 */
  bottom: -40%;
  left: -20%;
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
  bottom: -10%;
  right: -90%;
  /* transform: translate(X, Y); で微調整も可能 */
  align-items: flex-end; /* ボタンを右寄せ */
  justify-content: flex-end; /* ボタンを下寄せ */
}
.player-actions-right {
  /* 右側: 画面から見て手牌の左上 */
  top: -10%;
  left: -90%;
  align-items: flex-start; /* ボタンを左寄せ */
  justify-content: flex-start; /* ボタンを上寄せ */
}
.player-actions-left button, .player-actions-right button {
  width: 100%; /* ボタン幅をコンテナに合わせる */
}
</style>