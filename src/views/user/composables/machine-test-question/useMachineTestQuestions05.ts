import { reactive, ref, toRef, toRefs, unref } from 'vue'
import { reject } from 'lodash-es'

export function useMachineTestQuestions05() {
  const initMachineTestQuestions05 = () => {
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
    testInsertionSort()
    // testMyEventBus()

    // testMyCall()
    // testMyApply()
    // testMyBind()
    // testMyInstanceof()

    // testCurry()
    // testGetMaxFromMultidimensionalArrByFlattedArr()
    // testGetMaxFromMultidimensionalArrByPureFunction()

    // testPromise()
    // distinguishVarAndLet()
  }

  const testGetPromiseNumber = () => {
    const p1 = Promise.resolve(1)
    const p2 = Promise.resolve(2)
    const sum = getPromiseNumber(p1, p2)
    console.log('sum', sum)
    sum.then((val) => {
      console.log('val', val)
    })
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
      if (i > arr.length || arr[i] === null || arr[i] === undefined) {
        return null
      }
      return {
        val: arr[i],
        left: buildTree(arr, 2 * i + 1),
        right: buildTree(arr, 2 * i + 2),
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
      } else {
        return isSame(t1.left, t2.left) && isSame(t1.right, t2.right)
      }
    }

    //不完全是：中序遍历是 DFS 的一种，不是等同关系
    const dfs = (t1, t2) => {
      if (isSame(t1, t2)) {
        return true
      } else if (t1 === null) {
        return false
      } else {
        return dfs(t1.left, t2) || dfs(t1.right, t2)
      }
    }

    return dfs(root, sub)
  }

  const testSimplifyPath = () => {
    const simplifiedPath = simplifyPath('/home/foo/./bar/../baz/')
    console.log('simplifiedPath', simplifiedPath)
  }

  const simplifyPath = (path) => {
    const paths = path.split('/')
    const newPaths = []
    paths.forEach((item, i) => {
      if (item === '..') {
        newPaths.pop()
      } else if (item !== '.' && item !== '') {
        newPaths.push(item)
      }
    })
    return '/' + newPaths.join('/')
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
    return arr.filter((item, i) => {
      if (!nameSet.has(item.name)) {
        nameSet.add(item.name)
        return true
      }
    })
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
      arr.forEach((item, i) => {
        const data = flatArr(item)
        newArr = newArr.concat(data)
      })
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
    return arr1.filter((item, i) => {
      if (arr2.includes(item)) {
        return true
      }
    })
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
    let rafId = null

    function check() {
      const now = Date.now()
      if (now - start >= delay) {
        fn()
      } else {
        rafId = requestAnimationFrame(check)
      }
    }

    rafId = requestAnimationFrame(check)
    return () => cancelAnimationFrame(rafId)
  }

  const mySetInterval = (fn, time) => {
    let start = Date.now()
    let rafId = null

    function loop() {
      const now = Date.now()
      if (now - start >= time) {
        fn()
        start += time
        rafId = requestAnimationFrame(loop)
      } else {
        rafId = requestAnimationFrame(loop)
      }
    }

    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
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
      clearTimeout(timer)
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
        start = Date.now()
      } else {
        if (Date.now() - start >= time) {
          fn.apply(this, args)
          start = Date.now()
        }
      }
    }
  }

  const testSleep = async () => {
    console.log('等待2s后输出')
    await sleep(2000)
    console.log('输出')

    console.log('等待3s后输出')
    await sleep(3000)
    console.log('输出')
  }

  const sleep = (time) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve()
      }, time)
    })
  }

  const testDeepClone = () => {
    const origin = {
      name: '小明',
      age: 20,
      hobby: ['打球', '看书'],
      info: {
        addr: '四川',
      },
    }

    const clone = deepClone(origin)
    clone.name = '小红'
    clone.hobby[0] = '游泳'
    clone.info.addr = '成都'

    console.log('原对象', origin)
    console.log('克隆对象', clone)
  }

  const deepClone = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
      return obj
    } else {
      const objOrArr = Array.isArray(obj) ? [] : {}
      for (const key in obj) {
        objOrArr[key] = deepClone(obj[key])
      }
      return objOrArr
    }
  }
  const testReverseStr = () => {
    const str = reverseStr('abcdefg')
    console.log('str', str)
  }
  const reverseStr = (str) => {
    const strs = str.split('')
    return strs.reverse().join('')
  }

  //effectScope() 创建 scope，在 scope.run() 里注册的响应式副作用（watch、watchEffect、computed 等）都挂在这个 scope 上；调用 scope.stop() 可以一次性关闭它们。

  const getWordNumInStr = (str) => {
    const obj = {}
    for (const item of str) {
      if (obj.hasOwnProperty(item)) {
        obj[item] += 1
      } else {
        obj[item] = 1
      }
    }
    return obj
  }

  const testMyNew = () => {
    function Person(name, age) {
      this.name = name
      this.age = age
    }

    function _new(fn, ...args) {
      const obj = {}
      obj.__proto__ = fn.prototype
      const r = fn.apply(obj, args)
      return r instanceof Object ? r : obj
    }

    const stu1 = _new(Person, 'frank', 18)
    console.log('stu1', stu1)

    const stu2 = _new(Person, 'jack', 32)
    console.log('stu2', stu2)
  }

  const testQuick = () => {
    // 测试1：常规乱序数组
    const arr1 = [5, 2, 9, 1, 5, 6]
    console.log(quickSort(arr1)) // [1, 2, 5, 5, 6, 9]

    // 测试2：已经有序数组
    const arr2 = [1, 2, 3, 4, 5]
    console.log(quickSort(arr2)) // [1, 2, 3, 4, 5]

    // 测试3：逆序数组
    const arr3 = [9, 7, 5, 3, 1]
    console.log(quickSort(arr3)) // [1, 3, 5, 7, 9]

    // 测试4：包含负数
    const arr4 = [-2, 5, 0, -8, 3]
    console.log(quickSort(arr4)) // [-8, -2, 0, 3, 5]

    // 测试5：空数组 / 单元素
    const arr5 = []
    const arr6 = [7]
    console.log(quickSort(arr5)) // []
    console.log(quickSort(arr6)) // [7]
  }

  const quickSort = (arr) => {
    if (arr.length <= 1) {
      return arr
    }
    const midIndex = Math.floor(arr.length / 2)
    const mid = arr.splice(midIndex, 1)[0]
    const leftArr = []
    const rightArr = []
    arr.forEach((item, i) => {
      if (item > mid) {
        rightArr.push(item)
      } else {
        leftArr.push(item)
      }
    })
    return [...quickSort(leftArr), mid, ...quickSort(rightArr)]
  }

  const textBubbleSort = () => {
    console.log(bubbleSort([5, 2, 9, 1, 5, 6])) // [1, 2, 5, 5, 6, 9]
    console.log(bubbleSort([9, 7, 3, 1])) // [1, 3, 7, 9]
    console.log(bubbleSort([-2, 0, -5, 4])) // [-5, -2, 0, 4]
    console.log(bubbleSort([1, 2, 3, 4])) // [1, 2, 3, 4]（优化版一轮就退出）
  }

  const bubbleSort = (arr) => {
    for (let i = 1; i < arr.length; i++) {
      for (let j = arr.length - 1; j >= i; j--) {
        if (arr[j - 1] > arr[j]) {
          const temp = arr[j - 1]
          arr[j - 1] = arr[j]
          arr[j] = temp
        }
      }
    }
    return arr
  }

  const testInsertionSort = () => {
    const nums = [5, 2, 9, 1, 5, 6]
    insertionSort(nums)
    console.log('nums', nums)
  }

  //边移动边判断
  const insertionSort = (arr) => {
    for (let i = 1; i < arr.length; i++) {
      let shouldBeIndex=0;
      let temp=arr[i]
      for (let j = i-1; j >= 0; j--) {
        if (arr[j] > temp) {
          arr[j+1]=arr[j]
        }else{
          shouldBeIndex=j+1
          break
        }
      }
      arr[shouldBeIndex]=temp
    }
  }

  const testMyEventBus = () => {
    class MyEventBus {
      id= 0
      cbs = {
        eventName1: {
          id1: {
            isOnce: false,
            fn: null,
          },
          id2: {
            isOnce: false,
            fn: null,
          },
        },
      }

      $emit(eventName, ...args) {
        if (this.cbs[eventName] === undefined) {
          return
        }
        for (const idKey in this.cbs[eventName]) {
          const idObj=this.cbs[eventName][idKey]
          idObj.fn(...args)
          if (idObj.isOnce) {
            delete this.cbs[eventName][idKey]
          }
        }
        if (Object.keys(this.cbs[eventName]).length === 0) {
          delete this.cbs[eventName]
        }
      }

      $on(eventName, fn) {
        if (!this.cbs.hasOwnProperty(eventName)) {
          this.cbs[eventName] = {}
        }
        this.id++
        this.cbs[eventName][this.id] = {
          isOnce: false,
          fn: fn,
        }
        return this.id
      }

      $off(eventName,id){
        if(this.cbs[eventName]===undefined||this.cbs[eventName][id]===undefined){
          return
        }
        delete this.cbs[eventName][id]
        if (Object.keys(this.cbs[eventName]).length === 0) {
          delete this.cbs[eventName]
        }
      }

      $once(eventName, fn) {
        if (!this.cbs.hasOwnProperty(eventName)) {
          this.cbs[eventName] = {}
        }
        this.id++
        this.cbs[eventName][this.id] = {
          isOnce: true,
          fn: fn,
        }
        return this.id
      }

    }

    const bus = new MyEventBus()
    const id1 = bus.$on('getStuInfo', (name, age) => {
      console.log('getStuInfo1')
      console.log('name', name)
      console.log('age', age)
    })
    bus.$off('getStuInfo', id1)
    bus.$on('getStuInfo', (name, age) => {
      console.log('getStuInfo2')
      console.log('name', name)
      console.log('age', age)
    })
    bus.$once('getTeacherInfo', (name, age, height) => {
      console.log('getTeacherInfo')
      console.log('name', name)
      console.log('age', age)
      console.log('height', height)
    })

    setTimeout(() => {
      bus.$emit('getStuInfo', 'frank', 20)
      bus.$emit('getTeacherInfo', 'jackTeacher', 60, 166)
    }, 3000)

    setTimeout(() => {
      bus.$emit('getTeacherInfo', 'tomTeacher', 60, 166)
    }, 5000)
  }

  const testMyCall = () => {
    Function.prototype.myCall = function (target,...args) {
      const fnKey=Symbol('fnKey')
      target[fnKey]=this
      const r =target[fnKey](...args)
      delete target[fnKey]
      return r
    }
    function Stu(name,age){
      this.name=name
      this.age=age
      return 'success'
    }
    const stu1={
      gender:'man'
    }
    const r=Stu.myCall(stu1,'fank',18)
    console.log("r", r);
    console.log("stu1", stu1);
  }

  const testMyApply = () => {
    Function.prototype.myApply = function (target,arr) {
      const fnKey=Symbol('fnKey')
      target[fnKey]=this
      const r=target[fnKey](...arr)
      delete target[fnKey]
      return r
    }
    function Stu(name, age) {
      this.name=name
      this.age=age
      return 'success'
    }
    const stu1={
      gender:'woman'
    }
    const r=Stu.myApply(stu1,['jack',25])
    console.log("r", r);
    console.log("stu1", stu1);
  }

  const testMyBind = () => {
    Function.prototype.myBind=function(target,...oldArgs){
      const fnKey=Symbol('fnKey')
      target[fnKey]=this
      return function(...newArgs){
        const r=target[fnKey](...oldArgs,...newArgs)
        return r
      }
    }

    function Person(name, age) {
      this.name = name
      this.age = age
      return this
    }

    const man = {
      gender: 'man',
    }

    const boy1fn = Person.myBind(man, 'frank')
    const boy1 = boy1fn(18)
    console.log('boy1', boy1)
  }

  const testMyInstanceof = () => {
    const r = myInstanceof([1, 2, 3], Array)
    // const r=myInstanceof([1,2,3],Object)
    // const r=myInstanceof([1,2,3],Number)
    console.log('r', r)
  }

  const myInstanceof = (obj, Type) => {
    if (typeof obj !== 'function'&&typeof obj !== 'object') {
      return false
    }
    if (obj === null) {
      return false
    }
    if (obj.__proto__ === Type.prototype) {
      return true
    }
    obj=obj.__proto__
    return myInstanceof(obj,Type)
  }

  const testCurry = () => {
    function add(x, y, z) {
      return x + y + z
    }

    const curriedAdd = curry(add, 1)
    const sum1 = curriedAdd(2)(3)
    const sum2 = curriedAdd(2, 3)
    console.log('sum1', sum1)
    console.log('sum2', sum2)

    const curriedAdd2 = curry(add)
    const sumFn2 = curriedAdd2(2)(3)
    const sum3 = sumFn2(1)
    console.log('sum3', sum3)
  }

  const curry = (fn, ...args) => {
    if (args.length >= fn.length) {
      const r=fn(...args)
      return r
    }
    return function (...newArgs) {
      return curry(fn,...args,...newArgs)
    }
  }

  const testGetMaxFromMultidimensionalArrByFlattedArr = () => {
    const arr1 = [1, 5, [8, 2], [9, [12, 3], 7]]
    const max = getMaxFromMultidimensionalArrByFlattedArr(arr1)
    console.log('max', max)
  }

  const getMaxFromMultidimensionalArrByFlattedArr = (arr) => {
    function flatArr(arr) {
      if (!Array.isArray(arr)) {
        return arr
      } else {
        let newArr = []
        for (const item of arr) {
          const data = flatArr(item)
          newArr = newArr.concat(data)
        }
        return newArr
      }
    }

    const flattedArr = flatArr(arr)
    return Math.max(...flattedArr)
  }

  const testGetMaxFromMultidimensionalArrByPureFunction = () => {
    const arr1 = [1, 5, [8, 2], [9, [12, 3], 7]]
    const max = getMaxFromMultidimensionalArrByPureFunction(arr1)
    console.log('max', max)
  }

  const getMaxFromMultidimensionalArrByPureFunction = (arr) => {
   let max=-Infinity
    if (!Array.isArray(arr)) {
      return Math.max(arr,max)
    }
    arr.forEach((item,i)=>{
      let subMax=getMaxFromMultidimensionalArrByPureFunction(item)
      max=Math.max(max,subMax)
    })
    return max
  }

  const testPromise = () => {
    const p = new Promise((resolve, reject) => {
      resolve(2)
      // reject(1)
    })
    const pThenR = p.then(
      (result) => {
        console.log('state', 'fulfilled')
        console.log('result', result)
        return new Promise((resolve, reject) => {
          // resolve(2)
          reject(1)
        })
      },
      (result) => {
        console.log('state', 'rejected')
        console.log('result', result)
      },
    )

    pThenR.then(
      (result) => {
        console.log('pThenRstate', 'fulfilled')
        console.log('pThenRresult', result)
      },
      (result) => {
        console.log('pThenRstate', 'rejected')
        console.log('pThenRresult', result)
      },
    )
  }

  const testMyPromise = () => {
    const REJECTED='rejected'
    const FULFILLED='fulfilled'
    const PENDING='pending'
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
      then(onFulfilled,onRejected){
        onFulfilled=onFulfilled instanceof Function?onFulfilled:(result)=>{return result}
        onRejected=onRejected instanceof Function?onRejected:(result)=>{throw result}
        const p=new MyPromise((resolve,reject)=>{
           const settleX= (cb)=>{
            try{
              const x=cb(this.result)
              if(x instanceof MyPromise){
                x.then((xResult)=>{
                  resolve(xResult)
                },(xResult)=>{
                  reject(xResult)
                })
              }else{
                resolve(x)
              }
            }catch (e) {
              reject(e)
            }
          }
          if (this.state === FULFILLED) {
            settleX(onFulfilled)
          } else if (this.state === REJECTED) {
            settleX(onRejected)
          }else{
            this.fulfilledCbs.push(settleX.bind(this,onFulfilled))
            this.rejectedCbs.push(settleX.bind(this,onRejected))
          }
        })
        return p
      }
      static resolve(val){
        if (val instanceof MyPromise) {
          return val
        }else{
          return new MyPromise((resolve,reject)=>{
            resolve(val)
          })
        }
      }
      static reject(val){
        return new MyPromise((resolve,reject)=>{
          reject(val)
        })
      }
      static all(arr){
        const results=[]
        let num=0
        return new MyPromise((resolve,reject)=>{
          if (arr.length === 0) {
            resolve([])
            return
          }
          for (let i=0;i<arr.length;i++) {
            if (arr[i] instanceof MyPromise) {
              arr[i].then((result)=>{
                results[i]=result
                num++
                if (num === arr.length) {
                  resolve(results)
                }
              },(result)=>{
                reject(result)
              })
            }else{
              results[i]=arr[i]
              num++
              if (num === arr.length) {
                resolve(results)
              }
            }
          }
        })
      }
      static race(arr){
        return new MyPromise((resolve,reject)=>{
          arr.forEach((item,i)=>{
            if(item instanceof MyPromise){
              item.then((itemResult)=>{
                resolve(itemResult)
              },(itemResult)=>{
                reject(itemResult)
              })
            }else{
              resolve(item)
            }
          })
        })
      }
    }
  }

  const distinguishVarAndLet = () => {
    console.log(a) // undefined，不是报错
    var a = 1
    // function getA(){
    //   var a='aaa'
    // }
    // console.log("a", a);
  }

  return {
    initMachineTestQuestions05,
  }
}
