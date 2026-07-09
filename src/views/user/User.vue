<script setup lang="ts">
import { useMachineTestQuestions } from './composables/machine-test-question/useMachineTestQuestions'
import { useMachineTestQuestionsCopy01 } from './composables/machine-test-question/useMachineTestQuestionsCopy01.ts'
import { useMachineTestQuestions02 } from './composables/machine-test-question/useMachineTestQuestions02'
import { useMachineTestQuestions03 } from './composables/machine-test-question/useMachineTestQuestions03'
import CSSTest from '@/views/user/components/css/CSSTest.vue'
import { computed, onMounted, ref } from 'vue'
import { useMachineTestQuestions08To14 } from '@/views/user/composables/machine-test-question/useMachineTestQuestions08To14'
import { useTest70 } from '@/views/user/composables/eight-part-essay/useTest70.ts'
import { useMyPromise } from '@/views/user/composables/eight-part-essay/useMyPromise'
import { useMachineTestQuestions04 } from '@/views/user/composables/machine-test-question/useMachineTestQuestions04'
import { useMachineTestQuestions05 } from '@/views/user/composables/machine-test-question/useMachineTestQuestions05'
const { initMachineTestQuestions } = useMachineTestQuestions()
const { initMachineTestQuestionsCopy01 } = useMachineTestQuestionsCopy01()
const { initMachineTestQuestions02 } = useMachineTestQuestions02()
const { initMachineTestQuestions03 } = useMachineTestQuestions03()
const { initMachineTestQuestions04 } = useMachineTestQuestions04()
const { initMachineTestQuestions05 } = useMachineTestQuestions05()
const { initMachineTestQuestions08To14 } = useMachineTestQuestions08To14()
const { initUseTest70 } = useTest70()
const { initMyPromise } = useMyPromise()

const a = ref(20)
const b = ref(10)
const aComputed = computed(() => {
  // console.log('computed')
  const accumulate = a.value * b.value
  return accumulate
})

setTimeout(() => {
  a.value = 10
  b.value = 20
}, 3000)

onMounted(() => {
  // initMachineTestQuestions()
  //  initMachineTestQuestionsCopy01()
  // initMachineTestQuestions02()
  // initMachineTestQuestions08To14()

  // initUseTest70()
  // initMyPromise()
  // initMachineTestQuestions03()
  // initMachineTestQuestions04()
  initMachineTestQuestions05()

  // for (let i = 0; i < 1; i++) {
  //   var aaa=10 //var无死区
  // }
  // console.log("aaa", aaa);//输出10
})
</script>

<template>
  <div>
    <div class="container">
      <div class="left">aaa</div>
      <div class="center">bbb</div>
      <div class="right">ccc</div>
    </div>
    {{ aComputed }}
    {{ aComputed }}
    {{ aComputed }}
    <CSSTest />
  </div>
</template>

<style scoped lang="scss">
.container {
  display: flex;
  .left,
  .right {
    width: 500px;
    flex-shrink: 0;
    background: #42b983;
  }
  .center {
    flex: 1;
    background: #66ccff;
  }
}

.my-test01 {
  > div {
    width: 300px;
    height: 300px;
    background: red;
  }
}
</style>
