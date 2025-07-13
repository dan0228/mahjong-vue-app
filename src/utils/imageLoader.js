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
