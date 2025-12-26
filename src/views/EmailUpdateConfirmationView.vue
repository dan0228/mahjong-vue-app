<template>
  <div class="confirmation-container">
    <div class="confirmation-box">
      <h1>🎉</h1>
      <h2>{{ $t('emailUpdateConfirmation.title') }}</h2>
      <p>{{ $t('emailUpdateConfirmation.message') }}</p>
    </div>
  </div>
</template>

<script setup>
// このページはメッセージを表示するだけなので、特別なスクリプトは不要です。
</script>

<style scoped>
.confirmation-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
  font-family: 'M PLUS Rounded 1c', sans-serif;
  text-align: center;
}
.confirmation-box {
  background-color: #fff;
  padding: 40px 50px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}
h1 {
  font-size: 4em;
  margin: 0;
}
h2 {
  font-size: 1.8em;
  color: #333;
  margin: 20px 0 10px 0;
}
p {
  font-size: 1.1em;
  color: #666;
}
</style>
