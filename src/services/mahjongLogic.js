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
 [SUITS.MANZU, SUITS.PINZU, SUITS.SOZU].forEach(suit => { // 検証用にコメントアウト
  // [SUITS.MANZU].forEach(suit => {
    for (let rank = 2; rank <= 6; rank++) { // 検証用。本来は9
      for (let i = 0; i < 6; i++) { //検証用。本来は4
        tiles.push({
          suit,
          rank,
          id: `${suit}${rank}_${i}`, // 例: m1_0, m1_1, m1_2, m1_3
        });
        idCounter++;
      }
    }
  });

  // // 字牌 (東南西北白發中) - 各4枚
  // Object.values(JIHAI_TYPES).forEach(rank => {
  //   for (let i = 0; i < 4; i++) {
  //     tiles.push({
  //       suit: SUITS.JIHAI,
  //       rank,
  //       id: `${SUITS.JIHAI}${rank}_${i}` // 例: z1_0 (東), z5_0 (白)
  //     });
  //     idCounter++;
  //   }
  // });

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
 * プレイヤーに席風を割り当てます。親が東、その下家が南、対面が西、上家が北となります。
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
 * ツモ和了が可能か判定します。
 * @param {Array<Object>} hand 手牌
 * @param {Object} drawnTile ツモ牌
 * @param {Object} gameContext ゲームコンテキスト (役判定用)
 * @returns {{isWin: boolean, yaku: Array, score: number, fans: number, isYakuman: boolean, yakumanPower: number}}} 和了情報
 */
export function checkCanTsumo(hand, drawnTile, gameContext) {
    if (!hand || !drawnTile) {
        return { isWin: false, yaku: [], score: 0, fans: 0, isYakuman: false, yakumanPower: 0 };
    }
    const handForWin = [...hand, drawnTile];
    return checkYonhaiWin(handForWin, drawnTile, true, gameContext);
}

/**
 * 役判定を行わずに、和了の基本形（1面子1雀頭）が成立するかどうかだけを高速に判定します。
 * @param {Array<Object>} hand 手牌
 * @param {Object} targetTile 和了牌（ロンまたはツモ）
 * @param {Array<Object>} melds 鳴き
 * @returns {boolean} 和了形が成立すればtrue
 */
export function canWinBasicShape(hand, targetTile, melds = []) {
    if (!hand || !targetTile) {
        return false;
    }
    const handForCheck = [...hand, targetTile];

    if (melds.length > 0) {
        // 鳴きがある場合、残りの手牌が雀頭を形成するかどうか
        if (handForCheck.length === 2 && getTileKey(handForCheck[0]) === getTileKey(handForCheck[1])) {
            return true;
        }
    } else {
        // 門前の場合、5枚の手牌で和了形を判定
        if (handForCheck.length === 5) {
            const basicWinInfo = checkBasicYonhaiWinCondition(sortHand(handForCheck));
            return basicWinInfo.isWin;
        }
    }
    return false;
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
 * @param {Object} drawnTile ツモった牌
 * @returns {Array<Object>} 暗槓可能な牌の配列。可能でなければ空配列。
 */
export function checkCanAnkan(hand, drawnTile) {
    const ankanableTiles = [];
    const fullHand = drawnTile ? [...hand, drawnTile] : [...hand];
    const counts = {};
    fullHand.forEach(tile => {
        if (!tile) return;
        const key = getTileKey(tile);
        counts[key] = (counts[key] || 0) + 1;
    });
    for (const key in counts) {
        if (counts[key] === 4) {
            const tile = fullHand.find(t => getTileKey(t) === key);
            if (tile) ankanableTiles.push(tile);
        }
    }
    return ankanableTiles;
}

/**
 * 加槓が可能かチェックします。
 * @param {Array<Object>} hand 手牌
 * @param {Array<Object>} melds 既存の鳴き
 * @param {Object|null} drawnTile ツモった牌 (nullの場合もある)
 * @returns {Array<Object>} 加槓可能な牌の配列。可能でなければ空配列。
 */
export function checkCanKakan(hand, melds, drawnTile) {
    const kakanableTiles = [];
    if (!melds || melds.length === 0) {
        return kakanableTiles;
    }

    const fullHand = drawnTile ? [...hand, drawnTile] : [...hand];
    if (fullHand.length === 0) {
        return kakanableTiles;
    }

    const ponMelds = melds.filter(meld => meld.type === 'pon');

    for (const ponMeld of ponMelds) {
        const ponKey = getTileKey(ponMeld.tiles[0]);
        // 手牌（ツモ牌含む）の中に、ポンしている牌と同じ牌があるか探す
        const tileInHand = fullHand.find(tile => getTileKey(tile) === ponKey);
        if (tileInHand && !kakanableTiles.some(t => getTileKey(t) === ponKey)) {
            kakanableTiles.push(tileInHand);
        }
    }

    return kakanableTiles;}

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
  CHINITSU: { name: "清一色", fans: 4, menzenOnly: false, kuisagari: 1, exampleTiles: [{suit:'s',rank:1},{suit:'s',rank:2},{suit:'s',rank:3},{suit:'s',rank:8},{suit:'s',rank:8}] },
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
 * 牌オブジェクトからキー文字列を生成 (suitとrankを結合)
 * @param {Object} tile - { suit: 'm', rank: 1 }
 * @returns {string} 例: "m1"
 */
export function getTileKey(tile) {
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
  if (!hand5tiles || hand5tiles.length !== 5) { // 5枚でなければ和了形ではない
    return { isWin: false, mentsuType: null, jantou: null, mentsu: null };
  }

  // 牌の枚数をカウント
  const counts = {};
  hand5tiles.forEach(tile => {
    const key = getTileKey(tile); // getTileKey を使用
    counts[key] = (counts[key] || 0) + 1;
  });

  // 1. 雀頭の候補を探す
  const uniqueTileKeysInHand = Array.from(new Set(hand5tiles.map(t => getTileKey(t))));

  for (const jantouCandidateKey of uniqueTileKeysInHand) {
    if (counts[jantouCandidateKey] >= 2) {
      const jantou = hand5tiles.filter(t => getTileKey(t) === jantouCandidateKey).slice(0, 2);

      // 雀頭を除いた残りの3牌を取得
      const remainingForMentsuCandidate = [];
      let jantouRemovedCount = 0;
      for (const tile of hand5tiles) {
        if (getTileKey(tile) === jantouCandidateKey && jantouRemovedCount < 2) {
          jantouRemovedCount++;
        } else {
          remainingForMentsuCandidate.push(tile);
        }
      }

      if (remainingForMentsuCandidate.length === 3) {
        const sortedMentsuCandidate = sortHand(remainingForMentsuCandidate);
        // 刻子判定
        if (
          getTileKey(sortedMentsuCandidate[0]) === getTileKey(sortedMentsuCandidate[1]) &&
          getTileKey(sortedMentsuCandidate[1]) === getTileKey(sortedMentsuCandidate[2])
        ) {
          return { isWin: true, mentsuType: 'koutsu', jantou: jantou, mentsu: sortedMentsuCandidate };
        }

        // 順子判定
        if (
          sortedMentsuCandidate[0].suit !== SUITS.JIHAI && // 字牌は順子にならない
          sortedMentsuCandidate[0].suit === sortedMentsuCandidate[1].suit && // 牌のスーツが同じであること
          sortedMentsuCandidate[1].suit === sortedMentsuCandidate[2].suit &&
          sortedMentsuCandidate[1].rank === sortedMentsuCandidate[0].rank + 1 &&
          sortedMentsuCandidate[2].rank === sortedMentsuCandidate[1].rank + 1
        ) {
          return { isWin: true, mentsuType: 'shuntsu', jantou: jantou, mentsu: sortedMentsuCandidate };
        }
      }
    }
  }

  // 3. game.js の isWinningHand のように、刻子を先に抜き出し、残りが雀頭になるか、
  //    あるいは順子を先に抜き出し、残りが雀頭になるか、というアプローチも有効。
  //    現在のロジックは雀頭を先に抜き出している。
  //    より網羅的にするために、面子を先に抜き出すパターンも試す。
  for (let i = 0; i < hand5tiles.length; i++) {
    for (let j = i + 1; j < hand5tiles.length; j++) {
      for (let k = j + 1; k < hand5tiles.length; k++) {
        const mentsuCandidate = sortHand([hand5tiles[i], hand5tiles[j], hand5tiles[k]]);
        let isMentsu = false;
        let mentsuType = null;
        // 刻子判定
        if (getTileKey(mentsuCandidate[0]) === getTileKey(mentsuCandidate[1]) && getTileKey(mentsuCandidate[1]) === getTileKey(mentsuCandidate[2])) {
          isMentsu = true; mentsuType = 'koutsu';
        }
        // 順子判定
        if (!isMentsu && mentsuCandidate[0].suit !== SUITS.JIHAI && mentsuCandidate[0].suit === mentsuCandidate[1].suit && mentsuCandidate[1].suit === mentsuCandidate[2].suit &&
            mentsuCandidate[1].rank === mentsuCandidate[0].rank + 1 && mentsuCandidate[2].rank === mentsuCandidate[1].rank + 1) {
          isMentsu = true; mentsuType = 'shuntsu';
        }

        if (isMentsu) {
          const remainingForJantou = hand5tiles.filter((tile, index) => index !== i && index !== j && index !== k);
          if (remainingForJantou.length === 2 && getTileKey(remainingForJantou[0]) === getTileKey(remainingForJantou[1])) {
            return { isWin: true, mentsuType: mentsuType, jantou: remainingForJantou, mentsu: mentsuCandidate };
          }
        }
      }
    }
  }

  // 4. 特殊な役満の形を判定 (1面子1雀頭の標準形以外で和了とみなす形)
  // 大三元 (白發中各1枚 + 任意の雀頭2枚)
  const hasHaku = hand5tiles.some(t => t.suit === SUITS.JIHAI && t.rank === JIHAI_TYPES.HAKU);
  const hasHatsu = hand5tiles.some(t => t.suit === SUITS.JIHAI && t.rank === JIHAI_TYPES.HATSU);
  const hasChun = hand5tiles.some(t => t.suit === SUITS.JIHAI && t.rank === JIHAI_TYPES.CHUN);
  if (hasHaku && hasHatsu && hasChun) {
    // 白發中が各1枚以上あることを確認
    const sangenTileObjects = [
      { suit: SUITS.JIHAI, rank: JIHAI_TYPES.HAKU },
      { suit: SUITS.JIHAI, rank: JIHAI_TYPES.HATSU },
      { suit: SUITS.JIHAI, rank: JIHAI_TYPES.CHUN },
    ];
    let sangenCount = 0;
    const tempHandForSangenCheck = [...hand5tiles];
    for (const st of sangenTileObjects) {
      const idx = tempHandForSangenCheck.findIndex(t => getTileKey(t) === getTileKey(st));
      if (idx > -1) {
        sangenCount++;
        tempHandForSangenCheck.splice(idx, 1); // 見つかった三元牌を除外
      }
    }

    const remainingAfterSangen = [];
    if (sangenCount === 3 && tempHandForSangenCheck.length === 2 && getTileKey(tempHandForSangenCheck[0]) === getTileKey(tempHandForSangenCheck[1])) {
      // 白發中が各1枚あり、残りの2枚が雀頭
      return { isWin: true, mentsuType: 'daisangen_special', jantou: tempHandForSangenCheck, mentsu: sangenTileObjects };
    }
  }

  // 小四喜・大四喜の判定
  const windTiles = [JIHAI_TYPES.TON, JIHAI_TYPES.NAN, JIHAI_TYPES.SHA, JIHAI_TYPES.PEI];
  let windCounts = {};
  windTiles.forEach(wt => windCounts[wt] = 0);
  hand5tiles.forEach(t => {
    if (t.suit === SUITS.JIHAI && windTiles.includes(t.rank)) {
      windCounts[t.rank]++;
    }
  });
  const distinctPresentWinds = Object.keys(windCounts).filter(key => windCounts[key] > 0).length;
  let jantouWindKey = null;
  let koutsuWindKeys = [];

  for (const key in windCounts) {
    if (windCounts[key] >= 2) jantouWindKey = key; // 雀頭候補の風牌
    if (windCounts[key] >= 3) koutsuWindKeys.push(key); // 刻子候補の風牌
  }

  // 小四喜: 3種類の風牌が刻子(または槓子) + 残り1種類の風牌が雀頭 (四牌麻雀では5枚なので構成が異なる)
  // 四牌麻雀の小四喜: 3種類の風牌が各1枚 + 残り1種類の風牌が雀頭 (例: 東東南西北)
  if (distinctPresentWinds === 4 && jantouWindKey && koutsuWindKeys.length === 0) {
    // 4種類の風牌があり、そのうち1種類が雀頭で、他3種類が各1枚
    return { isWin: true, mentsuType: 'shousuushi_special', jantou: hand5tiles.filter(t => getTileKey(t) === jantouWindKey).slice(0,2), mentsu: null };
  }
  // 大四喜の判定は、通常の1面子1雀頭のパターンでカバーされることが多い (例: 東東東 南南)
  // もし特殊な5枚構成の大四喜がある場合はここに追加

  return { isWin: false, mentsuType: null, jantou: null, mentsu: null };
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
 * @param {number} handData.playerCount - プレイヤー数 (人和判定用)
 * @returns {{yaku: Array<Object>, fans: number, yakuman: Array<Object>, yakumanPower: number}}
 */
function calculateYonhaiYaku(handData) {
  const yakuList = [];
  let totalFans = 0;
  const yakumanList = [];
  let totalYakumanPower = 0;

  const { hand, winTile, isTsumo, melds = [], playerWind, roundWind, doraIndicators = [], uraDoraIndicators = [], isRiichi, isDoubleRiichi, isIppatsu, isHaitei, isHoutei, isChankan, isTenho, isChiho, isRenho, remainingTilesCount, isParent, turnCount, playerCount, gameContext } = handData; // playerCount と gameContext を追加 (gameContextは人和判定で利用)
  const currentPlayerTurnCount = gameContext.currentPlayerTurnCount || 0; // gameContextから現在のプレイヤーのツモ回数を取得、未定義なら0
  const isMenzen = (melds || []).length === 0;
  const basicWinInfo = handData.basicWinInfo || checkBasicYonhaiWinCondition(hand); // handDataから受け取るか、なければ再計算

  // 役満判定 (優先)
  // 天和 (Tenhou)
  if (isTenho) {
    yakumanList.push(YONHAI_YAKUMAN.TENHOU);
    totalYakumanPower += YONHAI_YAKUMAN.TENHOU.power;
  }
  // 地和 (Chiho)
  if (isChiho) {
    yakumanList.push(YONHAI_YAKUMAN.CHIHOU);
    totalYakumanPower += YONHAI_YAKUMAN.CHIHOU.power;
  }
  // 人和 (Renhou)
  if (isRenho) {
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
  if (isYonhaiToitoi(handData, basicWinInfo)) {
    yakuList.push(YONHAI_YAKU.TOITOI);
    totalFans += YONHAI_YAKU.TOITOI.fans;
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
    const yakuhaiInfo = isYakuhai(tileObj, playerWind, roundWind);
    if (yakuhaiInfo.isPlayerWind && !yakuList.some(y => y.name === YONHAI_YAKU.JIKAZE.name)) {
        yakuList.push(YONHAI_YAKU.JIKAZE); totalFans += YONHAI_YAKU.JIKAZE.fans;
    }
    if (yakuhaiInfo.isRoundWind && !yakuList.some(y => y.name === YONHAI_YAKU.BAKAZE.name)) {
        yakuList.push(YONHAI_YAKU.BAKAZE); totalFans += YONHAI_YAKU.BAKAZE.fans;
    }
    if (yakuhaiInfo.isSangenpai) {
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
  // 純全帯么九 (Junchan)
  if (isYonhaiJunchan(handData, basicWinInfo)) {
    const yakuInfo = YONHAI_YAKU.JUNCHAN;
    const actualFans = isMenzen ? yakuInfo.fans : (yakuInfo.fans - (yakuInfo.kuisagari || 0));
    yakuList.push({ ...yakuInfo, fans: actualFans });
    totalFans += actualFans;
  }
  // 混全帯么九 (Chanta)
  else if (isYonhaiChanta(handData, basicWinInfo)) {
    const yakuInfo = YONHAI_YAKU.CHANTA;
    const actualFans = isMenzen ? yakuInfo.fans : (yakuInfo.fans - (yakuInfo.kuisagari || 0));
    yakuList.push({ ...yakuInfo, fans: actualFans });
    totalFans += actualFans;
  }
  // 混一色 (Honitsu)
  if (isYonhaiHonitsu(handData, basicWinInfo)) {
    const yakuInfo = YONHAI_YAKU.HONITSU;
    const actualFans = isMenzen ? yakuInfo.fans : (yakuInfo.fans - (yakuInfo.kuisagari || 0));
    yakuList.push({ ...yakuInfo, fans: actualFans });
    totalFans += actualFans;
  }
  // 清一色 (Chinitsu)
  if (isYonhaiChinitsu(handData, basicWinInfo)) {
    const yakuInfo = YONHAI_YAKU.CHINITSU;
    const actualFans = isMenzen ? yakuInfo.fans : (yakuInfo.fans - (yakuInfo.kuisagari || 0));
    yakuList.push({ ...yakuInfo, fans: actualFans });
    totalFans += actualFans;
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
  if ((isRiichi || isDoubleRiichi) && uraDoraIndicators && uraDoraIndicators.length > 0) {
    const uraDoraCount = countDora(hand, uraDoraIndicators);
    if (uraDoraCount > 0) {
      yakuList.push({ ...YONHAI_YAKU.URA_DORA, fans: uraDoraCount });
      totalFans += uraDoraCount;
    }
  }

  // 役満が成立している場合は、役満のみを返す (通常役とは複合しない)
  if (totalYakumanPower > 0) {
    return { yaku: [], fans: 0, yakuman: yakumanList, yakumanPower: totalYakumanPower };
  }
  return { yaku: yakuList, fans: totalFans, yakuman: [], yakumanPower: 0 };
}

/**
 * 王牌から裏ドラ表示牌を取得します。
 * @param {Array<Object>} deadWall - 王牌の配列
 * @param {Array<Object>} revealedDoraIndicators - 表示されている表ドラ表示牌の配列
 * @returns {Array<Object>} 裏ドラ表示牌の配列
 */
export function getUraDoraIndicators(deadWall, revealedDoraIndicators) {
  if (!deadWall || !revealedDoraIndicators || revealedDoraIndicators.length === 0) {
    return [];
  }
  const uraDoraIndicators = [];
  const uraDoraIndicatorPositions = [5, 7, 9, 11]; // 表ドラ表示牌の真下の牌 (0-indexed)

  for (let i = 0; i < revealedDoraIndicators.length; i++) {
    const uraPos = uraDoraIndicatorPositions[i];
    if (deadWall.length > uraPos) {
      uraDoraIndicators.push(deadWall[uraPos]);
    }
  }
  return uraDoraIndicators;
}

// --- 各役の判定関数の実装 ---
// isTenho, isChiho, isRenho は handData のフラグで判定済み

/**
 * 役牌かどうかを判定するヘルパー関数
 * @param {Object} tile - 判定対象の牌オブジェクト
 * @param {string} playerWind - 自風
 * @param {string} roundWind - 場風
 * @param {'player'|'round'|'sangen'} type - 判定タイプ
 * @returns {{isPlayerWind: boolean, isRoundWind: boolean, isSangenpai: boolean}}
 */
function isYakuhai(tile, playerWind, roundWind) {
  const result = { isPlayerWind: false, isRoundWind: false, isSangenpai: false };
  if (!tile || tile.suit !== SUITS.JIHAI) return result;

  const tileRank = tile.rank;
  const windMap = { [PLAYER_WINDS.EAST]: JIHAI_TYPES.TON, [PLAYER_WINDS.SOUTH]: JIHAI_TYPES.NAN, [PLAYER_WINDS.WEST]: JIHAI_TYPES.SHA, [PLAYER_WINDS.NORTH]: JIHAI_TYPES.PEI };

  // 自風
  if (windMap[playerWind] === tileRank) {
    result.isPlayerWind = true;
  }
  // 場風 (東場のみ)
  if (windMap[roundWind] === tileRank && roundWind === PLAYER_WINDS.EAST) {
    result.isRoundWind = true;
  }
  // 三元牌
  if (tileRank >= JIHAI_TYPES.HAKU && tileRank <= JIHAI_TYPES.CHUN) {
    result.isSangenpai = true;
  }
  return result;
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
  const { hand, winTile, melds } = handData; // hand は和了形5枚
  if (!basicWinInfo.isWin) return false;
  if (hand.length !== 5) return false;
  if ((melds || []).length > 0) return false; // 門前限定

  const windTiles = [JIHAI_TYPES.TON, JIHAI_TYPES.NAN, JIHAI_TYPES.SHA, JIHAI_TYPES.PEI];
  const handWindCounts = {};
  windTiles.forEach(wt => handWindCounts[wt] = 0);

  hand.forEach(tile => {
    if (tile.suit === SUITS.JIHAI && windTiles.includes(tile.rank)) {
      handWindCounts[tile.rank]++;
    }
  });

  // 和了牌を除いた手牌4枚を考える
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
  if (originalHand4.length !== 4) return false; // 和了牌が手牌になかった場合など

  const originalHandWindCounts = {};
  windTiles.forEach(wt => originalHandWindCounts[wt] = 0);
  let distinctWindTypesInOriginalHand4 = 0;
  let jantouWindInOriginalHand4 = null;

  originalHand4.forEach(tile => {
    if (tile.suit === SUITS.JIHAI && windTiles.includes(tile.rank)) {
      originalHandWindCounts[tile.rank]++;
      if (originalHandWindCounts[tile.rank] === 1) {
        distinctWindTypesInOriginalHand4++;
      }
      if (originalHandWindCounts[tile.rank] === 2) {
        jantouWindInOriginalHand4 = tile.rank;
      }
    }
  });

  // 手牌4枚に3種類の風牌があり、そのうち1種類が2枚(雀頭)であること
  if (!(distinctWindTypesInOriginalHand4 === 3 && jantouWindInOriginalHand4 !== null)) {
    return false;
  }

  // 和了牌が、手牌4枚に存在しない残り1種類の風牌であるか
  let missingWindType = null;
  for (const wt of windTiles) {
    if (originalHandWindCounts[wt] === 0) { // 手牌4枚の中に含まれていない風牌
      missingWindType = wt;
      break;
    }
  }
  return winTile.suit === SUITS.JIHAI && winTile.rank === missingWindType;
}

// 四牌麻雀: 大四喜
function isYonhaiDaisuushi(handData, basicWinInfo) {
  const { hand, winTile, melds } = handData; // hand は和了形5枚
  if (!basicWinInfo.isWin) return false;
  if (hand.length !== 5) return false;
  if ((melds || []).length > 0) return false; // 門前限定


  const windTiles = [JIHAI_TYPES.TON, JIHAI_TYPES.NAN, JIHAI_TYPES.SHA, JIHAI_TYPES.PEI];
  // 和了牌を除いた手牌4枚を考える
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
  if (originalHand4.length !== 4) return false; // 和了牌が手牌になかった場合など

  // originalHand4 に4種類の風牌が全て含まれているか
  let distinctWindsInOriginalHand4 = 0;
  for (const wt of windTiles) {
    if (originalHand4.some(t => t.suit === SUITS.JIHAI && t.rank === wt)) {
      distinctWindsInOriginalHand4++;
    }
  }
  if (distinctWindsInOriginalHand4 !== 4) return false;

  // 和了牌がその4種類の風牌のいずれかであること
  return winTile.suit === SUITS.JIHAI && windTiles.includes(winTile.rank);
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

// 四牌麻雀: 平和
function isYonhaiPinfu(handData, basicWinInfo) {
  const { hand, winTile, melds, playerWind, roundWind } = handData;

  // 1. 門前限定
  if (melds && melds.length > 0) return false;

  // 2. 面子が順子であること
  if (basicWinInfo.mentsuType !== 'shuntsu') return false;

  const jantou = basicWinInfo.jantou;
  const mentsu = basicWinInfo.mentsu;

  // 3. 雀頭が役牌でないこと
  const yakuhaiInfo = isYakuhai(jantou[0], playerWind, roundWind);
  if (yakuhaiInfo.isPlayerWind || yakuhaiInfo.isRoundWind || yakuhaiInfo.isSangenpai) {
    return false;
  }

  // 4. 待ちが両面待ちであること
  const winTileKey = getTileKey(winTile);
  const mentsuTileKeys = mentsu.map(getTileKey);

  // 和了牌が順子の一部でなければならない (ノベタン待ちなどを除外)
  if (!mentsuTileKeys.includes(winTileKey)) {
    return false;
  }

  // 両面待ちの判定：順子の最初か最後の牌で待っている必要がある
  const isRyanmenWait = winTileKey === mentsuTileKeys[0] || winTileKey === mentsuTileKeys[2];

  // 辺張待ち(123の3、789の7)を除外
  const isPenchanWait = (mentsu[0].rank === 1 && winTile.rank === 3) || (mentsu[0].rank === 7 && winTile.rank === 7);

  if (isRyanmenWait && !isPenchanWait) {
    return true; // 全ての平和の条件を満たす
  }

  return false;
}

// 四牌麻雀: 対々和
function isYonhaiToitoi(handData, basicWinInfo) {
  // 平和とは複合しない
  if (isYonhaiPinfu(handData, basicWinInfo)) {
    return false;
  }
  // 基本的な和了形で、面子が刻子(koutsu)であれば対々和
  if (!basicWinInfo.isWin || basicWinInfo.mentsuType !== 'koutsu') {
    return false;
  }

  return true;
}

// 四牌麻雀: 一暗刻 (三暗刻の代用で一暗刻)
function isYonhaiIianko(handData) {
  const { hand, melds, winTile, isTsumo } = handData;

  let ankouCount = 0;

  // 1. 暗槓(ankan)をチェック
  if (melds) {
    ankouCount += melds.filter(m => m.type === 'ankan').length;
  }

  // 2. 手牌の中の刻子をチェック
  const handCounts = {};
  hand.forEach(tile => {
    const key = getTileKey(tile);
    handCounts[key] = (handCounts[key] || 0) + 1;
  });

  const winTileKey = getTileKey(winTile);

  for (const key in handCounts) {
    if (handCounts[key] >= 3) {
      // ツモ和了の場合は、手牌の刻子は常に暗刻扱い
      // ロン和了の場合は、和了牌で完成した刻子は明刻扱い
      if (isTsumo || key !== winTileKey) {
        ankouCount++;
      }
    }
  }
  return ankouCount >= 1;
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

  // 順子が含まれている必要がある。四麻の鳴きは刻子のみなので、門前限定。
  if (melds.length > 0 || basicWinInfo.mentsuType !== 'shuntsu') {
    return false;
  }

  const allGroups = []; // [ [雀頭], [面子] ]
  if (basicWinInfo.jantou) allGroups.push(basicWinInfo.jantou);
  if (basicWinInfo.mentsu) allGroups.push(basicWinInfo.mentsu);

  const isYaochuhai = (tile) => (tile.suit === SUITS.JIHAI || tile.rank === 1 || tile.rank === 9);
  if (!allGroups.every(group => Array.isArray(group) && group.some(isYaochuhai))) return false;
  return allGroups.flat().filter(Boolean).some(tile => tile.suit === SUITS.JIHAI);
}

// 四牌麻雀: 純全帯么九 (ジュンチャン)
function isYonhaiJunchan(handData, basicWinInfo) {
  const { hand, melds } = handData;
  if (!basicWinInfo.isWin) return false;

  // 順子が含まれている必要がある。四麻の鳴きは刻子のみなので、門前限定。
  if (melds.length > 0 || basicWinInfo.mentsuType !== 'shuntsu') {
    return false;
  }

  const allGroups = [];
  if (basicWinInfo.jantou) allGroups.push(basicWinInfo.jantou);
  if (basicWinInfo.mentsu) allGroups.push(basicWinInfo.mentsu);

  const isTerminal = (tile) => (tile.suit !== SUITS.JIHAI && (tile.rank === 1 || tile.rank === 9));
  if (!allGroups.every(group => Array.isArray(group) && group.some(isTerminal))) return false;
  return !allGroups.flat().filter(Boolean).some(tile => tile.suit === SUITS.JIHAI);
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
export function checkYonhaiWin(currentHandWithWinTile, winTile, isTsumo, gameContext = {}) {
  const melds = gameContext.melds || [];
  const isParent = gameContext.isParent || false; // ここで isParent を定義
  let basicWinInfo = { isWin: false, mentsuType: null, jantou: null, mentsu: null };

  if (melds.length > 0) {
    // 鳴きがある場合: 残りの手牌が雀頭を形成するかチェック
    // 四牌麻雀で1回鳴くと、手牌は和了牌を含めて2枚になる
    if (currentHandWithWinTile.length === 2 && getTileKey(currentHandWithWinTile[0]) === getTileKey(currentHandWithWinTile[1])) {
      const meld = melds[0];
      // ポンやカンは刻子として扱う
      const mentsuType = (meld.type === 'pon' || meld.type.includes('kan')) ? 'koutsu' : 'shuntsu';

      basicWinInfo = {
        isWin: true,
        // 鳴いた面子を mentsu として、手牌を jantou として設定
        mentsuType: mentsuType,
        jantou: currentHandWithWinTile,
        mentsu: melds[0].tiles
      };
    }
  } else {
    // 鳴きがない場合 (門前): 5枚の手牌全体で和了形を判定
    const sortedHand = sortHand([...currentHandWithWinTile]);
    basicWinInfo = checkBasicYonhaiWinCondition(sortedHand);
  }


  if (basicWinInfo.isWin) {
    const handDataForYaku = {
      hand: currentHandWithWinTile, // 役判定には、鳴きを含まない実際の手牌を渡す
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
      turnCount: gameContext.turnCount ?? 1, // 巡目 (0は有効な値なのでnull合体演算子を使う)
      // ...その他必要な情報を gameContext から取得
      basicWinInfo: basicWinInfo, // 計算済みの基本和了情報を渡す
      playerCount: gameContext.playerCount, // プレイヤー数を渡す
      gameContext: gameContext // 人和判定のために gameContext 自体も渡す
    };
    const isParent = gameContext.isParent || false;
    const yakuResult = calculateYonhaiYaku(handDataForYaku);

    // 役なし和了は認めないため、役がない場合は isWin = false
    if (yakuResult.fans === 0 && yakuResult.yakumanPower === 0) {
        // 役なしチョンボとして扱う
        const chomboScore = isParent ? -12000 : -8000;
        return {
            isWin: true, // 和了形は成立しているが、役がない状態
            yaku: [{ name: "役なしチョンボ", fans: 0, isChombo: true }],
            score: chomboScore, // チョンボしたプレイヤーが失う点数
            fans: 0,
            isYakuman: false,
            yakumanPower: 0,
            scoreName: "役なしチョンボ",
            isChombo: true, // チョンボであることを示すフラグ
            chomboPlayerIsParent: isParent // チョンボしたのが親かどうかのフラグ
        };
    }

    let score = 0;
    let calculatedFans = yakuResult.fans;
    let calculatedYakumanPower = yakuResult.yakumanPower;
    let isWinResult = false; 
    let resultYakuList = [];
    let resultIsYakuman = false;
    let resultYakumanPower = calculatedYakumanPower;
    let scoreName = null;

    const MANGAN_BASE_KO = 8000;
    const MANGAN_BASE_OYA = 12000;
    const KAZOE_YAKUMAN_FANS_THRESHOLD = 13;

    if (calculatedYakumanPower > 0) { // 役満の場合
      isWinResult = true;
      resultIsYakuman = true;
      resultYakuList = yakuResult.yakuman;
      
      // 役満は満貫の4倍が基本
      const yakumanUnitScore = isParent ? MANGAN_BASE_OYA * 4 : MANGAN_BASE_KO * 4;
      score = yakumanUnitScore * calculatedYakumanPower; // N倍役満に対応
      scoreName = calculatedYakumanPower >= 2 ? `${calculatedYakumanPower}倍役満` : "役満";

    } else if (calculatedFans >= KAZOE_YAKUMAN_FANS_THRESHOLD) { // 数え役満の場合
      isWinResult = true;
      resultIsYakuman = true;
      resultYakumanPower = 1; // 1倍役満として扱う
      resultYakuList = yakuResult.yaku; // 通常役のリストはそのまま
      const yakumanUnitScore = isParent ? MANGAN_BASE_OYA * 4 : MANGAN_BASE_KO * 4;
      score = yakumanUnitScore;
      scoreName = "数え役満";
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
        scoreName = "三倍満";
      } else if (calculatedFans >= BAIMAN_FANS_THRESHOLD) { // 倍満
        score = isParent ? MANGAN_BASE_OYA * 2 : MANGAN_BASE_KO * 2;
        scoreName = "倍満";
      } else if (calculatedFans >= HANEMAN_FANS_THRESHOLD) { // 跳満
        score = isParent ? 18000 : 12000; // 親18000点, 子12000点
        scoreName = "跳満";
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
        scoreName = null;
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
        yakumanPower: resultYakumanPower,
        scoreName: scoreName
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
  if (!hand4tiles || (hand4tiles.length !== 4 && hand4tiles.length !== 1)) {
    return { isTenpai: false, waits: [] };
  }

  const waits = [];
  if (hand4tiles.length === 1) {
    const waitingTile = { ...hand4tiles[0] }; // 待ち牌は手牌のコピー
    waits.push(waitingTile);
    return { isTenpai: true, waits: waits };
  }

  // 手牌が4枚の場合、ありえる待ち牌を全て試す
  const allPossibleTiles = getAllTiles().filter(
    (tile, index, self) => index === self.findIndex(t => t.suit === tile.suit && t.rank === tile.rank)
  ); // getAllTiles() から重複を除いた牌種リストを取得

  // 手牌の牌の枚数をカウント
  const handCounts = {};
  hand4tiles.forEach(tile => {
    const key = getTileKey(tile);
    handCounts[key] = (handCounts[key] || 0) + 1;
  });

  for (const potentialTile of allPossibleTiles) {
    // 既に4枚持っている牌は、5枚目を待つことはできないのでスキップ
    const potentialTileKey = getTileKey(potentialTile);
    if ((handCounts[potentialTileKey] || 0) >= 4) {
      continue;
    }
    const tempHand5 = sortHand([...hand4tiles, potentialTile]);
    const basicWinResult = checkBasicYonhaiWinCondition(tempHand5);
    if (basicWinResult.isWin) {
      waits.push(potentialTile); // 実際に試した牌 (ID付き) を待ち牌として追加
    }
  }
  // 待ち牌の重複を除去
  const uniqueWaitKeys = new Set();
  const uniqueWaits = waits.filter(tile => {
      if (!tile) return false;
      const key = getTileKey(tile);
      if (uniqueWaitKeys.has(key)) return false;
      uniqueWaitKeys.add(key);
      return true;
  });
  return { isTenpai: uniqueWaits.length > 0, waits: uniqueWaits };
}