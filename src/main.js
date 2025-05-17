import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// もしグローバルなCSSを適用したい場合はここでインポートします
// import './styles/main.css'

const app = createApp(App)

app.use(createPinia()) // Piniaを有効化
app.use(router) // Vue Routerを有効化
app.mount('#app') // アプリケーションをマウント