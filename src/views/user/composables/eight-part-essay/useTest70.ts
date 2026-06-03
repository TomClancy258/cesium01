import { onMounted } from 'vue'

export function useTest70() {
  const initUseTest70 = () => {
    // normalArrDeduplication([1,2,3,4,1,2,2,9])

    const list = [
      { name: "张三", age: 20 },
      { name: "李四", age: 22 },
      { name: "张三", age: 21 }, // name 重复
      { name: "王五", age: 19 },
      { name: "李四", age: 23 }  // name 重复
    ]
    // objArrDeduplicationByName(list)

    const arr1 = [1, 5, [8, 2], [9, [12, 3], 7]]
    // getMaxFromMultidimensionalArr(arr1)
    // const max=getMaxFromMultidimensionalArrByPureFunction(arr1)
    // console.log("max", max);

    // getMostFrequentlyOccurringCharFromStr('aaabbbbcccccdd')

    const origin = {
      name: "小明",
      age: 20,
      hobby: ["打球", "看书"],
      info: {
        addr: "四川"
      }
    }
    // const deepObj= deepClone(origin)
    // const deepObj= deepClone02(origin)
    // console.log("deepObj", deepObj);

  }
  const normalArrDeduplication=(arr)=>{
    const deduplicatedArr=new Set(arr)
    console.log("deduplicatedArr", deduplicatedArr);
    return deduplicatedArr
  }
  const objArrDeduplicationByName=(arr)=>{
    const nameSet=new Set()
    const deduplicatedArr=arr.filter((obj)=>{
      if(!nameSet.has(obj.name)){
        nameSet.add(obj.name)
        return true
      }
    })
    console.log("deduplicatedArr", deduplicatedArr);
    return deduplicatedArr
  }

  const getMaxFromMultidimensionalArr=(arr)=>{
    let max=-Infinity
    getMax(arr)
    function getMax(arr){
      for(const item of arr){
        if(Array.isArray(item)){
          getMax(item)
        }else{
          if (item > max) {
            max = item
          }
        }
      }
    }
    console.log("max", max);
    return max;
  }

  const getMaxFromMultidimensionalArrByPureFunction=(arr)=>{
    let max=-Infinity
    for(const item of arr){
      if(Array.isArray(item)){
        const subMax=getMaxFromMultidimensionalArrByPureFunction(item)
        max=Math.max(max,subMax)
      }else{
        if (item > max) {
          max = item
        }
      }
    }
    return max;
  }

  const getMaxArrFromTwoDimensionalArr=(arr)=>{
    const maxArr=[]
    for(const item of arr){
      maxArr.push(Math.max(...item))
    }
    console.log("maxArr", maxArr);
    return maxArr;
  }

  const getMostFrequentlyOccurringCharFromStr=(str)=>{
    const charArr=str.split("")
    const obj={}
    let mostFrequentlyOccurringChar=''
    let occurringNum=0
    charArr.forEach((item)=>{
      if(!obj.hasOwnProperty(item)){
        obj[item]=1;
      }else{
        obj[item]+=1;
      }
    })
    console.log("obj", obj);
    for (const key in obj) {
      if (obj[key] > occurringNum) {
        mostFrequentlyOccurringChar=key
        occurringNum=obj[key]
      }
    }
    console.log("mostFrequentlyOccurringChar", mostFrequentlyOccurringChar);
    console.log("occurringNum", occurringNum);
    return {
      mostFrequentlyOccurringChar:occurringNum
    }
  }

  //    const origin = {
  //       name: "小明",
  //       age: 20,
  //       hobby: ["打球", "看书"],
  //       info: {
  //         addr: "四川"
  //       }
  //     }
  const deepClone=(obj)=>{
    //函数名称 instanceof Object 为 true
    // if(!(obj instanceof Object)){
    //typeof 函数名称 为 'function'
    if(obj===null || typeof obj!=="object"){
      return obj
    }else{
      const objOrArr=Array.isArray(obj)?[]:{}
      for(const key in obj){
        const data=deepClone(obj[key])
        objOrArr[key]=data
      }
      return objOrArr
    }
  }

  const deepClone02=(obj)=>{
    if (typeof obj !== 'object' || obj === null) {
      return obj
    }else{
      const objOrArr=Array.isArray(obj)?[]:{}
      for(const item in obj){
        objOrArr[item]=deepClone(obj[item])
      }
      return objOrArr
    }
  }

  const testDebounce=()=>{
    const btn = document.getElementById('btn')
    // btn.addEventListener('click', (e) => {
    //   console.log("this", this);
    //   debounceClick(e, '按钮点击', '提交表单')
    // })
                                      //不能用箭头函数，不然下面this是undefined，虽然是btn调用的
    btn.addEventListener('click',function (e) {
      // console.log("this", this.id);
      debounceClick.call(this,e, '按钮点击', '提交表单')
    })

    // const debounceClick=debounce((e,a,b)=>{
    //   console.log("this", this);
    //   console.log("e, a, b", e, a, b);
    // },1000)
                            //不能是箭头函数，不然apply改变不了实参函数里的this指向上面的btn
    const debounceClick=throttleWithDate(function (e,a,b){
      console.log("this", this);
      console.log("e, a, b", e, a, b);
    },1000)
  }

  const debounce=(fn,delay)=>{
    let timer=null;
    return function(...args){
      if(timer)clearTimeout(timer);
      timer=setTimeout(()=>{
        fn.apply(this,args)
      },delay)
    }
  }

  //setTimeout版本，开始不执行，最后会执行一次
  const throttleWithTimeout=(fn,delay)=>{
    let timer=null
    return function (...args) {
      if (timer === null) {
        timer=setTimeout(()=>{
          fn.apply(this,args)
          clearTimeout(timer)
          timer=null
        },delay)
      }
    }
  }

  //时间戳版本，可以立即执行，最后不执行
  const throttleWithDate=(fn,delay)=>{
    //如果你在绑定后过了 1 秒才点，now - start >= 1000，就会立刻执行
    // 如果绑定后<1s内 点击了按钮，就不会立即执行
    // let start=Date.now()
    let start=0
    return function(...args) {
      let now=Date.now()
      if(now-start>=delay){
        fn.apply(this,args)
        start=now
      }
    }
  }

  onMounted(()=>{
    testDebounce()
  })
  return {
    initUseTest70,
  }
}
