// eslint.config.js
import globals from "globals";
import pluginJs from "@eslint/js";
import pluginVue from "eslint-plugin-vue";


export default [
  {
    languageOptions: { 
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  },
  pluginJs.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    rules: {
        "vue/multi-word-component-names": "off",
        "no-unused-vars": "warn",
        "vue/no-unused-vars": "warn",
        "no-undef": "warn"
    }
  },
  {
    ignores: ["dist/", "node_modules/"]
  }
];
