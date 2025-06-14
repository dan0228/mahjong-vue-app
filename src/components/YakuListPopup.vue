<template>
  <div class="popup-overlay" @click.self="$emit('close')">
    <div class="popup-content">
      <h2>役一覧</h2>
      <div class="yaku-section">
        <table class="yaku-table">
          <thead>
            <tr>
              <th>役名</th>
              <th>翻数</th>
              <th>例</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="yaku in normalYakuList" :key="yaku.name">
              <td>{{ yaku.name }}</td>
              <td>
                {{ yaku.fans }}翻
                <span v-if="yaku.menzenOnly"> (門前のみ)</span>
                <span v-if="yaku.kuisagari"> (喰{{ yaku.fans - yaku.kuisagari }}翻)</span>
              </td>
              <td class="yaku-example">
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
              <th>役満名</th>
              <th>役満数</th>
              <th>例</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="yakuman in yakumanList" :key="yakuman.name">
              <td>{{ yakuman.name }}</td>
              <td>{{ yakuman.power === 1 ? '役満' : `${yakuman.power}倍役満` }}</td>
              <td class="yaku-example">
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
      <button @click="$emit('close')">閉じる</button>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue';
  import { getTileImageUrl, tileToString } from '@/utils/tileUtils'; // 画像表示用ユーティリティ
  import { YONHAI_YAKU, YONHAI_YAKUMAN } from '@/services/mahjongLogic'; // 役定義をインポート
  defineEmits(['close']);
  const normalYakuList = computed(() => {
    return Object.values(YONHAI_YAKU).filter(yaku =>
      yaku.name !== YONHAI_YAKU.DORA.name && yaku.name !== YONHAI_YAKU.URA_DORA.name
    );
  });
  const yakumanList = computed(() => Object.values(YONHAI_YAKUMAN));

  function determineTileImage(yaku, tile, index) {
    if (yaku.name === '一暗槓単騎' && (index === 2 || index === 5)) {
      return '/assets/images/tiles/ura.png'; // 裏向きの牌
    }
    return getTileImageUrl(tile);
  }

  function determineTileAlt(yaku, tile, index) {
    if (yaku.name === '一暗槓単騎' && (index === 2 || index === 5)) {
      return '裏向きの牌';
    }
    return tileToString(tile);
  }

  function getTileSpecificClass(yaku, index, exampleLength) {
    const classes = [];
    // 通常の5枚和了の4枚目と5枚目の間のスペース
    if (index === 3 && yaku.name !== '一槓子' && yaku.name !== '一暗槓単騎' && exampleLength === 5) {
      classes.push('last-drawn-tile-spacer');
    }

    // 一槓子と一暗槓単騎の1枚目と2枚目、2枚目と3枚目の間のスペース
    if ((yaku.name === '一槓子' || yaku.name === '一暗槓単騎') && (index === 0 || index === 1)) {
      classes.push('kan-tile-spacer');
    }

    // 一槓子の6枚目を横向きにする
    if (yaku.name === '一槓子' && index === 5) {
      classes.push('tile-rotated');
    }
    return classes;
  }

</script>

<style scoped>
  /* RulePopup.vue と同様のスタイルを使用できます */
  .popup-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
  .popup-content { background-color: white; padding: 20px; border-radius: 8px; max-width: 90%; max-height: 85vh; overflow-y: auto; text-align: center; font-family: 'Helvetica Neue', Arial, sans-serif; /* フォントを元に戻す */ }
  .yaku-section { margin-bottom: 15px; }
  .yaku-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  .yaku-table th, .yaku-table td { border: 1px solid #ddd; padding: 6px; text-align: left; }
  .yaku-table th { background-color: #f2f2f2; }
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
</style>