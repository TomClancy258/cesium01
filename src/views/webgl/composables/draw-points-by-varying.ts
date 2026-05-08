export function drawPointsByVarying(){
 const canvas = document.getElementById("glCanvas");
 const gl=canvas.getContext('webgl')

  //顶点着色器
  const vertexShaderSource=`
    attribute vec2 a_position;
    attribute float a_pointSize;
    attribute vec4 a_color;
    varying vec4 v_color; //vertexShader->fragmentShader
      void main() {
      gl_PointSize=a_pointSize;
      gl_Position=vec4(a_position,0.0,1.0);
      v_color=a_color;
    }`
  //片元着色器
  const fragmentShaderSource=`
  precision mediump float;
  varying vec4 v_color;
  void main() {
    gl_FragColor=v_color;
  }`

  //创建着色器
  const vShader=gl.createShader(gl.VERTEX_SHADER)
  const fShader=gl.createShader(gl.FRAGMENT_SHADER)

  //灌入代码
  gl.shaderSource(vShader,vertexShaderSource)
  gl.shaderSource(fShader,fragmentShaderSource)

  //创建program
  const program=gl.createProgram()

  //添加着色器
  gl.attachShader(program,vShader)
  gl.attachShader(program,fShader)

  //编译着色器
  gl.compileShader(vShader)
  gl.compileShader(fShader)

  //链接program
  gl.linkProgram(program)
  gl.useProgram(program)

  //获取变量点位
  const a_position=gl.getAttribLocation(program,"a_position");
  const a_pointSize=gl.getAttribLocation(program,"a_pointSize");
  const a_color=gl.getAttribLocation(program,"a_color");

  //开启点位
  gl.enableVertexAttribArray(a_position);
  gl.enableVertexAttribArray(a_pointSize);
  gl.enableVertexAttribArray(a_color);

  //顶点数据
  const vertexData=new Float32Array([
    -.5,-.5, 10.0, 1.0,.0,.0,1.0,
    .5,.5, 15.0, 0.0,1.0,.0,1.0,
    .7,.9, 20.0, 0.0,.0,1.0,1.0,
  ]);

  //创建buffer
  const vertexBuffer=gl.createBuffer()

  //绑定
  gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);

  //灌入数据
  gl.bufferData(gl.ARRAY_BUFFER,vertexData,gl.STATIC_DRAW);
  gl.vertexAttribPointer(
    a_position,//location：vertexShader里面attribute变量的location
    2,//size：attribute变量的长度（这里是vec2）
    gl.FLOAT,//type：buffer里面数据的类型
    false, //normalized：正交化，true,false,eg:[1,2]=>[1/根号5,2/根号5]，平方和===1
    7*Float32Array.BYTES_PER_ELEMENT,//stride：每个点的信息所占的比特大小Bytes,每个点信息[x,y,pointSize]
    0//offset：每个点的信息，从第几个比特开始数
  );
  gl.vertexAttribPointer(a_pointSize, 1, gl.FLOAT, false, 7*Float32Array.BYTES_PER_ELEMENT, 2*Float32Array.BYTES_PER_ELEMENT);
  gl.vertexAttribPointer(a_color, 4, gl.FLOAT, false, 7*Float32Array.BYTES_PER_ELEMENT, 3*Float32Array.BYTES_PER_ELEMENT);

  //绘制
  //从第0个位置，绘制3个点
  gl.drawArrays(gl.POINTS,0,3)
}
