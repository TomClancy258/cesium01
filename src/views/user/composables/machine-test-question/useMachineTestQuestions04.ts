import { reactive, ref, toRef, toRefs, unref } from 'vue'

export function useMachineTestQuestions04() {
  const initMachineTestQuestions04 = () => {
    // testGetPromiseNumber()
    // testIsChildTree()
    // testSimplifyPath()
    // testNormalArrDeduplication()
    // testObjArrDuplicatedByName()
    // testFlatArr()
    // testIntersect()

    // const min= getMin([1,2,3,4,5,6])
    // console.log("min", min);

    // testRefMethods()

    // testMySetTimeout()
    // testMySetInterval()

    // testDebounce()
    // testSleep()
    // testDeepClone()
    // testReverseStr()

    // const obj= getWordNumInStr('112223abcabc')
    // console.log("obj", obj);

    // testMyNew()

    // testQuick()
    // textBubbleSort()
    // testInsertionSort()
    // testMyEventBus()

    // testMyCall()
    // testMyApply()
    // testMyBind()
    // testMyInstanceof()

    // testCurry()
    // testGetMaxFromMultidimensionalArrByFlattedArr()
    // testGetMaxFromMultidimensionalArrByPureFunction()

    // testPromise()
    distinguishVarAndLet()
  }

  const testGetPromiseNumber = () => {
    const p1 = Promise.resolve(2)
    const p2 = Promise.resolve(3)
    const sum = getPromiseNumber(p1, p2)
    console.log('sum', sum)
  }
  const getPromiseNumber = async (p1: Promise<number>, p2: Promise<number>) => {
    return (await p1) + (await p2)
  }
  const testIsChildTree = () => {
    const r = isChildTree([3, 4, 5, 1, 2, 9, 10, null, 7], [4, 1, 2, null, 7])
    console.log('r', r)
  }
  const isChildTree = (rootArr, subArr) => {
    const buildTree = (arr, i) => {
      if (arr[i] === null || arr[i] === undefined) {
        return null
      } else {
        return {
          val: arr[i],
          left: buildTree(arr, i * 2 + 1),
          right: buildTree(arr, i * 2 + 2),
        }
      }
    }
    const root = buildTree(rootArr, 0)
    const sub = buildTree(subArr, 0)

    const isSame = (t1, t2) => {
      if (t1 === null && t2 === null) {
        return true
      } else if (t1 === null && t2 !== null) {
        return false
      } else if (t1 !== null && t2 === null) {
        return false
      } else if (t1.val !== t2.val) {
        return false
      } else if (t1.val === t2.val) {
        return isSame(t1.left, t2.left) && isSame(t1.right, t2.right)
      }
    }
    const dfsTree = (t1, sub) => {
      if (isSame(t1, sub)) {
        return true
      } else if (t1 === null) {
        return false
      }
      return dfsTree(t1.left, sub) || dfsTree(t1.right, sub)
    }
    const r = dfsTree(root, sub)
    return r
  }

  const testSimplifyPath = () => {
    const simplifiedPath = simplifyPath('/home/foo/./bar/../baz/')
    console.log('simplifiedPath', simplifiedPath)
  }

  const simplifyPath = (path) => {
    const paths = path.split('/')
    const simplifiedPaths = []
    for (const item of paths) {
      if (item === '..') {
        // if (simplifiedPaths.length > 0) {
        simplifiedPaths.pop()
        // }
      } else if (item === '.' || item === '') {
      } else {
        simplifiedPaths.push(item)
      }
    }
    return '/' + simplifiedPaths.join('/')
  }

  const testNormalArrDeduplication = () => {
    const arr = normalArrDeduplication([5, 5, 1, 2, 3, 4, 1, 2, 1, 1])
    console.log('arr', arr)
  }

  const normalArrDeduplication = (arr) => {
    const set = new Set(arr)
    const deduplicatedArr = [...set]
    return deduplicatedArr
  }

  const testObjArrDuplicatedByName = () => {
    const test1 = [
      { name: '张三', age: 18 },
      { name: '李四', age: 20 },
      { name: '张三', age: 25 }, // name 重复，会被过滤
      { name: '王五', age: 22 },
    ]
    const arr = objArrDuplicatedByName(test1)
    console.log('arr', arr)
  }

  const objArrDuplicatedByName = (arr) => {
    const nameSet = new Set()
    const newArr = arr.filter((item, i) => {
      if (!nameSet.has(item.name)) {
        nameSet.add(item.name)
        return true
      }
    })
    return newArr
  }

  const testFlatArr = () => {
    const multiArr = [1, [2, [3, [4, 5]], 6], 7, [8]]
    const arr = flatArr(multiArr)
    console.log('arr', arr)
  }
  const flatArr = (arr) => {
    if (!Array.isArray(arr)) {
      return arr
    } else {
      let newArr = []
      for (const item of arr) {
        const data = flatArr(item)
        newArr = newArr.concat(data) //concat / map / filter 等很多数组方法都不改原数组
      }
      return newArr
    }
  }

  const testIntersect = () => {
    // const arr=intersection([1,2,3,4],[3,4,5,6,7])
    // const arr=union([1,2,3,4],[3,4,5,6,7])
    const arr = diff([1, 2, 3, 4], [3, 4, 5, 6, 7])
    console.log('arr', arr)
  }
  const intersection = (arr1, arr2) => {
    const arr = arr1.filter((item, i) => {
      if (arr2.includes(item)) {
        return true
      }
    })
    return arr
  }

  const union = (arr1, arr2) => {
    const set = new Set([...arr1, ...arr2])
    return [...set]
  }

  const diff = (arr1, arr2) => {
    return arr1.filter((item, i) => {
      if (!arr2.includes(item)) {
        return true
      }
    })
  }

  const getMin = (arr) => {
    return Math.min(...arr)
  }

  const testRefMethods = () => {
    const obj = reactive({
      name: 'jack',
      age: 18,
      sex: 'boy',
      friends: {
        tom: {
          age: 32,
          sex: 'boy',
        },
      },
    })
    //toRef:
    //基于响应式对象上浅层上的一属性，创建一对应的ref
    //ref类型的sex指向obj.sex
    //新创建的ref与其原属性保持同步（互相影响）
    const sex = toRef(obj, 'sex')
    console.log('sex.value', sex.value)
    console.log('obj.sex', obj.sex)
    // obj.sex='girl'
    sex.value = 'girl'
    console.log('sex.value', sex.value)
    console.log('obj.sex', obj.sex)

    const obj2 = ref({
      name: 'jack',
      age: 18,
    })
    console.log('obj2', obj2)
    //unref：
    //如果参数是ref,则返回内部值，否则返回参数本身
    //值类型的obj2UnRef指向了obj2.value指向的地址，如果是obj2是普通类型则拷贝了一个数，则修改obj2UnRef不会影响obj2
    const obj2UnRef = unref(obj2)
    obj2UnRef.name = 'frank'
    console.log('obj2.value.name', obj2.value.name)

    //toRefs:
    //将一响应式对象转换为一普通对象
    //但是这个普通对象的浅层上的每个属性都是指向原对象属性的ref
    //每个单独的ref都是通过toRef创建的
    const obj3Reactive = reactive({ name: 'jack', age: 22 })
    const obj3 = toRefs(obj3Reactive)
    console.log('obj3', obj3)
  }

  const testMySetTimeout = () => {
    mySetTimeout(() => {
      console.log('aaa')
    }, 3000)
  }
  const testMySetInterval = () => {
    mySetInterval(() => {
      console.log('aaa')
    }, 3000)
  }

  const mySetTimeout = (fn, delay) => {
    const start = Date.now()
    let cafId = null

    function check() {
      if (Date.now() - start >= delay) {
        fn()
      } else {
        cafId = requestAnimationFrame(check)
      }
    }

    cafId = requestAnimationFrame(check)
    return () => cancelAnimationFrame(cafId)
  }

  const mySetInterval = (fn, time) => {
    let start = Date.now()
    let cafId = null

    function loop() {
      const now = Date.now()
      if (now - start >= time) {
        fn()
        start += time
        // start=now
      }
      cafId = requestAnimationFrame(loop)
    }

    cafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(cafId)
  }

  const testDebounce = () => {
    const debounceCb = debounce((a, b, c) => {
      console.log('aaa')
      console.log('a', a)
      console.log('b', b)
      console.log('c', c)
    }, 3000)
    debounceCb(1, 2, 3)
    setTimeout(() => {
      debounceCb(4, 5, 6)
    }, 2000)
  }

  const debounce = (fn, time) => {
    let timer = null
    return function (...args) {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      timer = setTimeout(() => {
        fn.apply(this, args)
      }, time)
    }
  }

  //刚触发不执行，最后一次是延迟time执行
  const throttle01 = (fn, time) => {
    let timer = null
    return function (...args) {
      if (timer === null) {
        timer = setTimeout(() => {
          fn.apply(this, args)
          clearTimeout(timer)
          timer = null
        }, time)
      }
    }
  }

  //刚触发执行，最后一次触发就执行且不是延迟time执行
  const throttle02 = (fn, time) => {
    let start = null
    return function (...args) {
      if (start === null) {
        fn.apply(this, args)
        start=Date.now()
      }else{
        const now=Date.now()
        if (now - start >= time) {
          start=now
          fn.apply(this,args)
        }
      }
    }
  }

  const testSleep=async()=>{
    console.log('等待2s后输出')
    await sleep(2000)
    console.log('输出')

    console.log('等待3s后输出')
    await sleep(3000)
    console.log('输出')
  }

  const sleep=(time)=>{
    return new Promise((resolve,reject)=>{
      setTimeout(()=>{
        resolve()
      },time)
    })
  }

  const testDeepClone=()=>{
    const origin = {
      name: "小明",
      age: 20,
      hobby: ["打球", "看书"],
      info: {
        addr: "四川"
      }
    }

    const clone = deepClone(origin)
    clone.name = "小红"
    clone.hobby[0] = "游泳"
    clone.info.addr = "成都"

    console.log("原对象", origin)
    console.log("克隆对象", clone)
  }

  const deepClone=(obj)=>{
    if (typeof obj !== 'object' || obj === null) {
      return obj
    }else{
      let objOrArr={}
      if (Array.isArray(obj)) {
        objOrArr=[]
      }
      for (const key in obj) {
        const data=deepClone(obj[key])
        objOrArr[key]=data
      }
      return objOrArr
    }
  }
  const testReverseStr=()=>{
    const str=reverseStr('abcdefg')
    console.log("str", str);
  }
  const reverseStr=(str)=>{
    const strs=str.split('')
    const reversedStr=strs.reverse()
    return reversedStr.join('')
  }

  //effectScope() 创建 scope，在 scope.run() 里注册的响应式副作用（watch、watchEffect、computed 等）都挂在这个 scope 上；调用 scope.stop() 可以一次性关闭它们。

  const getWordNumInStr=(str)=>{
    const strs=str.split('')
    const obj={}
    strs.forEach((item,i)=>{
      if (obj.hasOwnProperty(item)) {
        obj[item]++
      }else{
        obj[item]=1
      }
    })
    return obj
  }

  const testMyNew=()=>{
    function Person(name,age){
      this.name=name
      this.age=age
    }
    function _New(fn,...args){
      const obj={}
      obj.__proto__=fn.prototype
      const r=fn.apply(obj,args)
      return (r instanceof Object)?r:obj
    }
    const stu1=_New(Person,'frank',18)
    console.log("stu1", stu1);
  }

  const testQuick=()=>{
    // 测试1：常规乱序数组
    const arr1 = [5, 2, 9, 1, 5, 6];
    console.log(quickSort(arr1)); // [1, 2, 5, 5, 6, 9]

// 测试2：已经有序数组
    const arr2 = [1, 2, 3, 4, 5];
    console.log(quickSort(arr2)); // [1, 2, 3, 4, 5]

// 测试3：逆序数组
    const arr3 = [9, 7, 5, 3, 1];
    console.log(quickSort(arr3)); // [1, 3, 5, 7, 9]

// 测试4：包含负数
    const arr4 = [-2, 5, 0, -8, 3];
    console.log(quickSort(arr4)); // [-8, -2, 0, 3, 5]

// 测试5：空数组 / 单元素
    const arr5 = [];
    const arr6 = [7];
    console.log(quickSort(arr5)); // []
    console.log(quickSort(arr6)); // [7]
  }


  const quickSort=(arr)=>{
    if (arr.length === 0 || arr.length === 1) {
      return arr
    }
    const midIndex=Math.floor(arr.length/2)
    const mid=arr.splice(midIndex,1)[0]
    const leftArr=[]
    const rightArr=[]
    arr.forEach((item,i)=>{
      if (item <= mid) {
        leftArr.push(item)
      }else{
        rightArr.push(item)
      }
    })
    return [...quickSort(leftArr),mid,...quickSort(rightArr)]
  }

  const textBubbleSort=()=>{
    console.log(bubbleSort([5, 2, 9, 1, 5, 6]));  // [1, 2, 5, 5, 6, 9]
    console.log(bubbleSort([9, 7, 3, 1]));         // [1, 3, 7, 9]
    console.log(bubbleSort([-2, 0, -5, 4]));       // [-5, -2, 0, 4]
    console.log(bubbleSort([1, 2, 3, 4]));         // [1, 2, 3, 4]（优化版一轮就退出）
  }

  const bubbleSort=(arr)=>{
    for (let i = 0; i < arr.length - 1; i++) {
      for (let j = arr.length - 1; j > i; j--) {
        if (arr[j] < arr[j - 1]) {
          const temp=arr[j-1]
          arr[j-1]=arr[j]
          arr[j]=temp
        }
      }
    }
    return arr
  }

  const testInsertionSort=()=>{
    const nums = [5, 2, 9, 1, 5, 6];
    insertionSort(nums)
    console.log("nums", nums);
  }

  const insertionSort=(arr)=>{
    for (let i = 0; i < arr.length-1; i++) {
      const temp=arr[i+1]
      let shouldBeIndex=i+1
      for (let j = i + 1; j > 0; j--) {
        if (temp < arr[j - 1]) {
          arr[j]=arr[j-1]
          shouldBeIndex=j-1
        }else{
          break
        }
      }
      arr[shouldBeIndex]=temp
    }
    return arr
  }

  const testMyEventBus=()=>{
    class MyEventBus{
      obj={}
      id=0
      constructor() {
        // obj={
        //   eventName1:{
        //     id1:{
        //       fn,
        //       isOnce:false
        //     },
        //     id2:{
        //       fn,
        //       isOnce:true
        //     },
        //   },
        //
        // }
      }
      $emit(eventName,...args){
        if (!this.obj.hasOwnProperty(eventName)) {
          return
        }
        for(const id in this.obj[eventName]){
          const idObj=this.obj[eventName][id]
          idObj.fn(...args)
          if (idObj.isOnce) {
            delete this.obj[eventName][id]
          }
        }
        if (Object.keys(this.obj[eventName]).length === 0) {
          delete this.obj[eventName]
        }
      }
      $on(eventName,fn){
        if (!this.obj.hasOwnProperty(eventName)) {
          this.obj[eventName]={}
        }
        this.id++
        this.obj[eventName][this.id]={
          fn,
          isOnce:false,
        }
        return this.id
      }
      $once(eventName,fn){
        if (!this.obj.hasOwnProperty(eventName)) {
          this.obj[eventName]={}
        }
        this.id++
        this.obj[eventName][this.id]={
          fn,
          isOnce:true,
        }
        return this.id
      }
      $off(eventName,id){
        if (this.obj[eventName] === undefined || this.obj[eventName][id] === undefined) {
          return
        }
        delete this.obj[eventName][id]
        if (Object.keys(this.obj[eventName]).length === 0) {
          delete this.obj[eventName]
        }
      }
    }

    const bus=new MyEventBus()
    const id1=bus.$on('getStuInfo',(name,age)=>{
      console.log('getStuInfo1')
      console.log("name", name);
      console.log("age", age);
    })
    bus.$off('getStuInfo',id1)
    bus.$on('getStuInfo',(name,age)=>{
      console.log('getStuInfo2')
      console.log("name", name);
      console.log("age", age);
    })
    bus.$once('getTeacherInfo',(name,age,height)=>{
      console.log('getTeacherInfo')
      console.log("name", name);
      console.log("age", age);
      console.log("height", height);
    })

    setTimeout(()=>{
      bus.$emit('getStuInfo','frank',20)
      bus.$emit('getTeacherInfo','jackTeacher',60,166)
    },3000)

    setTimeout(()=>{
      bus.$emit('getTeacherInfo','tomTeacher',60,166)
    },5000)
  }

  const testMyCall=()=>{
    Function.prototype.myCall=function(target,...args){
      const fnKey=Symbol('fnKey')
      target[fnKey]=this
      console.log("target", target);
      const r = target[fnKey](...args)
      delete target[fnKey]
      return r
    }

    function Person(name,age){
      this.name=name
      this.age=age
      return this
    }

    const man={
      gender:'man'
    }

    const boy1= Person.myCall(man,'frank',18)
    console.log("boy1", boy1);
  }

  const testMyApply=()=>{
    Function.prototype.myApply=function(target,args){
      const fnKey=Symbol('fnKey')
      target[fnKey]=this
      console.log("target", target);
      const r = target[fnKey](...args)
      delete target[fnKey]
      return r
    }

    function Person(name,age){
      this.name=name
      this.age=age
      return this
    }

    const man={
      gender:'man'
    }

    const boy1= Person.myApply(man,['frank',18])
    console.log("boy1", boy1);
  }

  const testMyBind=()=>{
    Function.prototype.myBind=function(target,...args){
      const fnKey=Symbol('fnKey')
      target[fnKey]=this
      return function(...newArgs){
        const r = target[fnKey](...args,...newArgs)
        // delete target[fnKey]
        return r
      }
    }

    function Person(name,age){
      this.name=name
      this.age=age
      return this
    }

    const man={
      gender:'man'
    }

    const boy1fn= Person.myBind(man,'frank')
    const boy1=boy1fn(18)
    console.log("boy1", boy1);
  }

  const testMyInstanceof=()=>{
    const r=myInstanceof([1,2,3],Array)
    // const r=myInstanceof([1,2,3],Object)
    // const r=myInstanceof([1,2,3],Number)
    console.log("r", r);
  }

  const myInstanceof=(obj,Type)=>{
    if (typeof obj !== 'object' && typeof obj !== 'function') {
      return false
    } else if (obj === undefined ||obj === null) {
      return false
    }else if (obj.__proto__ === Type.prototype) {
      return true
    }else if(obj.__proto__ !== Type.prototype){
      obj=obj.__proto__
      return myInstanceof(obj,Type)
    }
  }

  const testCurry=()=>{
    function add(x,y,z){
      return x+y+z
    }
    const curriedAdd=curry(add,1)
    const sum1=curriedAdd(2)(3)
    const sum2=curriedAdd(2,3)
    console.log("sum1", sum1);
    console.log("sum2", sum2);

    const curriedAdd2=curry(add)
    const sumFn2=curriedAdd2(2)(3)
    const sum3=sumFn2(1)
    console.log("sum3", sum3);
  }

  const curry=(fn,...args)=>{
    if (args.length >= fn.length) {
      return fn(...args)
    }
    return function (...newArgs) {
      return curry(fn,...args,...newArgs)
    }
  }

  const testGetMaxFromMultidimensionalArrByFlattedArr=()=>{
    const arr1 = [1, 5, [8, 2], [9, [12, 3], 7]]
    const max= getMaxFromMultidimensionalArrByFlattedArr(arr1)
    console.log("max", max);
  }

  const getMaxFromMultidimensionalArrByFlattedArr=(arr)=>{
    function flatArr(arr){
      if (!Array.isArray(arr)) {
        return arr
      }else{
        let newArr=[]
        for (const item of arr) {
          const data=flatArr(item)
          newArr=newArr.concat(data)
        }
        return newArr
      }
    }
    const flattedArr=flatArr(arr)
    return Math.max(...flattedArr)
  }

  const testGetMaxFromMultidimensionalArrByPureFunction=()=>{
    const arr1 = [1, 5, [8, 2], [9, [12, 3], 7]]
    const max= getMaxFromMultidimensionalArrByPureFunction(arr1)
    console.log("max", max);
  }

  const getMaxFromMultidimensionalArrByPureFunction=(arr)=>{
    // let max=-Infinity
    // for (const item of arr) {
    //   if (!Array.isArray(item)) {
    //     max=Math.max(item,max)
    //   }else{
    //     const data=getMaxFromMultidimensionalArrByPureFunction(item)
    //     max=Math.max(max,data)
    //   }
    // }
    // return max

    let max=-Infinity
    if (!Array.isArray(arr)) {
      max=Math.max(max,arr)
    }else{
      for (const item of arr) {
        const data=getMaxFromMultidimensionalArrByPureFunction(item)
        max=Math.max(max,data)
      }
    }
    return max
  }

  const testPromise=()=>{
    const p=new Promise((resolve,reject)=>{
      resolve(2)
      // reject(1)
    })
   const pThenR= p.then((result)=>{
      console.log('state','fulfilled')
      console.log("result", result);
      return new Promise((resolve,reject)=>{
        // resolve(2)
        reject(1)
      })
    },(result)=>{
      console.log("state", 'rejected');
      console.log("result", result);
    })

    pThenR.then((result)=>{
      console.log('pThenRstate','fulfilled')
      console.log("pThenRresult", result);
    },(result)=>{
      console.log("pThenRstate", 'rejected');
      console.log("pThenRresult", result);
    })
  }

  const testMyPromise=()=>{
    const PENDING='pending'
    const FULFILLED='fulfilled'
    const REJECTED='rejected'

    class MyPromise{
      state=PENDING
      result=null
      fulfilledCbs=[]
      rejectedCbs=[]
      constructor(executor) {
        try {
          executor(this.resolve.bind(this),this.reject.bind(this))
        }catch (e) {
          this.reject(e)
        }
      }
      resolve(val){
        if (this.state === PENDING) {
          this.state=FULFILLED
          this.result=val
          while (this.fulfilledCbs.length > 0) {
            this.fulfilledCbs.shift()(this.result)
          }
        }
      }
      reject(val){
        if (this.state === PENDING) {
          this.state=REJECTED
          this.result=val
          while (this.rejectedCbs.length > 0) {
            this.rejectedCbs.shift()(this.result)
          }
        }
      }
      then(onFulFilled,onRejected){
        onFulFilled=(typeof onFulFilled)==='function'?onFulFilled:(result)=>{return result}
        onRejected=(typeof onRejected)==='function'?onRejected:(result)=>{throw result}
        const p= new MyPromise((resolve,reject)=>{
          const settlePromise=(cb)=>{
            queueMicrotask(()=>{
              try{
                const x=cb(this.result)
                if (x === p) {
                  throw new Error('不能返回自身')
                }
                if (x instanceof MyPromise) { //实参返回的是Promise类型的x，则then返回与x相同状态与结果的新Promise对象
                  x.then((xResult)=>{
                    resolve(xResult)
                  },(xResult)=>{
                    reject(xResult)
                  })
                }else{
                  resolve(x)
                }
              }catch (err){
                reject(err)
              }
            })
          }
          if (this.state === FULFILLED) {
            settlePromise(onFulFilled)
          } else if (this.state === REJECTED) {
            settlePromise(onRejected)
          }else if (this.state === PENDING) {
            this.fulfilledCbs.push(settlePromise.bind(this,onFulFilled))
            this.rejectedCbs.push(settlePromise.bind(this,onRejected))
          }
        })
        return p
      }
      static all(arr){
        const results=[]
        let num=0
        return new MyPromise((resolve,reject)=>{
          if (arr.length === 0) {
            resolve([])
            return
          }
          arr.forEach((item,i)=>{
            if (item instanceof MyPromise) {
              item.then((itemResult)=>{
                results[i]=itemResult
                num++
                if (num === arr.length) {
                  resolve(results)
                }
              },(itemResult)=>{
                reject(itemResult)
              })
            }else{
              results[i]=item
              num++
              if (num === arr.length) {
                resolve(results)
              }
            }
          })
        })
      }

      static race(arr){
        return new MyPromise((resolve,reject)=>{
          arr.forEach((item,i)=>{
            if (item instanceof MyPromise) {
              item.then(resolve,reject)
            }else{
              queueMicrotask(()=>{
                resolve(item)
              })
            }
          })
        })
      }
    }
  }

  const distinguishVarAndLet=()=>{
    console.log(a) // undefined，不是报错
    var a = 1
    // function getA(){
    //   var a='aaa'
    // }
    // console.log("a", a);
  }


  return {
    initMachineTestQuestions04,
  }
}
