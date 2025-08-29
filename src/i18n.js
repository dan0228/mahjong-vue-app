import { createI18n } from 'vue-i18n';
import ja from './locales/ja.json';
import en from './locales/en.json';

// Detect browser language
const browserLocale = navigator.language.startsWith('ja') ? 'ja' : 'en';

const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: 'ja', // set locale
  fallbackLocale: 'en', // set fallback locale
  warnHtmlMessage: false, // Disable warning for HTML in messages
  messages: {
    ja,
    en
  }
});

export default i18n;
