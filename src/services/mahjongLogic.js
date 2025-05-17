// src/services/mahjongLogic.js

export const SUITS = { MANZU: 'm', PINZU: 'p', SOZU: 's', JIHAI: 'z' };
export const JIHAI_TYPES = { TON: 1, NAN: 2, SHA: 3, PEI: 4, HAKU: 5, HATSU: 6, CHUN: 7 }; // 東南西北白發中

/**
 * 四牌麻雀で使用する全ての牌のリストを生成します。
 * 各牌は suit, rank, idを持ちます。
 * @returns {Array<Object>} 全ての牌の配列
 */
export function getAllTiles() {
  const tiles = [];
  let idCounter = 0;

  // 萬子、筒子、索子 (1-9) - 各4枚
  [SUITS.MANZU, SUITS.PINZU, SUITS.SOZU].forEach(suit => {
    for (let rank = 1; rank <= 9; rank++) {
      for (let i = 0; i < 4; i++) {
        tiles.push({
          suit,
          rank,
          id: `${suit}${rank}_${i}`, // 例: m1_0, m1_1, m1_2, m1_3
        });
        idCounter++;
      }
    }
  });

  // 字牌 (東南西北白發中) - 各4枚
  Object.values(JIHAI_TYPES).forEach(rank => {
    for (let i = 0; i < 4; i++) {
      tiles.push({
        suit: SUITS.JIHAI,
        rank,
        id: `${SUITS.JIHAI}${rank}_${i}` // 例: z1_0 (東), z5_0 (白)
      });
      idCounter++;
    }
  });
  return tiles;
}

/**
 * 王牌からドラ表示牌を取得します。
 * 四牌麻雀のルールに基づき、どの牌をドラ表示とするかを決定します。
 * @param {Array<Object>} deadWall 王牌の配列
 * @returns {Array<Object>} ドラ表示牌の配列 (通常は1枚)
 */
export function getDoraIndicators(deadWall) {
  if (!deadWall || deadWall.length === 0) {
    return [];
  }
  // 例: 王牌の先頭から3枚目をドラ表示牌とする (0-indexedなので2)
  // このインデックスは四牌麻雀の具体的なルールによって決定してください。
  const doraIndicatorIndex = 2; // 仮のインデックス
  if (deadWall.length > doraIndicatorIndex) {
    return [deadWall[doraIndicatorIndex]];
  }
  // 王牌が足りない場合は、取得できる範囲で返すか、空を返す
  // return [deadWall[0]]; // 最低でも1枚目を返す場合
  return []; // 足りなければ表示しない場合
}

/**
 * 牌の山をシャッフルします (Fisher-Yates shuffle)。
 * @param {Array<Object>} wall シャッフルする牌の山
 * @returns {Array<Object>} シャッフルされた牌の山 (新しい配列)
 */
export function shuffleWall(wall) {
  const shuffledWall = [...wall]; // 元の配列をコピーして変更する
  for (let i = shuffledWall.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledWall[i], shuffledWall[j]] = [shuffledWall[j], shuffledWall[i]];
  }
  return shuffledWall;
}

/**
 * 指定されたプレイヤー数と手牌の枚数で初期手牌を配ります。
 * @param {number} playerCount プレイヤー数
 * @param {Array<Object>} wall 配牌元の山牌 (この関数内で変更されます)
 * @param {number} handSize 各プレイヤーの手牌の枚数
 * @returns {{hands: Array<Array<Object>>, wall: Array<Object>}} 各プレイヤーの手牌と配牌後の山牌
 */
export function dealInitialHands(playerCount, wall, handSize) {
  const hands = Array.from({ length: playerCount }, () => []);
  for (let i = 0; i < handSize; i++) {
    for (let j = 0; j < playerCount; j++) {
      if (wall.length > 0) {
        hands[j].push(wall.pop());
      } else {
        console.warn("山牌が不足しています。");
        return { hands, wall }; // 山が尽きたら現在の状態で終了
      }
    }
  }
  // 各プレイヤーの手牌をソートする
  for (let i = 0; i < playerCount; i++) {
    hands[i] = sortHand(hands[i]);
  }
  return { hands, wall };
}

// TODO: ドラ表示牌をめくるロジック、王牌を生成するロジックなどを追加
export function revealDora(deadWall) {
    // 王牌の特定の位置からドラ表示牌を取得するロジック
    const doraIndicatorIndex = 2; // 王牌の先頭から数えて3枚目
    if (deadWall && deadWall.length > doraIndicatorIndex) {
        // TODO: 実際にドラ表示牌を「めくった」状態にする処理が必要な場合、
        // deadWall内の牌オブジェクトにフラグを立てるなどを検討。
        // ここでは単純にその牌を返す。
        return deadWall[doraIndicatorIndex];
    }
    console.warn("ドラ表示牌をめくるための十分な王牌がありません。");
    return null;
}

/**
 * 手牌をソートします (例: 字牌→萬子→筒子→索子の順、各スート内でランク昇順)。
 * @param {Array<Object>} hand ソートする手牌
 * @returns {Array<Object>} ソートされた手牌
 */
export function sortHand(hand) {
  const suitOrder = { [SUITS.MANZU]: 0, [SUITS.PINZU]: 1, [SUITS.SOZU]: 2, [SUITS.JIHAI]: 3 };
  return hand.sort((a, b) => {
    if (a.suit !== b.suit) {
      return suitOrder[a.suit] - suitOrder[b.suit];
    }
    return a.rank - b.rank;
  });
}