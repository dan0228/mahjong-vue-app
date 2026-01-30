<template>
  <div class="matchmaking-container">
    <router-link to="/" class="back-to-title-btn">
      {{ $t('shrineView.backToTitle') }}
    </router-link>
    
    <div class="content-wrapper">
      <h1 class="status-text">{{ $t('matchmaking.status.searching') }}</h1>

      <!-- プレイヤーアイコンを個別に配置 -->
      <div id="player-1" class="player-slot">
        <img src="/assets/images/info/cat_icon_1.png" alt="Player Avatar" class="player-avatar" />
      </div>
      <div id="player-2" class="player-slot">
        <img src="/assets/images/info/cat_icon_2.png" alt="Player Avatar" class="player-avatar" />
      </div>
      <div id="player-3" class="player-slot">
        <img src="/assets/images/info/cat_icon_3.png" alt="Player Avatar" class="player-avatar" />
      </div>
      <div id="player-4" class="player-slot">
        <img src="/assets/images/info/hito_icon_1.png" alt="Player Avatar" class="player-avatar" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
</script>

<style scoped>
/* じゃん猫神社画面の構造を完全に再現 */
.matchmaking-container {
  width: 100vw;
  height: 100vh;
  background-image: url('/assets/images/back/matching.png');
  background-size: cover; /* 画面全体を覆うように設定 */
  background-position: center;
  position: relative;
  overflow: hidden;
  font-family: 'Yuji Syuku', serif;
}

/* コンテンツを中央に配置するためのラッパー(オプション) */
.content-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.back-to-title-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 20;
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

.status-text {
  position: absolute;
  top: 15%;
  color: white;
  font-size: 1.8em;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
  white-space: nowrap;
  background-color: rgba(0, 0, 0, 0.4);
  padding: 10px 50px;
  border-radius: 10px;
}

.player-slot {
  position: absolute;
  transform: translate(-50%, -50%);
}

.player-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 1px solid rgb(41, 2, 2);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
  object-fit: cover;
}

/* 各プレイヤーのアイコンの位置とサイズをCSSで個別に指定 */
/* top/leftは画面全体に対するパーセンテージ指定 */
#player-1 {
  top: 80%;
  left: 30%;
  width: 70px;
  height: 70px;
}

#player-2 {
  top: 80%;
  left: 70%;
  width: 70px;
  height: 70px;
}

#player-3 {
  top: 65%;
  left: 15%;
  width: 70px;
  height: 70px;
}

#player-4 {
  top: 65%;
  left: 85%;
  width: 70px;
  height: 70px;
}
</style>
