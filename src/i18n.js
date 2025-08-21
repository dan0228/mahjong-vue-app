import { createI18n } from 'vue-i18n';
import ja from './locales/ja.json';
import en from './locales/en.json';

// Detect browser language
const browserLocale = navigator.language.startsWith('ja') ? 'ja' : 'en';

const i18n = createI18n({
  legacy: false, // use composition API
  locale: browserLocale, // set default locale based on browser language
  fallbackLocale: 'en', // set fallback locale
  messages: {
    ja,
    en
  }
});

export default i18n;
