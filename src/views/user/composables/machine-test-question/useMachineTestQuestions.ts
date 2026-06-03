export function useMachineTestQuestions() {
  const initMachineTestQuestions = () => {
    // promiseNumber()
    // getPromiseSum(Promise.resolve(1),Promise.resolve(2))

    // mySetTimeout(2000,promiseNumber)
    // mySetTimeout02(2000,promiseNumber)

    // mySetInterval(2000,promiseNumber)
    // mySetInterval02(2000,promiseNumber)

    // isChildTree([3, 4, 5, 1, 2, 9, 10, null, 7], [4, 1, 2, null, 7])
    // isChildTree02([3, 4, 5, 1, 2, 9, 10, null, 7], [4, 1, 2, null, 7])

    // simplifyPath('D:\\word\\..\\..\\\\.\\\\.\\\\\\....\\..简历01\\claude01-02.png')
    //  simplifyPath02('D:\\word\\..\\..\\\\.\\\\.\\\\\\....\\..简历01\\claude01-02.png')

    // lockAndWait()
    // lockAndWait02()
  }

  const promiseNumber = () => {
    // 有两个泛型 Promise 类型：
    // 要求：
    // 写一个函数 sum，接收两个参数
    // 第一个参数类型：Promise1<number>
    // 第二个参数类型：Promise2<number>
    // 函数内部把它们变成 number 类型
    // 最后 return 两个数字之和
    const getSum = async (p1: Promise<number>, p2: Promise<number>): Promise<number> => {
      // 不加 await,sum="[object Promise][object Promise]",因为p1和p2是Promise 对象
      //await 的作用只有一个：从 Promise 里把里面包裹的 值 拿出来！
      const sum = (await p1) + (await p2)
      console.log('sum', sum)
      return sum
    }
    getSum(Promise.resolve(1), Promise.resolve(2))
  }

  const mySetTimeout = (delay, fn) => {
    const start = Date.now()
    const check = () => {
      if (Date.now() - start < delay) {
        requestAnimationFrame(check)
      } else {
        fn()
      }
    }
    requestAnimationFrame(check)
  }

  const mySetInterval = (interval, fn) => {
    let start = Date.now()

    function loop() {
      if (Date.now() - start < interval) {
        requestAnimationFrame(loop)
      } else {
        start = Date.now()
        fn()
        requestAnimationFrame(loop)
      }
    }

    requestAnimationFrame(loop)
  }

  const isChildTree = (rootArr, subArr) => {
    const buildTree = (arr, i) => {
      if (arr[i] === null) return null
      else if (i >= arr.length) return null
      else
        return {
          val: arr[i],
          left: buildTree(arr, 2 * i + 1),
          right: buildTree(arr, 2 * i + 2),
        }
    }

    const root = buildTree(rootArr, 0)
    const sub = buildTree(subArr, 0)

    console.log('root', root)
    console.log('sub', sub)

    const isSame = (t1, t2) => {
      if (t1 === null && t2 === null) return true // 都空 → 相等
      if (!t1 || !t2) return false // 一个空一个不空 → 不等
      if (t1.val === t2.val) {
        return isSame(t1.left, t2.left) && isSame(t1.right, t2.right) //递归
      } else {
        return false // 一旦走到这里，直接结束！不会再往下遍历！
      }
    }

    const dfs = (t) => {
      // 1. 走到空了，没找到，返回false
      if (!t) return false

      // 2. 看看当前节点是不是子树的根
      // 是 → 直接返回 true
      if (isSame(t, sub)) return true

      // 3. 不是 → 去左边找 或者 去右边找
      // 左边找到 或 右边找到 → 都行
      return dfs(t.left) || dfs(t.right)
    }

    const isChild = dfs(root)
    console.log('isChild', isChild)
    return isChild
    /*
    比相同、判全等 → 用 &&

    都空 → true
    一个空 → false
    值相等 + 左 && 右
  */

    /*
      找东西、存在性 → 用 ||

      空 → false
      找到 → true
      否则 左 || 右
    */

    /*
    // 固定骨架，所有二叉树查找题通用
    function dfs(当前节点){
      // 1. 边界出口：空节点直接返回结果（必写，防止无限递归+报错）
      if(!当前节点) return false

      // 2. 本位判断：当前节点满足条件就直接返回true
      if(当前节点符合要求) return true

      // 3. 往左右孩子搜：左边搜到 或者 右边搜到 都算成
      return dfs(左孩子) || dfs(右孩子)
    }
    */
  }

  const simplifyPath = (path) => {
    console.log('path', path)
    const paths = path.split('\\')
    console.log('paths', paths)
    const simplifiedPaths = []
    for (const item of paths) {
      if (item.includes(':')) {
        simplifiedPaths.push(item)
      } else if (item === '..') {
        if (simplifiedPaths.length > 1) {
          simplifiedPaths.pop()
        }
      } else if (item === '' || item === '.') {
        continue
      } else {
        simplifiedPaths.push(item)
      }
    }
    const simplifiedPath = simplifiedPaths.join('\\')
    console.log('simplifiedPath', simplifiedPath)
    return simplifiedPath
  }

  const lockAndWait = () => {
    let tasks = []
    let locked = false

    function lock() {
      locked = true
      console.log('上锁了')
    }

    function unlock() {
      locked = false // 打开收银台大门
      // 遍历队伍里所有小票
      for (const r of tasks) {
        r() // 拿着小票，放行对应的人（唤醒卡住的代码）
      }
      tasks = [] // 队伍清空
      console.log('解锁了')
    }

    /**
     * 把代码当成超市收银排队
     * 1.locked = 收银台开关
     *    true：关门暂停收银（上锁）
     *    false：开门正常收银（解锁）
     * 2.tasks = 排队人群
     * 3.wait() = 顾客走到收银口，发现关门就站队伍里等
     * 4.resolve = 每个人手里的放行小票
     * 5.unlock() = 开门，挨个喊人拿小票走人
     */
    function wait() {
      if (locked) {
        // 门关着，进队伍排队
        // resolve就是专属放行小票
        return new Promise((resolve) => tasks.push(resolve))
      } else {
        // 门开着，直接走，不用排队
        return Promise.resolve()
      }
    }

    async function run() {
      console.log('开始，未上锁')
      lock() // 第一步：关门上锁

      // 第一处等待
      await wait()
      // 门关着 → 生成小票1塞进队伍 → 代码卡在这不动
      console.log('执行1')

      // 第二处等待
      await wait()
      // 门关着 → 生成小票2塞进队伍 → 代码卡在这不动
      console.log('执行2')
    }

    run()

    setTimeout(() => {
      unlock()
    }, 3000)
  }

  const getPromiseSum = async (p1, p2) => {
    const sum = (await p1) + (await p2)
    console.log('sum', sum)
    return sum
  }

  const mySetTimeout02 = (delay, cb) => {
    const start = Date.now()

    function check() {
      if (Date.now() - start < delay) {
        requestAnimationFrame(check)
      } else {
        cb()
      }
    }

    requestAnimationFrame(check)
  }

  const mySetInterval02 = (interval, cb) => {
    let start = Date.now()

    function loop() {
      if (Date.now() - start < interval) {
        requestAnimationFrame(loop)
      } else {
        start = Date.now()
        cb()
        requestAnimationFrame(loop)
      }
    }

    requestAnimationFrame(loop)
  }

  const isChildTree02 = (rootArr, subArr) => {
    function build(arr, i) {
     if (i >= arr.length) return null
     else  if (arr[i] === null) return null
      else
        return {
          val: arr[i],
          left: build(arr, 2 * i + 1),
          right: build(arr, 2 * i + 2),
        }
    }

    const root = build(rootArr, 0)
    const sub = build(subArr, 0)
    console.log('root', root)
    console.log('sub', sub)

    function isSame(t1, t2) {
      if (t1 === null && t2 === null) {
        return true
      } else if (t1 === null || t2 === null) {
        return false //一个空一个不空 = 不相等
      }else if(t1.val !== t2.val) {return false}
      else if(t1.val === t2.val) {
        return isSame(t1.left, t1.left)&&isSame(t1.right, t2.right)
      }
    }

    function dsf(t1) {
      if (t1 === null) {
        return false
      }else if(isSame(t1, sub)) {
        return true
      }else{
        return dsf(t1.left)||dsf(t1.right)
      }
    }

    const isChildTree=dsf(root)
    console.log("isChildTree", isChildTree);
  }

  const simplifyPath02=(path)=>{
    const paths= path.split('\\')
    const simplifiedPaths=[]
    for (const item of paths){
      if (item === '..') {
        //路径必须以 C:\ 或 D:\ 开头，且盘符不能被 .. 删掉,就可以注释下面那个else if判断
        if (simplifiedPaths.length > 1) {
          simplifiedPaths.pop()
        }
        // else if (simplifiedPaths.length === 1) {
        //   if (!simplifiedPaths[0].includes(':')) {
        //     simplifiedPaths.pop()
        //   }
        // }
      } else if (item === '' || item === '.') {
        continue
      }else{
        simplifiedPaths.push(item)
      }
    }
    const simplifiedPathStr=simplifiedPaths.join('\\')
    console.log("simplifiedPathStr", simplifiedPathStr);
  }

  const lockAndWait02=()=>{
    let isLocked=false
    let tasks=[]
    function lock(){
      isLocked=true
      console.log('上锁了')
    }
    function unlock(){
      isLocked=false
      for(const r of tasks){
        r()
      }
      tasks=[]
    }
    function wait(){
      if (isLocked){
        //固定格式 new Promise((resolve, reject) => {})
        //这是手动创建一个 Promise，目的：让代码卡住！
        // 你不调用 resolve()，代码就永远卡在 await 这里,
        // 所以我们把 resolve 放进数组 tasks 里, 等 unlock() 时再拿出来调用
        return new Promise((resolve,reject)=>{
          tasks.push(resolve)
        })
      }else{
        return Promise.resolve()
        //等同于下面
        //return new Promise(resolve => {
        //   resolve() // 立刻执行，不卡住
        //})

      }
    }
    async function run(){
      console.log('开始执行')
      lock()
      await wait()
      console.log('执行1')

      await wait()
      console.log('执行2')
    }
    run()
    setTimeout(()=>{
      unlock()
    },3000)
  }

  return {
    initMachineTestQuestions,
  }
}
