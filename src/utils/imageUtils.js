export const compressImage = (file, targetWidth = 200, targetHeight = 200) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Canvasのサイズをターゲットサイズに設定
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // まずキャンバスを白で塗りつぶす
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 画像の長辺に合わせてスケールを計算
      const aspectRatio = img.width / img.height;
      let drawWidth = targetWidth;
      let drawHeight = targetHeight;

      if (img.width > img.height) { // 横長の画像
        drawHeight = targetWidth / aspectRatio;
        drawWidth = targetWidth;
      } else { // 縦長または正方形の画像
        drawWidth = targetHeight * aspectRatio;
        drawHeight = targetHeight;
      }

      // 描画位置を中央に調整
      const x = (targetWidth - drawWidth) / 2;
      const y = (targetHeight - drawHeight) / 2;

      // 画像をキャンバスに描画
      ctx.drawImage(img, x, y, drawWidth, drawHeight);

      // Blobとして出力
      canvas.toBlob(resolve, file.type, 0.9); // 0.9は品質
    };
    img.onerror = reject;
  });
};
