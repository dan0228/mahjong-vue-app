<template>
  <div class="shrine-view-container" :style="{ height: viewportHeight }">
    <div class="shrine-screen" :style="scalerStyle">
      <div class="cat-coins">
        🪙猫コイン: <span class="cat-coins-number">{{ gameStore.catCoins }}</span>
      </div>
      <div class="top-controls">
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
        <button @click="goToTitle" class="back-button">
          <img src="/assets/images/button/buckToTitle.png" alt="トップに戻る">
        </button>
      </div>
      
      <button @click="drawOmikuji" class="omikuji-button">おみくじ<br><span class="coin-text">１回100🪙猫コイン</span></button>
      <div class="sayings-container">
        <table class="sayings-table">
          <tbody>
            <tr v-for="(saying, index) in sayings" :key="saying.id">
              <td class="saying-no">No.{{ index + 1 }}</td>
              <td class="saying-text">{{ revealedSayings[saying.id] ? saying.text : '？？？' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <transition name="fade">
        <SayingPopup v-if="showPopup" :fortune="randomFortune" :saying="randomSaying" :sayingId="randomSayingId" :isNew="isNewSaying" @close="closePopup" />
      </transition>

      <div :class="{'fade-overlay': true, 'is-fading': isFading}"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useAudioStore } from '../stores/audioStore';
import { useGameStore } from '@/stores/gameStore';
import SayingPopup from '@/components/SayingPopup.vue';
import { useViewportHeight } from '@/composables/useViewportHeight';

const { viewportHeight } = useViewportHeight();

const router = useRouter();
const audioStore = useAudioStore();
const gameStore = useGameStore();

const showPopup = ref(false);
const randomFortune = ref('');
const randomSaying = ref('');
const randomSayingId = ref(null);
const isFading = ref(false); // フェード状態を管理
const isNewSaying = ref(false); // 新しい名言かどうか

const revealedSayings = ref({}); // { sayingId: true/false }

const loadRevealedSayings = () => {
  const saved = localStorage.getItem('mahjongRevealedSayings');
  if (saved) {
    revealedSayings.value = JSON.parse(saved);
  }
};

const saveRevealedSayings = () => {
  localStorage.setItem('mahjongRevealedSayings', JSON.stringify(revealedSayings.value));
};

const previousBgm = ref(null);

const drawOmikuji = () => {
  previousBgm.value = audioStore.currentBgm;
  audioStore.setBgm(null); // BGMを停止
  audioStore.playSound('Kagura_Suzu01-7.mp3'); // 神楽鈴の音を再生

  const cost = 100;
  if (gameStore.catCoins < cost) {
    randomFortune.value = ""; // 運勢は表示しない
    randomSaying.value = "コインが足りないにゃ！\nコインを稼いでくるにゃ！";
    randomSayingId.value = null; // コイン不足時はIDをクリア
    isNewSaying.value = false; // リセット
    showPopup.value = true;
    return;
  }



  if (gameStore.deductCatCoins(cost)) {
    isFading.value = true; // フェードアウト開始
    setTimeout(() => {
      const fortunes = ["大吉😸", "吉🐈", "中吉🐈", "小吉🐈", "末吉🐈‍⬛", "凶🐈‍⬛", "大凶🐈‍⬛"];
      randomFortune.value = fortunes[Math.floor(Math.random() * fortunes.length)];
      const randomIndex = Math.floor(Math.random() * sayings.value.length);
      const drawnSaying = sayings.value[randomIndex];
      randomSaying.value = drawnSaying.text;
      randomSayingId.value = drawnSaying.id; // 引いた名言のIDをセット

      // 新しく公開された名言かどうかを判定
      isNewSaying.value = !revealedSayings.value[drawnSaying.id];

      // 引いた名言を公開状態にする
      revealedSayings.value[drawnSaying.id] = true;
      saveRevealedSayings();

      showPopup.value = true;
      isFading.value = false; // フェードイン開始
    }, 1500); // フェードアウトの時間に合わせて調整
  } else {
    randomFortune.value = "";
    randomSaying.value = "コインの消費に失敗したにゃ。";
    randomSayingId.value = null; // コイン消費失敗時はIDをクリア
    isNewSaying.value = false; // リセット
    showPopup.value = true;
  }
};


const closePopup = () => {
  showPopup.value = false;
  if (previousBgm.value) {
    audioStore.setBgm(previousBgm.value);
    previousBgm.value = null; // Reset for next time
  }
};


const goToTitle = () => {
  router.push({ name: 'Title' });
};

// --- Scaling Logic ---
const DESIGN_WIDTH = 360;
const DESIGN_HEIGHT = 640;
const scaleFactor = ref(1);
const scalerStyle = computed(() => ({
  transform: `translate(-50%, -50%) scale(${scaleFactor.value})`
}));

const updateScaleFactor = () => {
  const currentWidth = window.innerWidth;
  const currentHeight = window.innerHeight;
  const scaleX = currentWidth / DESIGN_WIDTH;
  const scaleY = currentHeight / DESIGN_HEIGHT;
  scaleFactor.value = Math.min(scaleX, scaleY);
};

onMounted(() => {
  updateScaleFactor();
  window.addEventListener('resize', updateScaleFactor);
  gameStore.loadCatCoins();
  loadRevealedSayings(); // 追加
  audioStore.setBgm('GB-JP-A02-2(Menu-Loop105).mp3');
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScaleFactor);
  audioStore.setBgm(null); // 画面離脱時にBGMを停止
});

const sayings = ref([
  { id: 's1', text: "運もツモも、掴みにいくからやってくるにゃ。" },
  { id: 's2', text: "迷ったときは、東風に問いかけるといいにゃ。" },
  { id: 's3', text: "鳴くも捨てるも、おぬし次第。自分を信じるのみにゃ。" },
  { id: 's4', text: "運はいつも、眠そうな顔してやってくるにゃ。" },
  { id: 's5', text: "勝ちたいと願う心が、最初の一牌にゃ。" },
  { id: 's6', text: "待ちは一つじゃないにゃ。道もまた然り。" },
  { id: 's7', text: "ツモったときは、誰より先に感謝するにゃ。" },
  { id: 's8', text: "流局もまた、勝利への一歩にゃ。" },
  { id: 's9', text: "河を見よ。牌は語るにゃ。" },
  { id: 's10', text: "勝っても負けても、平常心にゃ。" },
  { id: 's11', text: "強者とは、捨てるときに迷わぬ者にゃ。" },
  { id: 's12', text: "理牌は手牌だけじゃないにゃ。心を整えるにゃ。" },
  { id: 's13', text: "最後のツモまで諦めないのが、真の雀士にゃ。" },
  { id: 's14', text: "選択は速く、判断は冷静にゃ。" },
  { id: 's15', text: "どんな結果も運だけじゃにゃい、意思を持って選び続けた結果にゃ。" },
  { id: 's16', text: "ロンされる勇気がある猫だけ、ロン宣言するにゃ。" },
  { id: 's17', text: "捨て牌は過去。ツモる牌だけが未来にゃ。" },
  { id: 's18', text: "効率も大事。でも直感もまた真実にゃ。" },
  { id: 's19', text: "勝利は必然。偶然を集めて作る必然にゃ。" },
  { id: 's20', text: "今日の負けは、明日の役満にゃ。" },
  { id: 's21', text: "待つのも技術。焦りはミスを生むにゃ。" },
  { id: 's22', text: "リーチは誓い。己との約束にゃ。" },
  { id: 's23', text: "心の乱れは牌の乱れ。まずは深呼吸にゃ。" },
  { id: 's24', text: "和了るときは静かににゃ。猫は忍び足。" },
  { id: 's25', text: "残り1000点しかないじゃない。まだ1000点あるにゃ。" },
  { id: 's26', text: "一度決めた待ちを信じ続ける強さもあるにゃ。" },
  { id: 's27', text: "他家を恐れるより、己を信じるにゃ。" },
  { id: 's28', text: "配牌が悪くても、最後まで諦めぬにゃ。" },
  { id: 's29', text: "牌効率の先に、それだけじゃない真の強さがあるにゃ。" },
  { id: 's30', text: "ツモ切りもまた戦略にゃ。" },
  { id: 's31', text: "目に映る河は、心を映す鏡にゃ。" },
  { id: 's32', text: "いつか役満、今は一歩にゃ。" },
  { id: 's33', text: "寝て待て、流局は味方にゃ。" },
  { id: 's34', text: "ドラは運の化身にゃ。捨てるときは注意にゃ。" },
  { id: 's35', text: "ゼンツは覚悟、オリは勇気にゃ。" },
  { id: 's36', text: "和了牌は、来ると信じない猫にはやってこないにゃ。" },
  { id: 's37', text: "役を作るより、心を育てるにゃ。" },
  { id: 's38', text: "風牌を鳴くときは、場を荒らす覚悟を持てにゃ。" },
  { id: 's39', text: "親は攻めるもの、子は守るものにゃ。" },
  { id: 's40', text: "和了れぬ局は、己の心を鍛える稽古にゃ。" },
  { id: 's41', text: "勝負は卓上だけでないにゃ。ブラフを織り交ぜ舌戦を制するにゃ。" },
  { id: 's42', text: "三色に気づき、戦略に取り入れるにゃ。" },
  { id: 's43', text: "無駄ヅモなし。すべてのツモが血肉になるにゃ。" },
  { id: 's44', text: "捨て牌に迷ったら、まずは深呼吸にゃ。" },
  { id: 's45', text: "大三元も一歩の積み重ねにゃ。" },
  { id: 's46', text: "初心を忘れたとき、大きな振込みがやってくるにゃ。" },
  { id: 's47', text: "牌山は小さくても、夢は大きくにゃ。" },
  { id: 's48', text: "どんな道を通ろうとも、和了れば正解にゃ。" },
  { id: 's49', text: "目先の点より、流れを重んじるにゃ。" },
  { id: 's50', text: "麻雀は風とともにあるにゃ。流れに身を任せるにゃ。" },
  { id: 's51', text: "勝利は狙うものではなく迎えるものにゃ。" },
  { id: 's52', text: "勝って兜の緒を締めるにゃ。" },
  { id: 's53', text: "孤独に振り返り、自身を見つめるにゃ。" },
  { id: 's54', text: "混一色は欲望の現れにゃ。" },
  { id: 's55', text: "三色同刻は慎ましやかな喜びにゃ。" },
  { id: 's56', text: "清一色は強欲の極みにゃ。" },
  { id: 's57', text: "役牌バックは密かな策略にゃ。" },
  { id: 's58', text: "一発ツモは神の戯れにゃ。" },
  { id: 's59', text: "やめなければ、まだ負けてないにゃ。" },
  { id: 's60', text: "流し満貫はないけどやる。それも美学にゃ。" },
  { id: 's61', text: "東場3局まで育て、オーラスで刈り取るにゃ。" },
  { id: 's62', text: "供託棒は猫のおやつにゃ。" },
  { id: 's63', text: "親は誰にも渡さない、それが誇りにゃ。" },
  { id: 's64', text: "安牌がないときは、祈るより読むにゃ。" },
  { id: 's65', text: "牌は読まれる前に切るにゃ。" },
  { id: 's66', text: "迷いは河に捨てるにゃ。" },
  { id: 's67', text: "ロン！は一言の芸術にゃ。" },
  { id: 's68', text: "リーチ！は静かな宣戦布告にゃ。" },
  { id: 's69', text: "カン！は運命の切り替えにゃ。" },
  { id: 's70', text: "ポン！は勇気の現れにゃ。" },
  { id: 's71', text: "どの牌も一度は大切な仲間にゃ。" },
  { id: 's72', text: "ドラは猫の鈴にゃ。鳴らすか隠すかにゃ。" },
  { id: 's73', text: "最後の一牌で流れが変わるにゃ。" },
  { id: 's74', text: "勝負は積む前から始まっているにゃ。" },
  { id: 's75', text: "己を信じたとき、牌も応えるにゃ。" },
  { id: 's76', text: "他家に合わせるときも、心は合わせぬにゃ。" },
  { id: 's77', text: "流れを読むより流れを作るにゃ。" },
  { id: 's78', text: "牌は選ばれるのではなく、選ぶものにゃ。" },
  { id: 's79', text: "役は牌の努力の結晶にゃ。" },
  { id: 's80', text: "勝利を焦る者は、振込みを急ぐにゃ。" },
  { id: 's81', text: "和了りのない局も、無意味ではないにゃ。" },
  { id: 's82', text: "捨てた牌は戻らぬ。だからこそ美しいにゃ。" },
  { id: 's83', text: "運がない日は、牌を磨く日にゃ。" },
  { id: 's84', text: "対子は孤独にゃ。でも二つ集まれば百人力にゃ。" },
  { id: 's85', text: "タンヤオは初心者の友、上級者の味方にゃ。" },
  { id: 's86', text: "リーチ後の一牌は祈りにゃ。" },
  { id: 's87', text: "役満は現実的な夢、それ未満は妥協にゃ。" },
  { id: 's88', text: "牌効率は人生の効率に通ずるにゃ。" },
  { id: 's89', text: "ツモ切りで流れを断ち切るにゃ。" },
  { id: 's90', text: "和了らぬ勇気もときに必要にゃ。" },
  { id: 's91', text: "裏ドラは気まぐれな女神にゃ。" },
  { id: 's92', text: "振込みを恐れるな。恐れは勝利を遠ざけるにゃ。" },
  { id: 's93', text: "目指すは勝利。和了りだけが勝利ではないにゃ。" },
  { id: 's94', text: "牌山の頂は遠くても、一歩ずつ進むにゃ。" },
  { id: 's95', text: "リーチ棒は祈り棒。お賽銭にゃ。" },
  { id: 's96', text: "役満は努力と運のどちらが欠けても成就しないにゃ。" },
  { id: 's97', text: "鳴くときは心から腹から声を出して鳴くにゃ。" },
  { id: 's98', text: "捨てる牌に未練を残すようでは二流にゃ。" },
  { id: 's99', text: "千里の道も一歩より。最後のロンは、最初のツモから始まるにゃ。" },
  { id: 's100', text: "麻雀は人生にゃ。目の前の一局に全力を出す結果の積み重ねにゃ。" },
]);
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Yuji+Syuku&display=swap');
@import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;700&display=swap');

.shrine-view-container {
  position: relative;
  width: 100vw;
  /* height: 100vh; */ /* Replaced by dynamic height */
  overflow: hidden;
  background-image: url('/assets/images/back/back_out_shrine.png');
  background-repeat: repeat;
}

.shrine-screen {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 360px;
  height: 640px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between; /* 要素を上下に配置 */
  padding-top: 80px; /* 上部の余白 */
  text-align: center;
  font-family: 'M PLUS Rounded 1c', 'Helvetica Neue', Arial, sans-serif;
  overflow: hidden;
  box-sizing: border-box;
  background-image: url('/assets/images/back/shrine.png');
  background-size: 100% auto;
  background-position: center top;
  background-repeat: no-repeat;
}

.omikuji-button {
  padding: 2px 30px;
  font-size: 1.3rem;
  font-family: 'M PLUS Rounded 1c', sans-serif;
  font-weight: bold;
  color: white;
  background-color: #e53935; /* 少し鮮やかな赤 */
  border: 5px solid #a02825;
  border-radius: 50px;
  cursor: pointer;
  margin-top: auto; /* 上の余白を自動で最大化 */
  margin-bottom: -305px; /* 下部の余白 */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.omikuji-button .coin-text {
  font-size: 0.7em; /* 親要素の1.3remに対して0.8倍 */
}

.omikuji-button:hover {
  background-color: #c62828;
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.2);
}

.sayings-container {
  height: 130px; /* 高さを半分に */
  width: 90%;
  overflow-y: auto;
  background-color: #fff3f3;
  border: 5px solid #ffe600;
  border-radius: 20px;
  padding: 10px;
  margin-top: auto; /* 上の余白を自動で最大化して下へプッシュ */
  margin-bottom: 10px; /* 下部の余白 */
}

.sayings-table {
  width: 100%;
  border-collapse: collapse;
}

.sayings-table td {
  padding: 4px;
  border-bottom: 1px solid #7e0c0c;
}

.saying-no {
  width: 50px;
  font-size: 0.6rem;
  font-family: 'Yuji Syuku', serif;
  font-weight: bold;
  color: hsl(0, 0%, 0%);
  text-align: left;
  padding-right: 10px;
}

.saying-text {
  font-family: 'Yuji Syuku', serif;
  font-size: 0.7rem;
  font-weight: bold;
  text-align: left;
  color: hsl(0, 0%, 0%);
}

.cat-coins {
  position: absolute;
  top: 10px;
  left: 15px;
  font-size: 0.8em;
  color: #333;
  z-index: 10;
  background-color: rgba(255, 255, 255, 0.6);
  padding: 5px 8px;
  border-radius: 8px;
  white-space: nowrap;
  scale: 0.9; /* サイズを小さく */
}

.cat-coins-number {
  font-weight: bold;
  color: #f59e0b; /* 黄色っぽい色 */
}

.top-controls {
  position: absolute;
  top: 4px;
  right: 15px;
  display: flex;
  justify-content: flex-end; /* 右寄せに変更 */
  align-items: center;
  z-index: 10;
  scale: 0.9; /* サイズを小さく */
}

.audio-toggles {
  display: flex;
  align-items: center;
  margin-top: -14px;
  gap: 5px;
  background-color: rgba(255, 255, 255, 0.6);
  padding: 5px 8px;
  border-radius: 8px;
}

.toggle-label {
  font-size: 0.8em;
  color: #333;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 24px;
  height: 14px;
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
  transition: .4s;
  border-radius: 14px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 10px;
  width: 10px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #2196F3;
}

.back-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.back-button img {
  width: 60px; /* Adjust size as needed */
  margin-left: 8px;
  height: auto;
}

.back-button:hover img {
  opacity: 0.8;
}

.fade-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: white;
  opacity: 0;
  visibility: hidden;
  transition: opacity 1.5s ease-in-out, visibility 1.5s ease-in-out;
  z-index: 999;
}

.fade-overlay.is-fading {
  opacity: 1;
  visibility: visible;
}

.fade-leave-active {
  transition-duration: 0.2s;
}
</style>
