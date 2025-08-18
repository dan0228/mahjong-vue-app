<template>
    <div class="game-board">
      <!-- :styleで動的にtransformを適用 -->
      <div class="game-board-scaler" :style="scalerStyle" ref="gameBoardScalerRef">
      <!-- ルール・役一覧ボタン -->
      <div class="game-board-top-left-buttons">
        <img src="/assets/images/button/rule_button.png" alt="ルール" @click="showRulesPopup = true" class="info-button-image" />
        <img src="/assets/images/button/yaku_button.png" alt="役一覧" @click="showYakuListPopup = true" class="info-button-image" />
        <div class="audio-toggles">
          <label class="toggle-switch">
            <input type="checkbox" :checked="audioStore.isBgmEnabled" @change="audioStore.toggleBgm()">
            <span class="slider round"></span>
          </label>
          <span class="toggle-label">BGM</span>
          <label class="toggle-switch">
            <input type="checkbox" :checked="audioStore.isSeEnabled" @change="audioStore.toggleSe()">
            <span class="slider round"></span>
          </label>
          <span class="toggle-label">効果音</span>
        </div>
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
        <img v-if="isMyPlayerInFuriTen" src="/assets/images/status/furiten.png" alt="フリテン" class="furiten-indicator bottom-furiten" />
        <img v-if="gameStore.isTenpaiDisplay[playerAtBottom.id]" src="/assets/images/status/tenpai.png" alt="テンパイ" class="tenpai-indicator bottom-tenpai" />
        <PlayerArea :player="playerAtBottom" position="bottom" :is-my-hand="determineIsMyHand(playerAtBottom.id)" :drawn-tile-display="drawnTileForPlayer(playerAtBottom.id)" :can-discard="canPlayerDiscard(playerAtBottom.id)" @tile-selected="handleTileSelection" @action-declared="handlePlayerAction" />
      </div>

      <!-- 中央エリア (左右プレイヤーと中央テーブル) -->
      <div class="middle-row">
        <div class="player-area-container left-player-container" v-if="playerAtLeft">
          <img :src="playerIcon(playerAtLeft)" alt="Left Player Icon" :class="{'cat-icon-left-flipped': isKuroAtLeft}" class="cat-icon cat-icon-left" />
          <img v-if="isLeftPlayerInFuriTen" src="/assets/images/status/furiten.png" alt="フリテン" class="furiten-indicator left-furiten" />
          <img v-if="gameStore.isTenpaiDisplay[playerAtLeft.id]" src="/assets/images/status/tenpai.png" alt="テンパイ" class="tenpai-indicator left-tenpai" />
          <PlayerArea :player="playerAtLeft" position="left" :is-my-hand="determineIsMyHand(playerAtLeft.id)" :drawn-tile-display="drawnTileForPlayer(playerAtLeft.id)" :can-discard="canPlayerDiscard(playerAtLeft.id)" @tile-selected="handleTileSelection" @action-declared="handlePlayerAction" />
        </div>
        <div class="center-table">
          <CenterTableInfo :ordered-players="orderedPlayersForDisplay" />
          <!-- 自家の捨て牌エリア (中央テーブルのすぐ下) -->
          <div class="bottom-discard-container">
            <DiscardPile v-if="playerAtBottom" :tiles="playerAtBottom.discards" position="bottom" :riichi-discarded-tile-id="gameStore.riichiDiscardedTileId[playerAtBottom.id]" :highlighted-tile-id="gameStore.highlightedDiscardTileId" class="discard-pile-bottom-player" />
          </div>
        </div>
        <div class="player-area-container right-player-container" v-if="playerAtRight">
         <img :src="playerIcon(playerAtRight)" alt="Right Player Icon" :class="{'cat-icon-right-flipped': isToraAtRight}" class="cat-icon cat-icon-right" />
         <img v-if="isRightPlayerInFuriTen" src="/assets/images/status/furiten.png" alt="フリテン" class="furiten-indicator right-furiten" />
         <img v-if="gameStore.isTenpaiDisplay[playerAtRight.id]" src="/assets/images/status/tenpai.png" alt="テンパイ" class="tenpai-indicator right-tenpai" />
         <PlayerArea :player="playerAtRight" position="right" :is-my-hand="determineIsMyHand(playerAtRight.id)" :drawn-tile-display="drawnTileForPlayer(playerAtRight.id)" :can-discard="canPlayerDiscard(playerAtRight.id)" @tile-selected="handleTileSelection" @action-declared="handlePlayerAction" />
        </div>
      </div>

      <!-- 画面の一番上に表示 -->
      <div class="player-area-container top-player-container" v-if="playerAtTop">
         <img :src="playerIcon(playerAtTop)" alt="Top Player Icon" class="cat-icon cat-icon-top" />
         <PlayerArea :player="playerAtTop" position="top" :is-my-hand="determineIsMyHand(playerAtTop.id)" :drawn-tile-display="drawnTileForPlayer(playerAtTop.id)" :can-discard="canPlayerDiscard(playerAtTop.id)" @tile-selected="handleTileSelection" @action-declared="handlePlayerAction" />
         <img v-if="isTopPlayerInFuriTen" src="/assets/images/status/furiten.png" alt="フリテン" class="furiten-indicator top-furiten" />
         <img v-if="gameStore.isTenpaiDisplay[playerAtTop.id]" src="/assets/images/status/tenpai.png" alt="テンパイ" class="tenpai-indicator top-tenpai" />
         <!-- 対面の捨て牌エリア (対面手牌のすぐ下) -->
         <div class="top-discard-container">
           <DiscardPile v-if="playerAtTop" :tiles="playerAtTop.discards" position="top" :riichi-discarded-tile-id="gameStore.riichiDiscardedTileId[playerAtTop.id]" :highlighted-tile-id="gameStore.highlightedDiscardTileId" class="discard-pile-top-player" />
         </div>
      </div>
      
      <!-- 左の捨て牌エリア (絶対配置) -->
      <div class="left-discard-container">
        <DiscardPile v-if="playerAtLeft" :tiles="playerAtLeft.discards" position="left" :riichi-discarded-tile-id="gameStore.riichiDiscardedTileId[playerAtLeft.id]" :highlighted-tile-id="gameStore.highlightedDiscardTileId" class="discard-pile-left-player" />
      </div>

      <!-- 右の捨て牌エリア (絶対配置) -->
      <div class="right-discard-container">
        <DiscardPile v-if="playerAtRight" :tiles="playerAtRight.discards" position="right" :riichi-discarded-tile-id="gameStore.riichiDiscardedTileId[playerAtRight.id]" :highlighted-tile-id="gameStore.highlightedDiscardTileId" class="discard-pile-right-player" />
      </div>

      <ResultPopup
        :show="gameStore.showResultPopup"
        :message="gameStore.resultMessage"
        :result-details="gameStore.agariResultDetails"
        @close="handleCloseResultPopup"
        @proceed="handleProceedToNextRound"
      />
      
      <ParentDecisionPopup
        :show="gameStore.showDealerDeterminationPopup"
        :dealer-determination-results="sortedPlayersForPopup"
        @close="handleCloseDealerDeterminationPopup"
      />
      <FinalResultPopup
        :show="gameStore.showFinalResultPopup"
        :final-result-details="gameStore.finalResultDetails"
        @start-new-game="handleStartNewGameFromFinalResult"
        @back-to-title="handleBackToTitleFromFinalResult"
      />
      <img v-if="animationDisplay && animationDisplay.type === 'ron'" src="/assets/images/status/ron.png" :class="['ron-indicator', `ron-indicator-${animationDisplay.position}`, 'ron-animation']" alt="ロン" />
      <!-- New Riichi animation for own player -->
      <div v-if="animationDisplay && animationDisplay.type === 'riichi' && animationDisplay.position === 'bottom'" class="riichi-container riichi-slide-animation">
        <img src="/assets/images/status/riichi.png" alt="リーチ" class="riichi-image-scaled" />
      </div>

      <!-- Existing Riichi animation for other players -->
      <img v-if="animationDisplay && animationDisplay.type === 'riichi' && animationDisplay.position !== 'bottom'" src="/assets/images/status/riichi.png" :class="['ron-indicator', `ron-indicator-${animationDisplay.position}`]" alt="リーチ" />
      <img v-if="animationDisplay && animationDisplay.type === 'tsumo'" src="/assets/images/status/tsumo.png" :class="['ron-indicator', `ron-indicator-${animationDisplay.position}`, 'tsumo-animation']" alt="ツモ" />
      <!-- ポンとカンの表示を追加 -->
      <img v-if="animationDisplay && animationDisplay.type === 'pon'" src="/assets/images/status/pon.png" :class="['ron-indicator', `ron-indicator-${animationDisplay.position}`, 'pon-animation', 'pon-kan-size']" alt="ポン" />
      <img v-if="animationDisplay && animationDisplay.type === 'kan'" src="/assets/images/status/kan.png" :class="['ron-indicator', `ron-indicator-${animationDisplay.position}`, 'pon-kan-size', 'kan-animation']" alt="カン" />
      <RulePopup v-if="showRulesPopup" @close="showRulesPopup = false" />
      <YakuListPopup v-if="showYakuListPopup" @close="showYakuListPopup = false" />
      <ParentDecisionPopup
        :show="gameStore.showDealerDeterminationPopup"
        :dealer-determination-results="sortedPlayersForPopup"
        @close="handleCloseDealerDeterminationPopup"
      />
      </div> <!-- End of game-board-scaler -->
    </div>
</template>
  
<script setup>
  import { computed, onMounted, ref, onBeforeUnmount, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import PlayerHand from './PlayerHand.vue';
  import { useGameStore } from '@/stores/gameStore';
  import { useAudioStore } from '@/stores/audioStore';
  import CenterTableInfo from './CenterTableInfo.vue';
  import DiscardPile from './DiscardPile.vue';
  import PlayerArea from './PlayerArea.vue';
  import ResultPopup from './ResultPopup.vue';
  import FinalResultPopup from './FinalResultPopup.vue';
  import ParentDecisionPopup from './ParentDecisionPopup.vue';
  import RulePopup from './RulePopup.vue';
  import YakuListPopup from './YakuListPopup.vue';
  // import Wall from './Wall.vue'; // 将来的に使用
  import * as mahjongLogic from '@/services/mahjongLogic'; // 役判定などに使う場合 (例: checkYonhaiWin, canRiichi)
  import { GAME_PHASES } from '@/stores/gameStore'; // gameStoreからフェーズ定数をインポート

  const gameStore = useGameStore(); // ストアのインスタンスを取得
  const audioStore = useAudioStore();
  const router = useRouter(); // routerインスタンスを取得
  const showAnkanModal = ref(false);
  const ankanOptions = ref([]); // ストアから渡される暗槓可能な牌のリスト
  const showKakanModal = ref(false);
  const kakanOptions = ref([]); // ストアから渡される加槓可能な牌のリスト
  const showRulesPopup = ref(false);
  const showYakuListPopup = ref(false);
  const riichiAnimationState = ref(null);
  const gameBoardScalerRef = ref(null);
  

const playerIcon = (player) => {
  if (!player) return '';
  if (player.id === 'player1') return '/assets/images/info/hito_icon_1.png'; // あなた
  if (player.originalId === 'kuro') return '/assets/images/info/cat_icon_3.png'; // くろ
  if (player.originalId === 'tama') return '/assets/images/info/cat_icon_2.png'; // たま
  if (player.originalId === 'tora') return '/assets/images/info/cat_icon_1.png'; // とら
  if (player.originalId === 'janneko') return '/assets/images/info/cat_icon_4.png'; // 雀猫様
  return null;
};

  // --- Scaling Logic ---
  const DESIGN_WIDTH = 360; // ベースとなるデザインの幅 (9:16のアスペクト比)
  const DESIGN_HEIGHT = 640; // ベースとなるデザインの高さ (9:16のアスペクト比)
  const scaleFactor = ref(1); // 拡大縮小率
  const scalerStyle = computed(() => ({
    transform: `translate(-50%, -50%) scale(${scaleFactor.value})`
  }));

  // ストアのアニメーション状態を監視して、表示用の位置情報を計算する
  const animationDisplay = computed(() => {
    const state = gameStore.animationState;
    if (!state.type || !state.playerId) {
      return null;
    }

    const playerIndex = orderedPlayersForDisplay.value.findIndex(p => p.id === state.playerId);
    let position = '';
    if (playerIndex === 0) position = 'bottom';
    else if (playerIndex === 1) position = 'right';
    else if (playerIndex === 2) position = 'top';
    else if (playerIndex === 3) position = 'left';

    return { type: state.type, position };
  });

  const showReturnButton = computed(() => {
    return (gameStore.gameMode === 'allManual' || gameStore.gameMode === 'vsCPU') &&
           !gameStore.showResultPopup &&
           !gameStore.showFinalResultPopup;
  });
  // ユーザー自身のプレイヤーID (全操作モードでは 'player1' を仮定)
  // 将来的にはログイン機能やモード選択に応じて設定されるべき
  const myPlayerId = computed(() => {
    // 全操作モードとCPU対戦モードでは、'player1'を操作プレイヤーと仮定
    if (gameStore.gameMode === 'allManual' || gameStore.gameMode === 'vsCPU') {
      return 'player1';
    }
    // TODO: オンライン対戦の場合は、ストアに保持されたユーザー自身のIDを返す
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

  const isKuroAtLeft = computed(() => {
    return playerAtLeft.value && playerAtLeft.value.originalId === 'kuro';
  });

  const isToraAtRight = computed(() => {
    return playerAtRight.value && playerAtRight.value.originalId === 'tora';
  });

  const sortedPlayersForPopup = computed(() => {
    const players = gameStore.dealerDeterminationResult.players;
    const windOrder = ['東', '南', '西', '北'];
    return [...players].sort((a, b) => {
      return windOrder.indexOf(a.seatWind) - windOrder.indexOf(b.seatWind);
    });
  });
  const dealerInfo = computed(() => {
    if (gameStore.dealerIndex !== null && gameStore.players[gameStore.dealerIndex]) {
      const dealer = gameStore.players[gameStore.dealerIndex];
      return { name: dealer.name, seatWind: dealer.seatWind };
    }
    return { name: null, seatWind: null };
  });

  const isMyPlayerInFuriTen = computed(() => {
    if (!playerAtBottom.value) return false;
    const playerId = playerAtBottom.value.id;
    return !!(gameStore.isFuriTen[playerId] || gameStore.isDoujunFuriTen[playerId]);
  });

    const isTopPlayerInFuriTen = computed(() => {
    if (!playerAtTop.value) return false;
    const playerId = playerAtTop.value.id;
    return gameStore.gameMode === 'allManual' && !!(gameStore.isFuriTen[playerId] || gameStore.isDoujunFuriTen[playerId]);
  });

  const isLeftPlayerInFuriTen = computed(() => {
    if (!playerAtLeft.value) return false;
    const playerId = playerAtLeft.value.id;
    return gameStore.gameMode === 'allManual' && !!(gameStore.isFuriTen[playerId] || gameStore.isDoujunFuriTen[playerId]);
  });

  const isRightPlayerInFuriTen = computed(() => {
    if (!playerAtRight.value) return false;
    const playerId = playerAtRight.value.id;
    return gameStore.gameMode === 'allManual' && !!(gameStore.isFuriTen[playerId] || gameStore.isDoujunFuriTen[playerId]);
  });


  const gameMode = computed(() => gameStore.gameMode);

  function determineIsMyHand(playerId) {
    if (gameMode.value === 'allManual') {
      return true; // 全操作モードでは全ての牌を表向きに
    }
    // 流局フェーズで、かつテンパイ表示が有効なプレイヤーの手牌を表向きにする
    if (gameStore.gamePhase === GAME_PHASES.ROUND_END && gameStore.isTenpaiDisplay[playerId]) {
      return true;
    }
    // CPU対戦モードやオンライン対戦モードの場合
    // 自分のプレイヤーIDと一致する場合のみ手牌を表示
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
    // 通常の打牌待ち、またはリーチ後の打牌選択待ちの場合に打牌可能
    return gameStore.currentTurnPlayerId === playerId && 
           (gameStore.gamePhase === GAME_PHASES.AWAITING_DISCARD || gameStore.gamePhase === GAME_PHASES.AWAITING_RIICHI_DISCARD);
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
    // どのプレイヤーの操作かに関わらず、現在のターンプレイヤーが打牌可能な状態であれば実行
    // PlayerHand が can-discard プロパティ経由で適切なプレイヤーのターンであること保証すると想定
    if (gameStore.currentTurnPlayerId && (gameStore.gamePhase === 'awaitingDiscard' || gameStore.gamePhase === 'awaitingRiichiDiscard')) {
      gameStore.discardTile(gameStore.currentTurnPlayerId, payload.tile.id, payload.isFromDrawnTile); // 誰が打牌したか渡す
    } else {
      console.warn("現在のゲームフェーズでは牌を選択できません。ターンプレイヤーが打牌可能な状態であることを確認してください。");
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
    const { playerId, actionType, tile } = payload;
    if (actionType === 'skip') {
      gameStore.playerSkipsCall(playerId);
    } else if (actionType === 'tsumoAgari') {
      gameStore.handleAgari(playerId, gameStore.drawnTile, true);
    } else if (actionType === 'riichi') {
              gameStore.declareRiichi(playerId); }
    else if (actionType === 'ankan') {
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
      setTimeout(() => {
        gameStore.playerDeclaresCall(playerId, 'ron', gameStore.lastDiscardedTile);
      }, 0); // 0秒のディレイ
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
    riichiAnimationState.value = null;
    gameStore.showResultPopup = false;
  }

  function handleProceedToNextRound() {
    riichiAnimationState.value = null;
    gameStore.showResultPopup = false; // まずポップアップを閉じる
    gameStore.applyPointChanges(); // 点数変動を適用
    gameStore.prepareNextRound(); // 次の局の準備
  }

  function handleCloseDealerDeterminationPopup() {
    gameStore.showDealerDeterminationPopup = false;
    gameStore.startGameFlow(); // ポップアップが閉じた後にゲームフローを開始
  }

  function handleStartNewGameFromFinalResult() {
    riichiAnimationState.value = null;
    gameStore.resetGameForNewSession({ keepStreak: true }); // 連勝数を維持
    gameStore.initializeGame(); // 新しいゲームを開始
    gameStore.showDealerDeterminationPopup = true; // 親決めポップアップを表示
  }

  function handleBackToTitleFromFinalResult() {
    riichiAnimationState.value = null;
    router.push('/'); // タイトル画面のパス (router/index.jsで定義) に遷移
    gameStore.returnToTitle();
  }

  function returnToTitle() {
    riichiAnimationState.value = null;
    router.push('/');
    gameStore.resetGameForNewSession();
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
    // 保留中のすべてのタイマーをクリア
    let id = window.setTimeout(function() {}, 0);
    while (id--) {
      window.clearTimeout(id); // will do nothing if no timeout with id is present
    }
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
.ron-indicator {
  position: absolute;
  width: 200px; /* 画像サイズは適宜調整 */
  height: auto;
  z-index: 50; /* 他の要素より手前に表示 */
  pointer-events: none; /* 画像がクリックを妨げないように */
  /* 中央揃えのための基本transform */
  transform: translate(-50%, -50%);
  animation: ron-pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes ron-pop-in {
  from {
    transform: translate(-50%, -50%) scale(0.5);
    opacity: 0;
  }
  to {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

.ron-indicator.pon-animation {
  /* 他のインジケーターのアニメーションを上書き */
  animation: pon-bounce-effect 1.5s ease-in-out;
}

@keyframes pon-bounce-effect {
  0% {
    transform: translate(-50%, -50%) scale(1);
    filter: drop-shadow(0 0 0 transparent);
    opacity: 1;
  }
  10% {
    transform: translate(-50%, -50%) scale(1.3);
    filter: drop-shadow(0 0 80px rgba(255, 50, 50, 0.9)); /* 赤い光彩エフェクト */
    opacity: 1;
  }
  20% {
    transform: translate(-50%, -50%) scale(1);
    filter: drop-shadow(0 0 0 transparent);
    opacity: 1;
  }
  80% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.pon-kan-size {
  width: 150px; /* デフォルトの200pxより少し小さく */
}

.ron-indicator.kan-animation {
  animation: kan-bounce-effect 1.7s ease-in-out;
}

@keyframes kan-bounce-effect {
  0% {
    transform: translate(-50%, -50%) scale(1);
    filter: drop-shadow(0 0 0 transparent);
    opacity: 1;
  }
  10% {
    transform: translate(-50%, -50%) scale(1.3);
    filter: drop-shadow(0 0 80px rgba(50, 50, 255, 0.9)); /* 青い光彩エフェクト */
    opacity: 1;
  }
  20% {
    transform: translate(-50%, -50%) scale(1);
    filter: drop-shadow(0 0 0 transparent);
    opacity: 1;
  }
  80% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

/* For Ron (no fade-out) */
.ron-indicator.ron-animation {
  animation: ron-bounce-effect 0.4s ease-in-out;
}

@keyframes ron-bounce-effect {
  0% {
    transform: translate(-50%, -50%) scale(1);
    filter: drop-shadow(0 0 0 transparent);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.3);
    filter: drop-shadow(0 0 80px rgba(255, 50, 50, 0.9));
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    filter: drop-shadow(0 0 0 transparent);
  }
}

/* For Tsumo (no fade-out) */
.ron-indicator.tsumo-animation {
  animation: tsumo-bounce-effect 0.4s ease-in-out;
}

@keyframes tsumo-bounce-effect {
  0% {
    transform: translate(-50%, -50%) scale(1);
    filter: drop-shadow(0 0 0 transparent);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.3);
    filter: drop-shadow(0 0 80px rgba(50, 50, 255, 0.9));
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    filter: drop-shadow(0 0 0 transparent);
  }
}

/* New Riichi Animation Styles */
.riichi-container {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 100%; /* Full width of the game board scaler */
  height: 243px; /* Height of the riichi bar */
  background-color: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  z-index: 100; /* Make sure it's on top */
  transform: translate(-50%, 100%); /* Start off-screen */
}

.riichi-image-scaled {
  height: 100%; /* Fit height to container */
  width: auto;
  border: 6px solid gold;
  box-sizing: border-box; /* 枠線が画像のサイズに影響しないようにする */
}

.riichi-slide-animation {
  animation: riichi-slide 1.5s ease-in-out forwards;
}

@keyframes riichi-slide {
  0% {
    transform: translate(-50%, 100%);
  }
  20.0% { /* 0.3s / 1.5s */
    transform: translate(-50%, 0);
  }
  80.0% { /* 1.2s / 1.5s */
    transform: translate(-50%, 0);
  }
  100% {
    transform: translate(-50%, 100%);
  }
}

/* 各プレイヤーの位置に合わせた表示位置 */
.ron-indicator-bottom {
  top: 75%;
  left: 50%;
}
.ron-indicator-top {
  top: 35%;
  left: 50%;
}
.ron-indicator-left {
  top: 50%;
  left: 22%;
}
.ron-indicator-right {
  top: 53%;
  left: 78%;
}

.game-board-top-left-buttons {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 20;
  display: flex;
  align-items: center; /* Align items vertically */
  gap: 8px;
}

.audio-toggles {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
  background-color: rgba(0, 0, 0, 0.3);
  padding: 4px 8px;
  border-radius: 8px;
}

.toggle-label {
  color: white;
  font-size: 0.64em; /* 0.8em * 0.8 */
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 19.2px; /* 24px * 0.8 */
  height: 11.2px; /* 14px * 0.8 */
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  -webkit-transition: .4s;
  transition: .4s;
  border-radius: 14px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 8px; /* 10px * 0.8 */
  width: 8px; /* 10px * 0.8 */
  left: 1.6px; /* 2px * 0.8 */
  bottom: 1.6px; /* 2px * 0.8 */
  background-color: white;
  -webkit-transition: .4s;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #2196F3;
}

input:focus + .slider {
  box-shadow: 0 0 1px #2196F3;
}

input:checked + .slider:before {
  -webkit-transform: translateX(8px); /* 10px * 0.8 */
  -ms-transform: translateX(8px);
  transform: translateX(8px);
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
  width: 100px; /* 画像サイズに合わせて調整 */
  height: auto;
  z-index: 40; /* 手牌や他のUIより手前に */
  pointer-events: none; /* 画像がクリックを妨げないように */
}

.tenpai-indicator {
  position: absolute;
  width: 100px; /* 画像サイズに合わせて調整 */
  height: auto;
  z-index: 40; /* 手牌や他のUIより手前に */
  pointer-events: none; /* 画像がクリックを妨げないように */
}

.bottom-furiten {
  /* 手牌の前に表示されるように調整 */
  bottom: 120px; /* 手牌の高さや位置に応じて調整 */
  left: 58%;
  transform: translateX(-50%);
}

.bottom-tenpai {
  bottom: 90px;
  left: 58%;
  transform: translateX(-50%);
}

.top-furiten {
  /* 対面プレイヤーの手牌の上あたり */
  top: 90px; /* 手牌の上からの距離 */
  left: 25%;
}

.top-tenpai {
  top: 90px;
  left: 25%;
}

.left-furiten {
  /* 左プレイヤーの手牌の左あたり */
  top: 50%;
  left: 10px; /* 手牌の左からの距離 */
  transform: translateY(-50%) rotate(90deg); /* 90度回転 */
}

.left-tenpai {
  top: 50%;
  left: 10px;
  transform: translateY(-50%) rotate(90deg); /* 90度回転 */
}

.right-furiten {
  /* 右プレイヤーの手牌の右あたり */
  top: 50%;
  right: 10px; /* 手牌の右からの距離 */
  transform: translateY(-50%) rotate(-90deg); /* -90度回転 */
}

.right-tenpai {
  top: 50%;
  right: 10px;
  transform: translateY(-50%) rotate(-90deg); /* -90度回転 */
}

.cat-icon-left {
  top: -70px;
  left: 40px;
  transform: translate(-50%, -50%);
}

.cat-icon-left-flipped {
  transform: translate(-50%, -50%) scaleX(-1);
}

.cat-icon-top {
  top: -35px;
  left: 50%;
  transform: translate(-50%, -50%);
}

.cat-icon-right {
  top: -70px;
  right: -40px;
  transform: translate(-50%, -50%);
}

.cat-icon-right-flipped {
  transform: translate(-50%, -50%) scaleX(-1);
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
  width: 35px; /* 手牌の幅に合わせる */ 
  display: flex; 
  justify-content: center;
  z-index: 10; /* 他の要素より手前に表示 */
  flex-shrink: 0; /* コンテナが縮まないようにする */
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
  left: -30px;
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
