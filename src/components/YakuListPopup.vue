<template>
  <div class="popup-overlay" @click.self="$emit('close')">
    <div class="popup-content">
      <h2>役一覧</h2>
      <p>ここに四牌麻雀の役一覧を記載します。</p>
      <ul>
        <li>立直（リーチ）</li>
        <li>門前清自摸和（メンゼンツモ）</li>
        <li>役牌（ヤクハイ）</li>
        <li>断么九（タンヤオチュウ）</li>
        <li>（その他の役は順次追加）</li>
      </ul>
      <button @click="$emit('close')">閉じる</button>
    </div>
  </div>
</template>

<script setup>
defineEmits(['close']);
</script>

<style scoped>
/* RulePopup.vue と同様のスタイルを使用できます */
.popup-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.popup-content { background-color: white; padding: 20px; border-radius: 8px; max-width: 80%; }
</style>