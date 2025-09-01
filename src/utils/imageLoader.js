/**
 * 指定されたURLの画像をプリロードします。
 * 読み込みの進捗状況をコールバック関数で報告できます。
 * @param {Array<string>} urls - プリロードする画像のURLの配列。
 * @param {Function} [onProgress] - 各画像が読み込まれるたびに呼び出されるコールバック関数。
 *                                  引数として現在の進捗率（0から1の間の数値）を受け取ります。
 * @returns {Promise<void>} 全ての画像が正常に読み込まれた場合に解決されるPromise。
 *                          いずれかの画像の読み込みに失敗した場合は拒否されます。
 */
export function preloadImages(urls, onProgress = () => {}) {
  let loadedCount = 0;
  return Promise.all(
    urls.map((url) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = () => {
          loadedCount++;
          onProgress(loadedCount / urls.length);
          resolve();
        };
        img.onerror = reject;
      });
    })
  );
}
