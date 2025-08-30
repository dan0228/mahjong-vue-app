
<template>
  <div class="leaderboard-view-container" :style="{ height: viewportHeight }">
    <div class="leaderboard-screen" :style="scalerStyle">
      <div class="max-consecutive-wins">
        {{ $t('titleView.maxWinStreak') }} <span class="max-wins-number">{{ gameStore.maxConsecutiveWins }}</span>
      </div>
      <div class="top-controls">
        <div class="audio-toggles">
          <label class="toggle-switch">
            <input type="checkbox" :checked="audioStore.isBgmEnabled" @change="audioStore.toggleBgm()">
            <span class="slider round"></span>
          </label>
          <span class="toggle-label">{{ $t('shrineView.bgm') }}</span>
          <label class="toggle-switch">
            <input type="checkbox" :checked="audioStore.isSeEnabled" @change="audioStore.toggleSe()">
            <span class="slider round"></span>
          </label>
          <span class="toggle-label">{{ $t('shrineView.sfx') }}</span>
        </div>
        <button @click="goBack" class="back-button">
          <img src="/assets/images/button/buckToTitle.png" :alt="$t('shrineView.backToTitle')">
        </button>
      </div>

      <h1><span v-html="$t('leaderboardView.title')"></span></h1>
      
      <div v-if="isLoading" class="loading-message">Loading rankings...</div>
      <div v-if="error" class="error-message">{{ error }}</div>

      <div v-if="!isLoading && !error" class="ranking-table-container">
        <table class="ranking-table">
          <colgroup>
            <col style="width: 12%;">
            <col style="width: 20%;">
            <col style="width: 38%;">
            <col style="width: 15%;">
            <col style="width: 15%;">
          </colgroup>
          <thead>
            <tr>
              <th>{{ $t('leaderboardView.tableHeaderNo') }}</th>
              <th colspan="2">{{ $t('leaderboardView.tableHeaderUserName') }}</th>
              <th>{{ $t('leaderboardView.tableHeaderWinStreak') }}</th>
              <th>{{ $t('leaderboardView.tableHeaderPost') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="displayLeaderboard.length === 0">
              <td colspan="5" style="text-align: center;">No rankings found.</td>
            </tr>
            <tr v-for="player in displayLeaderboard" :key="player.rank">
              <td>{{ player.rank }}</td>
              <td class="user-avatar-cell">
                <img v-if="player.profile_image_url" :src="player.profile_image_url" alt="avatar" class="user-avatar" />
                <span v-else>-</span>
              </td>
              <td class="user-name-cell">
                <div class="user-name">{{ player.name }}</div>
                <div class="user-username">{{ player.username !== '-' ? '@' + player.username : '-' }}</div>
              </td>
              <td class="streak-cell">{{ player.streak }}</td>
              <td>
                <a v-if="player.url !== '#'" :href="player.url" target="_blank" rel="noopener noreferrer">View</a>
                <span v-else>-</span>
              </td>
            </tr>
          </tbody>
        </table>
        <p class="update-notice" v-html="$t('leaderboardView.updateNotice')"></p>
        <div class="info-section">
          <h4>{{ $t('leaderboardView.aggregationMethodTitle') }}</h4>
          <p class="description" v-html="$t('leaderboardView.description')"></p>
          <p class="post-prompt" v-html="$t('leaderboardView.postPrompt')"></p>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useViewportHeight } from '@/composables/useViewportHeight';
import { useAudioStore } from '@/stores/audioStore';
import { useGameStore } from '@/stores/gameStore';

const router = useRouter();
const { t } = useI18n();
const { viewportHeight } = useViewportHeight();
const audioStore = useAudioStore();
const gameStore = useGameStore();

const leaderboard = ref([]);
const isLoading = ref(true);
const error = ref(null);

// --- Scaling Logic ---
const DESIGN_WIDTH = 360;
const DESIGN_HEIGHT = 640;
const scaleFactor = ref(1);
const scalerStyle = computed(() => ({
  transform: `translate(-50%, -50%) scale(${scaleFactor.value})`
}));

const updateScaleFactor = () => {
  const currentWidth = window.innerWidth;
  const currentHeight = window.innerHeight;
  const scaleX = currentWidth / DESIGN_WIDTH;
  const scaleY = currentHeight / DESIGN_HEIGHT;
  scaleFactor.value = Math.min(scaleX, scaleY);
};

// Computed property to ensure 5 rows are always displayed
const displayLeaderboard = computed(() => {
  const data = leaderboard.value.slice(0, 5);
  while (data.length < 5) {
    data.push({
      rank: data.length + 1,
      id: `placeholder-${data.length}`,
      name: '-',
      username: '-',
      streak: '-',
      url: '#',
      profile_image_url: ''
    });
  }
  return data;
});

// Mock data for local development
const mockData = [
  { rank: 1, id: 'user1', name: 'ねこマスター', username: 'cat_master', streak: 50, url: '#', profile_image_url: '/assets/images/info/cat_icon_1.png' },
  { rank: 2, id: 'user2', name: 'とら', username: 'tora_chan', streak: 45, url: '#', profile_image_url: '/assets/images/info/cat_icon_2.png' },
  { rank: 3, id: 'user3', name: 'たま', username: 'tama_nyan', streak: 42, url: '#', profile_image_url: '/assets/images/info/cat_icon_3.png' },
];

async function fetchLeaderboard() {
  isLoading.value = true;
  error.value = null;

  if (import.meta.env.DEV) {
    console.log("Running in local dev mode. Using mock data for leaderboard.");
    setTimeout(() => {
      leaderboard.value = mockData;
      isLoading.value = false;
    }, 1000);
  } else {
    try {
      const response = await fetch('/api/ranking');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch leaderboard.');
      }
      leaderboard.value = await response.json();
    } catch (e) {
      console.error(e);
      error.value = e.message;
    } finally {
      isLoading.value = false;
    }
  }
}

onMounted(() => {
  updateScaleFactor();
  window.addEventListener('resize', updateScaleFactor);
  fetchLeaderboard();
  gameStore.loadCatCoins(); // Load cat coins for the gameStore
  audioStore.setBgm('GB-JP-A02-2(Menu-Loop105).mp3');
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScaleFactor);
  audioStore.setBgm(null);
});

function goBack() {
  router.push('/');
}
</script>

<style scoped>
.leaderboard-view-container {
  position: relative;
  width: 100vw;
  overflow: hidden;
  background-image: url('/assets/images/back/back_out.png');
  background-repeat: repeat;
}

.leaderboard-screen {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 360px;
  height: 640px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  font-family: 'M PLUS Rounded 1c', sans-serif;
  color: #333;
  background-image: url('/assets/images/back/ranking.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  box-sizing: border-box;
  touch-action: none !important;
}

.max-consecutive-wins {
  position: absolute;
  top: 12px;
  left: 20px; /* 左端からの位置を調整 */
  font-size: 0.7em;
  color: #333;
  z-index: 10;
  background-color: rgba(255, 255, 255, 0.6); /* 背景色 */
  padding: 3px 14px; /* パディング */
  border-radius: 8px; /* 角丸 */
  white-space: nowrap; /* テキストが改行されないように */
}

.max-wins-number {
  font-weight: bold;
  color: #CC6633; /* #C63 */
}

.top-controls {
  position: absolute;
  top: 10px;
  right: 15px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  z-index: 10;
}

.audio-toggles {
  display: flex;
  flex-direction: row; /* 横並びにする */
  align-items: center;
  gap: 5px; /* 要素間の間隔 */
  font-size: 0.8em;
  color: #333;
  background-color: rgba(255, 255, 255, 0.6); /* 背景色 */
  padding: 5px 8px; /* パディング */
  border-radius: 8px; /* 角丸 */
  white-space: nowrap; /* テキストが改行されないように */
  margin-right: 10px; /* ボタンとの間隔 */
  margin-bottom: 40px;
  scale: 0.86; /* 少し小さくする */
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 24px;
  height: 14px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  -webkit-transition: .4s;
  transition: .4s;
  border-radius: 14px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 10px;
  width: 10px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  -webkit-transition: .4s;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #2196F3;
}

input:focus + .slider {
  box-shadow: 0 0 1px #2196F3;
}

input:checked + .slider:before {
  -webkit-transform: translateX(10px);
  -ms-transform: translateX(10px);
  transform: translateX(10px);
}

.toggle-label {
  vertical-align: middle;
  font-size: 0.9em; /* ラベルのフォントサイズも調整 */
}

.back-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.back-button img {
  width: 60px;
  height: auto;
}

.back-button:hover img {
  opacity: 0.8;
}

h1 {
  margin-top: 50px; /* Adjust to make space for the back button */
  margin-bottom: 5px;
  font-size: 1.65em;
}

.description {
  font-size: 0.9em;
  color: #222222;
  margin-bottom: 10px;
  margin-left: 3%;
  text-align: center;
  width: 95%;
  max-width: 280px;
}

.loading-message, .error-message {
  margin: 20px;
  font-size: 1.2em;
}

.error-message {
  color: #d32f2f;
}

.ranking-table-container {
  width: 100%;
  max-width: 260px;
  overflow-x: auto;
  flex-grow: 1; /* Allow container to take up space */
  overflow-y: auto; /* Make the table scrollable */
  margin-bottom: 20px; /* Add some space at the bottom */
}

.ranking-table {
  width: 100%;
  border-collapse: separate; /* Use separate to allow for border-radius */
  border-spacing: 0;
  background-color: #FFFDF5; /* Creamy white background */
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  table-layout: fixed;
  border-radius: 8px; /* Rounded corners for the table */
  overflow: hidden; /* Ensures inner elements respect the border-radius */
}

.ranking-table th, .ranking-table td {
  border-bottom: 1px solid #D6C4BE; /* Soft pinkish-brown border */
  padding: 2px;
  text-align: center;
  vertical-align: middle;
  font-size: 0.68em;
  word-break: break-word;
  color: #5C4B4B; /* Soft dark brown text */
}

.ranking-table td {
    border-left: 1px solid #D6C4BE;
    border-right: 1px solid #D6C4BE;
}
.ranking-table tr:last-child td {
    border-bottom: none; /* No border for the last row */
}


.ranking-table th {
  background-color: #E1C9C1; /* Dusty pink header */
  font-weight: bold;
  position: sticky;
  top: 0;
}

.ranking-table tbody tr:nth-child(even) {
  background-color: #F9F5F2; /* Lighter, warm grey for alternating rows */
}

.user-avatar-cell {
  width: 50px;
  padding-right: 0;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.user-name-cell {
  line-height: 1.2;
}
.user-name {
  font-weight: bold;
}
.user-username {
  font-size: 0.9em;
  color: #555;
}

.streak-cell {
  font-weight: bold;
  font-size: 1.1em;
  text-align: center;
}

.ranking-table a {
  color: #C65B5B; /* Soft, warm red */
  text-decoration: none;
  font-weight: bold;
}

.ranking-table a:hover {
  text-decoration: underline;
}

.update-notice {
  font-size: 0.6em;
  color: #555;
  text-align: center;
  margin-top: 0px;
}

.description {
  font-size: 0.75em;
  color: #333;
  margin-top: 2px;
  margin-left: 0%;
  text-align: center;
  width: 100%;
  max-width: 280px;
}

.info-section {
  margin-top: 10px;
  padding: 0px;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  width: 100%;
  height: 22%;
  max-width: 280px;
}

.info-section h4 {
  font-size: 0.85em;
  font-weight: bold;
  color: #333;
  margin-bottom: 2px;
  text-align: center;
}

.post-prompt {
  font-size: 0.72em;
  color: #c65b5b;
  text-align: center;
  margin-top: 2px;
  font-weight: bold;
}
</style>
