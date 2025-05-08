<template>
  <div id="app-container">
    <header>
      <h1>四牌麻雀</h1>
    </header>
    <main>
      <GameBoard />
    </main>
    <!-- 必要であればここにフッターを追加できます -->
  </div>
</template>

<script setup>
// 今のところ、特別なスクリプトは不要です。
// 将来的に、グローバルなイベントリスナーや初期化処理などを記述する可能性があります。
import GameBoard from './components/GameBoard.vue';
</script>

<style scoped>
#app-container {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 20px;
}

header h1 {
  color: #42b983; /* Vue Green */
}
</style>