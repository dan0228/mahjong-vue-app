<template>
  <div v-if="show" class="popup-overlay" @click.self="closePopup">
    <div class="popup-container" :style="containerStyle">
      <button class="close-button" @click="closePopup">×</button>
      <div class="popup-content">
        <div
          v-for="button in buttons"
          :key="button.id"
          class="mode-option"
          :class="button.customClass"
          @click="selectOption(button.id)"
        >
          <div class="mode-title">{{ button.title }}</div>
          <div class="mode-description" v-html="button.description"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps, defineEmits } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  backgroundImage: {
    type: String,
    required: true,
  },
  buttons: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['close', 'select']);

const containerStyle = computed(() => ({
  backgroundImage: `url(${props.backgroundImage})`,
}));

const closePopup = () => {
  emit('close');
};

const selectOption = (id) => {
  emit('select', id);
};
</script>

<style scoped>
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.popup-container {
  background-size: cover;
  background-position: center;
  border-radius: 0px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  width: 650px;
  height: 180px;
  position: relative;
  font-family: 'Yuji Syuku', serif;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  animation: slap-in 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.close-button {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(122, 106, 83, 0.6);
  color: rgba(255, 255, 255, 0.8);
  border: 0px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 1.2em;
  line-height: 22px;
  cursor: pointer;
  box-shadow: none;
  z-index: 10;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}

.close-button:hover {
  background: rgba(122, 106, 83, 0.8);
  color: white;
}

.popup-content {
  position: relative;
  width: 100%;
  height: 100%;
}

.mode-option {
  width: 130px;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-family: 'Yuji Syuku', serif;
  color: #4a2c1a;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
  cursor: pointer;
  padding: 10px 0px;
  transition: transform 0.2s, color 0.2s;
  text-align: center;
  box-shadow: none;
}

.mode-left {
  left: 10px;
  top: 80px;
}

.mode-right {
  right: 20px;
  top: 85px;
}

.mode-right.online-ranked-button {
  top: 76px;
}

.mode-option:hover {
  transform: translateY(-50%) scale(1.05);
  color: #7a6a53;
  text-shadow: 0px 0px 8px rgba(255, 255, 255, 1);
}

.mode-title {
  font-size: 1.5em;
  font-weight: bold;
  margin-bottom: 5px;
  color: #4a2c1a;
}

.mode-description {
  font-size: 0.9em;
  line-height: 1.2;
  color: #6d5f4b;
}

@keyframes slap-in {
  0% {
    opacity: 0;
    transform: scale(1.5);
  }
  60% {
    opacity: 1;
    transform: scale(0.95);
  }
  80% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
  }
}
</style>