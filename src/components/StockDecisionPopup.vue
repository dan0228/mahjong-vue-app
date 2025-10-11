<template>
  <div class="popup-overlay">
    <div class="popup-container">
      <div class="popup-header">
        <h2 class="popup-title">{{ $t('stockDecisionPopup.title') }}</h2>
      </div>
      <div class="popup-content">
        <p class="description">{{ $t('stockDecisionPopup.description') }}</p>
        <div class="decision-buttons">
          <button class="decision-button draw-button" @click="$emit('draw-from-wall')">
            {{ $t('stockDecisionPopup.drawFromWall') }}
          </button>
          <button class="decision-button use-stock-button" @click="$emit('use-stocked-tile')">
            {{ $t('stockDecisionPopup.useStockedTile') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineEmits } from 'vue';

const emit = defineEmits(['draw-from-wall', 'use-stocked-tile']);
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
  background: linear-gradient(180deg, #f3f0e9, #e4e0d7);
  border-radius: 15px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 300px;
  border: 2px solid #7a6a53;
  position: relative;
  font-family: 'M PLUS Rounded 1c', sans-serif;
  padding: 20px;
}

.popup-header {
  text-align: center;
  margin-bottom: 15px;
}

.popup-title {
  font-size: 1.5em;
  color: #5c4b33;
  font-weight: 700;
  margin: 0;
}

.popup-content .description {
  font-size: 0.9em;
  color: #6d5f4b;
  text-align: center;
  margin-bottom: 20px;
}

.decision-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.decision-button {
  padding: 12px 20px;
  border-radius: 8px;
  border: none;
  font-size: 1.1em;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.decision-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.draw-button {
  background-color: #4CAF50; /* Green */
  color: white;
}

.use-stock-button {
  background-color: #FFC107; /* Amber */
  color: #333;
}
</style>
