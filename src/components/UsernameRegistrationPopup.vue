<template>
  <div v-if="show" class="popup-overlay">
    <div class="popup-content">
      <h2>{{ $t('usernameRegistration.title') }}</h2>
      <p>{{ $t('usernameRegistration.description') }}</p>
      <form @submit.prevent="register">
        <div class="form-group">
          <label for="username">{{ $t('usernameRegistration.usernameLabel') }}</label>
          <input type="text" id="username" v-model="username" :placeholder="$t('usernameRegistration.usernamePlaceholder')" />
          <div v-if="username.length > 0 && !isUsernameLengthValid" class="error-message">
            {{ $t('usernameRegistration.errors.usernameTooLong') }}
          </div>
        </div>
        <div class="form-group">
          <label for="x-account">{{ $t('usernameRegistration.xAccountLabel') }}</label>
          <p class="description-note">{{ $t('usernameRegistration.xAccountDescription') }}</p>
          <input type="text" id="x-account" v-model="xAccount" :placeholder="$t('usernameRegistration.xAccountPlaceholder')" />
          <div v-if="xAccount.length > 0 && !isXAccountFormatValid" class="error-message">
            {{ $t('usernameRegistration.errors.xAccountInvalid') }}
          </div>
        </div>
        <button type="submit" class="register-button" :disabled="!isFormValid">
          {{ $t('usernameRegistration.registerButton') }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue';
import { useI18n } from 'vue-i18n';
import { supabase } from '@/supabaseClient'; // Supabaseクライアントをインポート
import { useUserStore } from '@/stores/userStore'; // userStoreをインポート

const props = defineProps({
  show: Boolean,
});

const emit = defineEmits(['close']);
const { t } = useI18n();
const userStore = useUserStore(); // userStoreのインスタンスを取得

const username = ref('');
const xAccount = ref('');

/**
 * 全角文字を2、半角文字を1として文字の幅を計算します。
 * @param {string} str - 計算対象の文字列。
 * @returns {number} 計算された文字幅。
 */
const getCharacterWidth = (str) => {
  let width = 0;
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    // 半角カタカナ、半角英数字記号の範囲
    if ((charCode >= 0x0020 && charCode <= 0x007e) || (charCode >= 0xff61 && charCode <= 0xff9f)) {
      width += 1;
    } else {
      width += 2;
    }
  }
  return width;
};

// --- バリデーション用の算出プロパティ ---

const isUsernameNotEmpty = computed(() => username.value.trim().length > 0);
const isUsernameLengthValid = computed(() => getCharacterWidth(username.value) <= 6);
const isXAccountFormatValid = computed(() => xAccount.value.length === 0 || /^@[a-zA-Z0-9_]{1,15}$/.test(xAccount.value));

const isFormValid = computed(() => {
  return isUsernameNotEmpty.value && isUsernameLengthValid.value && isXAccountFormatValid.value;
});

/**
 * 登録処理を実行します。
 * Supabaseで匿名ユーザーを作成し、usersテーブルに情報を保存します。
 */
const register = async () => {
  if (!isFormValid.value) return;

  try {
    // 1. 匿名でサインアップ（またはサインイン）
    const { data: { user }, error: authError } = await supabase.auth.signInAnonymously();

    if (authError) {
      console.error('匿名サインインエラー:', authError);
      // TODO: ユーザーにエラーを通知
      return;
    }

    if (user) {
      // 2. usersテーブルにユーザー情報を挿入
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id, // AuthのユーザーIDを紐付ける
          username: username.value,
          x_account: xAccount.value || null, // 空の場合はnullを保存
        });

      if (insertError) {
        console.error('ユーザー情報挿入エラー:', insertError);
        // TODO: ユーザーにエラーを通知
        return;
      }

      // ★★★ 登録後にプロフィール情報を再取得してストアを更新 ★★★
      await userStore.fetchUserProfile();

      // 3. 従来のlocalStorageにも保存（既存のロジックのため）
      localStorage.setItem('mahjongUsername', username.value);
      localStorage.setItem('mahjongXAccount', xAccount.value);

      // 4. ポップアップを閉じる
      emit('close');
    }
  } catch (error) {
    console.error('登録処理中に予期せぬエラーが発生しました:', error);
  }
};
</script>

<style scoped>
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10001; /* 他のポップアップより手前に表示 */
}

.popup-content {
  background-color: #fff;
  padding: 20px 30px;
  border-radius: 10px;
  text-align: center;
  max-width: 90%;
  width: 350px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  color: #333;
}

h2 {
  margin-top: 0;
  font-size: 1.4em;
}

p {
  font-size: 0.9em;
  color: #666;
  margin-bottom: 20px;
}

.description-note {
  font-size: 0.8em;
  color: #666;
  margin-top: -5px;
  margin-bottom: 5px;
  padding: 0;
}

.form-group {
  margin-bottom: 15px;
  text-align: left;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  font-size: 0.9em;
}

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

.error-message {
  color: #e53935;
  font-size: 0.8em;
  margin-top: 5px;
}

.register-button {
  background-color: #4CAF50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  width: 100%;
  margin-top: 10px;
}

.register-button:hover {
  background-color: #45a049;
}

.register-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>
