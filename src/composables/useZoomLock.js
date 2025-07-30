import { onMounted, onUnmounted } from 'vue';

/**
 * 画面のズームを防止する Vue コンポーザブル。
 * 2本指以上のタッチ操作を検知し、ブラウザのデフォルトのズーム動作をキャンセルします。
 */
export function useZoomLock() {
  // ズームを引き起こすタッチイベントを無効化する関数
  const preventZoom = (event) => {
    // 画面に2つ以上のタッチポイントがある場合（ピンチズーム操作）
    if (event.touches.length > 1) {
      // ブラウザのデフォルト動作（ズーム）を停止
      event.preventDefault();
    }
  };

  // コンポーネントがマウントされた時にイベントリスナーを登録
  onMounted(() => {
    // touchmoveイベントをキャプチャする。
    // { passive: false } は、preventDefault() を機能させるために不可欠なオプションです。
    document.body.addEventListener('touchmove', preventZoom, { passive: false });
  });

  // コンポーネントがアンマウントされた時にイベントリスナーを解除
  onUnmounted(() => {
    document.body.removeEventListener('touchmove', preventZoom);
  });
}
