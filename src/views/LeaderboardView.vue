<template>
  <div class="leaderboard-view-container" :style="{ height: viewportHeight }">
    <div class="leaderboard-screen" :style="scalerStyle">
      <div class="top-controls">
        <button @click="goBack" class="back-button">
          <img src="/assets/images/button/buckToTitle.png" :alt="$t('shrineView.backToTitle')">
        </button>
      </div>

      <h1>{{ $t('leaderboardView.title') }}</h1>
      
      <div v-if="isLoading" class="loading-message">Loading rankings...</div>
      <div v-if="error" class="error-message">{{ error }}</div>

      <div v-if="!isLoading && !error" class="ranking-table-container">
        <p class="description">{{ $t('leaderboardView.description') }}</p>
        <table class="ranking-table">
          <thead>
            <tr>
              <th>{{ $t('leaderboardView.tableHeaderNo') }}</th>
              <th colspan="2">{{ $t('leaderboardView.tableHeaderUserName') }}</th>
              <th>{{ $t('leaderboardView.tableHeaderWinStreak') }}</th>
              <th>{{ $t('leaderboardView.tableHeaderPost') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="leaderboard.length === 0">
              <td colspan="5" style="text-align: center;">No rankings found.</td>
            </tr>
            <tr v-for="player in leaderboard" :key="player.id">
              <td>{{ player.rank }}</td>
              <td class="user-avatar-cell">
                <img :src="player.profile_image_url" alt="avatar" class="user-avatar" />
              </td>
              <td class="user-name-cell">
                <div class="user-name">{{ player.name }}</div>
                <div class="user-username">@{{ player.username }}</div>
              </td>
              <td class="streak-cell">{{ player.streak }}</td>
              <td><a :href="player.url" target="_blank" rel="noopener noreferrer">View</a></td>
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

// Mock data for local development
const mockData = [
  { rank: 1, id: 'user1', name: 'ねこマスター', username: 'cat_master', streak: 50, url: '#', profile_image_url: '/assets/images/info/cat_icon_1.png' },
  { rank: 2, id: 'user2', name: 'とら', username: 'tora_chan', streak: 45, url: '#', profile_image_url: '/assets/images/info/cat_icon_2.png' },
  { rank: 3, id: 'user3', name: 'たま', username: 'tama_nyan', streak: 42, url: '#', profile_image_url: '/assets/images/info/cat_icon_3.png' },
  { rank: 4, id: 'user4', name: 'くろ', username: 'kuro_san', streak: 38, url: '#', profile_image_url: '/assets/images/info/cat_icon_4.png' },
  { rank: 5, id: 'user5', name: '雀猫様', username: 'janneko_sama', streak: 35, url: '#', profile_image_url: '/assets/images/info/hito_icon_1.png' },
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
  margin-bottom: 20px;
}

.description {
  font-size: 0.9em;
  color: #666;
  margin-bottom: 20px;
  text-align: center;
  max-width: 600px;
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
  max-width: 600px;
  overflow-x: auto;
  flex-grow: 1; /* Allow container to take up space */
  overflow-y: auto; /* Make the table scrollable */
  margin-bottom: 20px; /* Add some space at the bottom */
}

.ranking-table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.ranking-table th, .ranking-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
  vertical-align: middle;
  font-size: 0.9em;
}

.ranking-table th {
  background-color: #f2f2f2;
  font-weight: bold;
  position: sticky;
  top: 0;
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
  color: #1a73e8;
  text-decoration: none;
  font-weight: bold;
}

.ranking-table a:hover {
  text-decoration: underline;
}
</style>