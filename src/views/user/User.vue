<script setup lang="ts">
import {useMachineTestQuestions} from "./composables/machine-test-question/useMachineTestQuestions"
import {useMachineTestQuestionsCopy01} from "./composables/machine-test-question/useMachineTestQuestionsCopy01.ts"
import {useMachineTestQuestions02} from "./composables/machine-test-question/useMachineTestQuestions02"
import {useMachineTestQuestions03} from "./composables/machine-test-question/useMachineTestQuestions03"
import CSSTest from "@/views/user/components/css/CSSTest.vue"
import { computed, onMounted, ref } from 'vue'
import {
  useMachineTestQuestions08To14
} from '@/views/user/composables/machine-test-question/useMachineTestQuestions08To14'
import {
  useTest70
} from '@/views/user/composables/eight-part-essay/useTest70.ts'
import { useMyPromise } from '@/views/user/composables/eight-part-essay/useMyPromise'
import {
  useMachineTestQuestions04
} from '@/views/user/composables/machine-test-question/useMachineTestQuestions04'
const {
  initMachineTestQuestions,
}=useMachineTestQuestions()
const {
  initMachineTestQuestionsCopy01,
}=useMachineTestQuestionsCopy01()
const {
  initMachineTestQuestions02,
}=useMachineTestQuestions02()
const {
  initMachineTestQuestions03,
}=useMachineTestQuestions03()
const {
  initMachineTestQuestions04,
}=useMachineTestQuestions04()
const {
  initMachineTestQuestions08To14,
}=useMachineTestQuestions08To14()
const {
  initUseTest70,
}=useTest70()
const {
  initMyPromise,
}=useMyPromise()

const a = ref(20)
const b = ref(10)
const aComputed=computed(()=>{
  // console.log('computed')
  const accumulate=a.value*b.value
  return accumulate
})

setTimeout(()=>{
  a.value=10
  b.value=20
},3000)


onMounted(()=>{
  // initMachineTestQuestions()
  //  initMachineTestQuestionsCopy01()
  // initMachineTestQuestions02()
  // initMachineTestQuestions08To14()

  // initUseTest70()
  // initMyPromise()
  // initMachineTestQuestions03()
  initMachineTestQuestions04()

  // const root=
})


</script>

<template>
<div>
  {{aComputed}}
  {{aComputed}}
  {{aComputed}}
  <CSSTest/>
</div>
</template>

<style scoped lang="scss">

</style>
