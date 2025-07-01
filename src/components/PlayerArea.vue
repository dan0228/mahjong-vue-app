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
        <div v-for="(meld, meldIndex) in player.melds" :key="meldIndex" class="meld">
          <span v-for="(tile, tileIndex) in meld.tiles" :key="tile.id + '-' + tileIndex" :class="['meld-tile', getMeldTileRotationClass(meld, tileIndex)]">
            <img :src="getMeldTileImage(meld, tile, tileIndex)" :alt="getMeldTileAlt(meld, tile, tileIndex)" class="meld-tile-image" />
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
import { defineProps, defineEmits, computed, ref, watch } from 'vue';
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

const actionInProgress = ref(false);

// ゲームの状態が変化したら、アクションボタンを再表示できるようにする
watch(() => [gameStore.gamePhase, gameStore.activeActionPlayerId, gameStore.currentTurnPlayerId], () => {
  actionInProgress.value = false;
}, { deep: true });

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
const canDeclareTsumoAgari = computed(() => !actionInProgress.value && isMyTurnAndCanActBeforeDiscard.value && playerEligibility.value.canTsumoAgari);
const canDeclareRiichi = computed(() => !actionInProgress.value && isMyTurnAndCanActBeforeDiscard.value && playerEligibility.value.canRiichi);
const canDeclareAnkan = computed(() => {
  if (actionInProgress.value || !isMyTurnAndCanActBeforeDiscard.value) return false;
  const ankanInfo = gameStore.canDeclareAnkan[props.player.id];
  return ankanInfo === true || (Array.isArray(ankanInfo) && ankanInfo.length > 0);
});
const canDeclareKakan = computed(() => {
  if (actionInProgress.value || !isMyTurnAndCanActBeforeDiscard.value) return false;
  const kakanInfo = gameStore.canDeclareKakan[props.player.id];
  return kakanInfo === true || (Array.isArray(kakanInfo) && kakanInfo.length > 0);
});

// 他家のアクションに対する応答
const canDeclareRon = computed(() => !actionInProgress.value && gameStore.activeActionPlayerId === props.player.id && playerEligibility.value.canRon);
const canDeclarePon = computed(() => !actionInProgress.value && gameStore.activeActionPlayerId === props.player.id && playerEligibility.value.canPon);
const canDeclareMinkan = computed(() => !actionInProgress.value && gameStore.activeActionPlayerId === props.player.id && playerEligibility.value.canMinkan);

const showSkipButton = computed(() => !actionInProgress.value && gameStore.activeActionPlayerId === props.player.id);

function emitAction(actionType) {
    // ボタンが押されたら、すぐに非表示にする
    actionInProgress.value = true;
    
    let tileData = null;
    if (actionType === 'pon') tileData = playerEligibility.value.canPon;
    else if (actionType === 'minkan') tileData = playerEligibility.value.canMinkan;
    // 暗槓・加槓の場合、UIで選択された牌を渡す必要がある。
    // ここでは仮に、ストアが単一の牌オブジェクトを返しているか、
    // GameBoard側で選択UIを呼び出す前のトリガーとして機能すると想定。
    // より具体的には、カンする牌を選択するUIを別途呼び出し、その結果を渡す。
    else if (actionType === 'ankan') {
        const ankanOptions = gameStore.canDeclareAnkan[props.player.id];
        if (Array.isArray(ankanOptions) && ankanOptions.length === 1) {
            // 選択肢が1つしかないので、それを自動的に選択
            tileData = ankanOptions[0];
        } else {
            // 選択肢が複数ある、またはUIでの選択が必要な場合
            // GameBoardに選択を促すイベントを投げる (tileDataはnullのまま)
            console.log("Multiple ankan options, UI selection needed.");
        }
    } else if (actionType === 'kakan') {
        // TODO: 加槓する牌を選択するUIを呼び出し、tileDataにセットする
    }
    emit('action-declared', { playerId: props.player.id, actionType, tile: tileData });
}

function getMeldTileRotationClass(meld, tileIndex) {
  // ポンと明槓以外は対象外
  if (meld.type !== 'pon' && meld.type !== 'minkan') return '';

  const players = gameStore.players;
  const myPlayerId = props.player.id;
  const fromPlayerId = meld.from;

  const myIndex = players.findIndex(p => p.id === myPlayerId);
  const fromIndex = players.findIndex(p => p.id === fromPlayerId);

  if (myIndex === -1 || fromIndex === -1) return '';

  // 鳴いた相手の相対位置を計算 (1:右(下家), 2:対面, 3:左(上家))
  const relativePosition = (fromIndex - myIndex + players.length) % players.length;

  let rotatedTileIndex = -1;
  if (meld.type === 'pon') {
    // ポン: プレイヤーの視点から見て、どの牌を横にするか
    if (relativePosition === 1) { // 右(下家)から
      rotatedTileIndex = 2; // 右端の牌
    } else if (relativePosition === 2) { // 対面から
      rotatedTileIndex = 1; // 真ん中の牌
    } else if (relativePosition === 3) { // 左(上家)から
      rotatedTileIndex = 0; // 左端の牌
    }
  } else if (meld.type === 'minkan') {
    // 明槓: プレイヤーの視点から見て、どの牌を横にするか
    if (relativePosition === 1) { // 右(下家)から
      rotatedTileIndex = 3; // 一番右の牌
    } else if (relativePosition === 2) { // 対面から
      rotatedTileIndex = 1; // 左から2番目の牌
    } else if (relativePosition === 3) { // 左(上家)から
      rotatedTileIndex = 0; // 一番左の牌
    }
  }

  // 対面プレイヤーの場合、牌の並びが視覚的に逆になるため、左右の解釈を入れ替える
  if (props.position === 'top') {
    const lastIndex = meld.tiles.length - 1;
    if (rotatedTileIndex === 0) {
      rotatedTileIndex = lastIndex;
    } else if (rotatedTileIndex === lastIndex) {
      rotatedTileIndex = 0;
    }
    // 中央の牌(index 1)は反転不要
  }

  // 右プレイヤーの場合のみ、牌の並びが視覚的に逆になるため、上下の解釈を入れ替える
  if (props.position === 'right') {
    const lastIndex = meld.tiles.length - 1;
    if (rotatedTileIndex === 0) {
      rotatedTileIndex = lastIndex;
    } else if (rotatedTileIndex === lastIndex) {
      rotatedTileIndex = 0;
    }
  }

  // tileIndexが回転対象のインデックスと一致すればクラスを返す
  return tileIndex === rotatedTileIndex ? 'rotated-meld-tile' : '';
}

function getMeldTileImage(meld, tile, tileIndex) {
  // 暗槓の場合、真ん中の2枚を裏向きにする
  if (meld.type === 'ankan' && (tileIndex === 1 || tileIndex === 2)) {
    return getTileImageUrl(null); // tileUtilsのgetTileImageUrlはnullで裏向き画像を返す
  }
  return getTileImageUrl(tile);
}

function getMeldTileAlt(meld, tile, tileIndex) {
  if (meld.type === 'ankan' && (tileIndex === 1 || tileIndex === 2)) {
    return '裏向きの牌';
  }
  return tileToString(tile);
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
  width: 100%; /* 親コンテナの幅に合わせる */
}


.player-info { font-size: 0.9em; margin-bottom: 5px; text-align: center; }
.melds-area {
  display: flex;
  gap: 10px; /* 面子間のスペース */
  position: absolute;
  z-index: 20;
}
.meld {
  display: flex;
  gap: 0px; /* 牌同士はくっつける */
  /* ポンとカンで表示位置がずれないように、コンテナのサイズをカン(4牌)に合わせる */
}
.player-area-bottom .meld,
.player-area-top .meld {
  min-width: 107px; /* (牌24px * 3) + (横向き牌35px) = 107px */
}
.player-area-bottom .meld {
  justify-content: flex-end; /* ポン(3牌)の場合に右に寄せる */
}
.player-area-top .meld {
  justify-content: flex-start; /* ポン(3牌)の場合に左に寄せる */
}
.player-area-left .meld {
  min-height: 107px; /* (牌24px * 3) + (横向き牌35px) = 107px */
}
.player-area-right .meld {
  min-height: 107px;
  justify-content: flex-end; /* ポン(3牌)の場合に下に寄せる */
}
.player-area-left .meld,
.player-area-right .meld {
  flex-direction: column;
}
.player-area-left .meld-tile,
.player-area-right .meld-tile {
  width: 28px;  /* 回転後の牌の幅 (画像の高さに合わせる) */
  height: 20px; /* 回転後の牌の高さ (画像の幅に合わせる) */
}
.player-area-bottom .meld-tile{
  width: 28px;  /* 回転後の牌の幅 (画像の高さに合わせる) */
  height: 20px; /* 回転後の牌の高さ (画像の幅に合わせる) */
}
.meld-tile {
  display: flex;
  justify-content: center;
  align-items: center;
}
/* 自家(手前)の鳴き牌コンテナは少し大きく */
.player-area-bottom .meld-tile {
  width: auto; /* 幅は画像に合わせる */
  height: 42px; /* 高さを指定 */
}
/* 各プレイヤーの面子エリアの位置と向き */
.player-area-bottom .melds-area {
  flex-direction: row-reverse; /* 右から左に面子を追加 */
  bottom: 0%;
  right: -170px;
  margin-bottom: 5px;
}
.player-area-top .melds-area {
  flex-direction: row; /* 左から右に面子を追加 */
  top: 0%;
  left:-150px;
  margin-top: 5px;
}
.player-area-left .melds-area {
  flex-direction: column; /* 上から下に面子を追加 */
  top: 100px;
  left: 7%; /* 手牌エリアの右側に配置 */
  margin-left: 5px; /* 手牌との間に少しスペースを空ける */
}
.player-area-right .melds-area {
  flex-direction: column-reverse; /* 下から上に面子を追加 */
  top: -260px; /* 垂直方向の中央に配置 */
  right: 20%; /* 手牌エリアの左側に配置 */
  margin-right: 5px; /* 手牌との間に少しスペースを空ける */
}

/* 牌の基本サイズと向き */
.meld-tile-image {
  width: 20px;
  height: 28px;
  display: block;
}
/* 自家(手前)の鳴き牌画像は大きく */
.player-area-bottom .meld-tile-image {
  width: 25px;
  height: 34px;
}
.player-area-top .meld-tile-image { transform: rotate(180deg); }
.player-area-left .meld-tile-image { transform: rotate(90deg); }
.player-area-right .meld-tile-image { transform: rotate(-90deg); }

/* ポンで横にする牌のスタイル */
.rotated-meld-tile {
  /* 横向きの牌は少しずらして重ねる */
  position: relative;
}
.player-area-bottom .rotated-meld-tile {
  /* 横向きの牌のコンテナは、牌の高さ分の幅を持つ */
  width: 34px; /* 新しい牌の高さに合わせる */
  bottom: -5px; /* 位置を微調整 */
}
.player-area-top .rotated-meld-tile {
  /* 横向きの牌のコンテナは、牌の高さ分の幅を持つ */
  width: 28px;
  bottom: 5px;
}
.player-area-bottom .rotated-meld-tile .meld-tile-image,
.player-area-top .rotated-meld-tile .meld-tile-image {
  transform: rotate(90deg);
}
.player-area-left .rotated-meld-tile{
  /* 縦向きの牌のコンテナは、牌の高さ分の高さを持つ */
  width: 20px;  /* 縦向きの牌の幅 */
  height: 28px; /* 縦向きの牌の高さ */
}
.player-area-right .rotated-meld-tile {
  /* 縦向きの牌のコンテナは、牌の高さ分の高さを持つ */
  width: 20px;  /* 縦向きの牌の幅 */
  height: 28px; /* 縦向きの牌の高さ */
  left: 8px;
}
.player-area-left .rotated-meld-tile .meld-tile-image,
.player-area-right .rotated-meld-tile .meld-tile-image {
  transform: none; /* 左右プレイヤーの場合は回転をリセットして縦置きにする */
}

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
  bottom: -80%;
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
  bottom: 0%;
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
  width: 84px; /* 例: 幅60px (調整可能) */
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