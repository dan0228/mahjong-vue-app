<template>
  <div class="center-table-info">
    <div v-if="centerImageSrc" class="center-image-container">
      <img :src="centerImageSrc" :alt="centerImageAltText" class="center-info-image" />
      <img v-if="riichiStickBaseImageSrc" :src="riichiStickBaseImageSrc" alt="供託棒ベース" class="riichi-stick-base-image" />
      <div class="riichi-stick-count-images">
        <img v-if="riichiStickCountImage1Src" :src="riichiStickCountImage1Src" alt="供託本数1桁目" class="riichi-stick-count-digit" />
        <img v-if="riichiStickCountImage2Src" :src="riichiStickCountImage2Src" alt="供託本数2桁目" class="riichi-stick-count-digit" />
      </div>
      <div class="remaining-tiles-count-images">
        <img v-if="remainingTilesImage1Src" :src="remainingTilesImage1Src" alt="残り牌数1桁目" class="remaining-tiles-count-digit" />
        <img v-if="remainingTilesImage2Src" :src="remainingTilesImage2Src" alt="残り牌数2桁目" class="remaining-tiles-count-digit" />
        <img v-if="remainingTilesImage3Src" :src="remainingTilesImage3Src" alt="残り牌数3桁目" class="remaining-tiles-count-digit" />
      </div>
      <!-- 自家の点数表示を画像コンテナ内に移動 -->
      <div v-if="orderedPlayers[0]" class="player-score-image-container bottom-player-score">
        <img v-if="bottomPlayerScoreInfo.sign" :src="bottomPlayerScoreInfo.sign" alt="符号" class="score-sign-image" />
        <img v-for="(src, index) in bottomPlayerScoreInfo.digits" :key="`digit-${index}-${src}`" :src="src" :alt="`数字${index}`" class="score-digit-image" />
      </div>
      <!-- 上家(画面左)の点数表示 -->
      <div v-if="orderedPlayers[3]" class="player-score-image-container side-player-score left-player-score">
        <img v-if="leftPlayerScoreInfo.sign" :src="leftPlayerScoreInfo.sign" alt="符号" class="score-sign-image" />
        <img v-for="(src, index) in leftPlayerScoreInfo.digits" :key="`left-digit-${index}-${src}`" :src="src" :alt="`数字${index}`" class="score-digit-image" />
      </div>
      <!-- 対面の点数表示 -->
      <div v-if="orderedPlayers[2]" class="player-score-image-container vertical-player-score top-player-score">
        <img v-if="topPlayerScoreInfo.sign" :src="topPlayerScoreInfo.sign" alt="符号" class="score-sign-image" />
        <img v-for="(src, index) in topPlayerScoreInfo.digits" :key="`top-digit-${index}-${src}`" :src="src" :alt="`数字${index}`" class="score-digit-image" />
      </div>
      <!-- 下家(画面右)の点数表示 -->
      <div v-if="orderedPlayers[1]" class="player-score-image-container side-player-score right-player-score">
        <img v-if="rightPlayerScoreInfo.sign" :src="rightPlayerScoreInfo.sign" alt="符号" class="score-sign-image" />
        <img v-for="(src, index) in rightPlayerScoreInfo.digits" :key="`right-digit-${index}-${src}`" :src="src" :alt="`数字${index}`" class="score-digit-image" />
      </div>
      <!-- リーチ棒表示 -->
      <img v-if="orderedPlayers[0]?.isRiichi || orderedPlayers[0]?.isDoubleRiichi" src="/assets/images/tenbo/tenbou1000.png" alt="自家リーチ棒" class="riichi-stick-image bottom-riichi-stick" />
      <img v-if="orderedPlayers[3]?.isRiichi || orderedPlayers[3]?.isDoubleRiichi" src="/assets/images/tenbo/tenbou1000.png" alt="上家リーチ棒" class="riichi-stick-image left-riichi-stick" />
      <img v-if="orderedPlayers[2]?.isRiichi || orderedPlayers[2]?.isDoubleRiichi" src="/assets/images/tenbo/tenbou1000.png" alt="対面リーチ棒" class="riichi-stick-image top-riichi-stick" />
      <img v-if="orderedPlayers[1]?.isRiichi || orderedPlayers[1]?.isDoubleRiichi" src="/assets/images/tenbo/tenbou1000.png" alt="下家リーチ棒" class="riichi-stick-image right-riichi-stick" />
      <img v-if="roundIndicatorImageSrc" :src="roundIndicatorImageSrc" alt="局表示" class="round-indicator-image" />
      <!-- 王牌ドラ表示エリア -->
      <div v-if="deadWallDisplayTiles.length > 0" class="dead-wall-display-area">
        <div v-for="(tilePair, pairIndex) in deadWallDisplayTiles" :key="`deadwall-pair-${pairIndex}`" class="dead-wall-tile-pair">
          <!-- 下の牌 (奥側) -->
          <img :src="getTileImageUrl(tilePair.bottom)" :alt="tileToString(tilePair.bottom)" class="dead-wall-tile dead-wall-bottom-tile" />
          <!-- 上の牌 (手前側) -->
          <img :src="getTileImageUrl(tilePair.top)" :alt="tileToString(tilePair.top)" class="dead-wall-tile dead-wall-top-tile" />
        </div>
      </div>
    </div>
    <div v-else class="info-text-container">
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
        <template v-for="(player, index) in orderedPlayers" :key="index">
          <div v-if="player" class="player-score">
            <span class="player-name">
              {{ getPlayerDisplayLabel(player) }}:
            </span>
            <span class="score-value">{{ player.score }}</span>
            <span v-if="player.isDealer && player.id !== dealer?.id" class="dealer-indicator-small"> (親)</span>
            <span v-if="player.seatWind && player.id !== dealer?.id" class="wind-indicator-small">
              ({{ player.seatWind }})
            </span>
          </div>
        </template>
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

const centerImageSrc = computed(() => {
  if (!dealer.value || !props.orderedPlayers || props.orderedPlayers.length === 0) {
    return null;
  }
  const dealerId = dealer.value.id;
  const bottomPlayerId = props.orderedPlayers[0]?.id; // 自家 (画面下)
  const rightPlayerId = props.orderedPlayers[1]?.id;  // 下家 (画面右)
  const topPlayerId = props.orderedPlayers[2]?.id;    // 対面 (画面上)
  const leftPlayerId = props.orderedPlayers[3]?.id;   // 上家 (画面左)

  if (dealerId === bottomPlayerId) {
    return '/assets/images/info/info_bottom.png';
  } else if (dealerId === rightPlayerId) {
    return '/assets/images/info/info_right.png';
  } else if (dealerId === topPlayerId) {
    return '/assets/images/info/info_top.png';
  } else if (dealerId === leftPlayerId) {
    return '/assets/images/info/info_left.png';
  }
  return null; // 上記以外の場合は画像なし (テキスト情報を表示)
});

const centerImageAltText = computed(() => {
  if (!dealer.value || !props.orderedPlayers || props.orderedPlayers.length === 0) {
    return '中央情報';
  }
  const dealerId = dealer.value.id;
  const bottomPlayerId = props.orderedPlayers[0]?.id;
  const rightPlayerId = props.orderedPlayers[1]?.id;
  const topPlayerId = props.orderedPlayers[2]?.id;
  const leftPlayerId = props.orderedPlayers[3]?.id;

  if (dealerId === bottomPlayerId) return '自家が親';
  if (dealerId === rightPlayerId) return '下家が親'; // 画面上は右
  if (dealerId === topPlayerId) return '対面が親';
  if (dealerId === leftPlayerId) return '上家が親'; // 画面上は左
  return '親情報';
});

const roundIndicatorImageSrc = computed(() => {
  const wind = gameStore.currentRound.wind;
  const number = gameStore.currentRound.number;
  if (wind === 'east' && number >= 1 && number <= 4) {
    return `/assets/images/info/ton${number}.png`;
  }
  return null; // 東場以外や該当なしの場合は表示しない
});

// 供託棒のベース画像 (zan_1000.png) は常に表示
const riichiStickBaseImageSrc = computed(() => {
  return '/assets/images/info/zan_1000.png';
});

// 供託本数の1桁目の画像パス
const riichiStickCountImage1Src = computed(() => {
  const count = gameStore.riichiSticks;
  if (count >= 0 && count <= 9) {
    return `/assets/images/number/${count}w.png`;
  } else if (count >= 10) {
    const firstDigit = Math.floor(count / 10);
    return `/assets/images/number/${firstDigit}w.png`;
  }
  return null; // 0未満や不正な値の場合は表示しない
});

// 供託本数の2桁目の画像パス (10本以上の場合のみ)
const riichiStickCountImage2Src = computed(() => {
  const count = gameStore.riichiSticks;
  if (count >= 10) {
    const secondDigit = count % 10;
    return `/assets/images/number/${secondDigit}w.png`;
  }
  return null; // 10本未満の場合は2桁目は表示しない
});

// 残り牌数を3桁の数字文字列配列に変換 (例: 4 -> ['0', '0', '4'])
const remainingTilesDigits = computed(() => {
  const count = gameStore.remainingWallTilesCount;
  if (count < 0) return ['0', '0', '0']; // マイナスは000と表示
  const s = String(count).padStart(3, '0');
  return [s[0], s[1], s[2]];
});

// 残り牌数の各桁の画像パス
const remainingTilesImage1Src = computed(() => {
  if (!remainingTilesDigits.value) return null;
  return `/assets/images/number/${remainingTilesDigits.value[0]}ao.png`;
});
const remainingTilesImage2Src = computed(() => {
  if (!remainingTilesDigits.value) return null;
  return `/assets/images/number/${remainingTilesDigits.value[1]}ao.png`;
});
const remainingTilesImage3Src = computed(() => {
  if (!remainingTilesDigits.value) return null;
  return `/assets/images/number/${remainingTilesDigits.value[2]}ao.png`;
});

// プレイヤーのスコアを画像表示用にフォーマットする共通関数
function formatScoreForImage(player) {
  if (!player) return { sign: null, digits: [] };
  let score = player.score;
  const signImage = score < 0 ? '/assets/images/number/-.png' : null;
  if (score < 0) {
    score = Math.abs(score);
  }
  const scoreStr = String(score);
  const digitImages = [];
  for (const digitChar of scoreStr) {
    digitImages.push(`/assets/images/number/${digitChar}.png`);
  }
  return { sign: signImage, digits: digitImages.slice(-6) };
}

// 自家の点数表示用画像情報を生成
const bottomPlayerScoreInfo = computed(() => {
  return formatScoreForImage(props.orderedPlayers[0]);
});

// 上家(画面左)の点数表示用画像情報を生成
const leftPlayerScoreInfo = computed(() => {
  return formatScoreForImage(props.orderedPlayers[3]);
});

// 対面(画面上)の点数表示用画像情報を生成
const topPlayerScoreInfo = computed(() => {
  return formatScoreForImage(props.orderedPlayers[2]);
});

// 下家(画面右)の点数表示用画像情報を生成
const rightPlayerScoreInfo = computed(() => {
  return formatScoreForImage(props.orderedPlayers[1]);
});

// 王牌表示用の算出プロパティ
const deadWallDisplayTiles = computed(() => {
  const deadWall = gameStore.deadWall;
  const revealedDoraIndicators = gameStore.doraIndicators;
  const displayPairs = [];
  const numPairsToDisplay = 4; // 表示する牌のペアの数 (実質4牌分)

  for (let i = 0; i < numPairsToDisplay; i++) {
    // この位置に表示すべきドラ表示牌があるかチェック
    if (revealedDoraIndicators && i < revealedDoraIndicators.length) {
      const doraIndicator = revealedDoraIndicators[i];
      // ドラ表示牌を上の牌とし、下の牌は裏向きで表示
      displayPairs.push({ bottom: { type: 'ura' }, top: doraIndicator });
    } else {
      // 表示すべきドラがない場合は、上下ともに裏向きの牌を表示
      displayPairs.push({ bottom: { type: 'ura' }, top: { type: 'ura' } });
    }
  }
  return displayPairs;
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
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  /* 親要素が .center-table なので、そのサイズに依存する */
  width: 100%; /* 親要素いっぱいに広がる */
  height: 100%; /* 親要素いっぱいに広がる */
  position: relative; /* .center-image-container の絶対配置の基準 */
  transform: scale(0.8); /* 全体を80%に縮小 (調整可能) */
  transform-origin: center center; /* 中央を基準に縮小 */
}
.center-image-container {
  position: relative; /* 子要素の絶対配置の基準 */
  width: 180px;  /* 例: スマホでの表示幅 */
  height: 180px; /* 例: info_bottom.png のアスペクト比に合わせた高さ */
}
.info-text-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  background-color: rgba(200, 200, 200, 0.8);
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
.center-info-image {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%); /* 中央揃え */
  width: 100%; /* 親コンテナに対する幅の割合 (調整可能) */
  height: 100%;
  object-fit: contain;
  z-index: 1;
}
.round-indicator-image {
  position: absolute;
  /* 親画像 (.center-info-image) の中央を基準に配置する例 */
  /* top, left, transform で微調整 */
  top: 50%;
  left: 50%;
  transform: translate(-51%, -120%); /* まず中央に配置 */
  width: 40%; /* 適切なサイズに調整 */
  height: auto;
  z-index: 2; /* 親画像より手前に表示 */
  object-fit: contain; /* 画像のアスペクト比を保つ */
}
.riichi-stick-base-image {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-80%, -80%); /* 位置調整 */
  width: 27%; /* 適切なサイズに調整 */
  height: auto;
  z-index: 2; /* 親画像より手前に表示 (round-indicator-image と同じか、必要なら調整) */
  object-fit: contain;
}
.riichi-stick-count-images {
  position: absolute;
  display: flex; /* 数字画像を横に並べる */
  top: 50%;
  left: 50%;
  /* zan_1000.png の上に重ねるように位置を調整 */
  transform: translate(13%, -80%); /* 位置調整*/
  z-index: 3; /* 供託棒ベース画像より手前 */
}
.riichi-stick-count-digit {
  width: 14%; /* 適切なサイズに調整 (zan_1000.png の幅に対する割合など) */
  height: auto;
  object-fit: contain;
}
.remaining-tiles-count-images {
  position: absolute;
  display: flex;
  top: 50%;
  left: 50%;
  transform: translate(-12%, 50%); /* 位置調整*/
  z-index: 3; /* 他の重なり合う画像より手前になるように調整 */
}
.remaining-tiles-count-digit {
  width: 14%; /* 適切なサイズに調整 */
  height: auto;
  object-fit: contain;
  margin: 0 1px; /* 数字間のわずかなスペース */
}
.player-score-image-container {
  position: absolute; /* .center-image-container を基準に配置 */
  display: flex;
  align-items: center;
  justify-content: flex-end; /* 数字画像を右詰めに */
  height: 100%; /* 画像の高さに合わせる */
  z-index: 4; /* 他の情報画像より手前、または同等に調整 */
}
.player-score-image-container.side-player-score {
  /* 5桁+符号が入る十分な固定幅を設定 */
  width: 85px;
}
.bottom-player-score { /* 自家点数用の追加位置調整 */
  bottom: -29.5%; /* コンテナ下部からの位置 */
  right: 31%;  /* コンテナ右部からの位置 */
}
.left-player-score { /* 上家(画面左)点数用の追加位置調整 */
  top: 57%; /* 垂直方向は中央のまま */
  left: -4.5%; /* 左端からの距離を固定 */
  transform: translateY(-50%) rotate(90deg); /* 垂直中央揃えと回転 */
  justify-content: flex-start; /* 左揃え（回転後は上揃え） */
}
.top-player-score { /* 対面(画面上)点数用の追加位置調整 */
  top: -31%;
  left: 50%;
  transform: translateX(-50%) rotate(180deg);
}
.right-player-score { /* 下家(画面右)点数用の追加位置調整 */
  top: 43%; /* 垂直方向は中央のまま */
  right: -4.5%; /* 右端からの距離を固定 */
  transform: translateY(-50%) rotate(-90deg); /* 垂直中央揃えと回転 */
  justify-content: flex-start; /* 右揃え（回転後は上揃え） */
}
.score-sign-image { /* 共通スタイル */
  height: auto;
  object-fit: contain;
  margin-right: 0px; /* 符号と数字の間 */
}
.bottom-player-score .score-sign-image, .vertical-player-score .score-sign-image {
  width: 12.5px; /* 固定幅に変更 */
}
.bottom-player-score .score-digit-image,
.vertical-player-score .score-digit-image {
  width: 12.5px; /* 固定幅に変更 */
}
.side-player-score .score-digit-image {
  width: 12.5px; /* 固定幅に変更 */
}
.side-player-score .score-sign-image {
  width: 12.5px; /* 固定幅に変更 */
}
.score-digit-image { /* 共通スタイル */
  height: auto;
  object-fit: contain;
}
.riichi-stick-image {
  position: absolute;
  width: 43%; /* 適切なサイズに調整 (center-image-containerの幅に対する割合) */
  height: auto;
  object-fit: contain;
  z-index: 4; /* 点数表示と同等か、少し手前/奥に調整 */
}
.bottom-riichi-stick {
  bottom: 6.5%; /* 自家点数表示の上あたり */
  left: 50%;
  transform: translateX(-50%);
}
.left-riichi-stick {
  top: 50%;
  left: -13.5%; /* 上家点数表示の右あたり */
  transform: translateY(-50%) rotate(90deg);
}
.top-riichi-stick {
  top: 6%; /* 対面点数表示の下あたり */
  left: 50%;
  transform: translateX(-50%) rotate(180deg);
}
.right-riichi-stick {
  top: 50%;
  right: -14%; /* 下家点数表示の左あたり */
  transform: translateY(-50%) rotate(-90deg);
}

.dead-wall-display-area {
  position: absolute;
  bottom: 150%;
  left: 18%;
  transform-origin: bottom left; /* 回転の基点を左下にする */
  display: flex;
  z-index: 5; /* 他の情報より手前に表示 */
}

.dead-wall-tile-pair {
  position: relative; /* 重ねる牌の基準 */
  width: 34px;  /* 表示上の牌の幅 */
  height: 42px; /* 表示上の牌の高さ */
}

.dead-wall-tile {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: contain;
  box-sizing: border-box;
}

.dead-wall-bottom-tile {
  top: 2px; /* 少し下にずらして重ね感を出す */
  left: 2px; /* 少し右にずらして重ね感を出す */
  z-index: 1;
}
.dead-wall-top-tile {
  top: 0;
  left: 0;
  z-index: 2; /* 上の牌を手前に */
}
</style>