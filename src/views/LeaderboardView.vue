
<template>
  <div class="leaderboard-view-container" :style="{ height: viewportHeight }">
    <div class="leaderboard-screen" :style="scalerStyle">
      <div class="top-controls">
        <button @click="goBack" class="back-button">
          <img src="/assets/images/button/buckToTitle.png" :alt="$t('shrineView.backToTitle')">
        </button>
      </div>

      <h1><span v-html="$t('leaderboardView.title')"></span></h1>
      
      <div v-if="isLoading" class="loading-message">Loading rankings...</div>
      <div v-if="error" class="error-message">{{ error }}</div>

      <div v-if="!isLoading && !error" class="ranking-table-container">
        <p class="description" v-html="$t('leaderboardView.description')"></p>
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
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useViewportHeight } from '@/composables/useViewportHeight';

const router = useRouter();
const { t } = useI18n();
const { viewportHeight } = useViewportHeight();

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
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScaleFactor);
});

function goBack() {
  router.push('/');
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;700&display=swap');

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

.top-controls {
  position: absolute;
  top: 10px;
  right: 15px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  z-index: 10;
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
  margin-bottom: -5px;
  font-size: 1.5em;
}

.description {
  font-size: 0.8em;
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
</style>
