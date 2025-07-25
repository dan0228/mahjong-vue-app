<template>
    <div :class="['player-hand-container', `position-${position}`, { 'my-turn-active': isMyHand && canDiscard }]">
      <!-- プレイヤー情報は PlayerArea に移動済みと仮定 -->
      <div
        class="hand-tiles-area player-hand"
      >
        <div
          v-for="tile in playerDisplayHand"
          :key="tile.id"
          :class="getTileClasses(tile, false)"
          @click="selectTile(tile, false)"
        >
          <img :src="getTileImageUrl(isMyHand ? tile : null)" :alt="isMyHand ? tileToString(tile) : '裏向きの牌'" />
        </div>
      </div>
      <div v-if="drawnTileDisplay" class="drawn-tile-area player-hand">
        <div
          :class="getTileClasses(drawnTileDisplay, true)"
          @click="selectTile(drawnTileDisplay, true)"
        >
          <img :src="getTileImageUrl(isMyHand ? drawnTileDisplay : null)" :alt="isMyHand ? tileToString(drawnTileDisplay) : '裏向きの牌'" />
        </div>
      </div>
    </div>
</template>

<script setup>
  import { defineProps, defineEmits, computed } from 'vue';
  import { useGameStore } from '@/stores/gameStore'; // gameStore をインポート
  import { getTileImageUrl, tileToString } from '@/utils/tileUtils'; // 共通ユーティリティをインポート
  const props = defineProps({
    player: {
      type: Object,
      required: true
    },
    isMyHand: {
      type: Boolean,
      default: false
    },
    drawnTileDisplay: {
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
  });

  const emit = defineEmits(['tile-selected']);
  const gameStore = useGameStore(); // gameStore を使用

  // player プロパティから手牌を取得する算出プロパティ
  const playerDisplayHand = computed(() => {
    return props.player?.hand || [];
  });

  function canSelectTile(tile, isFromDrawnTile) {
    if (!props.isMyHand || !props.canDiscard || !tile) return false;

    // リーチ宣言直後の打牌選択
    if (gameStore.gamePhase === 'awaitingRiichiDiscard') {
      return gameStore.riichiDiscardOptions.includes(tile.id);
    }
    // リーチ中の通常のツモ
    if (props.player.isRiichi || props.player.isDoubleRiichi) {
      // リーチ後はツモった牌しか捨てられない
      return isFromDrawnTile;
    }

    // 通常の打牌時は常に選択可能
    return true;
  }

  function selectTile(tile, isFromDrawnTile) {
    if (canSelectTile(tile, isFromDrawnTile)) { // canSelectTile で選択可否を判定
      emit('tile-selected', { tile, isFromDrawnTile });
    }
  }

    // 牌のCSSクラスを動的に生成するヘルパー関数
  function getTileClasses(tile, isDrawnTile) {
    const isSelectable = canSelectTile(tile, isDrawnTile);
    const isRiichiPhase = gameStore.gamePhase === 'awaitingRiichiDiscard';

    return [
      'tile',
      {
        'my-tile': props.isMyHand,
        'drawn-tile': isDrawnTile,
        'selectable': isSelectable,
        // 自分の手番で、リーチ中で、かつ選択できない牌を無効化する
        'disabled': props.canDiscard && isRiichiPhase && !isSelectable,
      }
    ];
  }
</script>

<style scoped>
  .player-hand-container {
    display: flex;
    position: relative; /* ツモ牌の絶対配置の基準 */
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
    position: absolute; /* 手牌の位置に影響を与えないように絶対配置 */
  }
  .position-top .drawn-tile-area {
    right: 100%; /* 手牌エリアの左側に配置 */
    top: 0;
    margin-right: 7px; /* 手牌との間に右マージンを設定 */
  }
  .position-bottom .drawn-tile-area {
    left: 100%; /* 手牌エリアの右側に配置 */
    top: 0;
    margin-left: 10px; /* 自家は手牌の右にツモ牌 */
  }
  .position-left .drawn-tile-area {
    top: 100%; /* 手牌エリアの下に配置 */
    left: 0;
    margin-top: 7px; /* 手牌エリアの下にツモ牌エリアを配置するためのマージン */
  }
  .position-right .drawn-tile-area {
    bottom: 100%; /* 手牌エリアの上に配置 */
    left: 0;
    margin-bottom: 7px; /* 手牌エリアとの間に下マージンを設定 (column-reverseのため) */
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
    width: 24px;  /* imgのwidthに合わせる */
    height: 35px; /* imgのheightに合わせる */
  }
  /* 左右プレイヤーの牌サイズ (90度回転するため幅と高さが逆転) */
  .player-hand-container.position-left .tile,
  .player-hand-container.position-right .tile {
    width: 35px;  /* 回転後の表示幅 (imgのheightに合わせる) */
    height: 24px; /* 回転後の表示高さ (imgのwidthに合わせる) */
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
    width: 24px;  /* 牌の回転前の幅を指定 (小さく) */
    height: 35px; /* 牌の回転前の高さを指定 (小さく) */
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
