export function drawVariablePointSizes(){
 const canvas = document.getElementById("glCanvas");
 const gl=canvas.getContext('webgl')

  //顶点着色器
  const vertexShaderSource=`
    attribute vec2 a_position;
    uniform float u_pointSize;
      void main() {
      gl_PointSize=u_pointSize;
      gl_Position=vec4(a_position,0.0,1.0);
    }`
  //片元着色器
  const fragmentShaderSource=`
  void main() {
    gl_FragColor=vec4(1.0,0.0,1.0,1.0);
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
  const u_pointSize=gl.getUniformLocation(program,"u_pointSize");

  //开启点位
  gl.enableVertexAttribArray(a_position);

  //顶点数据
  const vertexData=new Float32Array([
    -.5,-.5, .5,.5, .7,.9
  ]);

  //创建buffer
  const vertexBuffer=gl.createBuffer()

  //绑定
  gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);

  //灌入数据
  gl.bufferData(gl.ARRAY_BUFFER,vertexData,gl.STATIC_DRAW);
  gl.vertexAttribPointer(a_position,2,gl.FLOAT,false, 0, 0);

  gl.uniform1f(u_pointSize,25.0);

  //绘制
  //从第0个位置，绘制1个点
  gl.drawArrays(gl.POINT,0,3)
}
