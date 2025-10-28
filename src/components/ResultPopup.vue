<script setup>
import { useGameStore } from '@/stores/gameStore';
import { useI18n } from 'vue-i18n';  
import { useUserStore } from '@/stores/userStore';
import { getTileImageUrl, tileToString } from '@/utils/tileUtils';
import { computed, watch } from 'vue';

const { t } = useI18n();

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  message: {
    type: String,
    default: '結果はありません。',
  },
  resultDetails: { 
    type: Object,
    required: true,
    default: () => ({ pointChanges: {} })
  },
});

const emit = defineEmits(['close', 'proceed']);

const gameStore = useGameStore();
const userStore = useUserStore();

// このポップアップが表示されるときに、必ず準備完了状態をリセットする
watch(() => props.show, (isShown) => {
  if (isShown) {
    gameStore.clearReadyForNextRound();
  }
});

const isReady = computed(() => {
  if (!gameStore.isGameOnline) return false;
  const localId = userStore.profile?.id;
  if (!localId) return false;
  return gameStore.playersReadyForNextRound.includes(localId);
});

const translatedScoreName = computed(() => {
  const scoreName = props.resultDetails.scoreName;
  if (!scoreName) return '';
  const scoreNameMap = {
    '満貫': 'mangan',
    '跳満': 'haneman',
    '倍満': 'baiman',
    '三倍満': 'sanbaiman',
    '役満': 'yakuman',
    '数え役満': 'kazoeYakuman',
  };
  const key = scoreNameMap[scoreName];
  return key ? t(`resultPopup.scoreNames.${key}`) : scoreName;
});

function getTranslatedPlayerName(player) {
  if (!player) return '';
  if (player.originalId) {
    return t(`aiNames.${player.originalId}`);
  }
  return player.name;
}

function proceedToNext() {
  emit('proceed');
}

const isDrawResult = computed(() => props.resultDetails?.isDraw);
const isChomboResult = computed(() => props.resultDetails?.isChombo);

const resultTitle = computed(() => {
  if (isChomboResult.value && props.resultDetails.chomboPlayerId) {
    const chomboPlayer = gameStore.getPlayerById(props.resultDetails.chomboPlayerId);
    if (chomboPlayer) return t('resultPopup.titleChombo', { playerName: getTranslatedPlayerName(chomboPlayer) });
  }
  if (isDrawResult.value) return t('resultPopup.draw');
  const winnerId = Object.keys(props.resultDetails.pointChanges || {}).find(
    playerId => (props.resultDetails.pointChanges[playerId] || 0) > 0
  );
  if (winnerId) {
    const winner = gameStore.getPlayerById(winnerId);
    if (winner) return t('resultPopup.titleWin', { playerName: getTranslatedPlayerName(winner) });
  }
  const match = props.message.match(/(.+?) の和了/);
  if (match && match[1]) {
    const playerName = match[1];
    const player = gameStore.players.find(p => p.name === playerName);
    return t('resultPopup.titleWin', { playerName: getTranslatedPlayerName(player) });
  }
  return t('resultPopup.titleResult');
});

const isRiichiAgari = computed(() => {
  const winnerId = Object.keys(props.resultDetails.pointChanges || {}).find(playerId => props.resultDetails.pointChanges[playerId] > 0);
  if (!winnerId) return false;
  const winner = gameStore.getPlayerById(winnerId);
  return winner?.isRiichi || winner?.isDoubleRiichi;
});

const winnerIconSrc = computed(() => {
  if (isDrawResult.value) return null;
  let targetPlayerId = null;
  if (props.resultDetails.isChombo && props.resultDetails.chomboPlayerId) {
    targetPlayerId = props.resultDetails.chomboPlayerId;
  } else {
    targetPlayerId = Object.keys(props.resultDetails.pointChanges || {}).find(playerId => props.resultDetails.pointChanges[playerId] > 0);
  }
  if (!targetPlayerId) return null;
  const player = gameStore.players.find(p => p.id === targetPlayerId);
  if (!player) return null;
  if (player.id === 'player1' && userStore.profile?.avatar_url) {
    return userStore.profile.avatar_url;
  }
  if (player.id === 'player1') return '/assets/images/info/hito_icon_1.png';
  if (player.originalId === 'kuro') return '/assets/images/info/cat_icon_3.png';
  if (player.originalId === 'tama') return '/assets/images/info/cat_icon_2.png';
  if (player.originalId === 'tora') return '/assets/images/info/cat_icon_1.png';
  if (player.originalId === 'janneko') return '/assets/images/info/cat_icon_4.png';
  return null;
});

const isYakumanResult = computed(() => props.resultDetails.scoreName && props.resultDetails.scoreName.includes('役満'));
const isKazoeYakuman = computed(() => props.resultDetails.scoreName === '数え役満');

const originalHandWithoutAgariTile = computed(() => {
  if (!props.resultDetails.winningHand || !props.resultDetails.agariTile) {
    return props.resultDetails.winningHand || [];
  }
  const agariTileId = props.resultDetails.agariTile.id;
  let foundAgariTile = false;
  return props.resultDetails.winningHand.filter(tile => {
    if (tile.id === agariTileId && !foundAgariTile) {
      foundAgariTile = true;
      return false;
    }
    return true;
  });
});

const roundWindDisplay = computed(() => {
  if (props.resultDetails.roundWind === 'east') return t('resultPopup.windEast');
  if (props.resultDetails.roundWind === 'south') return t('resultPopup.windSouth');
  return '';
});

function formatPointChange(change) {
  if (change == null) return '';
  return change > 0 ? `+${change}` : `${change}`;
}

function getPointChangeClass(change) {
  if (change == null) return '';
  return change > 0 ? 'point-increase' : (change < 0 ? 'point-decrease' : '');
}

function getMeldTileClass(meld, tileIndex) {
  if (!meld.takenTileRelativePosition) return '';
  if (meld.type === 'pon' || meld.type === 'minkan' || meld.type === 'kakan') {
    if (meld.takenTileRelativePosition === 'left' && tileIndex === 0) return 'sideways';
    if (meld.takenTileRelativePosition === 'middle' && tileIndex === 1) return 'sideways';
    if (meld.takenTileRelativePosition === 'right' && tileIndex === 2) return 'sideways';
  }
  if (meld.type === 'ankan' && (tileIndex === 1 || tileIndex === 2)) {
    return 'hidden-tile';
  }
  return '';
}
</script>