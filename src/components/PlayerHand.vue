<template>
    <div class="player-hand">
      <div
        v-for="(tile, index) in handTiles"
        :key="index"
        class="tile"
        @click="selectTile(tile)"
      >
        <!-- ここでは仮の牌画像パスを使用します。後で動的に変更します。 -->
        <img :src="getTileImageUrl(tile)" :alt="tileToString(tile)" />
      </div>
    </div>
  </template>
  
  <script setup>
  import { defineProps, defineEmits } from 'vue';
  
  const props = defineProps({
    handTiles: { // 例: [{ suit: 'm', rank: 1 }, { suit: 'p', rank: 2 }, ...]
      type: Array,
      default: () => [] // 初期値は空の配列
    },
    isMyHand: { // 自分の手牌かどうかを区別するため
      type: Boolean,
      default: false
    }
  });
  
  const emit = defineEmits(['tile-selected']);
  
  function getTileImageUrl(tile) {
  // isRevealed プロパティは、他家の手牌で公開されている牌（例: 副露牌）や、
  // ゲーム終了時に公開された手牌などを扱うために使用できます。
  // ここでは、自分の手牌でない場合は、isRevealed が true でない限り裏面を表示します。
    if (!props.isMyHand && !tile.isRevealed) {
        return `/assets/images/tiles/ura.png`; // 裏面画像のパス
    }
  // 牌のsuit（種類）とrank（数字/種類）に基づいて画像ファイル名を決定します。
    if (tile && tile.suit && tile.rank) {
        return `/assets/images/tiles/${tile.suit}${tile.rank}.png`;
    }
  // 不正な牌データの場合はデフォルト画像またはエラー処理
    return `/assets/images/tiles/ura.png`; // またはエラーを示す画像
  }
  
  function tileToString(tile) {
    if (tile && tile.suit && tile.rank){
        return `${tile.suit}${tile.rank}`;
    }
  }
  
  function selectTile(tile) {
    if (props.isMyHand) {
      emit('tile-selected', tile);
    }
  }
  </script>
  
  <style scoped>
  .player-hand {
    display: flex;
    gap: 2px; /* 牌同士の間隔 */
    padding: 5px;
    background-color: #e0e0e0; /* 手牌エリアの背景色（仮） */
    border-radius: 4px;
    min-height: 70px; /* 牌がない場合でも高さを確保 */
  }
  
  .tile {
    width: 40px; /* 牌の幅（仮） */
    height: 60px; /* 牌の高さ（仮） */
    border: 1px solid #999;
    background-color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    box-shadow: 1px 1px 3px rgba(0,0,0,0.2);
  }
  
  .tile img {
    max-width: 90%;
    max-height: 90%;
    object-fit: contain;
  }
  </style>