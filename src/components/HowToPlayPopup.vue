<template>
  <transition name="popup">
    <div class="popup-overlay" @click.self="$emit('close')">
      <div class="popup-content">
        <h2>{{ $t('howToPlayPopup.title') }}</h2>
        <div class="popup-body">
          <div class="section">
            <h3>{{ $t('howToPlayPopup.section1.title') }}</h3>
            <p v-html="$t('howToPlayPopup.section1.line1')"></p>
            <p v-html="$t('howToPlayPopup.section1.line2')"></p>
            <p v-html="$t('howToPlayPopup.section1.line3')"></p>
            <p v-html="$t('howToPlayPopup.section1.line4')"></p>
          </div>

          <div class="section">
            <h3>{{ $t('howToPlayPopup.section2.title') }}</h3>
            <p v-html="$t('howToPlayPopup.section2.objective')"></p>
            <p v-html="$t('howToPlayPopup.section2.tileTypesTitle')"></p>
            <ul>
              <li v-html="$t('howToPlayPopup.section2.tileTypes[0]')"></li>
              <li v-html="$t('howToPlayPopup.section2.tileTypes[1]')"></li>
            </ul>
            <p v-html="$t('howToPlayPopup.section2.handCompositionTitle')"></p>
            <p v-html="$t('howToPlayPopup.section2.handComposition')"></p>
          </div>

          <div class="section">
            <h3>{{ $t('howToPlayPopup.section3.title') }}</h3>
            <p v-html="$t('howToPlayPopup.section3.intro')"></p>
            <ol>
              <li v-for="item in $tm('howToPlayPopup.section3.flow')" :key="item" v-html="item"></li>
            </ol>
            <p v-html="$t('howToPlayPopup.section3.roundFlowTitle')"></p>
            <ol>
              <li v-for="item in $tm('howToPlayPopup.section3.roundFlow')" :key="item" v-html="item"></li>
            </ol>
          </div>

          <div class="section">
            <h3>{{ $t('howToPlayPopup.section4.title') }}</h3>
            <dl>
              <div v-for="(action, key) in $tm('howToPlayPopup.section4.actions')" :key="key">
                <dt>{{ action.term }}</dt>
                <dd>{{ action.definition }}</dd>
              </div>
            </dl>
          </div>
          <p class="conclusion" v-html="$t('howToPlayPopup.conclusion')"></p>
        </div>
        <button @click="$emit('close')" class="close-button">{{ $t('howToPlayPopup.closeButton') }}</button>
      </div>
    </div>
  </transition>
</template>

<script setup>
// このコンポーネントは、遊び方を表示するためのポップアップです。
// 親コンポーネントから 'close' イベントを受け取って自身を閉じます。
defineEmits(['close']);
</script>

<style scoped>
  .popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .popup-content {
    background-image: url('/assets/images/back/rule.png');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    padding: 20px 38px;
    border-radius: 8px;
    width: 90%;
    max-width: 500px; /* 最大幅を調整 */
    height: 90%;
    max-height: 700px; /* 最大高さを調整 */
    overflow-y: auto;
    text-align: center;
    font-family: 'Yuji Syuku', serif;
    color: #3a2417; /* テキストの基本色 */
    text-shadow: 1px 1px 1px rgba(255, 255, 255, 0.2);
    display: flex;
    flex-direction: column;
    position: relative; /* close-buttonの基準点 */
  }
  .popup-body {
    width: 89%;
    margin-left: 25px;
    margin-top: -20px;
    margin-bottom: 48px;
    text-align: left;
    font-size: 12px;
    line-height: 1.2;
    flex-grow: 1;
    overflow-y: auto; /* 内容が多い場合にスクロール */
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
  }
  .popup-body::-webkit-scrollbar {
    width: 5px;
  }
  .popup-body::-webkit-scrollbar-track {
    background: transparent;
  }
  .popup-body::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 10px;
  }
  h2 {
    font-size: 2em;
    margin-top: 30px;
    color: #4a2c1a;
  }
  .section {
    margin-bottom: 5px;
  }
  .section h3 {
    font-size: 1.4em;
    text-align: center;
    margin-bottom: 15px;
    color: #4a2c1a;
    border-bottom: 1px solid #8a6d3b;
    padding-bottom: 8px;
  }
  .section p, .section ul, .section ol, .section dl {
    margin-left: 3px;
    margin-right: 3px;
  }
  .section ul, .section ol {
    padding-left: 25px;
  }
  .section strong {
    color: #a94442;
  }
  .section dt {
    font-weight: bold;
    margin-top: 15px;
    color: #4a2c1a;
  }
  .section dd {
    margin-left: 1.5em;
  }
  .conclusion {
    text-align: center;
    font-weight: bold;
    margin-top: 25px;
    font-size: 1.4em;
    color: #4a2c1a;
  }

  .close-button {
    position: absolute;
    bottom: 34px; /* 位置調整用 */
    right: 55px;  /* 位置調整用 */
    background: none;
    border: none;
    font-family: 'Yuji Syuku', serif;
    font-size: 1.1em;
    color: #4d2c1c;
    cursor: pointer;
    padding: 5px;
    opacity: 0.9;
    text-shadow: 1px 1px 1px rgba(255, 255, 255, 0.7);
  }

  /* トランジション用スタイル */
  .popup-enter-active, .popup-leave-active {
    transition: opacity 0.3s ease, transform 0.3s ease;
  }
  .popup-enter-from, .popup-leave-to {
    opacity: 0;
    transform: scale(0.95);
  }
</style>
