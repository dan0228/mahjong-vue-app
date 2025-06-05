// src/services/mahjongLogic.js

export const SUITS = { MANZU: 'm', PINZU: 'p', SOZU: 's', JIHAI: 'z' };
export const JIHAI_TYPES = { TON: 1, NAN: 2, SHA: 3, PEI: 4, HAKU: 5, HATSU: 6, CHUN: 7 }; // 東南西北白發中
export const PLAYER_WINDS = { EAST: '東', SOUTH: '南', WEST: '西', NORTH: '北' };
const WIND_ORDER = [PLAYER_WINDS.EAST, PLAYER_WINDS.SOUTH, PLAYER_WINDS.WEST, PLAYER_WINDS.NORTH];

/**
 * 四牌麻雀で使用する全ての牌のリストを生成します。
 * 各牌は suit, rank, idを持ちます。
 * @returns {Array<Object>} 全ての牌の配列
 */
export function getAllTiles() {
  const tiles = [];
  let idCounter = 0;

  // 萬子、筒子、索子 (1-9) - 各4枚
//  [SUITS.MANZU, SUITS.PINZU, SUITS.SOZU].forEach(suit => { 検証用にコメントアウト
  [SUITS.MANZU].forEach(suit => {
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

/* 検証用にコメントアウト
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
*/
  return tiles;
}

/**
 * 王牌からドラ表示牌を取得します。
 * 四牌麻雀のルールに基づき、どの牌をドラ表示とするかを決定します。
 * @param {Array<Object>} deadWall 王牌の配列
 * @returns {Array<Object>} ドラ表示牌の配列 (通常は1枚)
 * @modifies deadWall - ドラ表示牌としてマークする (例: `isDoraIndicator = true`)
 */
export function getDoraIndicators(deadWall) {
  if (!deadWall || deadWall.length === 0) {
    return [];
  }
  // 通常の麻雀では、王牌の特定の場所からドラ表示牌をめくります。
  // 例: 王牌の右から3幢目(5,6牌目)の上段の牌 (インデックス4)
  const initialDoraIndicatorIndex = 4; // 仮: 0-indexed で5番目の牌
  if (deadWall.length > initialDoraIndicatorIndex) {
    // deadWall[initialDoraIndicatorIndex].isDoraIndicator = true; // 必要であればマーク
    // console.log("Dora Indicator revealed:", deadWall[initialDoraIndicatorIndex]);
    return [deadWall[initialDoraIndicatorIndex]];
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
    // カンがあった場合、新しいドラ表示牌をめくる。
    // 通常、既存のドラ表示牌の隣(嶺上牌側)の牌をめくる。
    // deadWall 内で isDoraIndicator = true の牌を探し、その隣を新しい表示牌とする。
    // ここでは簡略化のため、王牌の固定位置から順番にめくる想定で実装。
    // (より正確には、ドラ表示牌の数と位置を管理する必要がある)
    let revealedCount = deadWall.filter(t => t.isDoraIndicator).length;
    // 例: 初期ドラ表示がインデックス4なら、次のドラ表示はインデックス6 (嶺上牌を挟む)
    // 四牌麻雀の王牌14枚: [嶺1,嶺2,表1,裏1, 表2,裏2, 表3,裏3, 表4,裏4, 予備,予備,予備,予備]
    // ドラ表示牌は 表1, 表2, 表3, 表4 の位置からめくられる
    const doraIndicatorPositions = [4, 6, 8, 10]; // 0-indexed
    if (revealedCount < doraIndicatorPositions.length && deadWall.length > doraIndicatorPositions[revealedCount]) {
        deadWall[doraIndicatorPositions[revealedCount]].isDoraIndicator = true;
        return deadWall[doraIndicatorPositions[revealedCount]];
    }
    console.warn("新しいドラ表示牌をめくるための十分な王牌がありません、または最大数です。");
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

/**
 * プレイヤーに席風を割り当てます。親が東、その上家が南、対面が西、下家が北となります。
 * @param {Array<Object>} players - プレイヤーオブジェクトの配列。各オブジェクトには `seatWind` プロパティが追加されます。
 * @param {number} dealerIndex - 親（東家）となるプレイヤーのインデックス。
 * @param {number} playerCount - プレイヤーの総数 (デフォルトは4)。
 * @returns {Array<Object>} 席風が割り当てられたプレイヤーオブジェクトの配列 (新しい配列)。
 */
export function assignPlayerWinds(players, dealerIndex, playerCount = 4) {
  // 元のプレイヤー配列を変更しないようにコピーを作成
  const updatedPlayers = players.map(player => ({ ...player }));

  for (let i = 0; i < playerCount; i++) {
    const playerActualIndex = (dealerIndex + i) % playerCount; // 親から数えてi番目のプレイヤーの実際のインデックス
    updatedPlayers[playerActualIndex].seatWind = WIND_ORDER[i];
  }
  return updatedPlayers;
}

/**
 * 嶺上牌を取得します。
 * @param {Array<Object>} deadWall 王牌の配列
 * @returns {Object|null} 嶺上牌、または取得できない場合はnull
 * @modifies deadWall - 取得した嶺上牌をdeadWallから取り除く
 */
export function drawRinshanTile(deadWall) {
    // 通常、嶺上牌は王牌の特定の位置から取ります。
    // 王牌14枚: [嶺1,嶺2,表1,裏1, 表2,裏2, 表3,裏3, 表4,裏4, 予備,予備,予備,予備]
    // 嶺上牌は通常、山の端から取ります。ここでは deadWall の先頭2枚を嶺上牌と仮定。
    if (deadWall && deadWall.length > 0) {
        // 嶺上牌がまだ残っているか確認 (例: 先頭から2枚までが嶺上牌)
        // 実際に何枚嶺上牌を使ったかを管理する必要がある。
        // ここでは単純に deadWall から pop するが、これは山の最後から取るので不適切。
        // 正しくは、王牌の構造を定義し、そこから取得する。
        // 仮に、王牌の先頭から順番に嶺上牌として使用するとする。
        // (より正確には、王牌の端からドラ表示牌をめくり、その隣から嶺上牌を取る)
        // deadWall の先頭が嶺上牌と仮定 (最大4回まで)
        const rinshanTilesArea = deadWall.slice(0, 4); // 先頭4牌が嶺上牌エリアと仮定
        const drawnRinshanTilesCount = rinshanTilesArea.filter(t => t.isRinshanDrawn).length;
        if (drawnRinshanTilesCount < 4 && rinshanTilesArea.length > drawnRinshanTilesCount) {
            const rinshanTile = rinshanTilesArea[drawnRinshanTilesCount];
            rinshanTile.isRinshanDrawn = true; // 使用済みマーク
            // deadWall から物理的に取り除く必要はないが、取得したことを示す。
            // 王牌の枚数は変わらない。
            return rinshanTile;
        }
    }
    console.warn("嶺上牌を取得できません。");
    return null;
}

/**
 * ロン和了が可能か判定します。
 * @param {Array<Object>} hand 手牌
 * @param {Object} discardedTile ロン対象の捨て牌
 * @param {Object} gameContext ゲームコンテキスト (役判定用)
 * @returns {{isWin: boolean, yaku: Array, score: number, fans: number, isYakuman: boolean, yakumanPower: number}}} 和了情報
 */
export function checkCanRon(hand, discardedTile, gameContext) {
  if (!hand || !discardedTile) {
    return { isWin: false, yaku: [], score: 0, fans: 0, isYakuman: false, yakumanPower: 0 };
  }
  // ロン和了なので、isTsumo は false
  const handForWin = [...hand, discardedTile]; // ロン牌を手牌に加える
  return checkYonhaiWin(handForWin, discardedTile, false, gameContext);
}

/**
 * ポンが可能かチェックします。
 * @param {Array<Object>} hand 手牌
 * @param {Object} discardedTile 捨てられた牌
 * @returns {boolean} ポン可能ならtrue
 */
export function checkCanPon(hand, discardedTile) {
    if (!discardedTile) return false;
    const count = hand.filter(tile => getTileKey(tile) === getTileKey(discardedTile)).length;
    return count >= 2;
}

/**
 * 明槓が可能かチェックします。
 * @param {Array<Object>} hand 手牌
 * @param {Object} discardedTile 捨てられた牌
 * @returns {boolean} 明槓可能ならtrue
 */
export function checkCanMinkan(hand, discardedTile) {
    if (!discardedTile) return false;
    const count = hand.filter(tile => getTileKey(tile) === getTileKey(discardedTile)).length;
    return count >= 3;
}

/**
 * 暗槓が可能かチェックします。
 * @param {Array<Object>} hand 手牌
 * @param {Object} drawnTile ツモった牌 (または手牌の4枚目の牌)
 * @returns {boolean} 暗槓可能ならtrue
 */
export function checkCanAnkan(hand, drawnTile) {
    if (!drawnTile) return false;
    // ツモ牌と同じ牌が手牌に3枚あるか
    const countInHand = hand.filter(tile => getTileKey(tile) === getTileKey(drawnTile)).length;
    if (countInHand === 3) return true;

    // または、手牌に同じ牌が4枚あるか (ツモ切り暗槓でない場合)
    const counts = {};
    hand.forEach(tile => {
        const key = getTileKey(tile);
        counts[key] = (counts[key] || 0) + 1;
    });
    for (const key in counts) {
        if (counts[key] === 4) return true;
    }
    return false;
}

/**
 * 加槓が可能かチェックします。
 * @param {Array<Object>} hand 手牌
 * @param {Array<Object>} melds 既存の鳴き
 * @param {Object} tileToKakan 加槓しようとする牌 (手牌にあるもの)
 * @returns {boolean} 加槓可能ならtrue
 */
export function checkCanKakan(hand, melds, tileToKakan) {
    if (!tileToKakan) return false;
    // 手牌に加槓する牌があるか
    if (!hand.some(tile => getTileKey(tile) === getTileKey(tileToKakan))) return false;
    // 既存のポンがあるか
    return melds.some(meld => meld.type === 'pon' && getTileKey(meld.tiles[0]) === getTileKey(tileToKakan));
}

// --- 四牌麻雀用ロジック ---

// 役の定義
// fans: 門前での翻数
// menzenOnly: 門前のみか
// kuisagari: 喰い下がりの翻数 (例: 1 なら1翻下がる) // 喰い下がり後の翻数を直接指定するのではなく、下がる値を指定
// exampleTiles: 役の例を示す牌の配列 (例: [{suit: 'm', rank: 1}, ...])。表示しない場合は null。
export const YONHAI_YAKU = {
  REACH: { name: "立直", fans: 1, menzenOnly: true, exampleTiles: null },
  TSUMO: { name: "門前清自摸和", fans: 1, menzenOnly: true, exampleTiles: null },
  TANYAO: { name: "断么九", fans: 1, menzenOnly: false, exampleTiles: [{suit:'m',rank:2},{suit:'m',rank:3},{suit:'m',rank:4},{suit:'p',rank:5},{suit:'p',rank:5}] },
  PINFU: { name: "平和", fans: 1, menzenOnly: true, exampleTiles: [{suit:'m',rank:9},{suit:'m',rank:9},{suit:'s',rank:5},{suit:'s',rank:6},{suit:'s',rank:7}] },
  JIKAZE: { name: "自風牌", fans: 1, menzenOnly: false, exampleTiles: [{suit:'m',rank:2},{suit:'m',rank:2},{suit:'z',rank:JIHAI_TYPES.SHA},{suit:'z',rank:JIHAI_TYPES.SHA},{suit:'z',rank:JIHAI_TYPES.SHA}] }, // 仮に西を自風
  BAKAZE: { name: "場風牌", fans: 1, menzenOnly: false, exampleTiles: [{suit:'m',rank:2},{suit:'m',rank:2},{suit:'z',rank:JIHAI_TYPES.TON},{suit:'z',rank:JIHAI_TYPES.TON},{suit:'z',rank:JIHAI_TYPES.TON}] }, // 仮に東を場風
  SANGENPAI: { name: "三元牌", fans: 1, menzenOnly: false, exampleTiles: [{suit:'s',rank:4},{suit:'s',rank:4},{suit:'z',rank:JIHAI_TYPES.HAKU},{suit:'z',rank:JIHAI_TYPES.HAKU},{suit:'z',rank:JIHAI_TYPES.HAKU}] }, // 仮に白
  CHANKAN: { name: "槍槓", fans: 1, menzenOnly: false, exampleTiles: null },
  HAITEI_RAOYUE: { name: "海底摸月", fans: 1, menzenOnly: false, exampleTiles: null },
  HOUTEI_RAOYUI: { name: "河底撈魚", fans: 1, menzenOnly: false, exampleTiles: null },
  IPPATSU: { name: "一発", fans: 1, menzenOnly: true, exampleTiles: null }, // 立直が条件
  DOUBLE_REACH: { name: "ダブル立直", fans: 2, menzenOnly: true, exampleTiles: null },
  SANGEN_DOUKOU: { name: "三色同刻", fans: 2, menzenOnly: false, exampleTiles: [{suit:'m',rank:2},{suit:'m',rank:2},{suit:'m',rank:5},{suit:'p',rank:5},{suit:'s',rank:5}] },
  TOITOI: { name: "対々和", fans: 2, menzenOnly: false, exampleTiles: [{suit:'m',rank:7},{suit:'m',rank:7},{suit:'p',rank:8},{suit:'p',rank:8},{suit:'p',rank:8}] },
  SANANKOU_DAIYO: { name: "一暗刻", fans: 2, menzenOnly: false, exampleTiles: [{suit:'m',rank:7},{suit:'m',rank:7},{suit:'m',rank:7},{suit:'p',rank:8},{suit:'p',rank:8}] }, // (暗刻) の部分は別途表示
  HONROUTOU: { name: "混老頭", fans: 2, menzenOnly: false, exampleTiles: [{suit:'p',rank:1},{suit:'p',rank:1},{suit:'p',rank:1},{suit:'z',rank:JIHAI_TYPES.NAN},{suit:'z',rank:JIHAI_TYPES.NAN}] },
  CHANTA: { name: "混全帯么九", fans: 2, menzenOnly: false, kuisagari: 1, exampleTiles: [{suit:'m',rank:7},{suit:'m',rank:8},{suit:'m',rank:9},{suit:'z',rank:JIHAI_TYPES.PEI},{suit:'z',rank:JIHAI_TYPES.PEI}] },
  JUNCHAN: { name: "純全帯么九", fans: 3, menzenOnly: false, kuisagari: 1, exampleTiles: [{suit:'m',rank:7},{suit:'m',rank:8},{suit:'m',rank:9},{suit:'s',rank:1},{suit:'s',rank:1}] },
  HONITSU: { name: "混一色", fans: 3, menzenOnly: false, kuisagari: 1, exampleTiles: [{suit:'s',rank:1},{suit:'s',rank:2},{suit:'s',rank:3},{suit:'z',rank:JIHAI_TYPES.HATSU},{suit:'z',rank:JIHAI_TYPES.HATSU}] },
  CHINITSU: { name: "清一色", fans: 3, menzenOnly: false, kuisagari: 1, exampleTiles: [{suit:'s',rank:1},{suit:'s',rank:2},{suit:'s',rank:3},{suit:'s',rank:8},{suit:'s',rank:8}] },
  // ドラ・裏ドラは動的に fans を設定するため、ここでは固定値を入れない
  DORA: { name: "ドラ", fans: 0, menzenOnly: false }, // fansは動的に計算
  URA_DORA: { name: "裏ドラ", fans: 0, menzenOnly: true }, // fansは動的に計算
};

export const YONHAI_YAKUMAN = {
  TENHOU: { name: "天和", power: 1, exampleTiles: null },
  CHIHOU: { name: "地和", power: 1, exampleTiles: null },
  RENHOU: { name: "人和", power: 1, exampleTiles: null },
  DAISANGEN: { name: "大三元", power: 1, exampleTiles: [{suit:'p',rank:4},{suit:'p',rank:4},{suit:'z',rank:JIHAI_TYPES.HAKU},{suit:'z',rank:JIHAI_TYPES.HATSU},{suit:'z',rank:JIHAI_TYPES.CHUN}] }, // 22萬白發中 のような形も含む
  TSUIISOU: { name: "字一色", power: 1, exampleTiles: [{suit:'z',rank:JIHAI_TYPES.TON},{suit:'z',rank:JIHAI_TYPES.TON},{suit:'z',rank:JIHAI_TYPES.TON},{suit:'z',rank:JIHAI_TYPES.NAN},{suit:'z',rank:JIHAI_TYPES.NAN}] },
  RYUIISOU: { name: "緑一色", power: 1, exampleTiles: [{suit:'s',rank:2},{suit:'s',rank:3},{suit:'s',rank:4},{suit:'s',rank:6},{suit:'s',rank:6}] }, // 發を含む場合は {suit:'z',rank:JIHAI_TYPES.HATSU}
  CHINROUTOU: { name: "清老頭", power: 1, exampleTiles: [{suit:'m',rank:1},{suit:'m',rank:1},{suit:'s',rank:9},{suit:'s',rank:9},{suit:'s',rank:9}] },
  SUUKANTSU_DAIYO: { name: "一槓子", power: 1, exampleTiles: [{suit:'m',rank:8},{suit:'m',rank:8},{suit:'z',rank:JIHAI_TYPES.HAKU},{suit:'z',rank:JIHAI_TYPES.HAKU},{suit:'z',rank:JIHAI_TYPES.HAKU},{suit:'z',rank:JIHAI_TYPES.HAKU}] }, // (槓子) の部分は別途表示
  SHOUSUUSHI: { name: "小四喜", power: 1, exampleTiles: [{suit:'z',rank:JIHAI_TYPES.TON},{suit:'z',rank:JIHAI_TYPES.NAN},{suit:'z',rank:JIHAI_TYPES.NAN},{suit:'z',rank:JIHAI_TYPES.SHA},{suit:'z',rank:JIHAI_TYPES.PEI}] }, // (1面待ち) の部分は別途表示
  DAISUUSHI: { name: "大四喜", power: 2, exampleTiles: [{suit:'z',rank:JIHAI_TYPES.TON},{suit:'z',rank:JIHAI_TYPES.NAN},{suit:'z',rank:JIHAI_TYPES.SHA},{suit:'z',rank:JIHAI_TYPES.PEI},{suit:'z',rank:JIHAI_TYPES.PEI}] }, // (4面待ち) の部分は別途表示
  SUUANKOU_TANKI_DAIYO: { name: "一暗槓単騎", power: 2, exampleTiles: [{suit:'m',rank:8},{suit:'m',rank:8},{suit:'z',rank:JIHAI_TYPES.HAKU},{suit:'z',rank:JIHAI_TYPES.HAKU},{suit:'z',rank:JIHAI_TYPES.HAKU},{suit:'z',rank:JIHAI_TYPES.HAKU}] } // (暗槓) の部分は別途表示
};

/**
 * 牌の文字列表現 (例: "m1", "z2") を game.js の形式 (例: "1萬", "南") に変換
 * @param {Object} tile - { suit: 'm', rank: 1 }
 * @returns {string} 例: "1萬"
 */
function formatTileForGameJs(tile) {
  if (!tile) return '';
  if (tile.suit === SUITS.MANZU) return `${tile.rank}萬`;
  if (tile.suit === SUITS.PINZU) return `${tile.rank}筒`;
  if (tile.suit === SUITS.SOZU) return `${tile.rank}索`;
  if (tile.suit === SUITS.JIHAI) {
    if (tile.rank === JIHAI_TYPES.TON) return '東';
    if (tile.rank === JIHAI_TYPES.NAN) return '南';
    if (tile.rank === JIHAI_TYPES.SHA) return '西';
    if (tile.rank === JIHAI_TYPES.PEI) return '北';
    if (tile.rank === JIHAI_TYPES.HAKU) return '白';
    if (tile.rank === JIHAI_TYPES.HATSU) return '發';
    if (tile.rank === JIHAI_TYPES.CHUN) return '中';
  }
  return '';
}

/**
 * 牌オブジェクトからキー文字列を生成 (suitとrankを結合)
 * @param {Object} tile - { suit: 'm', rank: 1 }
 * @returns {string} 例: "m1"
 */
function getTileKey(tile) {
  if (!tile) return '';
  return `${tile.suit}${tile.rank}`;
}

/**
 * 手牌中の特定の牌の数をカウント
 * @param {Array<Object>} hand - 手牌 (牌オブジェクトの配列)
 * @param {Object} targetTile - カウントする牌オブジェクト
 * @returns {number}
 */
function countSpecificTile(hand, targetTile) {
  const targetKey = getTileKey(targetTile);
  return hand.filter(tile => getTileKey(tile) === targetKey).length;
}

/**
 * 四牌麻雀の基本的な和了形を判定します。
 * (1面子 + 1雀頭)
 * 役の判定は別途行う必要があります。
 * @param {Array<Object>} hand5tiles - 手牌5枚 (ソートされていることが望ましいが、内部でソートも考慮)
 * @returns {{isWin: boolean, mentsuType: string|null, jantou: Array<Object>|null, mentsu: Array<Object>|null}} 和了情報
 */
export function checkBasicYonhaiWinCondition(hand5tiles) {
  if (!hand5tiles || hand5tiles.length !== 5) {
    return { isWin: false, mentsuType: null, jantou: null, mentsu: null };
  }

  // 牌の枚数をカウント
  const counts = {};
  hand5tiles.forEach(tile => {
    const key = `${tile.suit}${tile.rank}`;
    counts[key] = (counts[key] || 0) + 1;
  });

  // 雀頭の候補を探す
  for (const key in counts) {
    if (counts[key] >= 2) { // 雀頭の候補が見つかった
      const jantouTiles = hand5tiles.filter(t => getTileKey(t) === key).slice(0, 2); // 雀頭の牌2枚
      const remainingForMentsu = [];
      let jantouRemovedCount = 0;

      // 雀頭を除いた残りの3牌を取得
      hand5tiles.forEach(tile => {
        if (getTileKey(tile) === key && jantouRemovedCount < 2) {
          jantouRemovedCount++;
        } else {
          remainingForMentsu.push(tile);
        }
      });

      if (remainingForMentsu.length === 3) {
        const sortedMentsuCandidate = sortHand(remainingForMentsu); // 面子候補をソート
        // 残り3牌が刻子か順子かを判定
        // 刻子判定
        if (
          getTileKey(sortedMentsuCandidate[0]) === getTileKey(sortedMentsuCandidate[1]) &&
          getTileKey(sortedMentsuCandidate[1]) === getTileKey(sortedMentsuCandidate[2])
        ) {
          return { isWin: true, mentsuType: 'koutsu', jantou: jantouTiles, mentsu: sortedMentsuCandidate };
        }

        // 順子判定
        // 順子判定のためには、牌が数牌である必要がある
        if (
          sortedMentsuCandidate[0].suit !== SUITS.JIHAI && // 字牌は順子にならない
          sortedMentsuCandidate[0].suit === sortedMentsuCandidate[1].suit &&
          sortedMentsuCandidate[1].suit === sortedMentsuCandidate[2].suit &&
          sortedMentsuCandidate[1].rank === sortedMentsuCandidate[0].rank + 1 &&
          sortedMentsuCandidate[2].rank === sortedMentsuCandidate[1].rank + 1
        ) {
          return { isWin: true, mentsuType: 'shuntsu', jantou: jantouTiles, mentsu: sortedMentsuCandidate };
        }
      }
    }
  }
  return { isWin: false, mentsuType: null, jantou: null, mentsu: null }; // どの組み合わせでも和了形にならなかった
}

/**
 * 四牌麻雀の役判定を行う
 * @param {Object} handData - 役判定に必要なデータオブジェクト
 * @param {Array<Object>} handData.hand - 和了時の手牌5枚 (ソート済み)
 * @param {Object} handData.winTile - 和了牌
 * @param {boolean} handData.isTsumo - ツモ和了か
 * @param {Array<Object>} handData.melds - 副露 (四牌麻雀ではポン・カンのみ)
 * @param {string} handData.playerWind - 自風 (PLAYER_WINDSの値)
 * @param {string} handData.roundWind - 場風 (PLAYER_WINDSの値)
 * @param {Array<Object>} handData.doraIndicators - ドラ表示牌
 * @param {Array<Object>} handData.uraDoraIndicators - 裏ドラ表示牌
 * @param {boolean} handData.isParent - 親かどうか
 * @param {number} handData.turnCount - 現在の巡目 (人和などの判定用)
 * @param {Object} handData.basicWinInfo - checkBasicYonhaiWinConditionの結果
 * @param {boolean} handData.isRiichi - リーチしているか
 * @param {boolean} handData.isDoubleRiichi - ダブルリーチしているか
 * @param {boolean} handData.isIppatsu - 一発の可能性があるか (リーチ後1巡以内、かつ他家からの鳴きなし)
 * @param {boolean} handData.isHaitei - 海底牌での和了か
 * @param {boolean} handData.isHoutei - 河底牌での和了か
 * @param {boolean} handData.isChankan - 槍槓での和了か
 * @param {boolean} handData.isTenho - 天和の可能性があるか (親の配牌即和了)
 * @param {boolean} handData.isChiho - 地和の可能性があるか (子の配牌後第一ツモでの和了、鳴きなし)
 * @param {boolean} handData.isRenho - 人和の可能性があるか (子の配牌後、他家の第一打牌でのロン和了、鳴きなし)
 * @param {number} handData.remainingTilesCount - 残り山牌の数
 * @returns {{yaku: Array<Object>, fans: number, yakuman: Array<Object>, yakumanPower: number}}
 */
function calculateYonhaiYaku(handData) {
  const yakuList = [];
  let totalFans = 0;
  const yakumanList = [];
  let totalYakumanPower = 0;

  const { hand, winTile, isTsumo, melds = [], playerWind, roundWind, doraIndicators = [], uraDoraIndicators = [], isRiichi, isDoubleRiichi, isIppatsu, isHaitei, isHoutei, isChankan, isTenho, isChiho, isRenho, remainingTilesCount, isParent, turnCount } = handData;
  const isMenzen = (melds || []).length === 0;
  const basicWinInfo = handData.basicWinInfo || checkBasicYonhaiWinCondition(hand); // handDataから受け取るか、なければ再計算

  // 役満判定 (優先)
  // 天和 (Tenhou)
  if (isTenho) {
    yakumanList.push(YONHAI_YAKUMAN.TENHOU);
    totalYakumanPower += YONHAI_YAKUMAN.TENHOU.power;
  }
  // 地和 (Chiho)
  if (isChiho && !isTenho) {
    yakumanList.push(YONHAI_YAKUMAN.CHIHOU);
    totalYakumanPower += YONHAI_YAKUMAN.CHIHOU.power;
  }
  // 人和 (Renhou)
  if (isRenho && !isTenho && !isChiho) {
    yakumanList.push(YONHAI_YAKUMAN.RENHOU);
    totalYakumanPower += YONHAI_YAKUMAN.RENHOU.power;
  }
  // 字一色 (Tsuiisou)
  if (isYonhaiTsuiisou(handData, basicWinInfo)) {
    yakumanList.push(YONHAI_YAKUMAN.TSUIISOU);
    totalYakumanPower += YONHAI_YAKUMAN.TSUIISOU.power;
  }
  // 大三元 (Daisangen) - 特殊ルール: 白發中各1枚 + 雀頭2枚
  if (isYonhaiDaisangen(handData, basicWinInfo)) {
    yakumanList.push(YONHAI_YAKUMAN.DAISANGEN);
    totalYakumanPower += YONHAI_YAKUMAN.DAISANGEN.power;
  }
  // 緑一色 (Ryuiisou)
  if (isYonhaiRyuiisou(handData, basicWinInfo)) {
    yakumanList.push(YONHAI_YAKUMAN.RYUIISOU);
    totalYakumanPower += YONHAI_YAKUMAN.RYUIISOU.power;
  }
  // 清老頭 (Chinroutou)
  if (isYonhaiChinroutou(handData, basicWinInfo)) {
    yakumanList.push(YONHAI_YAKUMAN.CHINROUTOU);
    totalYakumanPower += YONHAI_YAKUMAN.CHINROUTOU.power;
  }
  // 一槓子 (Iikantsu) - 四槓子の代用
  if (isYonhaiIikantsu(handData, basicWinInfo)) {
    yakumanList.push(YONHAI_YAKUMAN.SUUKANTSU_DAIYO);
    totalYakumanPower += YONHAI_YAKUMAN.SUUKANTSU_DAIYO.power;
  }
  // 小四喜 (Shousuushi)
  if (isYonhaiShousuushi(handData, basicWinInfo)) {
    yakumanList.push(YONHAI_YAKUMAN.SHOUSUUSHI);
    totalYakumanPower += YONHAI_YAKUMAN.SHOUSUUSHI.power;
  }
  // 大四喜 (Daisuushi)
  if (isYonhaiDaisuushi(handData, basicWinInfo)) {
    yakumanList.push(YONHAI_YAKUMAN.DAISUUSHI);
    totalYakumanPower += YONHAI_YAKUMAN.DAISUUSHI.power;
  }
  // 一暗槓単騎 (Iiankantanki) - 四暗刻単騎の代用
  if (isYonhaiIiankantanki(handData, basicWinInfo)) {
    yakumanList.push(YONHAI_YAKUMAN.SUUANKOU_TANKI_DAIYO);
    totalYakumanPower += YONHAI_YAKUMAN.SUUANKOU_TANKI_DAIYO.power;
  }

  // 通常役判定
  // 門前清自摸和 (Menzen Tsumo)
  if (isMenzen && isTsumo) {
    yakuList.push(YONHAI_YAKU.TSUMO);
    totalFans += YONHAI_YAKU.TSUMO.fans;
  }
  // 立直 (Reach)
  if (isRiichi && !isDoubleRiichi && isMenzen) {
    yakuList.push(YONHAI_YAKU.REACH);
    totalFans += YONHAI_YAKU.REACH.fans;
  }
  // ダブル立直 (Double Reach)
  if (isDoubleRiichi && isMenzen) {
    yakuList.push(YONHAI_YAKU.DOUBLE_REACH);
    totalFans += YONHAI_YAKU.DOUBLE_REACH.fans;
  }
  // 一発 (Ippatsu)
  if (isIppatsu && (isRiichi || isDoubleRiichi) && isMenzen) {
    yakuList.push(YONHAI_YAKU.IPPATSU);
    totalFans += YONHAI_YAKU.IPPATSU.fans;
  }
  // 断么九 (Tanyao)
  if (isYonhaiTanyao(handData, basicWinInfo)) {
    yakuList.push(YONHAI_YAKU.TANYAO);
    totalFans += YONHAI_YAKU.TANYAO.fans;
  }
  // 対々和 (Toitoiho) - 鳴いて単騎か、三色同刻か、刻子持ちなら対々和
  if (basicWinInfo.isWin && basicWinInfo.mentsuType === 'koutsu') {
    // 平和とは複合しない想定 (平和は順子が必要)
    // isYonhaiPinfu の判定が先に行われ、平和でない場合にこちらが評価される
    if (!yakuList.some(y => y.name === YONHAI_YAKU.PINFU.name)) {
      if (isYonhaiToitoi(handData, basicWinInfo)) { // basicWinInfoを渡す
        yakuList.push(YONHAI_YAKU.TOITOI);
        totalFans += YONHAI_YAKU.TOITOI.fans;
      }
    }
  }
  // 自風牌・場風牌・三元牌
  const tileCounts = {};
  hand.forEach(t => {
    const key = getTileKey(t);
    tileCounts[key] = (tileCounts[key] || 0) + 1;
  });

  // 役牌の判定 (刻子になっている場合)
  // 刻子になっていれば役牌
  const koutsuTiles = [];
  for (const key in tileCounts) { // 手牌中の刻子候補
    if (tileCounts[key] >= 3) koutsuTiles.push(key);
  }
  melds.filter(m => m.type === 'pon' || m.type === 'ankan' || m.type === 'minkan' || m.type === 'kakan').forEach(m => {
    koutsuTiles.push(getTileKey(m.tiles[0])); // 刻子の代表牌
  });

  koutsuTiles.forEach(koutsuKey => {
    const tileObj = { suit: koutsuKey.charAt(0), rank: parseInt(koutsuKey.substring(1)) };
    if (isYakuhai(tileObj, playerWind, roundWind, 'player') && !yakuList.some(y => y.name === YONHAI_YAKU.JIKAZE.name)) {
        yakuList.push(YONHAI_YAKU.JIKAZE); totalFans += YONHAI_YAKU.JIKAZE.fans;
    }
    if (isYakuhai(tileObj, playerWind, roundWind, 'round') && !yakuList.some(y => y.name === YONHAI_YAKU.BAKAZE.name)) {
        yakuList.push(YONHAI_YAKU.BAKAZE); totalFans += YONHAI_YAKU.BAKAZE.fans;
    }
    if (isYakuhai(tileObj, playerWind, roundWind, 'sangen')) {
      if (!yakuList.some(y => y.name === YONHAI_YAKU.SANGENPAI.name && getTileKey(y.tile) === getTileKey(tileObj))) {
        yakuList.push({ ...YONHAI_YAKU.SANGENPAI, tile: tileObj }); // どの三元牌かを記録
        totalFans += YONHAI_YAKU.SANGENPAI.fans;
      }
    }
  });
  // 平和 (Pinfu)
  if (isYonhaiPinfu(handData, basicWinInfo)) { // basicWinInfoを渡す
    yakuList.push(YONHAI_YAKU.PINFU);
    totalFans += YONHAI_YAKU.PINFU.fans;
  }
  // 混老頭 (Honroutou)
  if (isYonhaiHonroutou(handData, basicWinInfo)) {
    yakuList.push(YONHAI_YAKU.HONROUTOU);
    totalFans += YONHAI_YAKU.HONROUTOU.fans;
  }
  // 一暗刻 (Sanankou Daiyo)
  if (isYonhaiIianko(handData, basicWinInfo)) {
    yakuList.push(YONHAI_YAKU.SANANKOU_DAIYO);
    totalFans += YONHAI_YAKU.SANANKOU_DAIYO.fans;
  }
  // 三色同刻 (Sangen Doukou)
  if (isYonhaiSanshokuDoukou(handData, basicWinInfo)) {
    yakuList.push(YONHAI_YAKU.SANGEN_DOUKOU);
    totalFans += YONHAI_YAKU.SANGEN_DOUKOU.fans;
  }
  // 混全帯么九 (Chanta)
  if (isYonhaiChanta(handData, basicWinInfo)) {
    const yaku = YONHAI_YAKU.CHANTA;
    yakuList.push(yaku);
    totalFans += isMenzen ? yaku.fans : (yaku.fans - (yaku.kuisagari || 0));
  }
  // 純全帯么九 (Junchan)
  if (isYonhaiJunchan(handData, basicWinInfo)) {
    const yaku = YONHAI_YAKU.JUNCHAN;
    yakuList.push(yaku);
    totalFans += isMenzen ? yaku.fans : (yaku.fans - (yaku.kuisagari || 0));
  }
  // 混一色 (Honitsu)
  if (isYonhaiHonitsu(handData, basicWinInfo)) {
    const yaku = YONHAI_YAKU.HONITSU;
    yakuList.push(yaku);
    totalFans += isMenzen ? yaku.fans : (yaku.fans - (yaku.kuisagari || 0));
  }
  // 清一色 (Chinitsu)
  if (isYonhaiChinitsu(handData, basicWinInfo)) {
    const yaku = YONHAI_YAKU.CHINITSU;
    yakuList.push(yaku);
    totalFans += isMenzen ? yaku.fans : (yaku.fans - (yaku.kuisagari || 0));
  }
  // 槍槓 (Chankan)
  if (isChankan) {
    yakuList.push(YONHAI_YAKU.CHANKAN);
    totalFans += YONHAI_YAKU.CHANKAN.fans;
  }
  // 海底摸月 (Haitei Raoyue)
  if (isHaitei && isTsumo) {
    yakuList.push(YONHAI_YAKU.HAITEI_RAOYUE);
    totalFans += YONHAI_YAKU.HAITEI_RAOYUE.fans;
  }
  // 河底撈魚 (Houtei Raoyui)
  if (isHoutei && !isTsumo) {
    yakuList.push(YONHAI_YAKU.HOUTEI_RAOYUI);
    totalFans += YONHAI_YAKU.HOUTEI_RAOYUI.fans;
  }
  // ドラ・裏ドラの計算
  const doraCount = countDora(hand, doraIndicators);
  if (doraCount > 0) {
    yakuList.push({ ...YONHAI_YAKU.DORA, fans: doraCount });
    totalFans += doraCount;
  }
  if (isRiichi && handData.uraDoraIndicators && handData.uraDoraIndicators.length > 0) {
    const uraDoraCount = countDora(handData.hand, handData.uraDoraIndicators);
    if (uraDoraCount > 0) {
      yakuList.push({ ...YONHAI_YAKU.URA_DORA, name: `${YONHAI_YAKU.URA_DORA.name}${uraDoraCount}`, fans: uraDoraCount });
      totalFans += uraDoraCount;
    }
  }

  // 役満が成立している場合は、役満のみを返す (通常役とは複合しない)
  if (totalYakumanPower > 0) {
    return { yaku: [], fans: 0, yakuman: yakumanList, yakumanPower: totalYakumanPower };
  }
  return { yaku: yakuList, fans: totalFans, yakuman: [], yakumanPower: 0 };
}

// --- 各役の判定関数の実装 ---
// isTenho, isChiho, isRenho は handData のフラグで判定済み

/**
 * 役牌かどうかを判定するヘルパー関数
 * @param {Object} tile - 判定対象の牌オブジェクト
 * @param {string} playerWind - 自風
 * @param {string} roundWind - 場風
 * @param {'player'|'round'|'sangen'} type - 判定タイプ
 * @returns {boolean}
 */
function isYakuhai(tile, playerWind, roundWind, type) {
  if (!tile || tile.suit !== SUITS.JIHAI) return false;
  if (type === 'player') return formatTileForGameJs(tile) === playerWind;
  if (type === 'round') {
    // PLAYER_WINDS.EAST は '東'
    // roundWind は '東' (PLAYER_WINDSの値)
    return formatTileForGameJs(tile) === roundWind && roundWind === PLAYER_WINDS.EAST; // 東場のみなので常に場風は東
  }
  if (type === 'sangen') {
    return tile.rank === JIHAI_TYPES.HAKU || tile.rank === JIHAI_TYPES.HATSU || tile.rank === JIHAI_TYPES.CHUN;
  }
  return false;
}

/**
 * ドラの枚数をカウントする
 * @param {Array<Object>} hand - 手牌
 * @param {Array<Object>} doraIndicators - ドラ表示牌
 * @returns {number} ドラの枚数
 */
function countDora(hand, doraIndicators) {
  let doraCount = 0;
  if (!doraIndicators || doraIndicators.length === 0) return 0;

  const actualDoraTiles = doraIndicators.map(indicator => getNextTile(indicator));

  hand.forEach(handTile => {
    actualDoraTiles.forEach(doraTile => {
      if (doraTile && handTile.suit === doraTile.suit && handTile.rank === doraTile.rank) {
        doraCount++;
      }
    });
  });
  return doraCount;
}

/**
 * ドラ表示牌の次の牌（実際のドラ牌）を取得する
 * @param {Object} indicatorTile - ドラ表示牌
 * @returns {Object|null} ドラ牌、またはnull
 */
export function getNextTile(indicatorTile) {
  if (!indicatorTile) return null;
  let { suit, rank } = indicatorTile;

  if (suit !== SUITS.JIHAI) { // 数牌
      rank = rank === 9 ? 1 : rank + 1;
  } else { // 字牌
      if (rank >= JIHAI_TYPES.TON && rank <= JIHAI_TYPES.PEI) { // 風牌
          rank = rank === JIHAI_TYPES.PEI ? JIHAI_TYPES.TON : rank + 1;
      } else if (rank >= JIHAI_TYPES.HAKU && rank <= JIHAI_TYPES.CHUN) { // 三元牌
          rank = rank === JIHAI_TYPES.CHUN ? JIHAI_TYPES.HAKU : rank + 1;
      }
  }
  return { suit, rank, id: `${suit}${rank}_dora` }; // idは仮
}


// 四牌麻雀: 大三元 (白發中各1枚 + 雀頭2枚)
function isYonhaiDaisangen(handData) {
  const { hand } = handData;
  if (hand.length !== 5) return false;

  const hasHaku = hand.some(t => t.suit === SUITS.JIHAI && t.rank === JIHAI_TYPES.HAKU);
  const hasHatsu = hand.some(t => t.suit === SUITS.JIHAI && t.rank === JIHAI_TYPES.HATSU);
  const hasChun = hand.some(t => t.suit === SUITS.JIHAI && t.rank === JIHAI_TYPES.CHUN);

  if (!(hasHaku && hasHatsu && hasChun)) return false;

  // 白發中を1枚ずつ除いた残りの2枚が雀頭になっているか
  const sangenTilesKeys = [
    getTileKey({ suit: SUITS.JIHAI, rank: JIHAI_TYPES.HAKU }),
    getTileKey({ suit: SUITS.JIHAI, rank: JIHAI_TYPES.HATSU }),
    getTileKey({ suit: SUITS.JIHAI, rank: JIHAI_TYPES.CHUN }),
  ];
  const remaining = [];
  const handKeys = hand.map(t => getTileKey(t));
  const usedSangen = new Set();

  for (const tileKey of handKeys) {
    if (sangenTilesKeys.includes(tileKey) && !usedSangen.has(tileKey)) {
      usedSangen.add(tileKey);
    } else {
      remaining.push(hand.find(t => getTileKey(t) === tileKey)); // 元の牌オブジェクトを保持
    }
  }
  // remainingの長さが2で、かつ同じ牌（雀頭）であれば大三元
  return remaining.length === 2 && getTileKey(remaining[0]) === getTileKey(remaining[1]);
}

// 四牌麻雀: 字一色 
function isYonhaiTsuiisou(handData, basicWinInfo) {
  const { hand, melds } = handData;
  if (!basicWinInfo.isWin) return false;
  const allTiles = [...hand, ...melds.flatMap(m => m.tiles)]; // meldsの牌も考慮
  return allTiles.every(tile => tile.suit === SUITS.JIHAI);
}

// 四牌麻雀: 緑一色
function isYonhaiRyuiisou(handData, basicWinInfo) {
  const { hand, melds } = handData;
  if (!basicWinInfo.isWin) return false;
  const allTiles = [...hand, ...melds.flatMap(m => m.tiles)];
  const greenTiles = [
    getTileKey({ suit: SUITS.SOZU, rank: 2 }),
    getTileKey({ suit: SUITS.SOZU, rank: 3 }),
    getTileKey({ suit: SUITS.SOZU, rank: 4 }),
    getTileKey({ suit: SUITS.SOZU, rank: 6 }),
    getTileKey({ suit: SUITS.SOZU, rank: 8 }),
    getTileKey({ suit: SUITS.JIHAI, rank: JIHAI_TYPES.HATSU }), // 發
  ];
  return allTiles.every(tile => greenTiles.includes(getTileKey(tile)));
}

// 四牌麻雀: 清老頭
function isYonhaiChinroutou(handData, basicWinInfo) {
  const { hand, melds } = handData;
  if (!basicWinInfo.isWin) return false;
  const allTiles = [...hand, ...melds.flatMap(m => m.tiles)];
  const terminalTiles = [1, 9];
  return allTiles.every(tile =>
    tile.suit !== SUITS.JIHAI && terminalTiles.includes(tile.rank)
  );
}

// 四牌麻雀: 一槓子 (四槓子の代用)
function isYonhaiIikantsu(handData, basicWinInfo) {
  const { melds, hand } = handData;
  if (!basicWinInfo.isWin) return false;
  const kanCount = melds.filter(m => m.type === 'ankan' || m.type === 'minkan' || m.type === 'kakan').length;
  return kanCount === 1;
}

// 四牌麻雀: 小四喜
function isYonhaiShousuushi(handData, basicWinInfo) {
  const { hand, winTile } = handData; // hand は和了形5枚
  if (!basicWinInfo.isWin) return false;
  if (hand.length !== 5) return false;

  const windTiles = [JIHAI_TYPES.TON, JIHAI_TYPES.NAN, JIHAI_TYPES.SHA, JIHAI_TYPES.PEI];
  const handWindCounts = {};
  windTiles.forEach(wt => handWindCounts[wt] = 0);
  let distinctWindTypesInAgariHand = 0;

  hand.forEach(tile => {
    if (tile.suit === SUITS.JIHAI && windTiles.includes(tile.rank)) {
      handWindCounts[tile.rank]++;
      if (handWindCounts[tile.rank] === 1) {
        distinctWindTypesInAgariHand++;
      }
    }
  });
  // 1. 和了形5枚に4種類の風牌が全て含まれているか
  if (distinctWindTypesInAgariHand !== 4) return false;

  // 2. 和了形5枚の中で、いずれかの風牌が雀頭を形成しているか
  let hasWindJantouInAgariHand = false;
  for (const rank of windTiles) {
    if (handWindCounts[rank] >= 2) {
      hasWindJantouInAgariHand = true;
      break;
    }
  }
  if (!hasWindJantouInAgariHand) return false;

  // 3. 和了牌を除いた手牌4枚の時点で、3種類の風牌しかなく、そのうち1種が雀頭であったか
  const winTileKey = getTileKey(winTile);
  let winTileRemoved = false;
  const originalHand4 = [];
  for (const tile of hand) {
    if (getTileKey(tile) === winTileKey && !winTileRemoved) {
      winTileRemoved = true;
    } else {
      originalHand4.push(tile);
    }
  }
  if (originalHand4.length !== 4) return false;

  const originalHandWindCounts = {};
  windTiles.forEach(wt => originalHandWindCounts[wt] = 0);
  let distinctWindTypesInOriginalHand4 = 0;
  originalHand4.forEach(tile => {
    if (tile.suit === SUITS.JIHAI && windTiles.includes(tile.rank)) {
      originalHandWindCounts[tile.rank]++;
      if (originalHandWindCounts[tile.rank] === 1) {
        distinctWindTypesInOriginalHand4++;
      }
    }
  });

  let hasJantouInOriginalHand4 = false;
  for (const rank of windTiles) {
    if (originalHandWindCounts[rank] >= 2) {
      hasJantouInOriginalHand4 = true;
      break;
    }
  }

  return distinctWindTypesInOriginalHand4 === 3 && hasJantouInOriginalHand4;
}

// 四牌麻雀: 大四喜
function isYonhaiDaisuushi(handData, basicWinInfo) {
  const { hand, winTile } = handData; // hand は和了形5枚
  if (!basicWinInfo.isWin) return false;
  if (hand.length !== 5) return false;

  const windTiles = [JIHAI_TYPES.TON, JIHAI_TYPES.NAN, JIHAI_TYPES.SHA, JIHAI_TYPES.PEI];
  const tileCounts = {};
  windTiles.forEach(wt => tileCounts[wt] = 0); // handWindCounts の代わりに tileCounts を初期化
  let distinctWindTypesInAgariHand = 0;

  hand.forEach(t => {
    const key = getTileKey(t);
    tileCounts[key] = (tileCounts[key] || 0) + 1;
    if (t.suit === SUITS.JIHAI && windTiles.includes(t.rank)) {
      if (tileCounts[key] === 1 && windTiles.some(wt => getTileKey({suit: SUITS.JIHAI, rank: wt}) === key) ) { // 風牌の初回出現
        distinctWindTypesInAgariHand++;
      }
    }
  });
  let windKoutsuCount = 0;
  windTiles.forEach(wtRank => {
    if (tileCounts[getTileKey({suit: SUITS.JIHAI, rank: wtRank})] >= 3) {
      windKoutsuCount++;
    }
  });
  // 1. 和了形5枚に4種類の風牌が全て含まれているか
  if (distinctWindTypesInAgariHand !== 4) return false;

  // 2. 和了形5枚の中で、いずれかの風牌が雀頭を形成しているか
  let hasWindJantouInAgariHand = false;
  for (const rank of windTiles) {
    if (tileCounts[getTileKey({suit: SUITS.JIHAI, rank: rank})] >= 2) {
      hasWindJantouInAgariHand = true;
      break;
    }
  }
  if (!hasWindJantouInAgariHand) return false;

  // 3. 和了牌を除いた手牌4枚の時点で、4種類の風牌が全て揃っていたか
  const winTileKey = getTileKey(winTile);
  let winTileRemoved = false;
  const originalHand4 = [];
  for (const tile of hand) {
    if (getTileKey(tile) === winTileKey && !winTileRemoved) {
      winTileRemoved = true;
    } else {
      originalHand4.push(tile);
    }
  }
  if (originalHand4.length !== 4) return false;

  const originalHandWindCounts = {};
  windTiles.forEach(wt => originalHandWindCounts[wt] = 0);
  let distinctWindTypesInOriginalHand4 = 0;
  originalHand4.forEach(tile => {
    if (tile.suit === SUITS.JIHAI && windTiles.includes(tile.rank)) {
      originalHandWindCounts[tile.rank]++;
      if (originalHandWindCounts[tile.rank] === 1) {
        distinctWindTypesInOriginalHand4++;
      }
    }
  });

  return distinctWindTypesInOriginalHand4 === 4;
}

// 四牌麻雀: 一暗槓単騎 (四暗刻単騎の代用)
function isYonhaiIiankantanki(handData) { // 四暗刻単騎の代用 (一暗槓単騎)
  const { melds, hand, winTile, basicWinInfo } = handData; // basicWinInfo を追加
  if (!basicWinInfo.isWin) return false;
  const ankanCount = melds.filter(m => m.type === 'ankan').length;
  if (ankanCount !== 1) return false;
  return hand.length === 1 && getTileKey(hand[0]) === getTileKey(winTile);
}

// 四牌麻雀：タンヤオ
function isYonhaiTanyao(handData) {
  const { hand, melds, basicWinInfo } = handData; // basicWinInfo を追加
  if (!basicWinInfo.isWin) return false;
  const allTiles = [...hand, ...melds.flatMap(m => m.tiles)];
  return allTiles.every(tile =>
    tile.suit !== SUITS.JIHAI && tile.rank !== 1 && tile.rank !== 9
  );
}

// 四牌麻雀: リーチ
function checkYonhaiRiichi(handData) {
  const { isRiichi, isDoubleRiichi, isMenzen } = handData;
  if (!isMenzen) return null;
  if (isDoubleRiichi) return 'ダブル立直';
  if (isRiichi) return '立直';
  return null;
}

// 四牌麻雀: 平和
function isYonhaiPinfu(handData, basicWinInfo) { // basicWinInfoParam を basicWinInfo に変更
  const { hand, winTile, melds, playerWind, roundWind } = handData;
  if (melds.length > 0) return false; // 門前限定

  // basicWinInfo が渡されていない場合 (直接呼び出された場合など) は、ここで取得
  const currentBasicWinInfo = basicWinInfo; // calculateYonhaiYaku から渡される前提

  // 1. 面子が順子であること
  if (!currentBasicWinInfo.isWin || currentBasicWinInfo.mentsuType !== 'shuntsu') {
    return false;
  }
  
  // 2. 雀頭が役牌でないこと
  const jantouTile = currentBasicWinInfo.jantou[0]; // 雀頭の最初の牌で代表
  if (isYakuhai(jantouTile, playerWind, roundWind, 'player') ||
      isYakuhai(jantouTile, playerWind, roundWind, 'round') ||
      isYakuhai(jantouTile, playerWind, roundWind, 'sangen')) {
    return false;
  }

  // 和了牌が雀頭の一部であった場合は平和ではない
  if (getTileKey(winTile) === getTileKey(jantouTile)) {
    return false;
  }

  // 3. 待ちの形が両面待ちであること (「頭と和了牌を除いた2牌を抽出し、1,9牌を含まず隣り合っているか」)
  const winTileKey = getTileKey(winTile);
  const mentsuTileKeys = currentBasicWinInfo.mentsu.map(t => getTileKey(t)); // 面子のキー

  if (winTileKey === mentsuTileKeys[1]) { // カンチャン待ち
    return false;
  }

  // 両面待ちの判定: 和了牌が順子の端であり、その順子を構成する他の2枚が連番であること。
  // かつ、その2枚が1や9を含まない（ペンチャン待ちとの区別）。
  let remainingTwoInShuntsu = [];
  if (winTileKey === mentsuTileKeys[0]) {
    remainingTwoInShuntsu = [currentBasicWinInfo.mentsu[1], currentBasicWinInfo.mentsu[2]];
  } else if (winTileKey === mentsuTileKeys[2]) {
    remainingTwoInShuntsu = [currentBasicWinInfo.mentsu[0], currentBasicWinInfo.mentsu[1]];
  } else {
    return false;
  }

  // 残った2枚が数牌で、隣り合っており、1や9を含まないか
  // 手牌5枚 = [雀頭A, 雀頭A] + [順子B, 順子C, 順子D] (B,C,Dは連続)
  // 和了牌がX。
  // 「頭と和了牌を除いた2牌」とは、手牌5枚から雀頭2枚と和了牌Xを除いた2枚。
  // この2枚がY, Zだとする。Y, Zが数牌で、1,9を含まず、隣り合っていれば両面待ち。

  const handWithoutJantouAndWinTile = [];
  let winTileRemoved = false;
  let tempJantouRemovedCount = 0;

  hand.forEach(tile => {
    const tileKey = getTileKey(tile);
    if (tileKey === getTileKey(jantouTile) && tempJantouRemovedCount < 2) {
      tempJantouRemovedCount++;
    } else if (tileKey === winTileKey && !winTileRemoved) {
      winTileRemoved = true;
    } else {
      handWithoutJantouAndWinTile.push(tile);
    }
  });

  if (handWithoutJantouAndWinTile.length !== 2) {
    return false;
  }

  const [y, z] = sortHand(handWithoutJantouAndWinTile); // ソートしておく

  // 1,9牌を含まず、隣り合っているか
  if (y.suit === SUITS.JIHAI || z.suit === SUITS.JIHAI) return false; // 数牌であること
  if (y.rank === 1 || y.rank === 9 || z.rank === 1 || z.rank === 9) return false; // 1,9牌を含まない
  if (y.suit !== z.suit || z.rank !== y.rank + 1) return false; // 隣り合っていない

  return true; // 全ての平和の条件を満たした
}

// 四牌麻雀: 対々和
function isYonhaiToitoi(handData, basicWinInfo) {
  const { hand, melds } = handData;

  // 面子が刻子でなければ対々和ではない
  if (!basicWinInfo.isWin || basicWinInfo.mentsuType !== 'koutsu') {
    return false;
  }

  // 1. 鳴いている場合:
  //   四牌麻雀の1面子1雀頭なので、鳴きが1つでそれがポンまたはカン（刻子系）であり、
  //   残りの手牌2枚が雀頭を形成していれば対々和。
  if (melds && melds.length === 1) {
    const meld = melds[0];
    if (meld.type === 'pon' || meld.type === 'minkan' || meld.type === 'ankan' || meld.type === 'kakan') {
      return true; // 鳴いた面子が刻子で、和了形が1面子1雀頭ならOK
    }
  }

  // 2. 門前の場合 (鳴きなし):
  if (!melds || melds.length === 0) {
    return true; // 門前で面子が刻子ならOK
  }
  return false;
}

// 四牌麻雀: 一暗刻 (三暗刻の代用で一暗刻)
function isYonhaiIianko(handData) { // game.js isIianko (三暗刻の代用で一暗刻)
  const { hand, melds, isTsumo, winTile, basicWinInfo } = handData; // basicWinInfo を追加
  if (!basicWinInfo.isWin) return false;
  if (melds.some(m => m.type !== 'ankan')) return false; // 暗槓以外の鳴きがあれば不可

  // 手牌から刻子を特定
  const counts = {};
  hand.forEach(t => counts[getTileKey(t)] = (counts[getTileKey(t)] || 0) + 1);
  let ankouKey = null;
  for (const key in counts) {
    if (counts[key] >= 3) {
      ankouKey = key;
      break;
    }
  }
  if (!ankouKey) return false; // 暗刻がない

  // ツモ和了ならその暗刻が成立
  if (isTsumo) return true;

  // ロン和了の場合、和了牌が暗刻の構成牌でなく、かつ雀頭の一部であること
  // (暗刻が和了牌で作られた場合は明刻扱い)
  const winTileKey = getTileKey(winTile);
  if (winTileKey === ankouKey) return false; // 和了牌が暗刻の一部ならダメ

  return true; // ロンで、和了牌が暗刻と関係なければOK
}

// 四牌麻雀: 混老頭 (全て幺九牌)
function isYonhaiHonroutou(handData, basicWinInfo) {
  const { hand, melds } = handData;
  if (!basicWinInfo.isWin) return false;
  const allTiles = [...hand, ...melds.flatMap(m => m.tiles)];
  const isYaochuhai = (tile) => {
    if (tile.suit === SUITS.JIHAI) return true;
    return tile.rank === 1 || tile.rank === 9;
  };
  return allTiles.every(isYaochuhai);
}

// 四牌麻雀: 混全帯么九 (チャンタ)
function isYonhaiChanta(handData, basicWinInfo) {
  const { hand, melds } = handData;
  if (!basicWinInfo.isWin) return false;

  const allGroups = []; // [ [雀頭], [面子] ] または [ [雀頭], [鳴いた面子] ]
  if (melds.length > 0) {
    if (melds.length === 1 && hand.length === 2 && getTileKey(hand[0]) === getTileKey(hand[1])) { // 1鳴き1雀頭
      allGroups.push(hand); // 雀頭
      allGroups.push(melds[0].tiles); // 鳴いた面子
    } else {
      return false; // 四牌麻雀の1面子1雀頭ではありえない形
    }
  } else { // 門前
    allGroups.push(basicWinInfo.jantou);
    allGroups.push(basicWinInfo.mentsu);
  }

  const isYaochuhai = (tile) => (tile.suit === SUITS.JIHAI || tile.rank === 1 || tile.rank === 9);
  if (!allGroups.every(group => group.some(isYaochuhai))) return false;
  return allGroups.flat().some(tile => tile.suit === SUITS.JIHAI);
}

// 四牌麻雀: 純全帯么九 (ジュンチャン)
function isYonhaiJunchan(handData, basicWinInfo) {
  const { hand, melds } = handData;
  if (!basicWinInfo.isWin) return false;

  const allGroups = [];
  if (melds.length > 0) {
    if (melds.length === 1 && hand.length === 2 && getTileKey(hand[0]) === getTileKey(hand[1])) {
      allGroups.push(hand);
      allGroups.push(melds[0].tiles);
    } else {
      return false;
    }
  } else {
    allGroups.push(basicWinInfo.jantou);
    allGroups.push(basicWinInfo.mentsu);
  }

  const isTerminal = (tile) => (tile.suit !== SUITS.JIHAI && (tile.rank === 1 || tile.rank === 9));
  if (!allGroups.every(group => group.some(isTerminal))) return false;
  return !allGroups.flat().some(tile => tile.suit === SUITS.JIHAI);
}

// 四牌麻雀: 混一色 (ホンイツ)
function isYonhaiHonitsu(handData, basicWinInfo) {
  const { hand, melds } = handData;
  if (!basicWinInfo.isWin) return false;
  const allTiles = [...hand, ...melds.flatMap(m => m.tiles)];

  const suitsPresent = new Set(allTiles.map(t => t.suit));
  if (suitsPresent.has(SUITS.MANZU) && suitsPresent.has(SUITS.PINZU)) return false;
  if (suitsPresent.has(SUITS.MANZU) && suitsPresent.has(SUITS.SOZU)) return false;
  if (suitsPresent.has(SUITS.PINZU) && suitsPresent.has(SUITS.SOZU)) return false;
  
  return suitsPresent.has(SUITS.JIHAI) && // 字牌を含む
         (suitsPresent.has(SUITS.MANZU) || suitsPresent.has(SUITS.PINZU) || suitsPresent.has(SUITS.SOZU)); // かつ数牌を1種類含む
}

// 四牌麻雀: 清一色 (チンイツ)
function isYonhaiChinitsu(handData, basicWinInfo) {
  const { hand, melds } = handData;
  if (!basicWinInfo.isWin) return false;
  const allTiles = [...hand, ...melds.flatMap(m => m.tiles)];

  if (allTiles.some(tile => tile.suit === SUITS.JIHAI)) return false;
  const firstSuit = allTiles[0].suit;
  return allTiles.every(tile => tile.suit === firstSuit);
}

// 四牌麻雀: 三色同刻 (サンショクドウコウ)
function isYonhaiSanshokuDoukou(handData, basicWinInfo) {
  const { hand, melds } = handData;
  if (!basicWinInfo.isWin) return false;
  if (melds.length > 0) return false; // 門前限定

  const countsBySuitAndRank = {}; // { 'm1': 1, 'p1': 1, 's1': 1, 'z1': 2 }

  hand.forEach(tile => {
    const key = getTileKey(tile);
    countsBySuitAndRank[key] = (countsBySuitAndRank[key] || 0) + 1;
  });

  for (let rank = 1; rank <= 9; rank++) {
    const manKey = `${SUITS.MANZU}${rank}`;
    const pinKey = `${SUITS.PINZU}${rank}`;
    const souKey = `${SUITS.SOZU}${rank}`;

    if (countsBySuitAndRank[manKey] >= 1 &&
        countsBySuitAndRank[pinKey] >= 1 &&
        countsBySuitAndRank[souKey] >= 1) {
      // 萬筒索の同じ数字が1枚ずつある
      // 残りの2枚が雀頭になっている必要がある
      let jantouFound = false;
      const tempHand = [...hand];
      // 三色の牌を1枚ずつ取り除く
      [manKey, pinKey, souKey].forEach(sKey => {
        const idx = tempHand.findIndex(t => getTileKey(t) === sKey);
        if (idx > -1) tempHand.splice(idx, 1);
      });
      if (tempHand.length === 2 && getTileKey(tempHand[0]) === getTileKey(tempHand[1])) {
        return true;
      }
    }
  }
  return false;
}

/**
 * 四牌麻雀の5枚手牌における和了判定 (役と点数計算は含まない基本的な形のみ)
 * @param {Array<Object>} hand5tiles - 手牌5枚 (牌オブジェクトの配列)
 * @param {Object} winTile - 和了牌 (今回は未使用だが、将来の役判定で利用)
 * @param {boolean} isTsumo - ツモ和了か (今回は未使用だが、将来の役判定で利用)
 * @param {Object} gameContext - 役判定に必要なゲームのコンテキスト情報 (自風、場風、ドラなど)
 * @returns {{isWin: boolean, yaku: Array, score: number}}
 */
export function checkYonhaiWin(hand5tiles, winTile, isTsumo, gameContext = {}) {
  const sortedHand = sortHand([...hand5tiles]);
  const basicWinInfo = checkBasicYonhaiWinCondition(sortedHand);

  if (basicWinInfo.isWin) {
    const handDataForYaku = {
      hand: sortedHand,
      winTile,
      isTsumo,
      melds: gameContext.melds || [],
      isRiichi: gameContext.isRiichi || false,
      isDoubleRiichi: gameContext.isDoubleRiichi || false,
      isIppatsu: gameContext.isIppatsu || false,
      isHaitei: gameContext.isHaitei || false,
      isHoutei: gameContext.isHoutei || false,
      isChankan: gameContext.isChankan || false,
      isTenho: gameContext.isTenho || false,
      isChiho: gameContext.isChiho || false,
      isRenho: gameContext.isRenho || false,
      playerWind: gameContext.playerWind,
      roundWind: gameContext.roundWind,
      doraIndicators: gameContext.doraIndicators || [],
      uraDoraIndicators: gameContext.uraDoraIndicators || [], // 裏ドラも渡す
      isParent: gameContext.isParent || false, // 親フラグ
      turnCount: gameContext.turnCount || 1, // 巡目
      // ...その他必要な情報を gameContext から取得
      basicWinInfo: basicWinInfo // 計算済みの基本和了情報を渡す
    };
    const yakuResult = calculateYonhaiYaku(handDataForYaku);

    // 役なし和了は認めないため、役がない場合は isWin = false
    if (yakuResult.fans === 0 && yakuResult.yakumanPower === 0) {
        return { isWin: false, yaku: [], score: 0, fans: 0, isYakuman: false, yakumanPower: 0 };
    }

    let score = 0;
    const isParent = gameContext.isParent || false;
    const calculatedFans = yakuResult.fans;
    const calculatedYakumanPower = yakuResult.yakumanPower;
    let isWinResult = false; 
    let resultYakuList = [];
    let resultIsYakuman = false;

    const MANGAN_BASE_KO = 8000;
    const MANGAN_BASE_OYA = 12000;

    if (calculatedYakumanPower > 0) { // 役満の場合
      isWinResult = true;
      resultIsYakuman = true;
      resultYakuList = yakuResult.yakuman;
      
      // 役満は満貫の4倍が基本
      const yakumanUnitScore = isParent ? MANGAN_BASE_OYA * 4 : MANGAN_BASE_KO * 4;
      score = yakumanUnitScore * calculatedYakumanPower; // N倍役満に対応

    } else if (calculatedFans > 0) { // 通常役の場合
      isWinResult = true;
      resultIsYakuman = false;
      resultYakuList = yakuResult.yaku;

      // 翻数に応じた満貫以上の点数計算
      const MANGAN_FANS_THRESHOLD = 4;     // 4翻以上で満貫
      const HANEMAN_FANS_THRESHOLD = 6;    // 6翻以上で跳満
      const BAIMAN_FANS_THRESHOLD = 8;     // 8翻以上で倍満
      const SANBAIMAN_FANS_THRESHOLD = 11; // 11翻以上で三倍満

      if (calculatedFans >= SANBAIMAN_FANS_THRESHOLD) { // 三倍満
        score = isParent ? MANGAN_BASE_OYA * 3 : MANGAN_BASE_KO * 3;
      } else if (calculatedFans >= BAIMAN_FANS_THRESHOLD) { // 倍満
        score = isParent ? MANGAN_BASE_OYA * 2 : MANGAN_BASE_KO * 2;
      } else if (calculatedFans >= HANEMAN_FANS_THRESHOLD) { // 跳満
        score = isParent ? 16000 : 12000; // 親16000点, 子12000点
      } else if (calculatedFans >= MANGAN_FANS_THRESHOLD) { // 満貫
        // 4翻かつ平和+ツモの場合は0点とする特殊ルール
        const isPinfuTsumo4Han = calculatedFans === 4 &&
                                 resultYakuList.some(y => y.name === YONHAI_YAKU.PINFU.name) &&
                                 resultYakuList.some(y => y.name === YONHAI_YAKU.TSUMO.name);
        if (isPinfuTsumo4Han) {
          score = 0; // 特殊ルールにより0点
        } else {
          score = isParent ? MANGAN_BASE_OYA : MANGAN_BASE_KO; // 通常の満貫点
        }
      } else {
        // 満貫未満の場合は点数移動なし (score は 0 のまま)
        score = 0;
      }
    } else {
      // 役なし (calculateYonhaiYaku で yakuResult.fans と yakumanPower が 0 になるため)
      isWinResult = false;
    }

    if (isWinResult) {
      return { 
        isWin: true, 
        yaku: resultYakuList, 
        score: score, // 満貫未満なら0, それ以上なら計算後の点数
        fans: calculatedFans, 
        isYakuman: resultIsYakuman,
        yakumanPower: calculatedYakumanPower 
      };
    }
  }
  // 基本和了形不成立
  return { isWin: false, yaku: [], score: 0, fans: 0, isYakuman: false, yakumanPower: 0 };
}

/**
 * 四牌麻雀の4枚手牌におけるテンパイ判定と待ち牌を返す
 * @param {Array<Object>} hand4tiles - ソート済みの手牌4枚 (牌オブジェクトの配列)
 * @returns {{isTenpai: boolean, waits: Array<Object>}}
 */
export function checkYonhaiTenpai(hand4tiles, gameContext = {}) { // gameContext を追加
  if (!hand4tiles || hand4tiles.length !== 4) {
    return { isTenpai: false, waits: [] };
  }

  const waits = [];
  const allPossibleTiles = getAllTiles().filter(
    (tile, index, self) => index === self.findIndex(t => t.suit === tile.suit && t.rank === tile.rank)
  ); // getAllTiles() から重複を除いた牌種リストを取得

  for (const potentialTile of allPossibleTiles) {
    const tempHand5 = sortHand([...hand4tiles, potentialTile]);
    const winResult = checkYonhaiWin(tempHand5, potentialTile, true, gameContext); // gameContext を渡す
    if (winResult.isWin) {
      waits.push(potentialTile);
    }
  }
  return { isTenpai: waits.length > 0, waits: waits };
}