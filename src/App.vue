<template>
  <div v-if="isLoading">
    Now Loading...
  </div>
  <router-view v-else />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { preloadImages } from './utils/imageLoader';

const isLoading = ref(true);

onMounted(async () => {
  const imageUrls = await import.meta.glob('/assets/images/**/*.png');
  const paths = Object.keys(imageUrls);
  await preloadImages(paths);
  isLoading.value = false;
});
</script>

<style scoped>
/* App.vueのスタイルは最小限に、各ビューやコンポーネントで管理するのが一般的 */
</style>