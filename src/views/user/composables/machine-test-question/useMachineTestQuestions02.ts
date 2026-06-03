import { onMounted } from 'vue'

export function useMachineTestQuestions02() {
  const initMachineTestQuestions02 = () => {
    // normalArrDeduplication([5,5,1,2,3,4,1,2,1,1])
    // testObjArrDuplicatedByName()
    // testFlatArr()
    // intersect([1,2,3,4],[3,4,5,6,7])
    // union([1,2,3,4],[3,4,5,6,7])
    // diff([1,2,3,4,5,6],[3,4])
    // getMin([1,2,3,4,5,6])

    // let i=0
    // const handler01=throttle02(printMultipleParameters,3000)
    // setInterval(()=>{
    //   handler01(1+i,2+i,3+i)
    //   i++
    // },1000)

    testSleep()
  }

  onMounted(()=>{
    testDebounce()
    window.addEventListener('resize', throttle01(printContentEverySecond,1000),)
  })

  const printMultipleParameters=(a,b,c)=>{
    console.log("a", a);
    console.log("b", b);
    console.log("c", c);
  }

  //1. 普通数组去重
  const normalArrDeduplication = (arr) => {
    const deduplicatedArr = [...new Set(arr)]
    console.log('deduplicatedArr', deduplicatedArr)
    return deduplicatedArr
  }

  const testObjArrDuplicatedByName = () => {
    const test1 = [
      { name: '张三', age: 18 },
      { name: '李四', age: 20 },
      { name: '张三', age: 25 }, // name 重复，会被过滤
      { name: '王五', age: 22 },
    ]
    objArrDuplicatedByName(test1)

//2. 对象数组去重（按 name 去重）
    function objArrDuplicatedByName(arr) {
      const set = new Set()
      const deduplicatedArr = arr.filter((item) => {
        const isExist = set.has(item.name)
        if (isExist) {
          return false
        } else {
          set.add(item.name)
          return true
        }
      })
      console.log('deduplicatedArr', deduplicatedArr)
      return deduplicatedArr
    }
  }

  const testFlatArr = () => {
    const multiArr = [1, [2, [3, [4, 5]], 6], 7, [8]]
    const flattenedArr = []
    // flatArr(multiArr)
    flatArr02(multiArr,flattenedArr)
    console.log('flattenedArr', flattenedArr)

    //3. 数组扁平化（多维转一维）
    function flatArr02(arr,flattenedArr) {
      for (const item of arr) {
        if (Array.isArray(item)) {
          flatArr02(item,flattenedArr)
        } else {
          flattenedArr.push(item)
        }
      }
    }
  }

  //4. 数组交集、并集、差集
  const intersect=(a,b)=>{
    const arr=[]
    for (const item of a) {
      const isExist=b.includes(item)
      if (isExist) {
        arr.push(item)
      }
    }
    const arr2=a.filter(item=>b.includes(item))
    console.log("arr", arr);
    console.log("arr2", arr2);
    return arr
  }

  const union=(a,b)=>{
    const set=new Set([...a,...b])
    console.log("set", set);
    return [...set]
  }

  const diff=(a,b)=>{
    const arr=a.filter(item=>!b.includes(item))
    console.log("arr", arr);
    return arr
  }

  const getMin=(arr)=>{
    const min=Math.min(...arr)
    console.log("min", min);
    return min
  }

  const testDebounce=()=>{
    const input=document.getElementById('myInput')
    // input.addEventListener('input',debounce(function(e,b){
    //   console.log("e", e);
    //   console.log("e.target.value", e.target.value);
    //   console.log("this.value", this.value);
    //   console.log("b", b);
    // },1000))

    input.addEventListener('input',debounce(function(...parameters){
      console.log("parameters", parameters);
      const [e,a,b]=parameters
      console.log("e", e);
      console.log("e.target.value", e.target.value);
      console.log("this.value", this.value);
      console.log("a", a);
      console.log("b", b);
    },1000))

    // input.addEventListener('input',(e)=>{
    //   console.log("e", e);
    //   console.log("this", this);
    //   console.log("this.value", this.value);
    // })


    const handler = debounce02(function(a, b, c) {
      console.log('手动多参调用：', a, b, c)
    }, 800)
    //handler就指向了debounce02里的匿名函数，handler(11,22,'测试')相当于 匿名函数(11,22,'测试')
    // handler(11, 22, '测试') //此时就必须匿名函数形参写...args

    const handler02 = debounce02(function(...args) {
      const [a,b,c]=args
      console.log('手动多参调用：', a, b, c)
    }, 800)
    //handler就指向了debounce02里的匿名函数，handler(11,22,'测试')相当于 匿名函数(11,22,'测试')
    // handler02(11, 22, '测试') //此时就必须匿名函数形参写...args

    const handler03=debounce03((...args)=>{
      const [a,b,c]=args
      console.log("a", a);
      console.log("b", b);
      console.log("c", c);
    },3000)
    // handler03(1,2,3)
  }
  const debounce03=(fn,time)=>{
    let timer=null
    return (...args)=>{
      if(timer) clearTimeout(timer)
      timer = setTimeout(()=>{
        fn(...args)
      },time);
    }
  }
  const debounce02=(fn,time)=>{
    let timer=null
    //input.addEventListener只给这个匿名函数传递一个参数e，也没有其它参数，所以没必要...args吧？对
    //但是如果是其它对象调用，比如我自定义的函数handler调用会传递多个实参，就只能接收第一个参数
    return function (...args) {
      if (timer) clearTimeout(timer)
      timer=setTimeout(()=>{
        // fn.apply(this,args,777,"jack")
        fn.call(this,...args) //call和apply都行
        // fn()
        console.log("args", args);
      },time)
    }
  }

  const debounce=(fn,time)=>{
    let timer=null
    // return function (args) { //args就是实参e的形参
    //   if (timer) clearTimeout(timer)
    //   timer=setTimeout(()=>{
    //     fn.call(this,args,777)
    //     // fn()
    //     console.log("args", args);
    //   },time)
    // }
    //input.addEventListener只给这个匿名函数传递一个参数e，也没有其它参数，所以没必要...args吧？对
    //但是如果是其它对象调用，比如我自定义的函数调用会传递多个
    return function (...args) { //防抖最终版
      if (timer) clearTimeout(timer)
      timer=setTimeout(()=>{
        // fn.apply(this,args,777,"jack")
        // fn.call(this,args,777,"jack")
        fn.call(this,...args)
        // fn(...args)
        console.log("args", args);
      },time)
    }
  }

  const printContentEverySecond=()=>{
    console.log('a')
  }
  //时间戳版本，可以立即执行
  const throttle01=(fn,time)=>{
    let start=null
    return function (...args) {
      if (start === null||Date.now()-start >= time) {
        fn.call(this,...args)
        start=Date.now()
      }
    }
  }
  //setTimeout版本，最后执行一次，不能立即执行
  const throttle02=(fn,wait)=>{
    let timer=null
    return function (...args) {
      if (timer === null) {
        timer=setTimeout(()=>{
          fn.call(this,...args)
          clearTimeout(timer)// 多余,定时器回调执行时，计时已经结束，清不掉也没必要清，删掉不影响。
          timer=null
        },wait)
      }
    }
  }

  //14.延时串行执行
  const sleep=(time)=>{
    const p=new Promise((resolve,reject)=>{
      setTimeout(()=>{
        resolve()
      },time)
    })
    return p
  }

  const testSleep=async ()=>{
    console.log('开始')
    console.log('等待1s')
    await sleep(1000)
    console.log('已经等待了1s')
    console.log('等待2s')
    await sleep(2000)
    console.log('已经等待了2s')
    console.log('等待3s')
    await sleep(3000)
    console.log('已经等待了3s')
  }

  return {
    initMachineTestQuestions02,
  }
}
