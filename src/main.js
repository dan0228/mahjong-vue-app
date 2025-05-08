import { createApp } from 'vue'
import App from './App.vue'

// もしグローバルなCSSを適用したい場合はここでインポートします
// import './styles/main.css'

// Piniaストアを使用する場合 (後でセットアップ)
// import { createPinia } from 'pinia'

const app = createApp(App)

// app.use(createPinia()) // Piniaを有効化
app.mount('#app')