import { defineStore } from 'pinia'
import { ref } from 'vue'


export const useSimulatedWebSocketStore = defineStore('simulateWebSocket', () => {
  const index = ref<number>(-1)
  let timer:number | null=null

  const open = ():void => {
    index.value++
    timer=setInterval(()=>{
      index.value++
    },2000)
    // },5000)
    // },10000)
  }

  const close  = ():void => {
    index.value = 0
    clearInterval(timer)
  }

  return {
    index,
    open,
    close,
  }
})
