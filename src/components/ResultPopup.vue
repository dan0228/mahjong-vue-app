<template>
  <transition name="popup">
    <div v-if="show" class="popup-overlay">
      <div class="popup-content">

      <div class="result-section round-info" style="text-align: center; margin-bottom: 15px;">
        <p class="round-main-info">{{ roundWindDisplay }}{{ resultDetails.roundNumber }}局 {{ resultDetails.honba }}本場</p>
      </div>
      <div v-if="!isDrawResult" class="winner-title-container">
        <img v-if="winnerIconSrc" :src="winnerIconSrc" alt="Winner Icon" class="winner-icon" />
        <h2>{{ resultTitle }}</h2>
      </div>
      <div v-if="!isDrawResult" class="result-section round-info-details"> <!-- 和了時のみ表示 -->
        <div class="dora-display">
          <span class="dora-label">ドラ</span>
          <div class="dora-tiles">
            <!-- 表示するドラ -->
            <img v-for="(tile, index) in resultDetails.doraIndicators" :key="'dora-'+tile.id + '-' + index" :src="getTileImageUrl(tile)" :alt="tileToString(tile)" class="tile-image-small"/>
            <!-- ドラの残りを裏向きで表示 (最大4つまで) -->
            <img v-for="n in Math.max(0, 4 - (resultDetails.doraIndicators?.length || 0))" :key="'dora-hidden-' + n" :src="getTileImageUrl({type: 'ura'})" alt="ドラ裏" class="tile-image-small"/>
          </div>
        </div>
        <div class="dora-display">
          <span class="dora-label">裏ドラ</span>
          <div class="dora-tiles">
            <template v-if="isRiichiAgari">
              <!-- リーチ和了時は、表ドラの数だけ裏ドラを表示（めくれている分＋裏向き） -->
              <img v-for="(tile, index) in resultDetails.uraDoraIndicators" :key="'ura-revealed-'+tile.id + '-' + index" :src="getTileImageUrl(tile)" :alt="tileToString(tile)" class="tile-image-small" />
              <img v-for="n in Math.max(0, 4 - (resultDetails.uraDoraIndicators?.length || 0))" :key="'ura-hidden-riichi-' + n" :src="getTileImageUrl({type: 'ura'})" alt="裏ドラ" class="tile-image-small" />
            </template>
            <template v-else>
              <!-- リーチなし和了や流局時は、4牌分を裏向きで表示 -->
              <img v-for="n in 4" :key="'ura-hidden-no-riichi-' + n" :src="getTileImageUrl({type: 'ura'})" alt="裏ドラ" class="tile-image-small"/>
            </template>
          </div>
        </div>
      </div>

      <div v-if="!isDrawResult" class="result-section winning-hand-info"> <!-- 和了時のみ表示 -->
        <h3>和了手牌</h3>
        <div class="hand-display">
          <!-- 元々持っていた4牌 -->
          <span v-for="(tile, index) in originalHandWithoutAgariTile" :key="'original-' + tile.id + '-' + index" class="tile-image-medium">
            <img :src="getTileImageUrl(tile)" :alt="tileToString(tile)" />
          </span>
          <!-- 和了牌 (少し間を開ける) -->
          <span v-if="resultDetails.agariTile" class="tile-image-medium agari-tile-display">
            <img :src="getTileImageUrl(resultDetails.agariTile)" :alt="tileToString(resultDetails.agariTile)" />
          </span>
          <!-- 鳴いた牌 -->
          <template v-if="resultDetails.melds && resultDetails.melds.length > 0">
            <div v-for="(meld, meldIndex) in resultDetails.melds" :key="'meld-' + meldIndex" class="meld-display">
              <span v-for="(tile, tileIndex) in meld.tiles" :key="'meld-' + meldIndex + '-tile-' + tileIndex" class="tile-image-medium" :class="getMeldTileClass(meld, tileIndex)">
                <img :src="meld.type === 'ankan' && (tileIndex === 1 || tileIndex === 2) ? '/assets/images/tiles/ura.png' : getTileImageUrl(tile)" :alt="tileToString(tile)" />
              </span>
            </div>
          </template>
        </div>
      </div>

      <div v-if="!isDrawResult" class="result-section yaku-info"> <!-- 和了時のみ表示 -->
        <h3>成立役</h3>
        <ul>
          <li v-for="(yaku, index) in resultDetails.yakuList" :key="index">
            {{ yaku.name }}
            <span v-if="yaku.power !== undefined"> <!-- 役満の場合 -->
              ({{ yaku.power === 1 ? '役満' : `${yaku.power}倍役満` }})
            </span>
            <span v-else-if="yaku.fans !== undefined"> ({{ yaku.fans }}翻)</span>
          </li>
        </ul>
        <p class="total-score">
          <span v-if="isKazoeYakuman">
            {{ resultDetails.totalFans }}翻
          </span>
          <span v-else-if="!isYakumanResult && resultDetails.totalFans > 0">
            {{ resultDetails.totalFans }}翻
          </span>          {{ resultDetails.scoreName ? resultDetails.scoreName : (resultDetails.score ? `${resultDetails.score}点` : '') }}
        </p>
      </div>
      <div v-if="isDrawResult" class="result-section draw-info"> <!-- 流局時のみ表示 -->
        <h2>流局</h2>
        <p>{{ message }}</p>
        <!-- 必要に応じてノーテン罰符などの情報を表示 -->
      </div>
      <div class="result-section score-changes"> <!-- 点数変動は常に表示 -->
        <h3>点数変動</h3>
        <div v-for="player in gameStore.players" :key="player.id" class="player-score-change">
          <span>{{ player.name }}: {{ (gameStore.getPlayerById(player.id)?.score ?? 0) + (resultDetails.pointChanges[player.id] ?? 0) }}点 </span>
          <span :class="getPointChangeClass(resultDetails.pointChanges[player.id])">
            ({{ formatPointChange(resultDetails.pointChanges[player.id]) }})
          </span>
        </div>
      </div>

      <button @click="proceedToNext">次へ</button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { defineProps, defineEmits, onMounted, onBeforeUnmount } from 'vue';
import { useGameStore } from '@/stores/gameStore';
import { getTileImageUrl, tileToString } from '@/utils/tileUtils';
import { computed } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  message: { // 従来のメッセージは残しつつ、詳細情報を優先
    type: String,
    default: '結果はありません。',
  },
  resultDetails: { // gameStore.agariResultDetails を想定
    type: Object,
    required: true,
    default: () => ({ pointChanges: {} }) // default を設定
  },
});

const emit = defineEmits(['close', 'proceed']);

const gameStore = useGameStore();

function closePopup() {
  emit('close');
}

function proceedToNext() {
  emit('proceed');
}

const isDrawResult = computed(() => {
  return props.resultDetails?.isDraw;
});
const resultTitle = computed(() => {
  // 1. チョンボの場合
  if (props.resultDetails.isChombo && props.resultDetails.chomboPlayerId) {
    const chomboPlayer = gameStore.getPlayerById(props.resultDetails.chomboPlayerId);
    if (chomboPlayer) return `${chomboPlayer.name} のチョンボ`;
  }

  // 2. 流局の場合
  if (isDrawResult.value) return '流局';

  // 3. 和了の場合
  const winnerId = Object.keys(props.resultDetails.pointChanges || {}).find(
    playerId => (props.resultDetails.pointChanges[playerId] || 0) > 0
  );
  if (winnerId) {
    const winner = gameStore.getPlayerById(winnerId);
    if (winner) return `${winner.name} の和了`;
  }

  // 4. 点数移動がない和了の場合 (0点和了など)
  const match = props.message.match(/(.+?) の和了/);
  if (match && match[1]) return `${match[1]} の和了`;

  // 5. 上記で見つからない場合のフォールバック
  return '和了結果';
});

const isRiichiAgari = computed(() => {
  const winnerId = Object.keys(props.resultDetails.pointChanges || {}).find(playerId => props.resultDetails.pointChanges[playerId] > 0);
  if (!winnerId) return false;
  const winner = gameStore.getPlayerById(winnerId);
  return winner?.isRiichi || winner?.isDoubleRiichi;
});

const winnerIconSrc = computed(() => {
  if (isDrawResult.value) return null;

  let targetPlayerId = null;
  if (props.resultDetails.isChombo && props.resultDetails.chomboPlayerId) {
    targetPlayerId = props.resultDetails.chomboPlayerId;
  } else {
    targetPlayerId = Object.keys(props.resultDetails.pointChanges || {}).find(playerId => props.resultDetails.pointChanges[playerId] > 0);
  }

  if (!targetPlayerId) return null;

  // player1 (あなた) の場合は hito_icon_1.png を表示
  if (targetPlayerId === 'player1') return '/assets/images/info/hito_icon_1.png'; // あなた
  if (targetPlayerId === 'player2') return '/assets/images/info/cat_icon_3.png'; // くろ
  if (targetPlayerId === 'player3') return '/assets/images/info/cat_icon_2.png'; // たま
  if (targetPlayerId === 'player4') return '/assets/images/info/cat_icon_1.png'; // とら

  return null;
});

const isYakumanResult = computed(() => {
  return props.resultDetails.scoreName && props.resultDetails.scoreName.includes('役満');
});

const isKazoeYakuman = computed(() => {
  return props.resultDetails.scoreName === '数え役満';
});

const originalHandWithoutAgariTile = computed(() => {
  if (!props.resultDetails.winningHand || !props.resultDetails.agariTile) {
    return props.resultDetails.winningHand || [];
  }
  const agariTileId = props.resultDetails.agariTile.id;
  let foundAgariTile = false;
  return props.resultDetails.winningHand.filter(tile => {
    if (tile.id === agariTileId && !foundAgariTile) {
      foundAgariTile = true;
      return false; // 和了牌を除外
    }
    return true;
  });
});


const roundWindDisplay = computed(() => {
  if (props.resultDetails.roundWind === 'east') return '東';
  if (props.resultDetails.roundWind === 'south') return '南';
  // 他の風も必要なら追加
  return '';
});

function formatPointChange(change) {
  if (change == null) return '';
  return change > 0 ? `+${change}` : `${change}`;
}

function getPointChangeClass(change) {
  if (change == null) return '';
  return change > 0 ? 'point-increase' : (change < 0 ? 'point-decrease' : '');
}

function getMeldTileClass(meld, tileIndex) {
  if (!meld.takenTileRelativePosition) return '';
  
  // ポンの場合
  if (meld.type === 'pon') {
    if (meld.takenTileRelativePosition === 'left' && tileIndex === 0) return 'sideways';
    if (meld.takenTileRelativePosition === 'middle' && tileIndex === 1) return 'sideways';
    if (meld.takenTileRelativePosition === 'right' && tileIndex === 2) return 'sideways';
  }
  // 明槓の場合
  else if (meld.type === 'minkan') {
    if (meld.takenTileRelativePosition === 'left' && tileIndex === 0) return 'sideways';
    if (meld.takenTileRelativePosition === 'middle' && tileIndex === 1) return 'sideways';
    if (meld.takenTileRelativePosition === 'right' && tileIndex === 2) return 'sideways';
  }
  // 加槓の場合
  else if (meld.type === 'kakan') {
    // 加槓は元のポン牌の向きを維持するので、ポンと同じロジック
    if (meld.takenTileRelativePosition === 'left' && tileIndex === 0) return 'sideways';
    if (meld.takenTileRelativePosition === 'middle' && tileIndex === 1) return 'sideways';
    if (meld.takenTileRelativePosition === 'right' && tileIndex === 2) return 'sideways';
  }
  // 暗槓は常に縦向きなので、ここでは何も返さない
  else if (meld.type === 'ankan') {
    if (tileIndex === 1 || tileIndex === 2) return 'hidden-tile'; // 真ん中の2枚を裏向きに
  }
  return '';
}
</script>

<style scoped>
/* RulePopup.vue と同様のスタイルを使用できます */
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.popup-content {
  background-color: white;
  padding: 25px;
  border-radius: 8px;
  min-width: 300px; /* ポップアップの最小幅を広げる */
  max-width: 80%;
  text-align: center;
  transform: scale(0.75); /* ポップアップ全体を縮小して画面に収める */
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

/* Transition styles */
.popup-enter-active, .popup-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.popup-enter-from, .popup-leave-to {
  opacity: 0;
  transform: scale(0.7);
}
.winner-title-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.popup-content h2 { margin-top: 0; color: #333; }
.popup-content h3 { margin-top: 15px; margin-bottom: 8px; color: #444; border-bottom: 1px solid #eee; padding-bottom: 5px;}
.result-section { margin-bottom: 15px; }
.round-info .round-main-info { margin: 5px 0; font-size: 2em; font-weight: bold; }
.dora-display {
  display: flex;
  justify-content: flex-end; /* ドラ表示内の要素は右寄せ */
  align-items: center; /* 垂直中央揃え */
  margin: 3px auto; /* 上下マージン3px、左右マージンautoでブロック自体を中央寄せ */
  width: fit-content; /* 内容に応じた幅にする */
}
.dora-label {
  margin-right: 8px; /* ラベルと牌の間のスペース */
  min-width: 50px; /* ラベル部分の最小幅を確保して揃える */
  text-align: right;
}
.dora-tiles {
  display: flex; /* 牌を横に並べる */
}
.dora-display img.tile-image-small { width: 24px; height: auto; vertical-align: middle; margin-left: 0; margin-right: 0; /* 牌同士の間隔をなくす */ }
.hand-display { display: flex; justify-content: center; gap: 0px; margin-bottom: 10px; }
.hand-display .tile-image-medium img { width: 35px; height: auto; border-radius: 3px; }
.agari-tile-display { margin-left: 10px; /* 和了牌の左に間隔を空ける */}
.meld-display {
  display: flex;
  margin-left: 10px; /* 鳴き牌の塊の左に間隔を空ける */
}

.sideways {
  transform: rotate(90deg);
  transform-origin: left center; /* 回転の中心を牌の左端中央に設定 */
  margin: 0 6px 0 0; /* 左寄せになるようにマージンを調整 */
  margin-left: 4px;
  margin-top: -32px;
}

.hidden-tile img {
  content: url('/public/assets/images/tiles/ura.png'); /* 裏向きの牌の画像 */
}

.yaku-info ul { list-style: none; padding: 0; margin: 0 0 10px 0; }
.yaku-info li { margin-bottom: 3px; }
.total-score { font-weight: bold; font-size: 1.5em;  color: red;}
.score-changes .player-score-change {
  display: flex; /* Flexbox を使用して内部要素を配置 */
  justify-content: space-between; /* 名前と点数変動を両端に配置 */
  margin: 3px auto; /* 上下マージン3px、左右マージンautoでブロック自体を中央寄せ */
  width: 230px; /* 固定幅を設定して中央揃えを安定させる (値は調整可能) */
  /* width: fit-content; から変更 */
}
.point-increase { color: green; }
.point-decrease { color: red; }

.winner-icon {
  width: 55px;
  height: 55px;
  margin-bottom: 15px;
}

.popup-content button {
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
}
.popup-content button:hover {
  background-color: #45a049;
}
</style>
