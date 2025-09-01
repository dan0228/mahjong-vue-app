import { createI18n } from 'vue-i18n';
import ja from './locales/ja.json';
import en from './locales/en.json';

// ブラウザの言語設定を検出し、'ja'で始まらない場合は'en'をデフォルトとする
const browserLocale = navigator.language.startsWith('ja') ? 'ja' : 'en';

const i18n = createI18n({
  legacy: false,          // Composition API を使用するため false に設定
  locale: browserLocale,  // ブラウザの言語を初期ロケールとして設定
  fallbackLocale: 'en',   // 指定した言語が見つからない場合の代替ロケール
  warnHtmlMessage: false, // メッセージ内のHTMLに対する警告を無効化
  messages: {
    ja,
    en
  }
});

export default i18n;
