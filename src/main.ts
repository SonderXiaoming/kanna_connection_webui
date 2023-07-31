import { createApp } from 'vue'
//import { createPinia } from 'pinia'
import 'element-plus/dist/index.css'
//import ElementPlus from 'element-plus'
//import cn from 'element-plus/es/locale/lang/zh-cn'
import App from './App.vue'
import router from './router'
import './assets/main.css'

const app = createApp(App)

//app.use(createPinia())
app.use(router)
//app.use(ElementPlus, { locale: cn })
app.mount('#app')
