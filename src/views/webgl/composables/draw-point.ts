export function drawPoint(){
 const canvas = document.getElementById("glCanvas");
 const gl=canvas.getContext('webgl')

  //顶点着色器
  const vertexShaderSource=`
    void main() {
    gl_PointSize=20.0;
    gl_Position=vec4(0.0,0.0,0.0,1.0);
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

  //绘制
  //从第0个位置，绘制1个点
  gl.drawArrays(gl.POINT,0,1)
}
