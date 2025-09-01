// src/composables/useViewportHeight.js
import { ref, onMounted, onBeforeUnmount } from 'vue';

/**
 * ビューポートの高さ（innerHeight）をリアクティブに提供するVueコンポーザブル。
 * ウィンドウのリサイズやデバイスの向き変更時に高さを自動で更新します。
 * 主にモバイルブラウザでのアドレスバーの表示/非表示によるビューポートの変動に対応するために使用されます。
 * @returns {{viewportHeight: Ref<string>}} 現在のビューポートの高さをピクセル単位の文字列で返します（例: "640px"）。
 */
export function useViewportHeight() {
  // ビューポートの高さをリアクティブな参照として保持
  const viewportHeight = ref(`${window.innerHeight}px`);

  /**
   * 現在のウィンドウのinnerHeightを取得し、viewportHeightを更新する関数。
   */
  const updateHeight = () => {
    viewportHeight.value = `${window.innerHeight}px`;
  };

  // コンポーネントがマウントされた時にイベントリスナーを登録
  onMounted(() => {
    // ウィンドウのリサイズ時に高さを更新
    window.addEventListener('resize', updateHeight);
    // デバイスの向き変更時にも高さを更新
    window.addEventListener('orientationchange', updateHeight);
    // 初期表示時の高さを設定
    updateHeight();
  });

  // コンポーネントがアンマウントされる時にイベントリスナーを解除し、メモリリークを防ぐ
  onBeforeUnmount(() => {
    window.removeEventListener('resize', updateHeight);
    window.removeEventListener('orientationchange', updateHeight);
  });

  return { viewportHeight };
}
