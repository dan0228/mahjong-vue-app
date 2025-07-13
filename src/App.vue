<template>
  <div v-if="isLoading">
    Now Loading...
  </div>
  <router-view v-else v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useAudioStore } from '@/stores/audioStore';

const isLoading = ref(false); 

const audioStore = useAudioStore();
const bgmPlayer = ref(null);

// --- Autoplay Workaround ---
const startAudioContext = () => {
  if (audioStore.isBgmEnabled && bgmPlayer.value && bgmPlayer.value.paused) {
    bgmPlayer.value.play().catch(e => {
      // Autoplay might still be blocked, but we attempt it on first user interaction.
      console.warn("BGM autoplay failed on interaction, might require another user gesture:", e);
    });
  }
  // Remove the event listeners after the first interaction
  window.removeEventListener('click', startAudioContext);
  window.removeEventListener('keydown', startAudioContext);
  window.removeEventListener('touchstart', startAudioContext);
};

onMounted(() => {
  // Add listeners for the first user interaction to start audio
  window.addEventListener('click', startAudioContext);
  window.addEventListener('keydown', startAudioContext);
  window.addEventListener('touchstart', startAudioContext);
});

onUnmounted(() => {
  // Clean up listeners when the component is destroyed
  window.removeEventListener('click', startAudioContext);
  window.removeEventListener('keydown', startAudioContext);
  window.removeEventListener('touchstart', startAudioContext);
});
// --- End Autoplay Workaround ---

watch(() => audioStore.isBgmEnabled, (newVal) => {
  if (newVal) {
    if (bgmPlayer.value && bgmPlayer.value.paused) {
      bgmPlayer.value.play().catch(e => console.error("BGMの再生に失敗しました:", e));
    }
  } else {
    if (bgmPlayer.value && !bgmPlayer.value.paused) {
      bgmPlayer.value.pause();
    }
  }
});

watch(() => audioStore.currentBgm, (newBgm) => {
  if (bgmPlayer.value) {
    bgmPlayer.value.pause();
  }
  if (newBgm) {
    bgmPlayer.value = new Audio(`/assets/sounds/${newBgm}`);
    bgmPlayer.value.loop = true;
    bgmPlayer.value.volume = audioStore.volume;
    if (audioStore.isBgmEnabled) {
      bgmPlayer.value.play().catch(e => console.error("BGMの再生に失敗しました:", e));
    }
  } else {
    bgmPlayer.value = null;
  }
});

watch(() => audioStore.volume, (newVolume) => {
  if (bgmPlayer.value) {
    bgmPlayer.value.volume = newVolume;
  }
});
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden; /* Prevents scrolling at the root level */
  height: 100%;
  width: 100%;
  position: fixed; /* Fixes the viewport to the window size */
}

#app {
  height: 100%;
  width: 100%;
}

/* グローバルなスタイルや、App.vue固有のスタイルをここに記述 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>