<template>
    <div class="game-board">
      <!-- PlayerArea コンポーネントを動的に配置 -->
      <div class="player-area-container top-player-container" v-if="playerAtTop">
         <PlayerArea :player="playerAtTop" position="top" :is-my-hand="determineIsMyHand(playerAtTop.id)" :drawn-tile-display="drawnTileForPlayer(playerAtTop.id)" :can-discard="canPlayerDiscard(playerAtTop.id)" @tile-selected="handleTileSelection" @action-declared="handlePlayerAction" />
      </div>
     <div class="middle-row">
        <div class="player-area-container left-player-container" v-if="playerAtLeft">
          <PlayerArea :player="playerAtLeft" position="left" :is-my-hand="determineIsMyHand(playerAtLeft.id)" :drawn-tile-display="drawnTileForPlayer(playerAtLeft.id)" :can-discard="canPlayerDiscard(playerAtLeft.id)" @tile-selected="handleTileSelection" @action-declared="handlePlayerAction" />
        </div>
        <div class="center-table">
          <CenterTableInfo :ordered-players="orderedPlayersForDisplay" />
        </div>
        <div class="player-area-container right-player-container" v-if="playerAtRight">
          <PlayerArea :player="playerAtRight" position="right" :is-my-hand="determineIsMyHand(playerAtRight.id)" :drawn-tile-display="drawnTileForPlayer(playerAtRight.id)" :can-discard="canPlayerDiscard(playerAtRight.id)" @tile-selected="handleTileSelection" @action-declared="handlePlayerAction" />
        </div>
      </div>
      <div class="discard-piles-main-area">
        <DiscardPile v-if="playerAtLeft" :tiles="playerAtLeft.discards" position="left" class="discard-pile-wrapper left-discard" />
        <DiscardPile v-if="playerAtTop" :tiles="playerAtTop.discards" position="top" class="discard-pile-wrapper top-discard" />
        <DiscardPile v-if="playerAtRight" :tiles="playerAtRight.discards" position="right" class="discard-pile-wrapper right-discard" />
        <DiscardPile v-if="playerAtBottom" :tiles="playerAtBottom.discards" position="bottom" class="discard-pile-wrapper bottom-discard" />
      </div>
      <div class="player-area-container bottom-player-container" v-if="playerAtBottom">
        <PlayerArea :player="playerAtBottom" position="bottom" :is-my-hand="determineIsMyHand(playerAtBottom.id)" :drawn-tile-display="drawnTileForPlayer(playerAtBottom.id)" :can-discard="canPlayerDiscard(playerAtBottom.id)" @tile-selected="handleTileSelection" @action-declared="handlePlayerAction" />
      </div>
      <ResultPopup
        :show="gameStore.showResultPopup"
        :message="gameStore.resultMessage"
        :result-details="gameStore.agariResultDetails"
        @close="handleCloseResultPopup"
        @proceed="handleProceedToNextRound"
      />
      <FinalResultPopup
        :show="gameStore.showFinalResultPopup"
        :final-result-details="gameStore.finalResultDetails"
        @start-new-game="handleStartNewGameFromFinalResult"
        @back-to-title="handleBackToTitleFromFinalResult"
      />
    </div>
</template>
  
<script setup>
  import { computed, onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import PlayerHand from './PlayerHand.vue';
  import { useGameStore } from '@/stores/gameStore';
  import CenterTableInfo from './CenterTableInfo.vue';
  import DiscardPile from './DiscardPile.vue';
  import PlayerArea from './PlayerArea.vue';
  import ResultPopup from './ResultPopup.vue';
  import FinalResultPopup from './FinalResultPopup.vue';
  // import Wall from './Wall.vue'; // 将来的に使用
  import * as mahjongLogic from '@/services/mahjongLogic'; // 役判定などに使う場合 (例: checkYonhaiWin, canRiichi)
  import { GAME_PHASES } from '@/stores/gameStore'; // gameStoreからフェーズ定数をインポート

  const gameStore = useGameStore(); // ストアのインスタンスを取得
  const router = useRouter(); // routerインスタンスを取得
  const showAnkanModal = ref(false);
  const ankanOptions = ref([]); // ストアから渡される暗槓可能な牌のリスト
  const showKakanModal = ref(false);
  const kakanOptions = ref([]); // ストアから渡される加槓可能な牌のリスト
  // ユーザー自身のプレイヤーID (全操作モードでは 'player1' を仮定)
  // 将来的にはログイン機能やモード選択に応じて設定されるべき
  const myPlayerId = computed(() => {
      // 全操作モードでは player1 を操作対象とする
      if (gameStore.gameMode === 'allManual') return 'player1';
      // TODO: CPU対戦やオンライン対戦の場合は、ストアに保持されたユーザー自身のIDを返す
      return gameStore.myActualPlayerId; // 例: ストアに myActualPlayerId を持つ
  });

  // プレイヤーの表示順序を動的に計算する (自分を下家として表示)
  const orderedPlayersForDisplay = computed(() => {
    if (!gameStore.players.length || !myPlayerId.value) return [];

    const myIndex = gameStore.players.findIndex(p => p.id === myPlayerId.value);
    if (myIndex === -1) return []; // 自分のプレイヤーが見つからない場合は空配列

    // 自分(下家) -> 右家 -> 対面 -> 左家 の順に並び替える
    const players = [...gameStore.players];
    const bottomP = players[myIndex];
    const rightP = players[(myIndex + 1) % 4];
    const topP = players[(myIndex + 2) % 4];
    const leftP = players[(myIndex + 3) % 4];

    return [bottomP, rightP, topP, leftP];
  });
  // orderedPlayersForDisplay から各位置のプレイヤーを取得
  const playerAtBottom = computed(() => orderedPlayersForDisplay.value[0]);
  const playerAtRight = computed(() => orderedPlayersForDisplay.value[1]);
  const playerAtTop = computed(() => orderedPlayersForDisplay.value[2]);
  const playerAtLeft = computed(() => orderedPlayersForDisplay.value[3]);
  const dealerInfo = computed(() => {
    if (gameStore.dealerIndex !== null && gameStore.players[gameStore.dealerIndex]) {
      const dealer = gameStore.players[gameStore.dealerIndex];
      return { name: dealer.name, seatWind: dealer.seatWind };
    }
    return { name: null, seatWind: null };
  });

  const gameMode = computed(() => gameStore.gameMode);

  function determineIsMyHand(playerId) {
    if (gameMode.value === 'allManual') {
      return true; // 全操作モードでは全ての牌を表向きに
    }
    // CPU対戦モードやオンライン対戦モードの場合
    // 自分のプレイヤーIDと一致する場合のみ手牌を表示
    // 注意: 自分の手牌は常に表示されるべきなので、この関数は「裏向きにするか」の判定に使う方が適切かもしれません。
    // 例: 自分のプレイヤーIDと一致する場合のみtrue
    // return gameStore.myActualPlayerId === playerId;
    // この関数は、渡された playerId が myPlayerId と一致するかどうかを返す
    return myPlayerId.value === playerId;
  }

  // GameBoard.vue のテンプレートで使用する場合の canPlayerDeclareRon 関数の定義例
  const canPlayerDeclareRon = (playerId) => {
    if (!playerId || !gameStore.playerActionEligibility[playerId]) return false;
    // 他家の打牌後、または槍槓のチャンスがある場合
    return (gameStore.gamePhase === GAME_PHASES.AWAITING_ACTION_RESPONSE ||
           (gameStore.gamePhase === GAME_PHASES.AWAITING_KAKAN_RESPONSE && gameStore.isChankanChance)) &&
           gameStore.playerActionEligibility[playerId].canRon === true;
  };

  // 渡されたプレイヤーIDに対応するツモ牌を取得
  function drawnTileForPlayer(playerId) {
    if (gameStore.currentTurnPlayerId === playerId && gameStore.drawnTile) {
      return gameStore.drawnTile;
    }
    return null;
  }

  // 渡されたプレイヤーIDが打牌可能か判定
  function canPlayerDiscard(playerId) {
    return gameStore.currentTurnPlayerId === playerId && gameStore.gamePhase === GAME_PHASES.AWAITING_DISCARD;
  }

  onMounted(() => {
    // ゲームの初期化処理などをストア経由で実行
    // 例: プレイヤー情報の設定、山牌の準備、配牌など
    // if (!gameStore.isInitialized) {
    if (gameStore.gamePhase === 'waitingToStart') { // gameStore.myPlayer のチェックは initializeGame 内で行う方が適切
      gameStore.initializeGame(); // ストアのアクションを呼び出す
      // 初期化後、最初のプレイヤーがツモる
      if (gameStore.currentTurnPlayerId && gameStore.gamePhase === 'playerTurn') {
        gameStore.drawTile();
      }
    }
  });

  function handleTileSelection(payload) { // payload は { tile: Object, isFromDrawnTile: Boolean }
    console.log('Selected tile for discard:', payload.tile, 'Is from drawn:', payload.isFromDrawnTile);
    // どのプレイヤーの操作かに関わらず、現在のターンプレイヤーが打牌可能な状態であれば実行
    // PlayerHand が can-discard プロパティ経由で適切なプレイヤーのターンであること保証すると想定
    if (gameStore.currentTurnPlayerId && gameStore.gamePhase === 'awaitingDiscard') {
      gameStore.discardTile(gameStore.currentTurnPlayerId, payload.tile.id, payload.isFromDrawnTile); // 誰が打牌したか渡す
    } else {
      console.log("It's not your turn or you cannot discard now.");
    }
  }

  // --- アクションボタンの表示条件 ---
  // --- アクション実行メソッド ---
  function handleDeclareTsumoAgari() {
    if (canDeclareTsumoAgari.value) {
      gameStore.handleAgari(myPlayerId.value, gameStore.drawnTile, true);
    }
  }

  function handleDeclareRiichi() {
    if (canDeclareRiichi.value) {
      gameStore.declareRiichi(myPlayerId.value);
    }
  }

  function handleDeclareAnkan() {
    if (canDeclareAnkan.value) {
      const options = gameStore.canDeclareAnkan[myPlayerId.value]; // ストアが具体的な牌またはtrueを返す想定
      if (options && options.length === 1) { // 選択肢が1つで明確な場合合
        gameStore.declareAnkan(myPlayerId.value, options[0]);
      } else if (options && options.length > 0) { // 複数の選択肢がある場合
        ankanOptions.value = options;
        showAnkanModal.value = true;
      } else if (gameStore.canDeclareAnkan[myPlayerId.value] === true) { // ストアが候補を返さず、UIで選択が必要な場合
          // このケースはストアが候補を返すようにするのが望ましい
          console.warn("暗槓牌の選択肢をストアから取得できませんでした。UIでの選択が必要です。");
          // ankanOptions.value = calculatePossibleAnkans(); // GameBoard側で計算する場合（非推奨）
          // showAnkanModal.value = true;
      }
    }
  }

function onAnkanSelected(tile) { // モーダルからのイベント
  showAnkanModal.value = false;
  if (tile) {
    gameStore.declareAnkan(myPlayerId.value, tile);
  }
}

// handleDeclareKakan と onKakanSelected も同様に実装が必要

  function handleDeclareKakan() {
    if (canDeclareKakan.value) {
      const tileToKakan = gameStore.canDeclareKakan[myPlayerId.value]; // ストアが具体的な牌またはtrueを返す想定
      if (tileToKakan) gameStore.declareKakan(myPlayerId.value, tileToKakan);
    }
  }

  function handleDeclareRon(playerId) {
    if (gameStore.playerActionEligibility[playerId]?.canRon && (gameStore.lastDiscardedTile || gameStore.chankanTile)) {
      const agariTile = gameStore.isChankanChance ? gameStore.chankanTile : gameStore.lastDiscardedTile;
      gameStore.handleAgari(playerId, agariTile, false, gameStore.lastActionPlayerId);
    }
  }

  function handleDeclarePon(playerId, tileToPon) {
    if (tileToPon && gameStore.lastActionPlayerId) {
      gameStore.declarePon(playerId, gameStore.lastActionPlayerId, tileToPon);
    }
  }

  function handleDeclareMinkan(playerId, tileToKan) {
    if (tileToKan && gameStore.lastActionPlayerId) {
      gameStore.declareMinkan(playerId, gameStore.lastActionPlayerId, tileToKan);
    }
  }

  function handleSkipAction() {
    // スキップは、応答待ちのプレイヤーが行う
    // gameStore.playerSkipsCall(myPlayerId.value); // myPlayerIdではなく、実際にスキップするプレイヤーIDを渡す必要がある
    // このメソッドは PlayerArea からのイベントで呼び出されるので、引数で playerId を受け取るべき
    console.warn("handleSkipAction needs to be called with the skipping player's ID from PlayerArea event.");
  }

  function handlePlayerAction(payload) { // { playerId, actionType, tile }
    console.log('Player action received in GameBoard:', payload);
    const { playerId, actionType, tile } = payload;
    if (actionType === 'skip') {
      gameStore.playerSkipsCall(playerId);
    } else if (actionType === 'tsumoAgari') {
      gameStore.handleAgari(playerId, gameStore.drawnTile, true);
    } else if (actionType === 'riichi') {
      gameStore.declareRiichi(playerId);
    } else if (actionType === 'ankan') {
      // PlayerAreaから渡されるtileは、暗槓の場合は選択された牌そのものであるべき
      // ストアの canDeclareAnkan[playerId] が候補リストを返す場合、
      // PlayerArea側で選択UIを出すか、GameBoardが仲介してモーダルを出す
      if (tile) { // tile に選択された暗槓牌が渡ってくる想定
        gameStore.declareAnkan(playerId, tile);
      } else {
        console.error("暗槓する牌が選択されていません。");
      }
    } else if (actionType === 'kakan') {
      if (tile) { // tile に選択された加槓牌が渡ってくる想定
        gameStore.declareKakan(playerId, tile);
      } else {
        console.error("加槓する牌が選択されていません。");
      }
    } else if (actionType === 'ron') {
      gameStore.playerDeclaresCall(playerId, 'ron', gameStore.lastDiscardedTile); // ロン対象牌は lastDiscardedTile
    } else if (actionType === 'pon') {
      gameStore.playerDeclaresCall(playerId, 'pon', tile); // ポン対象牌は PlayerArea から渡される
    } else if (actionType === 'minkan') {
      gameStore.playerDeclaresCall(playerId, 'minkan', tile); // カン対象牌は PlayerArea から渡される
    }
  }

  // ゲームコンテキスト生成のヘルパー関数 (重複を避けるため)
  // ストアから必要な情報を集めてコンテキストオブジェクトを作成

  function handleCloseResultPopup() {
    // ポップアップを閉じるだけの場合 (基本的には proceed を使う)
    gameStore.showResultPopup = false;
  }

  function handleProceedToNextRound() {
    gameStore.prepareNextRound();
  }

  function handleStartNewGameFromFinalResult() {
    gameStore.resetGameForNewSession(); // 状態を完全にリセット
    gameStore.initializeGame(); // 新しいゲームを開始
  }

  function handleBackToTitleFromFinalResult() {
    gameStore.returnToTitle();
    router.push('/'); // タイトル画面のパス (router/index.jsで定義) に遷移
  }
</script>
  
<style scoped>
.game-board {
  display: flex;
  flex-direction: column;
  width: 100vw; /* 画面幅全体を利用 */
  height: 100vh; /* 画面高さ全体を利用 */
  border: 2px solid #333;
  margin: 0; /* マージンを削除 */
  padding: 10px;
  background-image: url('/assets/images/back/mat.png'); /* 背景画像をマットに変更 */
  background-size: cover; /* 画面全体を覆うように調整 */
  background-position: center; /* 画像を中央に配置 */
  position: relative; /* ポップアップなどの基準点になる可能性 */
  box-sizing: border-box; /* paddingとborderをwidth/heightに含める */
}

.player-area-container {
    /* 各プレイヤーエリアコンテナのスタイル (必要に応じて) */
    display: flex;
  /* 縦画面では各プレイヤーエリアが縦に積まれるため、個別の order は不要になることが多い */
  /* 必要に応じて flex-grow や min-height を設定 */
}
.top-player-container {
  /* 対面プレイヤーのエリア */
  flex-grow: 1; min-height: 100px;
  justify-content: center; /* PlayerAreaを中央に配置 */
  align-items: center; /* PlayerAreaを垂直中央に配置 */
}
.middle-row {
  /* 左右プレイヤーと中央テーブルを配置する行 */
  display: flex;
  justify-content: space-between;
  align-items: center; /* 中央揃え */
  flex-grow: 2;
  margin: 5px 0;
}
.left-player-container, .right-player-container {
  /* 左右プレイヤーのエリア */
  width: 25%; display: flex; justify-content: center;
}
.bottom-player-container {
  /* 自分プレイヤーのエリア */
  flex-grow: 3; min-height: 150px;
  justify-content: center; /* PlayerAreaを中央に配置 */
  align-items: center; /* PlayerAreaを垂直中央に配置 */
}

.center-table {
  padding: 10px;
  flex-grow: 1;
  margin: 0 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.discard-piles-main-area {
  position: absolute; /* 親要素(.game-board)を基準に絶対配置 */
  /* 例えば、画面の中央やや下寄りに配置する場合 */
  top: 50%; /* 上から60%の位置 */
  left: 50%;
  transform: translate(-50%, -50%); /* 要素自身の中心を基準点に合わせる */
  width: 100%; /* 画面幅の80%程度の幅を持つようにする (調整可能) */
  max-width: 500px; /* 最大幅も設定しておくと良いでしょう */
  display: grid;
  grid-template-areas:
    ". top ."
    "left . right"
    ". bottom .";
  grid-template-columns: auto 1fr auto; /* 各捨て牌エリアの幅は内容に合わせ、中央のスペースで調整 */
  grid-template-rows: auto auto auto;
  justify-items: center; /* グリッドアイテムを水平中央に配置 */
  align-items: center; /* グリッドアイテムを垂直中央に配置 */
  gap: 5px; /* 捨て牌エリア間の隙間 */
}
.discard-pile-wrapper {
  /* 各DiscardPileコンポーネントのラッパーのスタイル（必要に応じて） */
}
.top-discard {
  grid-area: top;
}
.left-discard {
  grid-area: left;
}
.right-discard {
  grid-area: right;
}
.bottom-discard {
  grid-area: bottom;
}
</style>
