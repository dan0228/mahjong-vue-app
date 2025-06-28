<template>
    <div class="game-board">
      <!-- :styleで動的にtransformを適用 -->
      <div class="game-board-scaler" :style="scalerStyle">
      <!-- ルール・役一覧ボタン -->
      <div class="game-board-top-left-buttons">
        <img src="/assets/images/button/rule_button.png" alt="ルール" @click="showRulesPopup = true" class="info-button-image" />
        <img src="/assets/images/button/yaku_button.png" alt="役一覧" @click="showYakuListPopup = true" class="info-button-image" />
      </div>
      <!-- タイトルへ戻るボタン -->
      <div class="game-board-header" v-if="showReturnButton">
        <img 
          src="/assets/images/button/buckToTitle.png" 
          alt="タイトルへ戻る" 
          @click="returnToTitle" class="return-button-image" />
      </div>
      <!-- PlayerArea コンポーネントを動的に配置 -->
      <!-- DOMの記述順と表示順が column-reverse で逆になることに注意 -->

      <!-- 画面の一番下に表示 -->
      <div class="player-area-container bottom-player-container" v-if="playerAtBottom">
        <!-- フリテン表示 -->
        <img v-if="isMyPlayerInFuriTen" src="/assets/images/status/furiten.png" alt="フリテン" class="furiten-indicator" />
        <PlayerArea :player="playerAtBottom" position="bottom" :is-my-hand="determineIsMyHand(playerAtBottom.id)" :drawn-tile-display="drawnTileForPlayer(playerAtBottom.id)" :can-discard="canPlayerDiscard(playerAtBottom.id)" @tile-selected="handleTileSelection" @action-declared="handlePlayerAction" />
      </div>

      <!-- 中央エリア (左右プレイヤーと中央テーブル) -->
      <div class="middle-row">
        <div class="player-area-container left-player-container" v-if="playerAtLeft">
          <img src="/assets/images/info/cat_icon_1.png" alt="Cat Icon 1" class="cat-icon cat-icon-left" />
          <img src="/assets/images/info/cat_icon_2.png" alt="Cat Icon 1" class="cat-icon cat-icon-top" />
          <img src="/assets/images/info/cat_icon_3.png" alt="Cat Icon 1" class="cat-icon cat-icon-right" />
          <PlayerArea :player="playerAtLeft" position="left" :is-my-hand="determineIsMyHand(playerAtLeft.id)" :drawn-tile-display="drawnTileForPlayer(playerAtLeft.id)" :can-discard="canPlayerDiscard(playerAtLeft.id)" @tile-selected="handleTileSelection" @action-declared="handlePlayerAction" />
        </div>
        <div class="center-table">
          <CenterTableInfo :ordered-players="orderedPlayersForDisplay" />
          <!-- 自家の捨て牌エリア (中央テーブルのすぐ下) -->
          <div class="bottom-discard-container">
            <DiscardPile v-if="playerAtBottom" :tiles="playerAtBottom.discards" position="bottom" class="discard-pile-bottom-player" />
          </div>
        </div>
        <div class="player-area-container right-player-container" v-if="playerAtRight">
          <PlayerArea :player="playerAtRight" position="right" :is-my-hand="determineIsMyHand(playerAtRight.id)" :drawn-tile-display="drawnTileForPlayer(playerAtRight.id)" :can-discard="canPlayerDiscard(playerAtRight.id)" @tile-selected="handleTileSelection" @action-declared="handlePlayerAction" />
        </div>
      </div>

      <!-- 画面の一番上に表示 -->
      <div class="player-area-container top-player-container" v-if="playerAtTop">
         <PlayerArea :player="playerAtTop" position="top" :is-my-hand="determineIsMyHand(playerAtTop.id)" :drawn-tile-display="drawnTileForPlayer(playerAtTop.id)" :can-discard="canPlayerDiscard(playerAtTop.id)" @tile-selected="handleTileSelection" @action-declared="handlePlayerAction" />
         <!-- 対面の捨て牌エリア (対面手牌のすぐ下) -->
         <div class="top-discard-container">
           <DiscardPile v-if="playerAtTop" :tiles="playerAtTop.discards" position="top" class="discard-pile-top-player" />
         </div>
      </div>
      
      <!-- 左の捨て牌エリア (絶対配置) -->
      <div class="left-discard-container">
        <DiscardPile v-if="playerAtLeft" :tiles="playerAtLeft.discards" position="left" class="discard-pile-left-player" />
      </div>

      <!-- 右の捨て牌エリア (絶対配置) -->
      <div class="right-discard-container">
        <DiscardPile v-if="playerAtRight" :tiles="playerAtRight.discards" position="right" class="discard-pile-right-player" />
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
      <RulePopup v-if="showRulesPopup" @close="showRulesPopup = false" />
      <YakuListPopup v-if="showYakuListPopup" @close="showYakuListPopup = false" />
      </div> <!-- End of game-board-scaler -->
    </div>
</template>
  
<script setup>
  import { computed, onMounted, ref, onBeforeUnmount } from 'vue';
  import { useRouter } from 'vue-router';
  import PlayerHand from './PlayerHand.vue';
  import { useGameStore } from '@/stores/gameStore';
  import CenterTableInfo from './CenterTableInfo.vue';
  import DiscardPile from './DiscardPile.vue';
  import PlayerArea from './PlayerArea.vue';
  import ResultPopup from './ResultPopup.vue';
  import FinalResultPopup from './FinalResultPopup.vue';
  import RulePopup from './RulePopup.vue';
  import YakuListPopup from './YakuListPopup.vue';
  // import Wall from './Wall.vue'; // 将来的に使用
  import * as mahjongLogic from '@/services/mahjongLogic'; // 役判定などに使う場合 (例: checkYonhaiWin, canRiichi)
  import { GAME_PHASES } from '@/stores/gameStore'; // gameStoreからフェーズ定数をインポート

  const gameStore = useGameStore(); // ストアのインスタンスを取得
  const router = useRouter(); // routerインスタンスを取得
  const showAnkanModal = ref(false);
  const ankanOptions = ref([]); // ストアから渡される暗槓可能な牌のリスト
  const showKakanModal = ref(false);
  const kakanOptions = ref([]); // ストアから渡される加槓可能な牌のリスト
  const showRulesPopup = ref(false);
  const showYakuListPopup = ref(false);

  // --- Scaling Logic ---
  const DESIGN_WIDTH = 360; // ベースとなるデザインの幅 (9:16のアスペクト比)
  const DESIGN_HEIGHT = 640; // ベースとなるデザインの高さ (9:16のアスペクト比)
  const scaleFactor = ref(1); // 拡大縮小率
  const scalerStyle = computed(() => ({
    transform: `translate(-50%, -50%) scale(${scaleFactor.value})`
  }));

  const showReturnButton = computed(() => {
    return (gameStore.gameMode === 'allManual' || gameStore.gameMode === 'vsCPU') &&
           !gameStore.showResultPopup &&
           !gameStore.showFinalResultPopup;
  });
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

  const isMyPlayerInFuriTen = computed(() => {
    if (!playerAtBottom.value) return false;
    return !!gameStore.isFuriTen[playerAtBottom.value.id];
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

  function returnToTitle() {
    gameStore.resetGameForNewSession();
    router.push('/');
  }

  // --- Scaling Logic ---
  const updateScaleFactor = () => {
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;

    const scaleX = currentWidth / DESIGN_WIDTH;
    const scaleY = currentHeight / DESIGN_HEIGHT;

    // 幅と高さの両方に収まるように、小さい方のスケールファクターを選択
    scaleFactor.value = Math.min(scaleX, scaleY);
  };

  onMounted(() => {
    updateScaleFactor(); // 初期表示時にスケールを計算
    window.addEventListener('resize', updateScaleFactor); // ウィンドウリサイズ時に再計算
  });
  onBeforeUnmount(() => { // コンポーネントがアンマウントされるときにイベントリスナーをクリーンアップ
    window.removeEventListener('resize', updateScaleFactor);
  });

</script>
  
<style scoped>
.game-board {
  /* このdivはビューポートとして機能し、game-board-scalerを中央に配置します */
  position: relative; /* game-board-scaler の絶対配置の基準 */
  width: 100vw; /* ビューポートの幅全体を使用 */
  height: 100vh; /* ビューポートの高さ全体を使用 */
  overflow: hidden; /* スケーリングではみ出した部分を隠す */
  background-image: url('/assets/images/back/back_out.png'); /* 背景画像を敷き詰める */
  background-repeat: repeat; /* 画像を繰り返し表示 */
  box-sizing: border-box;
  border: 2px solid #333; /* 外側のボーダー */
}
.game-board-scaler {
  /* このdivがゲームコンテンツ全体を保持し、スケーリングされます */
  position: absolute; /* 親(.game-board)に対して絶対配置 */
  top: 50%; /* 親の中央に配置 */
  left: 50%; /* 親の中央に配置 */
  width: 360px; /* ベースとなるデザインの幅 */
  height: 640px; /* ベースとなるデザインの高さ */
  background-image: url('/assets/images/back/mat.png'); /* ゲームマットの背景画像 */
  background-size: cover;
  background-position: center;
  display: flex; /* 内部の flex レイアウトを維持 */
  flex-direction: column-reverse; /* 内部の flex レイアウトを維持 */
  border: 1px solid #740e017e; /* 赤茶色の枠線 */
  box-sizing: border-box; /* 枠線をwidth/heightに含める */
}

.game-board-top-left-buttons {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 20;
  display: flex;
  gap: 8px;
}
.info-button-image {
  width: 50px;
  height: auto;
  cursor: pointer;
  pointer-events: auto;
}
.info-button-image:hover {
  opacity: 0.8;
}

.game-board-header {
  position: absolute;
  top: 10px; /* 画面上部からの距離 (調整可能) */
  right: 10px; /* 画面右部からの距離 (調整可能) */
  z-index: 20; /* GameBoard内の他の要素より手前に表示 */
  pointer-events: auto !important; /* マウスイベントを強制的に有効化 */
}
.return-button-image {
  width: 50px; /* 画像の幅に合わせて調整してください */
  height: auto; /* 高さは自動調整 */
  cursor: pointer;
  display: block; /* imgタグの余分なスペースを消すため */
  pointer-events: auto !important; /* マウスイベントを強制的に有効化 */
}
.return-button-image:hover {
  opacity: 0.8; /* ホバー時に少し透明にするエフェクト (任意) */
}

.cat-icon {
  position: absolute;
  width: 80px; /* アイコンのサイズ */
  height: 80px; /* アイコンのサイズ */
  object-fit: contain;
  z-index: 15; /* 他のUI要素より手前に表示 */
}

.furiten-indicator {
  position: absolute;
  /* 手牌の前に表示されるように調整 */
  bottom: 80px; /* 手牌の高さや位置に応じて調整 */
  left: 50%;
  transform: translateX(-50%);
  width: 100px; /* 画像サイズに合わせて調整 */
  height: auto;
  z-index: 40; /* 手牌や他のUIより手前に */
  pointer-events: none; /* 画像がクリックを妨げないように */
}

.cat-icon-left {
  /* 左プレイヤーの手牌の上部 */
  top: -105px; /* コンテナの上端から少し上にずらす */
  left: 110%; /* コンテナの水平中央に配置 */
  transform: translateX(-50%); /* 中央揃えのための調整 */
}

.cat-icon-top {
  /* 対面プレイヤーの手牌の上部 */
  top: -255px; /* コンテナの上端から少し上にずらす */
  left: 530%; /* コンテナの水平中央に配置 */
  transform: translateX(-50%); /* 中央揃えのための調整 */
}

.cat-icon-right {
  /* 右プレイヤーの手牌の上部 */
  top: -105px; /* コンテナの上端から少し上にずらす */
  right: -1050%; /* コンテナの水平中央に配置 */
  transform: translateX(-50%); /* 中央揃えのための調整 */
}

.player-area-container {
    /* 各プレイヤーエリアコンテナのスタイル (必要に応じて) */
    display: flex;
  /* 縦画面では各プレイヤーエリアが縦に積まれるため、個別の order は不要になることが多い */
  /* 必要に応じて flex-grow や min-height を設定 */
  position: relative; /* アイコンの絶対配置の基準 */
}
.top-player-container, .bottom-player-container {
  width: 100%; /* コンテナの幅を画面幅に合わせる */
}
.top-player-container {
  /* 対面プレイヤーのエリア */
  flex-grow: 0; /* 高さは内容に合わせる */
  margin-bottom: -140px; /* 上の要素（middle-row）との間隔を狭める */
  max-width: 200px; /* 対面エリアの最大幅 (手牌の数やサイズに応じて調整) */
  margin-left: auto; /* max-width時に中央寄せ */
  margin-right: auto; /* max-width時に中央寄せ */
  justify-content: center; /* PlayerAreaを中央に配置 */
  align-items: center; /* PlayerAreaを垂直中央に配置 */
  z-index: 10; /* 他の要素より手前に表示 */
}
.middle-row {
  /* 左右プレイヤーと中央テーブルを配置する行 */
  display: flex;
  justify-content: space-between; /* 要素間にスペースを均等に配置 */
  align-items: center; /* 中央揃え */
  flex-grow: 2;
  width: 100%; /* 親要素いっぱいに広がるように */
  max-height: 600px; /* middle-rowの最大高さを設定 (任意) */
  max-width: 500px; /* middle-row全体の最大幅を設定 (任意) */
  margin-left: auto; /* max-width時に中央寄せ */
  margin-right: auto; /* max-width時に中央寄せ */
}
.left-player-container, .right-player-container {
  /* 左右プレイヤーのエリア */
  width: 35px; /* 内容に合わせる */ 
  display: flex; 
  justify-content: center;
  z-index: 10; /* 他の要素より手前に表示 */
}
.bottom-player-container {
  /* 自分プレイヤーのエリア */
  flex-grow: 1;
  max-height: 0px;
  justify-content: center; /* PlayerAreaを水平中央に配置 */
  align-items: flex-end; /* PlayerAreaをコンテナの下端に配置 */
  max-width: 400px; /* 自家エリアの最大幅 */
  margin-left: auto; /* max-width時に中央寄せ */
  margin-right: auto; /* max-width時に中央寄せ */;
  z-index: 10; /* 他の要素より手前に表示 */
  padding-bottom: 0px; /* この値を調整して手牌の位置を上下に動かします。値を大きくすると上に、小さくすると下に移動します。 */
}

.center-table {
  padding: 0; /* paddingは内部のbottom-discard-containerで調整 */
  flex-grow: 1;
  margin: 0 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column; /* 内部要素を縦に並べる */
}
.bottom-discard-container {
  /* 自家の捨て牌エリア */
  display: flex;
  position: absolute;
  top: 415px; /* 上端を固定 (調整) */
  left: 50%;
  transform: translateX(-50%);
}
.top-discard-container {
  /* 対面の捨て牌エリア */
  display: flex;
  position: absolute; /* 親のtop-player-containerを基準に絶対配置 */
  bottom: -87px; /* 下端を固定 (調整) */
  left: 50%;
  transform: translateX(-50%);
}
.left-discard-container {
  display: flex;
  position: absolute;
  top: 42%;
  right: 110px; /* 右端を固定 (調整) */
  transform: rotate(90deg);
  transform-origin: top left;
}
.right-discard-container {
  display: flex;
  position: absolute;
  top: 42%;
  left: 110px; /* 左端を固定 (調整) */
  transform: rotate(-90deg);
  transform-origin: top right;
}

</style>
