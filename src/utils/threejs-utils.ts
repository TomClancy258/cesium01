import { float, Fn, hash, TWO_PI, uint, vec3 } from 'three/tsl'

export const randomSphericalPosition = Fn(([ seed = uint(0), radius = float(1) ]) =>
{
  const u = hash(seed)
  const v = hash(seed.add(123).mul(2))
  const theta = u.mul(TWO_PI)
  const phi = v.remap(0, 1, -1, 1).acos()
  const sinPhi = phi.sin()

  return vec3(
    theta.sin().mul(sinPhi),
    phi.cos(),
    theta.cos().mul(sinPhi)
  ).mul(radius)
}, { seed: 'uint', radius: 'float', return: 'vec3' })
