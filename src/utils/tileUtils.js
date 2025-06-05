// src/utils/tileUtils.js

export function getTileImageUrl(tile) {
  if (tile && tile.suit && tile.rank) {
    return `/assets/images/tiles/${tile.suit}${tile.rank}.png`;
  }
  return `/assets/images/tiles/ura.png`; // 不明な牌やエラー時
}

export function tileToString(tile) {
  if (tile && tile.suit && tile.rank){
    return `${tile.suit}${tile.rank}`;
  }
  return '不明な牌';
}