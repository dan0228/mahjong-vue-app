<template>
  <transition name="scroll">
    <div v-if="show" class="popup-overlay" @click.self="$emit('close')">
      <div class="popup-content">
        <h2>{{ $t('howToPlayPopup.title') }}</h2>
        <div class="popup-body">
          <div class="section">
            <h3>
              <i class="fa-solid fa-fan icon-left"></i>
              <span>{{ $t('howToPlayPopup.section1.title') }}</span>
              <i class="fa-solid fa-fan icon-right"></i>
            </h3>
            <p v-html="$t('howToPlayPopup.section1.line1')"></p>
            <p v-html="$t('howToPlayPopup.section1.line2')"></p>
            <p v-html="$t('howToPlayPopup.section1.line3')"></p>
            <p v-html="$t('howToPlayPopup.section1.line4')"></p>
          </div>

          <div class="section">
            <h3>
              <i class="fa-solid fa-dragon icon-left"></i>
              <span>{{ $t('howToPlayPopup.section2.title') }}</span>
              <i class="fa-solid fa-dragon icon-right"></i>
            </h3>
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
            <h3>
              <i class="fa-solid fa-list-ol icon-left"></i>
              <span>{{ $t('howToPlayPopup.section3.title') }}</span>
              <i class="fa-solid fa-list-ol icon-right"></i>
            </h3>
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
            <h3>
              <i class="fa-solid fa-bolt icon-left"></i>
              <span>{{ $t('howToPlayPopup.section4.title') }}</span>
              <i class="fa-solid fa-bolt icon-right"></i>
            </h3>
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
        <img src="/assets/images/back/fude.png" class="close-fude-image" alt="fude" />
      </div>
    </div>
  </transition>
</template>

<script setup>
// このコンポーネントは、遊び方を表示するためのポップアップです。
// 親コンポーネントから 'show' プロパティを受け取って表示を制御し、
// 'close' イベントを発行して自身を閉じます。
defineProps({
  show: Boolean
});
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
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
  .icon-left {
    opacity: 0.9;    /* 少しだけ透けさせる */
    transform: rotate(-15deg);
  }
  .icon-right {
    opacity: 0.9;    /* 少しだけ透けさせる */
    transform: rotate(15deg);
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
    bottom: 42px; /* fude.pngを配置するため少し上に調整 */
    right: 55px;
    background: none;
    border: none;
    font-family: 'Yuji Syuku', serif;
    font-size: 1.0em;
    color: white; /* テキストを白に変更 */
    cursor: pointer;
    padding: 5px;
    opacity: 0.9;
    /* 暗い色のシャドウで、白いテキストの周りにグロー効果を作成 */
    text-shadow: 0 0 5px #4d2c1c, 0 0 8px #4d2c1c;
    transition: text-shadow 0.3s ease, color 0.3s ease;
  }

  .close-button:hover {
    color: #fffde7; /* 少し黄色がかった白 */
    text-shadow: 0 0 8px #4d2c1c, 0 0 12px #4d2c1c; /* ホバーで発光を強く */
  }

  .close-fude-image {
    position: absolute;
    bottom: 40px;
    right: 58px; /* ボタンの位置に合わせて調整 */
    width: 60px; /* 小さく表示 */
    opacity: 0.8;
    pointer-events: none; /* 画像がクリックイベントを妨げないように */
  }

/* --- 巻物アニメーション --- */

/* 表示アニメーション */
.scroll-enter-active {
  transition: background-color 0.3s ease; /* 背景のフェードイン */
}
.scroll-enter-from {
  background-color: rgba(0,0,0,0);
}
.scroll-enter-active .popup-content {
  animation: unroll 0.6s cubic-bezier(0.25, 1, 0.5, 1); /* 巻物コンテンツが開く */
}

/* 非表示アニメーション */
.scroll-leave-active {
  /* 背景のフェードアウト。巻物が閉じるアニメーション(0.4s)が終わってから開始 */
  transition: background-color 0.3s ease 0.4s;
}
.scroll-leave-to {
  background-color: rgba(0,0,0,0);
}
.scroll-leave-active .popup-content {
  animation: unroll 0.4s cubic-bezier(0.25, 1, 0.5, 1) reverse forwards; /* 巻物コンテンツが閉じる & 最終状態で停止 */
}

@keyframes unroll {
  0% {
    clip-path: inset(0 0 100% 0);
  }
  100% {
    clip-path: inset(0 0 0 0);
  }
}
</style>
