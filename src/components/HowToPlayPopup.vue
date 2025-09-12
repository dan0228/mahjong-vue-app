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
        <div class="close-button-container">
          <button @click="$emit('close')" class="close-button">{{ $t('howToPlayPopup.closeButton') }}</button>
        </div>
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
  /* スタイルは他のポップアップ(RulePopup.vueなど)を参考にしています */
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
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    max-width: 90%;
    max-height: 80%;
    overflow-y: auto;
    text-align: center;
    font-family: 'M PLUS 1', sans-serif;
  }
  .popup-body {
    margin-top: 20px;
    margin-bottom: 20px;
    text-align: left;
    font-size: 14px;
    line-height: 1.6;
  }
  .section {
    margin-bottom: 20px;
  }
  .section h3 {
    font-size: 1.2em;
    text-align: center;
    margin-bottom: 10px;
    color: #586810;
    border-bottom: 2px solid #d8c8a0;
    padding-bottom: 5px;
  }
  .section p, .section ul, .section ol, .section dl {
    margin-left: 10px;
    margin-right: 10px;
  }
  .section ul, .section ol {
    padding-left: 20px;
  }
  .section strong {
    color: #c0392b;
  }
  .section dt {
    font-weight: bold;
    margin-top: 10px;
  }
  .section dd {
    margin-left: 1em;
  }
  .conclusion {
    text-align: center;
    font-weight: bold;
    margin-top: 20px;
    color: #586810;
  }
  .close-button-container {
    text-align: center;
  }
  .close-button {
    padding: 10px 30px;
    background-color: #6c757d;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1em;
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
