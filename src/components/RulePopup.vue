<template>
  <div class="popup-overlay" @click.self="$emit('close')">
    <div class="popup-content">
      <h2>四牌麻雀 ルール</h2>
      <p>手牌4枚+1枚の1面子1雀頭で和了できる麻雀です！</p>
      <ul style="text-align: left;">
          <li>東風戦、南入なし</li>
          <li>本場による加点なし</li>
          <li>切り上げ満貫とし、満貫未満は0点(和了は可能)</li>
          <li>赤ドラなし</li>
          <li>チーなし</li>
          <li>喰い替えあり</li>
          <li>後付けあり</li>
          <li>喰いタンあり</li>
          <li>リーチ後の暗カンはいかなる形でも可能</li>
          <li>四風連打なし</li>
          <li>四家リーチ流れなし</li>
          <li>ダブロン、トリロンは頭ハネ</li>
          <li>箱下なし(0点未満で終了)</li>
          <li>アガリ止めなし(親が和了orテンパイで続行)</li>
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