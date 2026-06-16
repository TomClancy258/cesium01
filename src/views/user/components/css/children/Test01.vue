<script setup lang="ts">
import InputChild from '@/views/user/components/css/children/children/InputChild.vue'
import InputChildMutlpleInput from '@/views/user/components/css/children/children/InputChildMutlpleInput.vue'
import { customRef, ref } from 'vue'
const input1=ref('aaa')
const input2=ref('bbb')
const input3=ref('ccc')

// 搜索框输入防抖 + 延迟更新视图
const input4=customDebounceRef('aaa',2000)

function customDebounceRef(defaultValue,delay){
  let timer=null
  //相当于 let defaultValue='aaa'
  const msg= customRef((track, trigger)=>{
    return {
      get(){
        //track：记录谁引用了我（入队），比如别的computed、watch
        track()
        return defaultValue
      },
      set(val){
        clearTimeout(timer)
        timer=setTimeout(()=>{
          defaultValue=val
          //trigger：读取 track 里记录的对象（依次出队），告诉它们 msg 的值变了，及时更新
          trigger()
        },2000)
      }
    }
  })
  return msg
}
</script>

<template>
  <input id="myInput" type="text"/>
<!--  <div style="border:1px solid red;height: 100px;line-height: 100px;background: #38bdf8">-->
<!--    aaaaaaaaaaaaaaaa<br/>-->
<!--  </div>-->

<!--  <div style="border:5px solid red;height: 100px;width:120px;background: #2c3e50;margin: 3px;">-->

<!--  </div>-->

<!--  <div class="div3">-->
<!--    <div>aaa</div><div>bbb</div><div>ccc</div><div>ddd</div><div>eee</div>-->
<!--  </div>-->

<!--  <div class="draw-triangle-with-css"></div>-->

  <div style="position: relative;">
    <span class="my-float">地卫二空间技术</span>（杭州）有限公司是新一代太空智能公司，致力于成为全球领先的太空智能建设技术与服务提供商。公司是中国首家参与国家探月任务国际合作项目、首家完成向海外输出航天能力整体解决方案的民营商业航天企业。公司致力于以人工智能技术重构航天产业生态，以建设具备自主感知、决策、执行、协同能力的天地一体化智能系统为目标，以构建真实世界模型为技术路径，形成“感知—计算—规模化智能应用”的三阶太空智能能力体系，实现从太空改善地球。
  </div>

  <div class="outer-margin-collapse">
    <div>1</div>
    <div>2</div>
    <div>3</div>
  </div>
  <div style="width: 50px;height: 50px;background: #22ee22">aaaa</div>

  <div class="my-relative-outer">
    <div >aaa</div>
    <div>bbb</div>
    <div>ccc</div>
  </div>

  <button id="btn">点击测试</button>
  input1:{{input1}}<br/>
  input2:{{input2}}<br/>
  input3:{{input3}}<br/>
  input4:{{input4}}<br/>
  <InputChild v-model="input1"/>
<!--  vue2<InputChild v-model="input1"/>-->
<!--  <InputChildMutlpleInput v-model:input2="input2" v-model:input3="input3"/><br/>-->
<!--  vue2:<InputChildMutlpleInput :input2.sync="input2" :input3.sync="input3"/>-->
<!--  input4:<input type="text" v-model="input4"/>-->

  <div class="box">
    <div class="a">固定内容</div>
    <div class="b">flex:1</div>
    <div class="c">flex:1</div>
  </div>
</template>

<style scoped lang="scss">
.div3>div{
  display: inline-block;
  background: #66ccff;
  padding: 2px;
  margin: 3px;
}

.draw-triangle-with-css{
  height: 0;
  width: 0;
  border: 50px solid transparent;
  border-left-color: #66ccff;
}

.outer-margin-collapse{
  margin-top: 20px;
  background: #66ccff;
  overflow: hidden; //相当于下面的div都半脱离文档流，这个outer-margin-collapse高度为0，所以div[aaaa]就紧挨着它
  border:2px solid red;
  >div{
    float: left; //类似于display:inline-block;
    //display: inline;
    //padding: 10px;
    //font-size: 50px;

    width: 100px;
    height: 100px;
    background: #42b983;
    margin:10px;
  }
}

.my-float{
  font-size:50px;
  float:left;
  //position: relative;
  //left:10px;
}

.my-relative-outer{
  border: 1px solid red;
  >div{
    width: 100px;
    height: 100px;
    background: #66ccff;
    display: inline-block;
    margin:10px;
  }
  :first-child{
    position: relative;
    //left:50px;
    right: 20px;
  }
}

.box {
  margin-top: 20px;
  display: flex;
  gap: 10px;
  >div{
    background: pink;
  }
  >.b, .c {
    flex: 1;
  }
}

</style>
