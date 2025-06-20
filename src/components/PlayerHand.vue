<template>
    <div :class="['player-hand-container', `position-${position}`, { 'my-turn-active': isMyHand && canDiscard }]">
      <!-- プレイヤー情報は PlayerArea に移動済みと仮定 -->
      <div
        class="hand-tiles-area player-hand"
      >
        <div
          v-for="tile in playerDisplayHand"
          :key="tile.id"
          :class="['tile', { 'my-tile': isMyHand, 'selectable': canSelectTile(tile, false) && isMyHand && canDiscard, 'disabled': !canSelectTile(tile, false) && isMyHand && gameStore.gamePhase === 'awaitingRiichiDiscard' }]"
          @click="selectTile(tile, false)"
        >
          <img :src="getTileImageUrl(tile)" :alt="tileToString(tile)" />
        </div>
      </div>
      <div v-if="isMyHand && drawnTileDisplay" class="drawn-tile-area player-hand">
        <div
          :class="['tile', 'my-tile', 'drawn-tile', { 'selectable': canSelectTile(drawnTileDisplay, true) && canDiscard, 'disabled': !canSelectTile(drawnTileDisplay, true) && gameStore.gamePhase === 'awaitingRiichiDiscard' }]"
          @click="selectTile(drawnTileDisplay, true)"
        >
          <img :src="getTileImageUrl(drawnTileDisplay)" :alt="tileToString(drawnTileDisplay)" />
        </div>
      </div>
    </div>
</template>

<script setup>
  import { defineProps, defineEmits, computed } from 'vue';
  import { useGameStore } from '@/stores/gameStore'; // gameStore をインポート
  import { getTileImageUrl, tileToString } from '@/utils/tileUtils'; // 共通ユーティリティをインポート
  const props = defineProps({
    player: { // handTiles から player オブジェクト全体を受け取るように変更
      type: Object,
      default: () => null
    },
    isMyHand: {
      type: Boolean,
      default: false
    },
    // gameStoreから渡されるツモ牌 (自分の手番で、かつツモった後のみ表示)
    drawnTileDisplay: { // 名前を drawnTileDisplay に変更して、ストアの drawnTile と区別
      type: Object,
      default: null
    },
    // 打牌可能な状態か (自分のターンで、ツモ後など)
    canDiscard: {
      type: Boolean,
      default: false
    },
    position: {
      type: String,
      default: 'bottom'
    }
    // PlayerArea から渡される
    // PlayerHand 自身では使用しない場合は削除するか、レイアウト調整に使用する
    // position: { type: String, default: 'bottom' } // 未使用なら削除
  });

  const emit = defineEmits(['tile-selected']);
  const gameStore = useGameStore(); // gameStore を使用

  // player プロパティから手牌を取得する算出プロパティ
  const playerDisplayHand = computed(() => {
    return props.player ? props.player.hand : [];
  });

  function canSelectTile(tile, isFromDrawnTile) {
    if (!props.isMyHand || !props.canDiscard || !tile) return false;

    if (gameStore.gamePhase === 'awaitingRiichiDiscard') {
      return gameStore.riichiDiscardOptions.includes(tile.id);
    }
    // 通常の打牌時は常に選択可能 (canDiscard で制御されている前提)
    return true;
  }

  function selectTile(tile, isFromDrawnTile) {
    if (canSelectTile(tile, isFromDrawnTile)) { // canSelectTile で選択可否を判定
      emit('tile-selected', { tile, isFromDrawnTile });
    }
  }
</script>

<style scoped>
  .player-hand-container {
    display: flex;
    align-items: flex-start; /* 手牌とツモ牌の上端を揃える */
  }

  /* プレイヤーの位置に応じた手牌の向き調整 */
  .player-hand-container.position-bottom,
  .player-hand-container.position-top {
    align-items: flex-start; /* 手牌とツモ牌の上端を揃える */
  }
  .player-hand-container.position-bottom { flex-direction: row; }
  .player-hand-container.position-top {
    flex-direction: row-reverse; /* 対面はツモ牌が手牌の左(画面上)に来るように逆順 */
  }
  .player-hand-container.position-left {
    flex-direction: column; /* 左プレイヤーは手牌エリアとツモ牌エリアを縦に */
    width: fit-content;
    padding: 0;
    align-items: center;
  }
  .player-hand-container.position-right {
    flex-direction: column-reverse; /* 右プレイヤーはツモ牌が手牌の上(画面上)に来るように逆順 */
    width: fit-content; /* コンテナの幅を内容に合わせる */
    padding: 0; /* 左右プレイヤーのコンテナのpaddingを0に */
    align-items: center;
  }

  /* ホバー時の共通スタイル */
  .tile.my-tile.selectable:hover {
    cursor: pointer; /* selectable な牌にホバーしたらカーソル変更 */
  }

  /* 各ポジションごとのホバー時の動き */
  .player-hand-container.position-bottom .tile.my-tile.selectable:hover {
    transform: translateY(-5px); /* 上に動く */
  }
  .player-hand-container.position-right .tile.my-tile.selectable:hover {
    transform: translateX(-5px); /* 画面から見て左に動く */
  }
  .player-hand-container.position-top .tile.my-tile.selectable:hover {
    transform: translateY(5px); /* 画面から見て下に動く */
  }
  .player-hand-container.position-left .tile.my-tile.selectable:hover {
    transform: translateX(5px); /* 画面から見て右に動く */
  }

  .player-hand {
    display: flex;
    gap: 0px; /* 牌同士の間隔 */
    padding: 0; /* 牌自体の間隔はgapで制御するので、paddingは0に */
    min-height: 62px; /* 牌の高さ + paddingなど */
  }

  /* 左右プレイヤーの手牌は縦に並べる */
  .position-left .player-hand,
  .position-right .player-hand {
    flex-direction: column;
    min-height: auto;
  }

  .drawn-tile-area {
    display: flex; /* 内部の.tileを正しく配置するため */
  }
  .position-top .drawn-tile-area {
    margin-left: 0; /* 左側に配置されるので左マージンは不要 */
    margin-right: 15px; /* 手牌との間に右マージンを設定 */
  }
  .position-bottom .drawn-tile-area {
    margin-left: 15px; /* 自家は手牌の右にツモ牌 */
  }
  .position-left .drawn-tile-area {
    margin-left: 0; /* 縦並びなので左マージンは不要 */
    margin-top: 15px; /* 手牌エリアの下にツモ牌エリアを配置するためのマージン */
  }
  .position-right .drawn-tile-area {
    margin-left: 0; /* 縦並びなので左マージンは不要 */
    margin-bottom: 15px; /* 手牌エリアとの間に下マージンを設定 (column-reverseのため) */
  }

  .tile {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative; /* ラベル表示のため */
    transition: transform 0.05s ease-out; /* ホバー時の動きを滑らかに */
  }

    /* 自家の牌サイズ */
  .player-hand-container.position-bottom .tile{
    width: 50px;  /* 牌の幅 */
    height: 70px; /* 牌の高さ (実際の画像アスペクト比に合わせて調整) */
  }
  /* 対面の牌サイズ */
  .player-hand-container.position-top .tile {
    width: 30px;  /* imgのwidthに合わせる */
    height: 42px; /* imgのheightに合わせる */
  }
  /* 左右プレイヤーの牌サイズ (90度回転するため幅と高さが逆転) */
  .player-hand-container.position-left .tile,
  .player-hand-container.position-right .tile {
    width: 42px;  /* 回転後の表示幅 (imgのheightに合わせる) */
    height: 30px; /* 回転後の表示高さ (imgのwidthに合わせる) */
  }

  /* 牌の画像の向き */
  .player-hand-container.position-top .tile img {
    transform: rotate(180deg);
  }
  .player-hand-container.position-left .tile img {
    transform: rotate(90deg);
  }
  .player-hand-container.position-right .tile img {
    transform: rotate(-90deg);
  }

  .drawn-tile-label {
    position: absolute;
    bottom: -15px; /* 牌の下に表示 */
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.7em;
    color: #333;
  }
  .position-left .drawn-tile-label,
  .position-right .drawn-tile-label {
    bottom: auto;
    top: 50%;
    left: -20px; /* 牌の左側に表示 */
    transform: translateY(-50%) rotate(-90deg);
  }
  .position-right .drawn-tile-label {
    left: auto; right: -20px; transform: translateY(-50%) rotate(90deg);
  }

  .tile img {
    object-fit: contain; /* アスペクト比は維持する */
    display: block; /* 画像下の余分なスペースを取り除く場合がある */
  }

    /* 自家の牌画像サイズ */
  .player-hand-container.position-bottom .tile img {
    width: 50px;
    height: 70px;
  }
  /* 左右と対面の牌画像サイズ */
  .player-hand-container.position-top .tile img,
  .player-hand-container.position-left .tile img,
  .player-hand-container.position-right .tile img {
    width: 30px;  /* 牌の回転前の幅を指定 (小さく) */
    height: 42px; /* 牌の回転前の高さを指定 (小さく) */
  }

  .tile.my-tile:not(.selectable) { /* isMyHand は true だが canDiscard が false の場合 */
    cursor: default; /* クリックできないことを示す */
  }

  .tile:not(.my-tile) { /* isMyHand が false の場合 (他家の手牌) */
    /* 裏向き表示などのスタイル */
    cursor: default;
  }
  .tile.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
