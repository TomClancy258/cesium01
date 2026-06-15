<script setup lang="ts">
//必须写
const props = defineProps<{
  modelValue: string
}>()
// vue2:
// export default {
//   props: ['value']
// }

// const emit = defineEmits<{
//   'update:modelValue': [val: string]
// }>()
</script>

<template>
  <div>
    <input
      type="text"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <!--  vue2：<input :value="value" @input="$emit('input', $event.target.value)" />-->

    <!--  版本	   父 v-model 等价展开	                  子接收 prop（必写）	子 emit 触发事件-->
    <!--  Vue3	:modelValue="x" + @update:modelValue	modelValue	      update:modelValue-->
    <!--  Vue2	:value="x" + @input	                  value	            input-->

    <div class="my-float-container">
      <div class="my-float" style="margin-left: 20px; background: pink">1</div>
      <div class="my-float">2</div>
      <div class="my-float">3</div>
      <div>4</div>
      <!--    <span>4</span>  把上面行注释掉，换成这行才会实现文字4在3的右侧-->
    </div>
    <!--  <div style="background: #42b983">aaaaaaaaaaaaaaaaaa</div>-->

    <div class="my-container2">
      <div class="box1">盒子1</div>
      <div class="box2">盒子2</div>
      <div class="box3">盒子3</div>
      <!--    <div class="box4">盒子4</div>-->
    </div>

    <div style="padding: 20px; background: #42b983; margin-top: 50px">
      <div style="margin: 10px; background: pink">aaaa</div>
    </div>

    <div class="my-divs">
      <div>1</div>
      <div>2</div>
      <div>3</div>
      <div>4</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.my-divs {
  margin-top: 20px;
  border: 1px red solid;
  padding: 20px;

  > div {
    margin-top: 20px;
    background: #42b983;

    &:first-child { //就是>div这里的div
      margin-top: 0;
    }
  }

  //display: grid;
  //gap: 20px 0;
  //>div{
  //  background: #42b983;
  //}
}

.my-float-container {
  margin-top: 10px;
  border: 1px solid red;

  > div {
    width: 100px;
    height: 100px;
    background: #66ccff;
    margin: 10px;
  }

  > .my-float {
    float: left;
  }
}

.my-container2 {
  margin-top: 100px;

  > div {
    height: 50px;
  }

  > .box1 {
    background: red;
  }

  > .box2 {
    float: left;
    background: yellow;
    width: 100px;
  }

  > .box3 {
    background: blue;
    height: 30px;
    width: 150px;
  }
}
</style>
