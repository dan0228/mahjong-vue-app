<template>
  <div v-if="show" class="popup-overlay">
    <div class="popup-content">
      <!-- 登録モード -->
      <div v-if="!isLoginMode">
        <h2>{{ $t('usernameRegistration.title') }}</h2>
        <p>{{ $t('usernameRegistration.description') }}</p>
        <form @submit.prevent="register">
          <div class="form-group">
            <label for="username">{{ $t('usernameRegistration.usernameLabel') }}</label>
            <input type="text" id="username" v-model="username" :placeholder="$t('usernameRegistration.usernamePlaceholder')" />
            <div v-if="username.length > 0 && !isUsernameLengthValid" class="error-message">
              {{ $t('usernameRegistration.errors.usernameTooLong') }}
            </div>
            <div v-if="isUsernameProfane" class="error-message">
              {{ $t('usernameRegistration.errors.usernameProfane') }}
            </div>
          </div>

          <!-- アバターアップロード部分 -->
          <div class="form-group avatar-group">
            <label>{{ $t('usernameRegistration.avatarLabel') }}</label>
            <div class="avatar-upload-container">
              <img :src="previewUrl || '/assets/images/info/hito_icon_1.png'" alt="Avatar Preview" class="avatar-preview" />
              <div class="x-input-and-buttons">
                <div class="button-stack">
                  <input type="file" id="avatar-upload" @change="onFileChange" accept="image/png, image/jpeg" style="display: none;" ref="fileInput" />
                  <label for="avatar-upload" class="upload-button">{{ $t('avatarSection.uploadImageButton') }}</label>
                  <button type="button" class="x-avatar-button" @click="onXAvatarClick" :disabled="isLoadingXAvatar">{{ $t('avatarSection.getXIconButton') }}</button>
                  <LoadingIndicator v-if="isLoadingXAvatar" />
                </div>
                <input type="text" id="x-handle-input" v-model="xHandleInput" :placeholder="$t('avatarSection.xAccountPlaceholder')" class="x-handle-input" />
                <div v-if="xHandleError" class="error-message">{{ xHandleError }}</div>
              </div>
            </div>
          </div>

          <div class="avatar-notes">
            <p>{{ $t('avatarSection.xAccountNote') }}</p>
            <p>{{ $t('avatarSection.rightsNote') }}</p>
          </div>

          <button type="submit" class="register-button" :disabled="!isFormValid || isLoadingRegister">
            <span v-if="!isLoadingRegister">{{ $t('usernameRegistration.registerButton') }}</span>
            <LoadingIndicator v-else />
          </button>
        </form>
        <button type="button" class="toggle-mode-button" @click="toggleLoginMode">{{ $t('usernameRegistration.loginHere') }}</button>
      </div>

      <!-- ログインモード -->
      <div v-else>
        <h2>{{ $t('login.title') }}</h2>
        <p>{{ $t('login.description') }}</p>
        <form @submit.prevent="userStore.otpSent ? loginWithOtp() : sendOtp()">
          <div class="form-group">
            <label for="email">{{ $t('login.emailLabel') }}</label>
            <input type="email" id="email" v-model="email" :placeholder="$t('login.emailPlaceholder')" :disabled="userStore.otpSent" />
          </div>

          <div v-if="userStore.otpSent" class="form-group">
            <label for="otp">{{ $t('login.otpLabel') }}</label>
            <input type="text" id="otp" v-model="otp" :placeholder="$t('login.otpPlaceholder')" />
          </div>

          <div v-if="loginError" class="error-message">{{ loginError }}</div>

          <button type="submit" class="login-button" :disabled="userStore.loading || isSendingOtp || isVerifyingOtp">
            <span v-if="!userStore.otpSent && !isSendingOtp">{{ $t('login.sendOtpButton') }}</span>
            <span v-else-if="userStore.otpSent && !isVerifyingOtp">{{ $t('login.loginButton') }}</span>
            <LoadingIndicator v-else />
          </button>
        </form>
        <button type="button" class="toggle-mode-button" @click="toggleLoginMode">{{ $t('login.registerHere') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { supabase } from '@/supabaseClient';
import { useUserStore } from '@/stores/userStore';
import { containsProfanity } from '@/utils/validationUtils';
import { compressImage } from '@/utils/imageUtils';
import LoadingIndicator from '@/components/LoadingIndicator.vue';

const props = defineProps({ show: Boolean });
const emit = defineEmits(['close']);
const { t } = useI18n();
const userStore = useUserStore();

const username = ref('');
const selectedFile = ref(null);
const previewUrl = ref(null);

// --- ログイン関連の新しい状態 ---
const isLoginMode = ref(false);
const email = ref('');
const otp = ref('');
const loginError = ref('');
const isSendingOtp = ref(false);
const isVerifyingOtp = ref(false);

// ポップアップ表示時に現在のプロフィール情報をフォームに設定
watch(() => props.show, (newValue) => {
  if (newValue) {
    // ポップアップが開くたびに状態をリセット
    username.value = userStore.profile?.username || '';
    previewUrl.value = userStore.profile?.avatar_url || null;
    selectedFile.value = null;
    xHandleInput.value = '';
    xHandleError.value = '';
    isLoginMode.value = false; // デフォルトは登録モード
    resetLoginState(); // ログイン関連の状態もリセット
  }
});

const fileInput = ref(null);
const xHandleInput = ref('');
const xHandleError = ref('');
const isLoadingXAvatar = ref(false);
const xAvatarFetchError = ref(false);
const isLoadingRegister = ref(false);

watch(xHandleInput, () => {
  xHandleError.value = '';
});

// --- ログイン関連の新しいメソッド ---
const resetLoginState = () => {
  email.value = '';
  otp.value = '';
  loginError.value = '';
  userStore.otpSent = false; // userStoreのotpSentもリセット
  userStore.loginEmail = ''; // userStoreのloginEmailもリセット
};

const toggleLoginMode = () => {
  isLoginMode.value = !isLoginMode.value;
  resetLoginState(); // モード切り替え時にログイン状態をリセット
};

const sendOtp = async () => {
  loginError.value = '';
  if (!email.value) {
    loginError.value = t('login.errors.emailRequired');
    return;
  }
  isSendingOtp.value = true;
  const result = await userStore.signInWithEmailOtp(email.value, t);
  if (!result.success) {
    loginError.value = result.error || t('login.errors.sendOtpFailed');
  }
  isSendingOtp.value = false;
};

const loginWithOtp = async () => {
  loginError.value = '';
  if (!email.value || !otp.value) {
    loginError.value = t('login.errors.emailOtpRequired');
    return;
  }
  isVerifyingOtp.value = true;
  const result = await userStore.verifyEmailOtp(email.value, otp.value, t);
  if (result.success) {
    emit('close'); // ログイン成功でポップアップを閉じる
  } else {
    loginError.value = result.error || t('login.errors.verifyOtpFailed');
  }
  isVerifyingOtp.value = false;
};

// --- ファイル選択ハンドラ ---
const onFileChange = async (e) => {
  xHandleError.value = '';
  const file = e.target.files[0];
  if (!file) return;

  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    alert(t('usernameRegistration.errors.imageFormat'));
    return;
  }

  try {
    const compressedBlob = await compressImage(file, 200, 200);
    selectedFile.value = new File([compressedBlob], file.name, { type: blob.type });
    previewUrl.value = URL.createObjectURL(selectedFile.value);
  } catch (error) {
    console.error('画像の圧縮に失敗しました:', error);
    selectedFile.value = file;
    previewUrl.value = URL.createObjectURL(file);
  }
};

// --- Xアバター取得ハンドラ ---
const onXAvatarClick = async () => {
  isLoadingXAvatar.value = true;
  xHandleError.value = '';
  const xHandle = xHandleInput.value;
  if (!xHandle) {
    xHandleError.value = t('avatarSection.xAccountValidation.empty');
    isLoadingXAvatar.value = false;
    return;
  }

  let cleanHandle = xHandle.startsWith('@') ? xHandle.substring(1) : xHandle;

  const alphanumericRegex = /^[a-zA-Z0-9_]+$/;
  if (!alphanumericRegex.test(cleanHandle)) {
    xHandleError.value = t('avatarSection.xAccountValidation.invalidChars');
    isLoadingXAvatar.value = false;
    return;
  }

  try {
    const unavatarUrl = `https://unavatar.io/twitter/${cleanHandle}`;
    const xAvatarUrl = `https://images.weserv.nl/?url=${encodeURIComponent(unavatarUrl)}`;
    
    const response = await fetch(xAvatarUrl, { mode: 'cors', credentials: 'omit' });

    if (!response.ok) {
      console.error(`Failed to fetch X avatar from unavatar.io: ${response.status} ${response.statusText}`);
      xHandleError.value = t('avatarSection.xAccountValidation.fetchFailed');
      isLoadingXAvatar.value = false;
      return;
    }

    const contentType = response.headers.get('Content-Type');
    if (!contentType || !contentType.startsWith('image/')) {
      console.error('Received non-image content from unavatar.io:', contentType);
      xHandleError.value = t('avatarSection.xAccountValidation.invalidContent');
      isLoadingXAvatar.value = false;
      return;
    }

    const blob = await response.blob();

    selectedFile.value = new File([blob], `x_avatar_${cleanHandle}.png`, { type: blob.type });
    previewUrl.value = URL.createObjectURL(selectedFile.value);
    xAvatarFetchError.value = false;

  } catch (error) {
    console.error('Xアバターの取得中にエラーが発生しました:', error);
    xHandleError.value = t('avatarSection.xAccountValidation.networkError');
  } finally {
    isLoadingXAvatar.value = false;
  }
};

// --- バリデーション ---
const getCharacterWidth = (str) => {
  let width = 0;
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    if ((charCode >= 0x0020 && charCode <= 0x007e) || (charCode >= 0xff61 && charCode <= 0xff9f)) {
      width += 1;
    } else {
      width += 2;
    }
  }
  return width;
};

const isUsernameNotEmpty = computed(() => username.value.trim().length > 0);
const isUsernameLengthValid = computed(() => getCharacterWidth(username.value) <= 6);
const isUsernameProfane = computed(() => containsProfanity(username.value));

const isFormValid = computed(() => {
  return isUsernameNotEmpty.value && isUsernameLengthValid.value && !isUsernameProfane.value;
});

// --- 登録処理 ---
const register = async () => {
  if (!isFormValid.value) return;

  isLoadingRegister.value = true;

  try {
    const { data: { user }, error: authError } = await supabase.auth.signInAnonymously();
    if (authError) throw authError;

    if (user) {
      // 1. ユーザー情報を挿入
      const { error: insertError } = await supabase
        .from('users')
        .insert({ id: user.id, username: username.value, cat_coins: 2000 });
      if (insertError) throw insertError;

      await userStore.fetchUserProfile();

      // 2. アバターが選択されていればアップロード
      if (selectedFile.value) {
        await userStore.uploadAvatar(selectedFile.value);
      }

      // 3. 最新のプロフィール情報を取得
      await userStore.fetchUserProfile();

      // 4. 従来のlocalStorageにも保存 (これはSupabase移行後は不要になる可能性が高いが、既存ロジックを維持)
      localStorage.setItem('mahjongUsername', username.value);

      // 5. ポップアップを閉じる
      selectedFile.value = null;
      xHandleInput.value = '';
      previewUrl.value = userStore.profile.avatar_url;
      emit('close');
    }
  } catch (error) {
    console.error('登録処理中にエラーが発生しました:', error);
    alert('登録に失敗しました。もう一度お試しください。');
  } finally {
    isLoadingRegister.value = false;
  }
};
</script>

<style scoped>
.popup-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex; justify-content: center; align-items: center; z-index: 10001;
}
.popup-content { 
  background-color: #fff; padding: 20px 30px; border-radius: 10px; text-align: center;
  max-width: 90%; width: 350px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); color: #333;
}
h2 { margin-top: 0; font-size: 1.4em; }
p { font-size: 0.9em; color: #666; margin-bottom: 20px; }
.form-group { margin-bottom: 15px; text-align: left; }
.form-group label { display: block; margin-bottom: 5px; font-weight: bold; font-size: 0.9em; }
.form-group input { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
.error-message { color: #e53935; font-size: 0.8em; margin-top: 5px; }
.register-button, .login-button { 
  background-color: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 5px;
  cursor: pointer; font-size: 1em; width: 100%; margin-top: 10px; 
}
.register-button:hover, .login-button:hover { background-color: #45a049; }
.register-button:disabled, .login-button:disabled { background-color: #ccc; cursor: not-allowed; }

/* Avatar Styles */

.avatar-upload-container { display: flex; align-items: flex-start; gap: 10px; }
.x-input-and-buttons { display: flex; flex-direction: column; gap: 10px; flex-grow: 1; }
.button-stack { display: flex; flex-direction: column; gap: 10px; }
.x-handle-input { width: 100%; padding: 6px 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; font-size: 0.85em; height: 32px; }
.avatar-buttons { display: flex; gap: 10px; }
.avatar-preview {
  width: 120px; height: 120px;
  background-color: white; /* 白背景 */
  border: 1px solid #ccc; /* 1pxの縁 */
  border-radius: 6px; /* 角を丸く */
}
.upload-button {
  background-color: #f0f0f0;
  color: #333;
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1em;
  transition: background-color 0.2s;
  height: 18px;
  text-align: center;
}
.upload-button:hover { background-color: #e0e0e0; }
.x-avatar-button {
  background-color: #000000; /* X (Twitter) のブランドカラー */
  color: white; padding: 6px 8px;
  border: 1px solid #000000; border-radius: 4px; cursor: pointer;
  font-size: 0.8em; transition: background-color 0.2s;
  height: 32px; /* ボタンの高さを合わせる */
  text-align: center;
}
.x-avatar-button:hover { background-color: #333333; }

.avatar-notes {
  font-size: 0.7em;
  color: #666;
  margin-top: 15px;
  text-align: left;
  border-top: 1px solid #eee;
  padding-top: 10px;
}
.avatar-notes p {
  margin-bottom: 5px;
}

.toggle-mode-button {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  font-size: 0.9em;
  margin-top: 15px;
  text-decoration: underline;
}
.toggle-mode-button:hover {
  color: #0056b3;
}
</style>
