export function useMachineTestQuestions08To14() {
  const initMachineTestQuestions08To14 = () => {
    const stuA={
      name:'frank',
      age:18
    }
    // const stuB=superficialClone(stuA)

    // testDeepClone()

    // reverseStr('我是谁')

    // getWordNumInStr('11223abcabc')

    testClass('')
  }

  //8.浅拷贝
  const superficialClone=(obj)=>{
    const obj2={...obj}
    console.log("obj2", obj2);
    return obj2
  }

  //9.深拷贝
  const deepClone=(obj)=>{
    //typeof 函数名称 为 'function'
    if(obj===null || typeof obj!=="object"){
      return obj
    } else{
      const res=Array.isArray(obj)?[]:{}
      for(const key in obj){
        if(obj.hasOwnProperty(key)){
          res[key]=deepClone(obj[key])
        }
      }
      return res
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
    const strArr=str.split("")
    const reverseStr=strArr.reverse()
    const reversedStr=reverseStr.join("")
    console.log("reversedStr", reversedStr);
    return reversedStr
  }

  const getWordNumInStr=(str)=>{
    const strArr=str.split("")
    const obj={}
    for(const item of strArr){
      if (obj[item] === undefined) {
        obj[item] = 1;
      }else{
        obj[item]=obj[item] + 1
      }
    }
    console.log("obj", obj);
    return obj
  }

  const testClass=()=>{
    class Person{
      static species='human'
      static totalCount=0
      static addPerson(){
        this.totalCount++
      }
      constructor(name,age) {
        this.name = name;
        this.age = age;
        Person.addPerson()
      }
      getName(){
        return this.name;
      }
      setName(name){
        this.name = name;
      }
    }

    class Stu extends Person{
      // static
      constructor(name,age,score) {
        super(name,age)
        this.score=score;
      }
      getScore(){
        return this.score
      }
      setScore(score){
        this.score = score;
      }
    }

    const p1=new Person('frank',18)
    const stu1=new Stu('tom',22,100)
    console.log("p1", p1);
    console.log("stu1", stu1);
    stu1.setScore(88)
    const score=stu1.getScore()
    console.log("score", score);
    const totalPerson=Stu.totalCount
    console.log("totalPerson", totalPerson)
  }

  return {
    initMachineTestQuestions08To14,
  }
}
