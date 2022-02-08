import { createApp } from 'vue'
import router from './router'
import store from './store'
import App from './App.vue'

// Import Quasar stuff
import { Quasar } from 'quasar'
import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/src/css/index.sass'

createApp(App)
    .use(router)
    .use(store)
    .use(Quasar, { plugins: {} })
    .mount('#app')
