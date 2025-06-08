<template>
  <div v-if="show" class="popup-overlay" @click.self="closePopup">
    <div class="popup-content">

      <div class="result-section round-info" style="text-align: center; margin-bottom: 15px;">
        <p class="round-main-info">{{ roundWindDisplay }}{{ resultDetails.roundNumber }}局 {{ resultDetails.honba }}本場</p>
      </div>
      <h2>{{ resultTitle }}</h2>
      <div class="result-section round-info-details"> <!-- クラス名変更の提案 -->
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
              <!-- リーチ時は実際の裏ドラを表示 -->
              <img v-for="(tile, index) in resultDetails.uraDoraIndicators" :key="'ura-revealed-'+tile.id + '-' + index" :src="getTileImageUrl(tile)" :alt="tileToString(tile)" class="tile-image-small"/>
              <!-- 裏ドラの残りを裏向きで表示 (最大4つまで) -->
              <img v-for="n in Math.max(0, 4 - (resultDetails.uraDoraIndicators?.length || 0))" :key="'ura-hidden-riichi-' + n" :src="getTileImageUrl({type: 'ura'})" alt="裏ドラ" class="tile-image-small"/>
            </template>
            <template v-else>
              <!-- リーチでない場合は全て裏向きで4つ表示 -->
              <img v-for="n in 4" :key="'ura-hidden-no-riichi-' + n" :src="getTileImageUrl({type: 'ura'})" alt="裏ドラ" class="tile-image-small"/>
            </template>
          </div>
        </div>
      </div>

      <div class="result-section winning-hand-info">
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
        </div>
      </div>

      <div class="result-section yaku-info">
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
          <span v-if="!isYakumanResult && resultDetails.totalFans > 0">{{ resultDetails.totalFans }}翻 </span>
          {{ resultDetails.scoreName ? resultDetails.scoreName : (resultDetails.score ? `${resultDetails.score}点` : '') }}
        </p>
      </div>

      <div class="result-section score-changes">
        <h3>点数変動</h3>
        <div v-for="player in gameStore.players" :key="player.id" class="player-score-change">
          <span>{{ player.name }}: {{ gameStore.getPlayerById(player.id)?.score ?? player.score }}点 </span>
          <span :class="getPointChangeClass(resultDetails.pointChanges[player.id])">
            ({{ formatPointChange(resultDetails.pointChanges[player.id]) }})
          </span>
        </div>
      </div>

      <button @click="proceedToNext">次の局へ</button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
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

function closePopup() {
  emit('close');
}

function proceedToNext() {
  emit('proceed');
}
const gameStore = useGameStore();

const resultTitle = computed(() => {
  if (!props.resultDetails || !props.resultDetails.pointChanges) return '局結果';
  const winnerId = Object.keys(props.resultDetails.pointChanges).find(
    playerId => props.resultDetails.pointChanges[playerId] > 0 && props.resultDetails.yakuList && props.resultDetails.yakuList.length > 0
  );
  const winner = winnerId ? gameStore.getPlayerById(winnerId) : null;
  return winner ? `${winner.name} の和了` : '局結果';

});

const isYakumanResult = computed(() => {
  return props.resultDetails.scoreName && props.resultDetails.scoreName.includes('役満');
});

const isRiichiAgari = computed(() => {
  // gameStore から和了プレイヤーのリーチ状態を取得する必要がある
  // ここでは resultDetails に isRiichi フラグが含まれていると仮定するか、
  // winner オブジェクトからリーチ状態を参照する
  const winnerId = Object.keys(props.resultDetails.pointChanges).find(playerId => props.resultDetails.pointChanges[playerId] > 0);
  return winnerId ? gameStore.getPlayerById(winnerId)?.isRiichi || gameStore.getPlayerById(winnerId)?.isDoubleRiichi : false;
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
  max-width: 80%;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
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
.hand-display { display: flex; justify-content: center; gap: 0px; margin-bottom: 10px; }
.hand-display .tile-image-medium img { width: 35px; height: auto; border-radius: 3px; }
.agari-tile-display { margin-left: 10px; /* 和了牌の左に間隔を空ける */}
.yaku-info ul { list-style: none; padding: 0; margin: 0 0 10px 0; }
.yaku-info li { margin-bottom: 3px; }
.total-score { font-weight: bold; font-size: 1.5em;  color: red;}
.score-changes .player-score-change {
  display: flex; /* Flexbox を使用して内部要素を配置 */
  justify-content: space-between; /* 名前と点数変動を両端に配置 */
  margin: 3px auto; /* 上下マージン3px、左右マージンautoでブロック自体を中央寄せ */
  width: 200px; /* 固定幅を設定して中央揃えを安定させる (値は調整可能) */
  /* width: fit-content; から変更 */
}
.point-increase { color: green; }
.point-decrease { color: red; }

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
