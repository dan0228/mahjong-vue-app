<template>
  <div v-if="show" class="popup-overlay">
    <div class="popup-content">
      <h2>{{ $t('settingsPopup.title') }}</h2>
      <form @submit.prevent="saveProfile">
        <div class="form-group">
          <label for="username-settings">{{ $t('usernameRegistration.usernameLabel') }}</label>
          <input type="text" id="username-settings" v-model="username" :placeholder="$t('usernameRegistration.usernamePlaceholder')" />
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
            <img :src="previewUrl || userStore.profile?.avatar_url || '/assets/images/info/hito_icon_1.png'" alt="Avatar Preview" class="avatar-preview" />
            <div class="x-input-and-buttons">
              <div class="button-stack">
                <input type="file" id="avatar-upload-settings" @change="onFileChange" accept="image/png, image/jpeg" style="display: none;" ref="fileInput" />
                <label for="avatar-upload-settings" class="upload-button">{{ $t('avatarSection.uploadImageButton') }}</label>
                <button type="button" class="x-avatar-button" @click="onXAvatarClick" :disabled="isLoadingXAvatar">{{ $t('avatarSection.getXIconButton') }}</button>
                <LoadingIndicator v-if="isLoadingXAvatar" />
              </div>
              <input type="text" id="x-handle-input-settings" v-model="xHandleInput" :placeholder="$t('avatarSection.xAccountPlaceholder')" class="x-handle-input" />
              <div v-if="xHandleError" class="error-message">{{ xHandleError }}</div>
            </div>
          </div>
        </div>

        <div class="avatar-notes">
          <p>{{ $t('avatarSection.xAccountNote') }}</p>
          <p>{{ $t('avatarSection.rightsNote') }}</p>
        </div>

        <!-- メールアドレス編集セクション -->
        <div class="email-edit-section">
          <label for="email-settings" class="email-label-small">{{ $t('settingsPopup.emailSection.label') }}</label>
          <div v-if="!isEditingEmail">
            <p class="email-text-small">{{ userStore.profile?.email || $t('settingsPopup.emailSection.notSet') }}</p>
            <button type="button" @click="startEditEmail" class="edit-email-button">{{ $t('settingsPopup.emailSection.editEmailButton') }}</button>
          </div>
          <form v-else @submit.prevent="requestEmailUpdate">
            <div class="form-group">
              <label for="email-settings" class="email-label-small">{{ $t('settingsPopup.emailSection.newEmailLabel') }}</label>
              <input type="email" id="email-settings" v-model="emailInput" :placeholder="$t('settingsPopup.emailSection.newEmailPlaceholder')" />
            </div>
            <div v-if="emailError" class="error-message">{{ emailError }}</div>
            <div v-if="emailUpdateMessage" class="success-message">{{ emailUpdateMessage }}</div>
            <div class="button-group" v-if="!emailUpdateMessage">
              <button type="button" @click="cancelEditEmail" class="cancel-button">{{ $t('settingsPopup.cancelButton') }}</button>
              <button type="submit" class="save-button" :disabled="isUpdatingEmail">
                <span v-if="!isUpdatingEmail">{{ $t('settingsPopup.emailSection.sendUpdateRequestButton') }}</span>
                <LoadingIndicator v-else />
              </button>
            </div>
          </form>
        </div>

        <div class="button-group">
          <button type="button" @click="closePopup" class="cancel-button" :disabled="isEditingEmail" :class="{'disabled-button-style': isEditingEmail}">{{ $t('settingsPopup.cancelButton') }}</button>
          <button type="submit" class="save-button" :disabled="!isFormValid || isEditingEmail">
            {{ $t('settingsPopup.saveButton') }}
          </button>
        </div>
      </form>

      

      <!-- アカウント削除リンク -->
      <div class="delete-account-link-container">
        <button @click="handleDeleteAccount" class="delete-button">
          {{ $t('settingsPopup.deleteAccountSection.button') }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, defineProps, defineEmits } from 'vue';
import { useI18n } from 'vue-i18n';
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
const xHandleInput = ref('');
const xHandleError = ref('');
const isLoadingXAvatar = ref(false);

// --- メールアドレス編集関連の新しい状態 ---
const emailInput = ref('');
const emailError = ref('');
const isEditingEmail = ref(false);
const isUpdatingEmail = ref(false);
const emailUpdateMessage = ref('');

watch(xHandleInput, () => {
  xHandleError.value = '';
});

// ポップアップ表示時に現在のプロフィール情報をフォームに設定
watch(() => props.show, (newValue) => {
  if (newValue && userStore.profile) {
    username.value = userStore.profile.username || '';
    previewUrl.value = userStore.profile.avatar_url || null;
    selectedFile.value = null;
    xHandleInput.value = '';
    xHandleError.value = '';
    // メールアドレス関連の状態を初期化
    emailInput.value = userStore.profile.email || '';
    isEditingEmail.value = false;
    emailError.value = '';
    emailUpdateMessage.value = '';
  }
});

// --- メールアドレス編集関連の新しいメソッド ---
const startEditEmail = () => {
  isEditingEmail.value = true;
  emailError.value = '';
  emailUpdateMessage.value = '';
};

const cancelEditEmail = () => {
  isEditingEmail.value = false;
  emailInput.value = userStore.profile?.email || ''; // 元のメールアドレスに戻す
  emailError.value = '';
  emailUpdateMessage.value = '';
};

const requestEmailUpdate = async () => {
  emailError.value = '';
  emailUpdateMessage.value = '';
  if (!emailInput.value || !emailInput.value.includes('@')) {
    emailError.value = t('settingsPopup.emailSection.errors.invalidEmail');
    return;
  }

  isUpdatingEmail.value = true;
  const result = await userStore.updateUserEmail(emailInput.value);
  if (result.success) {
    emailUpdateMessage.value = t('settingsPopup.emailSection.updateRequestSent');
    // ユーザーは確認メールのリンクをクリックする必要があるため、フォームは開いたままにする
  } else {
    emailError.value = result.error || t('settingsPopup.emailSection.errors.updateFailed');
  }
  isUpdatingEmail.value = false;
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
      xHandleError.value = t('avatarSection.xAccountValidation.invalidContent'); // i18nを使用
      isLoadingXAvatar.value = false; // 追加
      return;
    }

    const blob = await response.blob();

    selectedFile.value = new File([blob], `x_avatar_${cleanHandle}.png`, { type: blob.type });
    previewUrl.value = URL.createObjectURL(selectedFile.value);

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
    if ((charCode >= 0x0020 && charCode <= 0x007e) || (charCode >= 0xff61 && charCode <= 0xff9f)) { width += 1; } else { width += 2; }
  }
  return width;
};
const isUsernameNotEmpty = computed(() => username.value.trim().length > 0);
const isUsernameLengthValid = computed(() => getCharacterWidth(username.value) <= 6);
const isUsernameProfane = computed(() => containsProfanity(username.value));
const isFormValid = computed(() => isUsernameNotEmpty.value && isUsernameLengthValid.value && !isUsernameProfane.value);

// --- 保存処理 ---
const saveProfile = async () => {
  if (!isFormValid.value) return;

  try {
    // 1. ユーザー名を更新
    await userStore.updateUserProfile({ username: username.value });

    // 2. 新しいアバターが選択されていればアップロード
    if (selectedFile.value) {
      await userStore.uploadAvatar(selectedFile.value);
    }

    // 3. 最新のプロフィール情報を再取得してストアを更新
    await userStore.fetchUserProfile();

    emit('close');
  } catch (error) {
    console.error('プロフィールの更新中にエラーが発生しました:', error);
    alert('更新に失敗しました。もう一度お試しください。');
  }
};

const closePopup = () => {
  emit('close');
};

const handleDeleteAccount = () => {
  if (window.confirm(t('settingsPopup.deleteAccountSection.confirm'))) {
    userStore.deleteUserData();
  }
};
</script>

<style scoped>
/* UsernameRegistrationPopup.vue のスタイルをコピー */
.popup-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.7); display: flex; justify-content: center; align-items: center; z-index: 10001; }
.popup-content { background-color: #fff; padding: 20px 30px; border-radius: 10px; text-align: center; max-width: 90%; width: 350px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); color: #333; }
h2 { margin-top: 0; font-size: 1.4em; }
p { font-size: 0.9em; color: #666; margin-bottom: 20px; }
.form-group { margin-bottom: 15px; text-align: left; }
.form-group label { display: block; margin-bottom: 5px; font-weight: bold; font-size: 0.9em; }
.form-group input { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
.error-message { color: #e53935; font-size: 0.8em; margin-top: 5px; }

/* Avatar Styles */
.avatar-upload-container { display: flex; align-items: flex-start; gap: 10px; }
.x-input-and-buttons { display: flex; flex-direction: column; gap: 10px; flex-grow: 1; }
.button-stack { display: flex; flex-direction: column; gap: 10px; }
.x-handle-input { width: 100%; padding: 6px 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; font-size: 0.8em; height: 32px; }
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

/* Button Group */
.button-group { display: flex; justify-content: space-between; margin-top: 20px; }
.save-button, .cancel-button { padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 1em; width: 48%; }
.save-button { background-color: #4CAF50; color: white; }
.save-button:hover { background-color: #45a049; }
.save-button:disabled { background-color: #ccc; cursor: not-allowed; }
.cancel-button { background-color: #f44336; color: white; }
.cancel-button:hover { background-color: #da190b; }

/* アカウント削除リンク */
.delete-account-link-container {
  text-align: right;
  margin-top: 15px;
}
.delete-button {
  background: none;
  border: none;
  color: #e53935;
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.9em;
  padding: 0;
}
.delete-button:hover {
  color: #c62828;
}

.email-edit-section {
  margin-top: 0px;
  padding-top: 15px;
  border-top: 1px solid #eee;
  text-align: left;
}

.email-edit-section h3 {
  font-size: 1.2em;
  margin-bottom: 10px;
  color: #333;
}

.email-edit-section p {
  font-size: 0.9em;
  color: #555;
  margin-bottom: 10px;
}

.edit-email-button {
  background-color: #007bff;
  color: white;
  padding: 8px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9em;
  margin-top: 5px;
}

.edit-email-button:hover {
  background-color: #0056b3;
}

.success-message {
  color: #4CAF50;
  font-size: 0.8em;
  margin-top: 5px;
}

.email-label-small {
  font-size: 0.9em; /* 必要に応じて調整 */
  font-weight: normal;
  font-weight: bold;
}

.email-text-small {
  font-size: 0.8em; /* 必要に応じて調整 */
  color: #555;
  margin-bottom: 5px;
}

.disabled-button-style {
  opacity: 0.6;
  cursor: not-allowed;
  /* You can add more styles like background-color, border-color etc. */
}
</style>