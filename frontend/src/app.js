import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './app.scss'

const app = createApp({
  onShow(options) {
    console.log('openGym app onShow')
  },
  onLaunch(options) {
    console.log('openGym app onLaunch')
  },
})

const pinia = createPinia()
app.use(pinia)

export default app
