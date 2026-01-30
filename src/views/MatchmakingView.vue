<template>
  <div class="matchmaking-container">
    <router-link to="/" class="back-to-title-btn">
      {{ $t('shrineView.backToTitle') }}
    </router-link>
    
    <div class="matchmaking-content">
      <h1 class="status-text">{{ $t('matchmaking.status.searching') }}</h1>
      <!-- The v-for is now on the player-slot itself -->
      <div
        v-for="player in waitingPlayers"
        :key="player.id"
        class="player-slot"
        :style="getPlayerStyle(player)"
      >
        <img :src="player.avatarUrl" alt="Player Avatar" class="player-avatar" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// ダミーデータにtop, left, sizeプロパティを追加
const waitingPlayers = ref([
  { id: 1, avatarUrl: '/assets/images/info/cat_icon_1.png', top: '85%', left: '25%', size: '70px' },
  { id: 2, avatarUrl: '/assets/images/info/cat_icon_2.png', top: '85%', left: '70%', size: '70px' },
  { id: 3, avatarUrl: '/assets/images/info/cat_icon_3.png', top: '75%', left: '-10%', size: '70px' },
  { id: 4, avatarUrl: '/assets/images/info/hito_icon_1.png', top: '75%', left: '100%', size: '70px' },
]);

// プレイヤー毎のスタイルを動的に生成する関数
const getPlayerStyle = (player) => ({
  position: 'absolute',
  top: player.top,
  left: player.left,
  width: player.size,
  height: player.size,
});

</script>

<style scoped>
.matchmaking-container {
  width: 100vw;
  height: 100vh;
  background-image: url('/assets/images/back/matching.png');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Yuji Syuku', serif;
}

.back-to-title-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 20; /* コンテンツより手前に表示 */
  
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 8px 15px;
  border-radius: 5px;
  text-decoration: none;
  font-family: 'Yuji Syuku', serif;
  transition: background-color 0.3s;
}

.back-to-title-btn:hover {
  background-color: rgba(0, 0, 0, 0.7);
}

.matchmaking-content {
  /* position: relative を追加して、中の絶対配置の基準点にする */
  position: relative;
  width: 80vw;
  height: 80vh;
  max-width: 400px;
  max-height: 600px;
  
  padding: 20px;
  border-radius: 10px;
}

.status-text {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  font-size: 1.5em;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
  width: 100%;
  text-align: center;
}

/* .players-container は不要になったので削除 */

.player-slot {
  /* スタイルはscriptで動的に設定されるが、共通のスタイルはここに記述可能 */
  transition: all 0.3s ease; /* 位置やサイズ変更時にアニメーション */
}

.player-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%; /* アイコンを丸くする */
  border: 1px solid rgb(41, 2, 2);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
  object-fit: cover; /* 画像のアスペクト比を保ちつつ、コンテナにフィットさせる */
}
</style>
