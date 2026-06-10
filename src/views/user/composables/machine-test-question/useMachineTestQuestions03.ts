export function useMachineTestQuestions03() {
  const initMachineTestQuestions03 = () => {
    // testNew()
    // textQuick()
    // textBubbleSort()
    // testInsertionSort()
    // testMyEventBusWithArgs()
    // testMyEventBusWithOff()
    // testMyEventBusWithOnce()
    testMyCall()
  }

  const testNew=()=>{
    function Stu(name,age){
      this.name=name
      this.age=age
      // return this
    }
    const _new=function(fn,...args){
      const obj={}
      Object.setPrototypeOf(obj,fn.prototype)
      const result=fn.apply(obj,args)
      return result instanceof Object?result:obj
    }
    const stu1=_new(Stu,'frank',18)
    const stu2=_new(Stu,'tom',20)
    console.log("stu1", stu1);
    console.log("stu2", stu2);

    type A=string
    type B=A
    const x:A='ello'
    const y:B=x
    console.log("y", y);
  }

  const textQuick=()=>{
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
    if (arr.length <= 1) {
      return arr
    }else{
      const midIndex=Math.floor(arr.length/2)
      const mid=arr.splice(midIndex,1)[0]
      const leftArr=[]
      const rightArr=[]
      arr.forEach((item,i)=>{
        if (item > mid) {
          rightArr.push(item)
        }else{
          leftArr.push(item)
        }
      })
      // return quickSort(leftArr).concat(mid,quickSort(rightArr))
      return [...quickSort(leftArr),mid,...quickSort(rightArr)]
    }
  }

  const textBubbleSort=()=>{
    console.log(bubbleSort([5, 2, 9, 1, 5, 6]));  // [1, 2, 5, 5, 6, 9]
    console.log(bubbleSort([9, 7, 3, 1]));         // [1, 3, 7, 9]
    console.log(bubbleSort([-2, 0, -5, 4]));       // [-5, -2, 0, 4]
    console.log(bubbleSort([1, 2, 3, 4]));         // [1, 2, 3, 4]（优化版一轮就退出）
  }

  const bubbleSort=(arr)=>{
    for (let i = 0; i < arr.length; i++) {
      for (let j = 0; j < arr.length - i-1; j++) {
        const temp=arr[j]
        if (arr[j] > arr[j + 1]) {
          arr[j]=arr[j+1]
          arr[j+1]=temp
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
    for (let i = 1; i < arr.length; i++) {
      const temp=arr[i]
      let tempFinalIndex=i
      for (let j = i-1; j >= 0; j--) {
        if (arr[j] > temp) {
          arr[j+1]=arr[j]
          tempFinalIndex=j
        }else{
          break
        }
      }
      arr[tempFinalIndex]=temp
    }
    // return arr
  }

  const testMyEventBusWithArgs=()=>{
    class EventBus{
      constructor() {
        this.obj={}
      }
      $on(eventName,fn){
        if (!this.obj.hasOwnProperty(eventName)) {
          this.obj[eventName]=[]
        }
          this.obj[eventName].push(fn)
      }
      $emit(eventName,...args){
        if (!this.obj.hasOwnProperty(eventName)) {
          return
        }
        const fns=this.obj[eventName]
        fns.forEach((fn,i)=>{
          fn(...args)
        })
      }
    }
    const bus=new EventBus()
    bus.$on('getStuInfo',(name,age)=>{
      console.log('getStuInfo1')
      console.log("name", name);
      console.log("age", age);
    })
    bus.$on('getStuInfo',(name,age)=>{
      console.log('getStuInfo2')
      console.log("name", name);
      console.log("age", age);
    })
    bus.$on('getTeacherInfo',(name,age,height)=>{
      console.log('getTeacherInfo')
      console.log("name", name);
      console.log("age", age);
      console.log("height", height);
    })

    setTimeout(()=>{
      bus.$emit('getStuInfo','frank',20)
    },3000)

    setTimeout(()=>{
      bus.$emit('getTeacherInfo','jack',60,166)
    },5000)
  }

  const testMyEventBusWithOff=()=>{
    class EventBus{
      constructor() {
        this.obj={}
        this.id=0
        //obj={
        //   eventName:{
        //       id1:fn1,
        //       id2:fn2
        //     }
        // }
      }
      $on(eventName,fn){
        if (!this.obj.hasOwnProperty(eventName)) {
          this.obj[eventName]={}
        }
        this.id++
          this.obj[eventName][this.id]=fn
        return this.id
      }
      $emit(eventName,...args){
        if (!this.obj.hasOwnProperty(eventName)) {
          return
        }
        for(const id in this.obj[eventName]){
          this.obj[eventName][id](...args)
        }
      }
      $off(eventName,id){
        if (!this.obj[eventName] || !this.obj[eventName][id]) {
          return
        }
        delete this.obj[eventName][id]
        if (Object.keys(this.obj[eventName]).length === 0) {
          delete this.obj[eventName]
        }
      }
    }
    const bus=new EventBus()
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
    bus.$on('getTeacherInfo',(name,age,height)=>{
      console.log('getTeacherInfo')
      console.log("name", name);
      console.log("age", age);
      console.log("height", height);
    })

    setTimeout(()=>{
      bus.$emit('getStuInfo','frank',20)
    },3000)

    setTimeout(()=>{
      bus.$emit('getTeacherInfo','jack',60,166)
    },5000)
  }

  const testMyEventBusWithOnce=()=>{
    class EventBus{
      constructor() {
        this.obj={}
        this.id=0
        //obj={
        //   eventName:{
        //       id1:{
        //         isOnce:false,
        //         fn:fn
        //       },
        //       id2:{
        //         isOnce:false,
        //         fn:fn
        //       },
        //     }
        // }
      }
      $on(eventName,fn){
        if (!this.obj.hasOwnProperty(eventName)) {
          this.obj[eventName]={}
        }
        this.id++
        this.obj[eventName][this.id]={
          isOnce:false,
          fn:fn
        }
        return this.id
      }
      $once(eventName,fn){
        if (!this.obj.hasOwnProperty(eventName)) {
          this.obj[eventName]={}
        }
        this.id++
        this.obj[eventName][this.id]={
          isOnce:true,
          fn:fn
        }
        return this.id
      }
      $emit(eventName,...args){
        if (!this.obj.hasOwnProperty(eventName)) {
          return
        }
        for(const id in this.obj[eventName]){
          this.obj[eventName][id].fn(...args)
          if (this.obj[eventName][id].isOnce) {
            delete this.obj[eventName][id]
          }
        }
      }
      $off(eventName,id){
        if (!this.obj[eventName] || !this.obj[eventName][id]) {
          return
        }
        delete this.obj[eventName][id]
        if (Object.keys(this.obj[eventName]).length === 0) {
          delete this.obj[eventName]
        }
      }
    }
    const bus=new EventBus()
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
    Function.prototype.myCall01 = function (...args) {
      const obj=args.shift()
      obj.fn=this //this===Stu
      // const r=this(...args) //this===Stu
      const r=obj.fn(...args) //this===Stu，这样时obj来调用的Stu函数，所以Stu里面的this就指向obj
      delete obj.fn
      return r
    }
    Function.prototype.myCall02 = function (obj,...args) {
      // let obj=args.shift()
      if(obj===null||obj===undefined){
        obj=globalThis
      }else{
        obj=Object(obj)
      }
      const fn=Symbol('tempKey')
      obj[fn]=this //this===Stu
      // const r=this(...args) //this===Stu
      const r=obj[fn](...args) //this===Stu，这样时obj来调用的Stu函数，所以Stu里面的this就指向obj
      delete obj[fn]
      return r
    }
    Function.prototype.myApply02 = function (obj,argArr) {
      if(obj===null||obj===undefined){
        obj=globalThis
      }else{
        obj=Object(obj)
      }
      const fn=Symbol('tempKey')
      obj[fn]=this //this===Stu
      // const r=this(...args) //this===Stu
      const r=(argArr===null||argArr===undefined)?obj[fn]():obj[fn](...argArr) //this===Stu，这样时obj来调用的Stu函数，所以Stu里面的this就指向obj
      delete obj[fn]
      return r
    }
    Function.prototype.myBind02 = function (obj,...argsPre) {
      if (obj === null || obj === undefined) {
        obj=globalThis
      }else{
        obj=Object(obj)
      }
      const _this=this
      return function (...argsNext) {
        const fnKey=Symbol('tempKey')
        const args=[...argsPre,...argsNext]
        obj[fnKey]=_this
        const r=obj[fnKey](...args)
        delete obj[fnKey]
        return r
      }
    }
    const obj1={college:'川大'}
    function Stu(name,age){
      this.name=name
      this.age=age
      return true
    }
    // const r=Stu.call(obj1,'tom',18)
    // const r=Stu.myCall02(obj1,'tom',18)

    // const r=Stu.myApply02(obj1,['tom',18])

    // const bindCb=Stu.bind(obj1,'jack',20)
    // const r=bindCb()

    const bindCb=Stu.myBind02(obj1,'tom',18)
    const r=bindCb()

    console.log("obj1", obj1);
    console.log("r", r);
  }

  return {
    initMachineTestQuestions03,
  }
}
