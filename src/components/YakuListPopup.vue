<template>
  <transition name="popup">
    <div class="popup-overlay" @click.self="$emit('close')">
      <div class="popup-content">
        <h2>{{ $t('yakuListPopup.title') }}</h2>
        <div class="yaku-section">
          <table class="yaku-table">
            <thead>
              <tr>
                <th>{{ $t('yakuListPopup.yakuNameHeader') }}</th>
                <th>{{ $t('yakuListPopup.hanHeader') }}</th>
                <th class="example-column">{{ $t('yakuListPopup.exampleHeader') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="yaku in normalYakuList" :key="yaku.key">
                <td>{{ $t(`yaku.${yaku.key}.name`) }}</td>
                <td>
                  {{ $t('yakuListPopup.han', { n: yaku.fans }) }}
                  <span v-if="yaku.menzenOnly"> {{ $t('yakuListPopup.menzenOnly') }}</span>
                  <span v-if="yaku.kuisagari"> {{ $t('yakuListPopup.kuisagari', { n: yaku.fans - yaku.kuisagari }) }}</span>
                </td>
                <td class="yaku-example example-column">
                  <span v-if="yaku.exampleTiles && yaku.exampleTiles.length > 0">
                    <img
                      v-for="(tile, index) in yaku.exampleTiles"
                      :key="index"
                      :src="determineTileImage(yaku, tile, index)"
                      :alt="determineTileAlt(yaku, tile, index)"
                      :class="['tile-image-small', getTileSpecificClass(yaku, index, yaku.exampleTiles.length)]"/>
                  </span>
                  <span v-else>-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="yaku-section">
          <table class="yaku-table">
            <thead>
              <tr>
                <th>{{ $t('yakuListPopup.yakumanNameHeader') }}</th>
                <th>{{ $t('yakuListPopup.yakumanValueHeader') }}</th>
                <th class="example-column">{{ $t('yakuListPopup.exampleHeader') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="yakuman in yakumanList" :key="yakuman.key">
                <td>{{ $t(`yaku.${yakuman.key}.name`) }}</td>
                <td>{{ yakuman.power === 1 ? $t('yakuListPopup.yakuman') : $t('yakuListPopup.multipleYakuman', { n: yakuman.power }) }}</td>
                <td class="yaku-example example-column">
                  <span v-if="yakuman.exampleTiles && yakuman.exampleTiles.length > 0">
                    <img
                      v-for="(tile, index) in yakuman.exampleTiles"
                      :key="index"
                      :src="determineTileImage(yakuman, tile, index)"
                      :alt="determineTileAlt(yakuman, tile, index)"
                      :class="['tile-image-small', getTileSpecificClass(yakuman, index, yakuman.exampleTiles.length)]"/>
                  </span>
                  <span v-else>-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="close-button-container">
          <button @click="$emit('close')" class="close-button">{{ $t('yakuListPopup.closeButton') }}</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
  import { computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { getTileImageUrl, tileToString } from '@/utils/tileUtils'; // 画像表示用ユーティリティ
  import { YONHAI_YAKU, YONHAI_YAKUMAN } from '@/services/mahjongLogic'; // 役定義をインポート
  defineEmits(['close']);

  const { t } = useI18n();

  const normalYakuList = computed(() => {
    return Object.values(YONHAI_YAKU).filter(yaku =>
      yaku.key !== 'dora' && yaku.key !== 'uraDora'
    );
  });
  const yakumanList = computed(() => Object.values(YONHAI_YAKUMAN));

  function determineTileImage(yaku, tile, index) {
    if (yaku.key === 'iiankanTanki' && (index === 2 || index === 5)) {
      return '/assets/images/tiles/ura.png'; // 裏向きの牌
    }
    return getTileImageUrl(tile);
  }

  function determineTileAlt(yaku, tile, index) {
    if (yaku.key === 'iiankanTanki' && (index === 2 || index === 5)) {
      return t('yakuListPopup.facedownTile');
    }
    return tileToString(tile);
  }

  function getTileSpecificClass(yaku, index, exampleLength) {
    const classes = [];
    // 通常の5枚和了の4枚目と5枚目の間のスペース
    if (index === 3 && yaku.key !== 'iikantsu' && yaku.key !== 'iiankanTanki' && exampleLength === 5) {
      classes.push('last-drawn-tile-spacer');
    }

    // 一槓子と一暗槓単騎の1枚目と2枚目、2枚目と3枚目の間のスペース
    if ((yaku.key === 'iikantsu' || yaku.key === 'iiankanTanki') && (index === 0 || index === 1)) {
      classes.push('kan-tile-spacer');
    }

    // 一槓子の6枚目を横向きにする
    if (yaku.key === 'iikantsu' && index === 5) {
      classes.push('tile-rotated');
    }
    return classes;
  }

</script>

<style scoped>
  /* RulePopup.vue と同様のスタイルを使用できます */
  .popup-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
  .popup-content {
    background-color: white;
    padding: 5px; border-radius: 8px;
    max-width: 100%; max-height: 100%;
    overflow-y: auto; text-align: center;
    font-family: 'M PLUS 1', sans-serif; /* フォントをM PLUS 1に統一 */
    font-size: 0.7em;
    transform: scale(0.85); /* ポップアップ全体を縮小して画面に収める */
    display: flex; flex-direction: column; justify-content: space-between;
    touch-action: pan-y;
  }

  /* Transition styles */
.popup-enter-active, .popup-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.popup-enter-from, .popup-leave-to {
  opacity: 0;
}
  .yaku-section { margin-bottom: 15px; }
  .yaku-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  .yaku-table th, .yaku-table td { border: 1px solid #ddd; padding: 6px; text-align: left; }
  .yaku-table th { background-color: #f2f2f2; }
  .example-column { width: 120px; }
  .yaku-example {
    display: flex;
    align-items: center;
    gap: 1px; /* 牌同士の間隔を少し詰める */
    overflow-x: auto; /* 横幅が足りない場合にスクロール可能にする */
    min-width: 0; /* flexアイテムが縮小できるようにする */
  }
  .tile-image-small {
    width: 18px; /* 例の牌画像の幅を少し小さく */
    height: 25px; /* 高さを固定して揃える (アスペクト比に応じて調整) */
    vertical-align: middle;
  }
  .last-drawn-tile-spacer {
    margin-right: 5px; /* 4牌目と5牌目の間のスペース */
  }
  .kan-tile-spacer {
    margin-right: 3px; /* カンツの牌の間のわずかなスペース */
  }
  .tile-rotated {
    transform: rotate(90deg);
    margin-left: 3px;
    margin-top: 6px; 
    /* 必要に応じてマージンや transform-origin を調整 */
  }
    .close-button-container {
    margin-top: 20px;
    text-align: center;
  }
  .close-button {
    padding: 8px 25px;
    background-color: #6c757d;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1em;
  }
</style>