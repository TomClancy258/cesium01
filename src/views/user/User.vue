<script setup lang="ts">
import {useMachineTestQuestions} from "./composables/machine-test-question/useMachineTestQuestions"
import {useMachineTestQuestionsCopy01} from "./composables/machine-test-question/useMachineTestQuestionsCopy01.ts"
import {useMachineTestQuestions02} from "./composables/machine-test-question/useMachineTestQuestions02"
import CSSTest from "@/views/user/components/css/CSSTest.vue"
import { onMounted } from 'vue'
import {
  useMachineTestQuestions08To14
} from '@/views/user/composables/machine-test-question/useMachineTestQuestions08To14'
import {
  useTest70
} from '@/views/user/composables/eight-part-essay/useTest70.ts'
import { useMyPromise } from '@/views/user/composables/eight-part-essay/useMyPromise'
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
  initMachineTestQuestions08To14,
}=useMachineTestQuestions08To14()
const {
  initUseTest70,
}=useTest70()
const {
  initMyPromise,
}=useMyPromise()

onMounted(()=>{
  // initMachineTestQuestions()
  //  initMachineTestQuestionsCopy01()
  // initMachineTestQuestions02()
  // initMachineTestQuestions08To14()

  // initUseTest70()
  initMyPromise()

  // const root=
})
</script>

<template>
<div>
  <CSSTest/>
</div>
</template>

<style scoped lang="scss">

</style>
