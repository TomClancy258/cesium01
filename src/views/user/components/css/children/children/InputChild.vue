<script setup lang="ts">
const props = defineProps<{
  modelValue:string
}>()
const emit = defineEmits<{
  'update:modelValue': [val: string]
}>()
</script>

<template>
<div>
  <input type="text" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)"/>
</div>
</template>

<style scoped lang="scss">

</style>
