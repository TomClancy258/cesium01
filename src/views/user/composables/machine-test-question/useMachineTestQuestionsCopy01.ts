export function useMachineTestQuestionsCopy01() {
  const initMachineTestQuestionsCopy01 = () => {
    // promiseNumber()
    // mySetTimeout()
    // mySetInterval()
    // isChildTree([3, 4, 5, 1, 2, 9, 10, null, 7], [4, 1, 2, null, 7])

    // simplifyPath('D:\\word\\..\\..\\\\.\\\\.\\\\\\....\\..简历01\\claude01-02.png')
    // simplifyPath('/a/./b/../../c/')

    // testMyLock()
    // normalArrDeduplication([5,5,1,2,3,4,1,2,1,1])
    // testObjArrDuplicatedByName()
    // testFlatArr()
    // testSleep()
    // testDeepClone()
    const obj= getWordNumInStr('112223abcabc')
    console.log("obj", obj);
  }

  const mySetTimeout = (fn, delay) => {
    const start = Date.now()
    let rafId
    const check = () => {
      if (Date.now() - start < delay) {
        rafId = requestAnimationFrame(check)
      } else {
        fn()
      }
    }
    rafId = requestAnimationFrame(check)
    return () => cancelAnimationFrame(rafId)
  }

  const mySetInterval = (fn, interval) => {
    let start = Date.now()
    let rafId
    const loop = () => {
      const now = Date.now()
      if (now - start < interval) {
        rafId = requestAnimationFrame(loop)
      } else {
        start += interval
        fn()
        rafId = requestAnimationFrame(loop)
      }
    }
    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }

  const promiseNumber = () => {
    // 有两个泛型 Promise 类型：
    // 要求：
    // 写一个函数 sum，接收两个参数
    // 第一个参数类型：Promise1<number>
    // 第二个参数类型：Promise2<number>
    // 函数内部把它们变成 number 类型
    // 最后 return 两个数字之和
    const sum = async (v1: Promise<number>, v2: Promise<number>) => {
      const num = (await v1) + (await v2)
      console.log('num', num)
      return num
    }
    const s = sum(
      new Promise((resolve, reject) => {
        resolve(3)
      }),
      new Promise((resolve, reject) => {
        resolve(4)
      }),
    )
    s.then((val) => {
      console.log('sVal', val)
    })

    const su = sum(Promise.resolve(1), Promise.resolve(2))
    su.then((val) => {
      console.log('suVal', val)
    })
    // console.log("s", s);
    // console.log("su", su);
  }

  const isTreeChild = (rootArr, subArr) => {
    const buildTree = (arr, i) => {
      if (i >= arr.length) {
        return null
      } else {
        return {
          val: arr[i],
          left: buildTree(arr, 2 * i + 1),
          right: buildTree(arr, 2 * i + 2),
        }
      }
    }

    const root = buildTree(rootArr, 0)
    const sub = buildTree(subArr, 0)
    console.log('root', root)
  }

  const isChildTree = (rootArr, subArr) => {
    const buildTree = (arr, i) => {
      if (arr[i] === null || i >= arr.length) {
        return null
      } else {
        return {
          val: arr[i],
          left: buildTree(arr, 2 * i + 1),
          right: buildTree(arr, 2 * i + 2),
        }
      }
    }

    const root = buildTree(rootArr, 0)
    const sub = buildTree(subArr, 0)

    const isSame = (t1, t2) => {
      if (t1 === null && t2 === null) {
        return true
      } else if (t1 === null && t2 !== null) {
        //一个为null，一个不为bull
        return false
      } else if (t1 !== null && t2 === null) {
        return false
      } else if (t1 !== null && t2 !== null) {
        if (t1.val !== t2.val) {
          return false
        } else {
          const isLeftSame = isSame(t1.left, t2.left)
          const isRightSame = isSame(t1.right, t2.right)
          return isLeftSame && isRightSame
        }
      }
    }

    const dfs = (t) => {
      if (t === null) {
        return false
      } else {
        const r = isSame(t, sub)
        if (!r) {
          return dfs(t.left) || dfs(t.right)
        } else {
          return true
        }
      }
    }

    const isChild = dfs(root)
    console.log('isChild', isChild)
    return isChild
  }

  const simplifyPath = (path) => {
    const paths = path.split('/')
    const simplifiedPaths = []
    for (const item of paths) {
      if (item === '' || item === '.') {
        continue
      } else if (item === '..') {
        if (simplifiedPaths.length > 0) {
          simplifiedPaths.pop()
        }
      } else {
        simplifiedPaths.push(item)
      }
    }
    const pathStr = '/' + simplifiedPaths.join('/')
    console.log('pathStr', pathStr)
    return pathStr
  }

  class MyLock {
    isLock = false
    tasks = []

    lock() {
      this.isLock = true
    }

    wait() {
      if (this.isLock) {
        const p = new Promise((resolve, reject) => {
          this.tasks.push(resolve)
        })
        return p
      } else {
        return Promise.resolve()
      }
    }

    unlock() {
      this.isLock = false
      while (this.tasks.length > 0) {
        this.tasks.shift()()
      }
    }
  }

  const testMyLock = async () => {
    const myLock = new MyLock()

    console.log('开始【未上锁】')

    myLock.lock()
    console.log('已经上锁')

    setTimeout(() => {
      myLock.unlock()
    }, 3000)

    await myLock.wait()
    console.log('wait1')

    await myLock.wait()
    console.log('wait2')
  }

  const normalArrDeduplication = (arr) => {
    const set = new Set(arr)
    const deduplicatedArr = [...set]
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

    function objArrDuplicatedByName(arr) {
      const nameSet = new Set()
      const newArr = arr.filter((item, i) => {
        if (!nameSet.has(item.name)) {
          nameSet.add(item.name)
          return true
        }
      })
      console.log('newArr', newArr)
      return newArr
    }
  }

  const testFlatArr = () => {
    const multiArr = [1, [2, [3, [4, 5]], 6], 7, [8]]
    // const flatArr=multiArr.flat(Infinity)
    // console.log("flatArr", flatArr);
    const newArr = []

    const flattenedArr = flatArrMethod(multiArr)
    flatArrMethod02(multiArr, newArr)
    // flatArr(multiArr,flattenedArr)
    console.log('flattenedArr', flattenedArr)
    console.log('newArr', newArr)

    function flatArrMethod(arr) {
      let flattedArr = []
      if (!Array.isArray(arr)) {
        // flattedArr.push(arr)
        return arr
      } else {
        for (const item of arr) {
          const data = flatArrMethod(item)
          flattedArr = flattedArr.concat(data)
          // if (Array.isArray(data)) {
          //   flattedArr=[...flattedArr,...data]
          // }else{
          //   flattedArr=[...flattedArr,data]
          // }
        }
        return flattedArr
      }
    }

    function flatArrMethod02(arr, newArr) {
      if (!Array.isArray(arr)) {
        newArr.push(arr)
      } else {
        for (const item of arr) {
          flatArrMethod02(item, newArr)
        }
      }
    }
  }

  //4. 数组交集、并集、差集
  const intersect = (a, b) => {
    const arr = []
    for (const item of a) {
      if (b.includes(item)) {
        arr.push(item)
      }
    }
    return arr
  }

  const union = (a, b) => {
    const set = new Set([...a, ...b])
    const arr = [...set]
    return arr
  }

  const diff = (a, b) => {
    const arr1 = a.filter((item) => {
      if (!b.includes(item)) {
        return true
      }
    })
    const arr2 = b.filter((item) => {
      if (!a.includes(item)) {
        return true
      }
    })
    return [...arr1, ...arr2]
  }

  const getMin = (arr) => {
    return Math.min(...arr)
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

  const throttle=(fn,time)=>{
    let timer=null
    return function(...args){
      if (timer!==null) {
        return
      }
      timer=setTimeout(()=>{
        fn.apply(this,args)
        clearTimeout(timer)
        timer=null
      },time)
    }
  }

  const throttle02=(fn,time)=>{
    let start=null
    return function(...args){
      if (start === null) {
        fn.apply(this,args)
        start=Date.now()
      }else{
        const now=Date.now()
        if (now - start >= time) {
          fn.apply(this,args)
          start=Date.now()
        }
      }
    }
  }

  const mySetTimeout02=(fn,delay)=>{
    let start=Date.now()
    let rafId=null
    function check(){
      if (Date.now() - start >= delay) {
        fn()
      }else{
        rafId=requestAnimationFrame(check)
      }
    }
    rafId=requestAnimationFrame(check)
    return ()=>cancelAnimationFrame(rafId)
  }

  const mySetInterval02=(fn,interval)=>{
    let start=Date.now()
    let rafId=null
    function loop(){
      if (Date.now() - start >= interval) {
        start+=interval
        fn()
        rafId=requestAnimationFrame(loop)
      }else{
        rafId=requestAnimationFrame(loop)
      }
    }
    rafId=requestAnimationFrame(loop)
    return ()=>cancelAnimationFrame(rafId)
  }

  const sleep=(time)=>{
    const p=new Promise((resolve,reject)=>{
      setTimeout(()=>{
        resolve()
      },time)
    })
    return p
  }

  const testSleep=async ()=>{
    console.log('等待5s')
    await sleep(5000)
    console.log('已经等待了5s')

    console.log('等待2s')
    await sleep(2000)
    console.log('已经等待了2s')
  }

  const deepClone=(obj)=>{
    if (obj === null || typeof obj !== 'object') {
      return obj
    }else{
      const objOrArr=Array.isArray(obj)?[]:{}
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const data=deepClone(obj[key])
          objOrArr[key]=data
        }
      }
      return objOrArr
    }
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

  const reverseStr=(str)=>{
    const strArr=str.split('')
    const reservedStrArr=strArr.reverse()
    return reservedStrArr.join('')
  }

  const getWordNumInStr=(str)=>{
    const strArr=str.split('')
    const obj={}
    strArr.forEach((item,i)=>{
      if (obj.hasOwnProperty(item)) {
        obj[item]+=1
      }else{
        obj[item]=1
      }
    })
    console.log("obj", obj);
    let maxWord=''
    let maxNum=-Infinity
    for (const key in obj) {
      if (obj[key] > maxNum) {
        maxNum=obj[key]
        maxWord=key
      }
    }
    return {
      maxWord:maxWord,
      maxNum:maxNum
    }
  }


  return {
    initMachineTestQuestionsCopy01,
  }
}
