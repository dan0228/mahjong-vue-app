<template>
  <div class="popup-overlay" @click.self="$emit('close')">
    <div class="popup-content">
      <button class="close-button" @click="$emit('close')">×</button>
      <p v-if="fortune" class="fortune-text"><strong>運勢　：</strong>{{ fortune }}</p>
      <p class="saying-text-with-prefix">
        <strong>お告げ：</strong>
        <span v-if="sayingNumber !== null">No.{{ sayingNumber }}</span><span v-if="isNew" class="new-tag">New！</span><br>{{ saying }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';

const props = defineProps({
  saying: String,
  fortune: String,
  sayingId: String,
  isNew: Boolean, // 追加
});

defineEmits(['close']);

const sayingNumber = computed(() => {
  if (props.sayingId) {
    const match = props.sayingId.match(/s(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }
  return null;
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Yuji+Syuku&display=swap');

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

.popup-content {
  background: #f3e9d2;
  border: 5px solid #8c6f46;
  padding: 30px 30px;
  border-radius: 15px;
  text-align: center;
  position: relative;
  width: 85%;
  max-width: 450px;
}

.fortune-text {
  font-family: 'Yuji Syuku', serif;
  font-size: 1.4rem;
  color: #333;
  margin-bottom: 15px;
  text-align: left;
}

.saying-text-with-prefix {
  font-family: 'Yuji Syuku', serif;
  font-size: 1.4rem;
  color: #333;
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.5;
  text-align: left;
}

.new-tag {
  font-size: 0.8em;
  color: #e53935;
  font-weight: bold;
  margin-left: 15px;
  vertical-align: super;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 15px;
  background: none;
  border: none;
  font-size: 2.5rem;
  cursor: pointer;
  color: #5a4a42;
}
</style>
