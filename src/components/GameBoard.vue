<template>
    <div class="game-board">
      <div class="player-area top-player">
        <!-- プレイヤー2 (対面) の手牌、捨て牌、副露 -->
        <p>対面のプレイヤーエリア</p>
      </div>
      <div class="middle-row">
        <div class="player-area left-player">
          <!-- プレイヤー3 (左側) の手牌、捨て牌、副露 -->
          <p>左側のプレイヤーエリア</p>
        </div>
        <div class="center-table">
          <!-- 壁牌、ドラ、点数など -->
          <p>中央テーブル (壁牌、ドラ、点数)</p>
        </div>
        <div class="player-area right-player">
          <!-- プレイヤー1 (右側) の手牌、捨て牌、副露 -->
          <p>右側のプレイヤーエリア</p>
        </div>
      </div>
      <div class="player-area bottom-player">
        <!-- プレイヤー0 (自分) の手牌、捨て牌、副露、操作パネル -->
        <PlayerHand :hand-tiles="myHand" :is-my-hand="true" @tile-selected="handleTileSelection" />
        <!-- 将来的にはここに ControlPanel.vue なども配置 -->
      </div>
    </div>
  </template>
  
  <script setup>
  // import { ref, computed } from 'vue';
  // 将来的なロジックのためのプレースホルダー (例: ゲーム状態の取得)
  import { ref } from 'vue';
import PlayerHand from './PlayerHand.vue';

// 仮の手牌データ (後でストアなどから取得するように変更します)
const myHand = ref([
  { suit: 'm', rank: 1, id: 'm1' }, { suit: 'm', rank: 2, id: 'm2' }, { suit: 'z', rank: 7, id: 'z7' },
  { suit: 'p', rank: 4, id: 'p4' }, { suit: 's', rank: 5, id: 'p5' }
]);

function handleTileSelection(tile) {
  console.log('Selected tile:', tile);
  // ここで選択された牌に対する処理（例：打牌候補にするなど）を実装します
}
  </script>
  
  <style scoped>
  .game-board {
    display: flex;
    flex-direction: column;
    width: 800px; /* 例: 幅 */
    height: 700px; /* 例: 高さ */
    border: 2px solid #333;
    margin: 20px auto;
    padding: 10px;
    background-color: #f0f0f0; /* ボードの薄い灰色の背景 */
  }
  
  .middle-row {
    display: flex;
    justify-content: space-between;
    flex-grow: 1;
    margin: 10px 0;
  }
  
  .player-area {
    border: 1px dashed #666;
    padding: 10px;
    min-height: 100px; /* 視認性のための最小の高さ */
  }
  
  .center-table {
    border: 1px solid #4CAF50; /* 区別のための緑色の境界線 */
    padding: 10px;
    flex-grow: 1;
    margin: 0 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  /*.top-player, .bottom-player {}*/
    /* 必要に応じて特定のスタイル */
  
  .left-player, .right-player {
    width: 150px; /* 例: サイドプレイヤーの幅 */
  }
  </style>