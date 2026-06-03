export function useMyPromise() {
  const initMyPromise = () => {
    // testMyPromise02()
    // testMyPromise02All()
    // testPromise01()
    // testPromise02()
    // testPromiseAll()
    testPromiseCatch()
  }
  const testPromiseCatch=()=>{
    const p1=new Promise((resolve,reject)=>{
      // resolve('成功1')
      reject('成功1')
    })
    const p2=p1.catch((val)=>{
      console.log("失败时才调用", val);
      // return '已改正'
    })
    const p3=p1.then(null,(val)=>{
      console.log("p3失败时才调用", val);
      return '已改正'
    })
    console.log("p2", p2);
  }


  const PENDING = 'pending'
  const FULFILLED = 'fulfilled'
  const REJECTED = 'rejected'

  class MyPromise {
    state = PENDING
    result = null

    fulfilledCbs = []
    rejectedCbs = []

    constructor(executor) {
      try {
        executor(this.resolve.bind(this), this.reject.bind(this))
      } catch (err) {
        this.reject(err)
      }
    }

    resolve(val) {
      if (this.state == PENDING) {
        this.result = val
        this.state = FULFILLED
        while (this.fulfilledCbs.length > 0) {
          this.fulfilledCbs.shift()(this.state)
        }
      }
    }

    reject(val) {
      if (this.state === PENDING) {
        this.result = val
        this.state = REJECTED
        while (this.rejectedCbs.length > 0) {
          this.rejectedCbs.shift()(this.state)
        }
      }
    }

    then(onFulfilled, onRejected) {
      onFulfilled =
        typeof onFulfilled === 'function'
          ? onFulfilled
          : (value) => {
              return value
            }
      onRejected =
        typeof onRejected === 'function'
          ? onRejected
          : (reason) => {
              throw reason
            }
      if (this.state == FULFILLED) {
        onFulfilled(this.result)
      } else if (this.state == REJECTED) {
        onRejected(this.result)
      } else if (this.state == PENDING) {
        this.fulfilledCbs.push(onFulfilled)
        this.rejectedCbs.push(onRejected)
      }
    }
  }

  const testPromise01 = () => {
    const promise = new Promise((resolve, reject) => {
      resolve('aaaaa')
      // reject('bbb')
      // throw 'aaa'
    })
    console.log('promise', promise)
    const p2 = promise.then(
      (val) => {
        return new Promise((resolve, reject) => {
          resolve('b')
          reject('c')
        })
        // console.log("成功val", val);
        // return '成功了1'
      },
      (fail) => {
        console.log('失败fail', fail)
        return '失败已经解决'
      },
    )
    console.log('p2', p2)
    //   .then('qqq','ww')
    // promise //如果写了promise，则val为最上面resolve('aaaaa')里的五个a
    //若不写，则val来自上个then里的return '成功了1'
    //   .then((val)=>{
    //   console.log("成功val2", val);
    // },(fail)=>{
    //   console.log("失败fail2", fail);
    // })
  }

  class MyPromise02 {
    state = PENDING
    result = null

    fulfilledCbs = []
    rejectedCbs = []

    constructor(executor) {
      try {
        executor(this.resolve.bind(this), this.reject.bind(this))
      } catch (err) {
        this.reject(err)
      }
    }

    resolve(val) {
      if (this.state === PENDING) {
        this.result = val
        this.state = FULFILLED
        while (this.fulfilledCbs.length > 0) {
          this.fulfilledCbs.shift()(this.result)
        }
      }
    }

    reject(val) {
      if (this.state === PENDING) {
        this.result = val
        this.state = REJECTED
        while (this.rejectedCbs.length > 0) {
          this.rejectedCbs.shift()(this.result)
        }
      }
    }

    /*
    接收俩回调
    若当前promise对象为成功状态，则执行第一个回调onFulfilled
    若当前promise对象为失败状态，则执行第二个回调onRejected
    若当前promise对象为成功状态，则暂时保存俩回调

    then必须返回一新的promise对象p，
    该对象p的状态和结果由回调函数onFulfilled或onRejected的返回值x决定
    若返回值x不是promise对象
      新promise【即p】就是成功，它的值为返回值
    若返回值x是promise对象，新promise的状态和值和x相同【但新promise!==x】
      返回值为成功，则新promise为成功
      返回值为失败，则新promise为失败
     */

    //其实全部方法里，都可以把字面量【即非promise类型】看成成功状态的promise类型
    then(onFulfilled, onRejected) {
      onFulfilled =
        typeof onFulfilled === 'function'
          ? onFulfilled
          : (val) => {
              return val
            }
      onRejected =
        typeof onRejected === 'function'
          ? onRejected
          : (reason) => {
              throw reason
            }

      const p = new MyPromise02((resolve, reject) => {
        const settlePromise = (cb) => {
          queueMicrotask(()=>{
            try {
              const x = cb(this.result)
              //看testMyPromise02里myPromise02.then里的第一个实参里return的新MyPromise02对象：
              // x为MyPromise02，其state为FULFILLED result为'成功p2'
              if (x === p) {
                throw new Error('不能返回p自身')
              }
              // console.log('x', x)
              if (x instanceof MyPromise02) {
                //x满足
                x.then(resolve, reject) //进入上面的then函数里，实参resolve,reject，形参onFulfilled,onRejected
                //又创建内层的MyPromise02类型的p
                //因为x为成功（state为FULFILLED result为'成功p2'），所以执行if (this.state === FULFILLED) {里的代码，
                //内层的let x=onFulfilled(this.result【x的result】)即执行上面传进来的实参resolve
                //相当于执行外层传进来的resolve('成功p2')，即外层为成功，此时x=onFulfilled(this.result)即resolve('成功p2')返回undefined，因为resolve函数里没有return
                //所以执行下面else{resolve(undefined)【这个为x里创建的p的resolve，不过x执行它的resolve不影响最外层】}
              } else {
                resolve(x) //递归最后会走到这里，所以递归会结束
              }
            } catch (err) {
              reject(err)
            }

          })
        }
        if (this.state === FULFILLED) {
          settlePromise(onFulfilled)
        } else if (this.state === REJECTED) {
          settlePromise(onRejected)
        } else if (this.state === PENDING) {
          this.fulfilledCbs.push(settlePromise.bind(this, onFulfilled))
          this.rejectedCbs.push(settlePromise.bind(this, onRejected))
        }
      })

      return p
    }

    /*
    all为一静态方法，参数是一数组
    可以传非promise类型，eg：Promise.all(['str1', p1, p3, 'str2'])或空数组，但仍视为成功
    必定返回一新promise
    参数数组里，只有所有promise对象都成功，返回的新promise才是成功状态
    参数数组里，只要有一promise对象为失败，则返回的新promise是失败状态
     */
    static all(arr) {
      const results = []
      let num=0
      const p = new MyPromise02((resolve, reject) => {
        if (arr.length === 0) {
          resolve([])
          return
        }
        for (const [index,item] of arr.entries()) {
          if (item instanceof MyPromise02) {
            item.then((itemResult)=>{
              results[index]=itemResult
              num++
              if (num === arr.length) {
                resolve(results)
              }
            },reject)
          } else {
            results[index]=item
            num++
            if (num === arr.length) {
              resolve(results)
            }
          }
        }
      })
      return p
    }

    /*
    静态方法，参数为一数组
    必定返回一新promise
    数组中的字面量【即非promise类型】，被视为成功的promise
    新promise的状态和结果，和参数数组中最快得到结果的相同
     */
    static race(arr){
      return new MyPromise02((resolve,reject)=>{
        arr.forEach((item,i)=>{
          if (item instanceof MyPromise02) {
            item.then(resolve,reject)
          }else{
            queueMicrotask(()=>{
              resolve(item)
            })
          }
        })
      })
    }

    /*
    必定返回一新promise对
    若参数是一promise对象，则原封不动地返回该对象
    若参数为非promise对象，则返回一成功状态的新promise对象
     */
    static resolve(val){
      if (val instanceof MyPromise02) {
        return val
      }else{
        return new MyPromise02((resolve,reject)=>{
          resolve(val)
        })
      }
    }

    /*
    必定返回一新promise对象
    参数不管是啥，都会被包裹为失败的一新promise对象
     */
    static reject(val){
      return new MyPromise02((resolve,reject)=>{
        reject(val)
      })
    }

    /*
    promise.finally (回调函数).then ( ... )
    1. 执行的顺序
    2. 最终的结果
    回调成功 --> then (promise 的结果)
    回调失败 --> then (回调的失败)
     */
    /*
    1.finally的实参函数（即回调函数）是return 成功promise【回调函数返回的非promise类型也会自动封装为成功的promise】，
    则finally返回调用finally的promise
    准确说，则finally 返回一个新的 promise，但它的状态和值与调用 finally 的那个 promise 相同（成功仍是 '成功'，失败仍是 '失败'）。
     Promise.resolve('成功').finally(() => '成功-成功').then(console.log, null) //'成功'
     Promise.reject('失败').finally(() => '失败-成功').then(null, console.log) //'失败'
     Promise.resolve('成功').finally(() => Promise.resolve('成功-成功')).then(console.log, null)
     Promise.reject('失败').finally(() => Promise.resolve('失败-成功')).then(null, console.log)

    2.finally的实参函数（即回调函数）是return 失败promise【同理，会把throw的字符串封装成失败的promise】，
    则finally返回该实参函数return的失败promise,
    准确说，则finally 返回一个新的、失败的 promise，失败原因来自回调（throw 的内容，或 reject 的原因）。
     Promise.resolve('成功').finally(() => {throw '成功-失败'}).then(null, console.log) //'成功-失败'
     Promise.reject('失败').finally(() => {throw '失败-失败'}).then(null, console.log)
     Promise.resolve('成功').finally(() => Promise.reject('成功-失败')).then(null, console.log)
     Promise.reject('失败').finally(() => Promise.reject('失败-失败')).then(null, console.log)
     */
    finally(callback){
      return this.then(callback,callback).then(()=>{return this},(error)=>{throw error})
    }

    finally02(onFinally) {
      return this.then(
        (value) =>
          MyPromise02.resolve(onFinally()).then(() => value),
        (reason) =>
          MyPromise02.resolve(onFinally()).then(() => {
            throw reason
          }),
      )
    }

    catch(callback){
      return this.then(null,callback)
    }
  }

  const testMyPromise02 = () => {
    const myPromise02 = new MyPromise02((resolve, reject) => {
      // setTimeout(()=>{
      resolve('success')
      // },3000)
    })
    const p3 = myPromise02.then(
      (val) => {
        return new MyPromise02((resolve, reject) => {
          resolve('成功p2')
        })
      },
      (val) => {},
    ).then((val)=>{
      console.log("val", val);
      return 'aaaaaaa'
    },()=>{

    }).then((val)=>{
      console.log("val5", val);
    },()=>{

    })
    // const p3 = myPromise02.then(
    //   (val) => {
    //     return new MyPromise02((resolve, reject) => {
    //       resolve('成功p2')
    //     })
    //   },
    //   (val) => {},
    // )
    // setTimeout(() => {
    //   console.log('p3', p3)
    // }, 2000)
  }

  const testPromise02 = () => {
    const promise = new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve('aaaaa')
      }, 3000)
    })
    const p2 = promise.then(
      (val) => {
        console.log('成功val', val)
        // return '成功了1'
      },
      (fail) => {
        console.log('失败fail', fail)
        return '失败已经解决'
      },
    )
    promise.then(
      (val) => {
        console.log('成功val2', val)
        return '成功了1'
      },
      (fail) => {
        console.log('失败fail', fail)
        return '失败已经解决'
      },
    )
    console.log('p2', p2)
  }

  const testPromiseAll = () => {
    const p1 = Promise.resolve('p1成功')
    const p2 = Promise.resolve('p2成功')
    const p3 = Promise.reject('p3失败')
    // const pAll = Promise.all(['str1', p1, p3, 'str2'])
    const pAll = Promise.all([])
    console.log('pAll', pAll)
  }
  const testMyPromise02All = () => {
    const p1 = new MyPromise02((resolve,reject)=>{
      resolve('p1成功')
    })
    const p2 = new MyPromise02((resolve,reject)=>{
      resolve('p2成功')
    })
    const pAll = MyPromise02.all(['str1', p1, p2, 'str2'])
    console.log('pAll', pAll)
  }

  return {
    initMyPromise,
  }
}
