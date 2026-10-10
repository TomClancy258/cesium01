import {select,toVar, lessThanEqual,assign,fwidth,smoothstep,oneMinus,color, convertToTexture, float, int, max, mix, mx_noise_float, nodeObject, sqrt, texture, TWO_PI, uv, vec2, vec3, vec4, viewportCoordinate, viewportSize, viewportUV } from 'three/tsl'
import * as THREE from 'three/webgpu'
import { voronoi } from './voronoi.js'

export class ShatterNode extends THREE.TempNode
{
    static get type()
    {
        return 'ShatterNode'
    }

    constructor(
        textureNode,
        subdivision,
        seed,
        progress,
        thickness,
        _color,
        colorStrength,
        offsetStrength
    )
    {
        super('vec4')

        this.textureNode = textureNode
        this.subdivision = subdivision
        this.seed = seed
        this.progress = progress
        this.thickness = thickness
        this._color = _color
        this.colorStrength = colorStrength
        this.offsetStrength = offsetStrength
    }

    //renderPipeline.render()  // 首次需要编译时 → setup → analyze → generate → WGSL
  //并不是在constructor执行后立即执行
    setup()
    {
        // Voronoi
      //viewportSize=容器 .three-container 的 clientWidth / clientHeight
        const viewportMaxSide = max(viewportSize.x, viewportSize.y)
        const voronoiUv = viewportCoordinate.div(viewportMaxSide)
        const voronoiColor = voronoi(voronoiUv, this.subdivision, this.seed)

        const aa=max(fwidth(voronoiColor.g),0.002);
      // const edge=float(0.03)
        const edge=this.progress.mul(this.thickness)
        const maskShape=smoothstep(edge.sub(aa),edge.add(aa),voronoiColor.g).oneMinus()

      maskShape.assign(select(edge.lessThanEqual(0.001),float(0),maskShape))

        // return vec4(vec3(maskShape),1)
        // return vec4(voronoiColor.ggg,1)
      // return vec4(mix(this.textureNode.rgb,this._color,maskShape),0.1)

      const goldenRatio = sqrt(5).add(1).div(2)
      const goldenAngle = goldenRatio.mul(TWO_PI)
      const angle = voronoiColor.a.mul(goldenAngle)
      const offset = vec2(angle.cos(), angle.sin()).mul(this.progress)
      const offsetUv = viewportUV.add(offset.mul(this.offsetStrength))

      return mix(texture(this.textureNode,offsetUv),vec4(this._color.mul(this.colorStrength),1.0),maskShape)
    }
}

export const shatter = (
    textureNode,
    subdivision = float(4),
    seed = int(0),
    progress = float(1),
    thickness = float(0.02),
    _color = color(0xff824d),
    colorStrength = float(3),
    offsetStrength = float(0.02)
) => new ShatterNode(
    convertToTexture(textureNode),
    nodeObject(subdivision),
    nodeObject(seed),
    nodeObject(progress),
    nodeObject(thickness),
    nodeObject(_color),
    nodeObject(colorStrength),
    nodeObject(offsetStrength)
)
