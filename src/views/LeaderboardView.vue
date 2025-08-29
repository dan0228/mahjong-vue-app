
<template>
  <div class="leaderboard-container">
    <h1>{{ $t('leaderboardView.title') }}</h1>
    
    <div v-if="isLoading" class="loading-message">Loading rankings...</div>
    <div v-if="error" class="error-message">{{ error }}</div>

    <div v-if="!isLoading && !error" class="ranking-table-container">
      <p class="description">{{ $t('leaderboardView.description') }}</p>
      <table class="ranking-table">
        <thead>
          <tr>
            <th>No.</th>
            <th colspan="2">User Name</th>
            <th>Win Streak</th>
            <th>Post</th>
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

    <button @click="goBack" class="back-button">Back to Title</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const { t } = useI18n();
const leaderboard = ref([]);
const isLoading = ref(true);
const error = ref(null);

async function fetchLeaderboard() {
  isLoading.value = true;
  error.value = null;
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

onMounted(() => {
  fetchLeaderboard();
});

function goBack() {
  router.push('/');
}
</script>

<style scoped>
.leaderboard-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  font-family: 'M PLUS Rounded 1c', sans-serif;
  color: #333;
  background-color: #f4f4f9;
  min-height: 100vh;
}

h1 {
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
}

.ranking-table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.ranking-table th, .ranking-table td {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
  vertical-align: middle;
}

.ranking-table th {
  background-color: #f2f2f2;
  font-weight: bold;
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

.back-button {
  margin-top: 30px;
  padding: 10px 25px;
  font-size: 1em;
  cursor: pointer;
  border: 2px solid #586810;
  background-color: white;
  color: #586810;
  border-radius: 8px;
  transition: background-color 0.2s, color 0.2s;
}

.back-button:hover {
  background-color: #586810;
  color: white;
}
</style>
