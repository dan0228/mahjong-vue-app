import { createI18n } from 'vue-i18n';
import ja from './locales/ja.json';
import en from './locales/en.json';

const i18n = createI18n({
  legacy: false, // use composition API
  locale: 'ja', // set default locale
  fallbackLocale: 'en', // set fallback locale
  messages: {
    ja,
    en
  }
});

export default i18n;
