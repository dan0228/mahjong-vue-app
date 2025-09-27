<template>
  <div v-if="show" class="popup-overlay">
    <div class="popup-content">
      <h2>{{ $t('settingsPopup.title') }}</h2>
      <p>{{ $t('settingsPopup.description') }}</p>
      <form @submit.prevent="saveProfile">
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

const props = defineProps({
  show: Boolean,
});

const emit = defineEmits(['close']);
const { t } = useI18n();
const userStore = useUserStore();

const username = ref('');
const xAccount = ref('');

// props.show を監視して、ポップアップが表示されたときにストアからデータを読み込む
watch(() => props.show, (newValue) => {
  if (newValue && userStore.profile) {
    username.value = userStore.profile.username || '';
    xAccount.value = userStore.profile.x_account || '';
  }
});

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
const isXAccountFormatValid = computed(() => xAccount.value.length === 0 || /^@[a-zA-Z0-9_]{1,15}$/.test(xAccount.value));

const isFormValid = computed(() => {
  return isUsernameNotEmpty.value && isUsernameLengthValid.value && isXAccountFormatValid.value;
});

const saveProfile = async () => {
  if (!isFormValid.value) return;

  try {
    await userStore.updateUserProfile({
      username: username.value,
      x_account: xAccount.value || null,
    });
    emit('close');
  } catch (error) {
    console.error('プロフィールの更新中にエラーが発生しました:', error);
  }
};

const closePopup = () => {
  emit('close');
};
</script>

<style scoped>
/* UsernameRegistrationPopup.vue のスタイルを参考にしつつ、調整 */
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
  z-index: 10001;
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

.button-group {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.save-button, .cancel-button {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  width: 48%;
}

.save-button {
  background-color: #4CAF50;
  color: white;
}

.save-button:hover {
  background-color: #45a049;
}

.save-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.cancel-button {
  background-color: #f44336;
  color: white;
}

.cancel-button:hover {
  background-color: #da190b;
}
</style>
