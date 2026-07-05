import * as THREE from 'three'

const RAW_POINTS: [number, number, number][] = [
  [22, 0.08, 10],
  [16, 0.08, 7.5],
  [9, 0.08, 2.5],
  [4.5, 0.08, -3],
  [4, 0.08, -7],
  [5, 0.08, -3],
  [5.5, 0.08, 2],
  [5.2, 0.08, 5.5],
  [5, 0.08, 6.5],
  [10, 0.08, 8.5],
]

export const forkliftPath = new THREE.CatmullRomCurve3(
  RAW_POINTS.map(p => new THREE.Vector3(p[0], p[1], p[2])),
  true,
  'catmullrom',
  0.5
)

export const TOTAL_LENGTH = forkliftPath.getLength()

function findClosestU(curve: THREE.CatmullRomCurve3, target: THREE.Vector3, samples = 200): number {
  let best = 0
  let bestDist = Infinity
  for (let i = 0; i <= samples; i++) {
    const u = i / samples
    const p = curve.getPointAt(u)
    const d = p.distanceTo(target)
    if (d < bestDist) { bestDist = d; best = u }
  }
  return best
}

const rackTarget = new THREE.Vector3(4, 0.08, -7)
const dockTarget = new THREE.Vector3(5, 0.08, 6.5)

export const RACK_U = findClosestU(forkliftPath, rackTarget)
export const DOCK_U = findClosestU(forkliftPath, dockTarget)
export const DRIVE_SPEED = 0.025
export const PAUSE_DURATION = 2
export const FORK_LERP_SPEED = 3
export const FORK_HIGH = 0.42
export const FORK_LOW = 0.04
