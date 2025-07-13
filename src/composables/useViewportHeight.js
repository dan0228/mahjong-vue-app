// src/composables/useViewportHeight.js
import { ref, onMounted, onBeforeUnmount } from 'vue';

export function useViewportHeight() {
  const viewportHeight = ref(`${window.innerHeight}px`);

  const updateHeight = () => {
    viewportHeight.value = `${window.innerHeight}px`;
  };

  onMounted(() => {
    window.addEventListener('resize', updateHeight);
    // Also update on orientation change
    window.addEventListener('orientationchange', updateHeight);
    // Initial set
    updateHeight();
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', updateHeight);
    window.removeEventListener('orientationchange', updateHeight);
  });

  return { viewportHeight };
}
