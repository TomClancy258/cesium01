import airplane01Jpg from "@/assets/img/airplane/jpg/airplane01.jpg"
export function drawTexture(){
 const canvas = document.getElementById("glCanvas");
 const gl=canvas.getContext('webgl')

  //顶点着色器
  const vertexShaderSource=`
    attribute vec2 a_position;
    attribute float a_pointSize;
    attribute vec4 a_color;
    attribute vec2 a_texCoord;
    varying vec4 v_color;
    varying vec2 v_texCoord;
      void main() {
      gl_PointSize=a_pointSize;
      gl_Position=vec4(a_position,0.0,1.0);
      v_color=a_color;
      v_texCoord=a_texCoord;
    }`
  //片元着色器
  const fragmentShaderSource=`
  precision mediump float;
  varying vec4 v_color;
  varying vec2 v_texCoord;
  uniform sampler2D u_texture;
  void main() {
    // gl_FragColor=v_color;
    gl_FragColor=texture2D(u_texture,v_texCoord);
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
  const a_texCoord=gl.getAttribLocation(program,"a_texCoord");

  //开启点位
  gl.enableVertexAttribArray(a_position);
  gl.enableVertexAttribArray(a_pointSize);
  gl.enableVertexAttribArray(a_color);
  gl.enableVertexAttribArray(a_texCoord);

  //顶点数据
  const vertexData=new Float32Array([
    /*坐标(x,y)*/-.5,-.5, /*点大小(1个)*/10.0, /*颜色rbga(4个)*/1.0,.0,.0,1.0, /*texCoord*/.0,.0,//index[0]
    .0,-.5, 15.0, 0.0,1.0,.0,1.0, .5,.0,//index[1]
    .5,-.5, 20.0, 0.0,.0,1.0,1.0, 1.0,.0,//index[2]
    .5,.5, 20.0, 0.0,.0,1.0,1.0, 1.0,1.0,//index[3]
    .0,.5, 20.0, 0.0,1.0,.0,1.0, .5,1.0,//index[4]
    -.5,.5, 20.0, 1.0,.0,.0,1.0, .0,1.0//index[5]
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
    9*Float32Array.BYTES_PER_ELEMENT,//stride：每个点的信息所占的比特大小Bytes,每个点信息[x,y,pointSize]
    0//offset：每个点的信息，从第几个比特开始数
  );
  gl.vertexAttribPointer(a_pointSize, 1, gl.FLOAT, false, 9*Float32Array.BYTES_PER_ELEMENT, 2*Float32Array.BYTES_PER_ELEMENT);
  gl.vertexAttribPointer(a_color, 4, gl.FLOAT, false, 9*Float32Array.BYTES_PER_ELEMENT, 3*Float32Array.BYTES_PER_ELEMENT);
  gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 9*Float32Array.BYTES_PER_ELEMENT, 7*Float32Array.BYTES_PER_ELEMENT);

  //纹理
  const texture = gl.createTexture();

  const image = new Image();
  image.src = airplane01Jpg
  image.onload = () => {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)

    const u_texture = gl.getUniformLocation(program, 'u_texture')
    gl.uniform1i(u_texture, 0)

    gl.drawArrays(gl.TRIANGLE_FAN,0,6)//0→1→2, 0→2→3, 0→3→4（共享顶点0） 可绘制圆
  }



  //绘制 webgl中的基本形状：点Point，线Line，三角形Triangle
  //从第0个位置，绘制6个点
  // gl.drawArrays(gl.POINTS,0,6)//0->1->2,3->4->5（2个独立三角形） 不连续三角形
  // gl.drawArrays(gl.TRIANGLES,0,6)//0->1->2,3->4->5（2个独立三角形） 不连续三角形
  // gl.drawArrays(gl.TRIANGLE_STRIP,0,6) //0→1→2, 1→2→3, 2→3→4（共享边）连续三角形（带状）

  function render(){
    gl.drawArrays(gl.TRIANGLE_FAN,0,6)//0→1→2, 0→2→3, 0→3→4（共享顶点0） 可绘制圆
    requestAnimationFrame(render)
  }
  // requestAnimationFrame(render)
}
