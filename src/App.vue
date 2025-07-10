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
import { ref, onMounted, watch } from 'vue';
import { useAudioStore } from './stores/audioStore';
import { preloadImages } from './utils/imageLoader';

const isLoading = ref(true);
const audioStore = useAudioStore();
const bgm = new Audio('/assets/sounds/BGM.mp3');
bgm.loop = true;

onMounted(async () => {
  const imageUrls = await import.meta.glob('/assets/images/**/*.png');
  const paths = Object.keys(imageUrls);
  await preloadImages(paths);
  isLoading.value = false;
});

watch([() => audioStore.volume, () => audioStore.isBgmEnabled], ([newVolume, isBgmEnabled]) => {
  bgm.volume = newVolume;
  if (isBgmEnabled) {
    bgm.play().catch(e => console.error("BGMの再生に失敗しました。", e));
  } else {
    bgm.pause();
  }
});
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
