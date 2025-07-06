<template>
  <div v-if="isLoading">
    Now Loading...
  </div>
  <router-view v-else />
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useAudioStore } from './stores/audioStore';
import { preloadImages } from './utils/imageLoader';

const isLoading = ref(true);
const audioStore = useAudioStore();
const bgm = new Audio('/assets/sounds/BGM.mp3');
bgm.loop = true;

const playBgm = () => {
  bgm.volume = audioStore.volume;
  bgm.play().catch(e => console.error("BGMの再生に失敗しました。", e));
  // 一度再生を開始したら、クリックイベントのリスナーは不要になるので削除
  window.removeEventListener('click', playBgm);
};

onMounted(async () => {
  const imageUrls = await import.meta.glob('/assets/images/**/*.png');
  const paths = Object.keys(imageUrls);
  await preloadImages(paths);
  isLoading.value = false;

  // 自動再生ポリシーのため、最初はクリックを待つ
  window.addEventListener('click', playBgm);
});

watch(() => audioStore.volume, (newVolume) => {
  bgm.volume = newVolume;
});
</script>

<style scoped>
/* App.vueのスタイルは最小限に、各ビューやコンポーネントで管理するのが一般的 */
</style>