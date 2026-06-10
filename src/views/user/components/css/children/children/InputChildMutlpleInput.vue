<script setup lang="ts">
const props = defineProps<{
  input2:string
  input3:string
}>()
const emit = defineEmits<{
  'update:input2': [val: string],
  'update:input3': [val: string],
}>()
</script>

<template>
<div>
  <input type="text" :value="input2" @input="$emit('update:input2', $event.target.value)"/>
  <input type="text" :value="input3" @input="$emit('update:input3', $event.target.value)"/>
</div>
</template>

<style scoped lang="scss">

</style>
