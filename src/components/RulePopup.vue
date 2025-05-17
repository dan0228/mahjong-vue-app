<template>
  <div class="popup-overlay" @click.self="$emit('close')">
    <div class="popup-content">
      <h2>四牌麻雀 ルール</h2>
      <p>ここに四牌麻雀の詳しいルールを記載します。</p>
      <ul>
        <li>手牌は常に4枚です（ツモ直後は5枚）。</li>
        <li>テンパイ形は4枚、和了形は5枚です。</li>
        <li>基本的な役は通常の麻雀に準じますが、枚数による調整があります。</li>
        <li>（詳細ルールは順次追加）</li>
      </ul>
      <button @click="$emit('close')">閉じる</button>
    </div>
  </div>
</template>

<script setup>
defineEmits(['close']);
</script>

<style scoped>
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.popup-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  max-width: 80%;
}
</style>