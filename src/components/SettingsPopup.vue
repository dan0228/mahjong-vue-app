<template>
  <div v-if="show" class="popup-overlay">
    <div class="popup-content">
      <h2>{{ $t('settingsPopup.title') }}</h2>
      <p>{{ $t('settingsPopup.description') }}</p>
      <form @submit.prevent="saveProfile">
        <!-- アバターアップロード部分 -->
        <div class="form-group avatar-group">
          <label>{{ $t('usernameRegistration.avatarLabel') }}</label>
          <div class="avatar-upload-container">
            <img :src="previewUrl || userStore.profile?.avatar_url || '/assets/images/info/hito_icon_1.png'" alt="Avatar Preview" class="avatar-preview" />
            <input type="file" id="avatar-upload-settings" @change="onFileChange" accept="image/png, image/jpeg" style="display: none;" ref="fileInput" />
            <label for="avatar-upload-settings" class="upload-button">{{ $t('usernameRegistration.uploadButton') }}</label>
          </div>
        </div>

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

        <div class="button-group">
          <button type="button" @click="closePopup" class="cancel-button">キャンセル</button>
          <button type="submit" class="save-button" :disabled="!isFormValid">
            {{ $t('settingsPopup.saveButton') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, defineProps, defineEmits } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/stores/userStore';
import { containsProfanity } from '@/utils/validationUtils';
import { compressImage } from '@/utils/imageUtils'; // imageUtilsからcompressImageをインポート

const props = defineProps({ show: Boolean });
const emit = defineEmits(['close']);
const { t } = useI18n();
const userStore = useUserStore();

const username = ref('');
const selectedFile = ref(null);
const previewUrl = ref(null);

// ポップアップ表示時に現在のプロフィール情報をフォームに設定
watch(() => props.show, (newValue) => {
  if (newValue && userStore.profile) {
    username.value = userStore.profile.username || '';
    previewUrl.value = userStore.profile.avatar_url || null; // 既存のアバターURLをプレビューに設定
    selectedFile.value = null; // ファイル選択状態をリセット
  }
});

// --- ファイル選択ハンドラ ---
const onFileChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    alert('PNGまたはJPEG形式の画像を選択してください。');
    return;
  }
  try {
    // imageUtilsのcompressImageを使用
    const compressedBlob = await compressImage(file, 200, 200); // アバターサイズに合わせて200x200を指定
    selectedFile.value = new File([compressedBlob], file.name, { type: file.type });
    previewUrl.value = URL.createObjectURL(selectedFile.value);
  } catch (error) {
    console.error('画像の圧縮に失敗しました:', error);
    selectedFile.value = file;
    previewUrl.value = URL.createObjectURL(file);
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
.avatar-group { text-align: center; }
.avatar-upload-container { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.avatar-preview {
  width: 80px; height: 80px;
  
  background-color: white; /* 白背景 */
  border: 1px solid #ccc; /* 1pxの縁 */
  border-radius: 6px; /* 角を丸く */
}
.upload-button { background-color: #f0f0f0; color: #333; padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; font-size: 0.9em; transition: background-color 0.2s; }
.upload-button:hover { background-color: #e0e0e0; }

/* Button Group */
.button-group { display: flex; justify-content: space-between; margin-top: 20px; }
.save-button, .cancel-button { padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 1em; width: 48%; }
.save-button { background-color: #4CAF50; color: white; }
.save-button:hover { background-color: #45a049; }
.save-button:disabled { background-color: #ccc; cursor: not-allowed; }
.cancel-button { background-color: #f44336; color: white; }
.cancel-button:hover { background-color: #da190b; }
</style>
