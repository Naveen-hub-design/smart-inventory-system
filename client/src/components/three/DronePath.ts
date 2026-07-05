import * as THREE from 'three'

export const RACK_LABELS = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4', 'D1', 'D2', 'D3', 'D4', 'E1', 'E2', 'E3', 'E4', 'F1', 'F2', 'F3', 'F4']

export const RACK_POS: [number, number][] = [
  [-16, -8], [-12, -8], [-8, -8], [-4, -8],
  [-16, -2], [-12, -2], [-8, -2], [-4, -2],
  [-16, 4],  [-12, 4],  [-8, 4],  [-4, 4],
  [4, -8],   [8, -8],   [12, -8], [16, -8],
  [4, -2],   [8, -2],   [12, -2], [16, -2],
  [4, 4],    [8, 4],    [12, 4],  [16, 4],
]

export interface ScanZone { x: number; z: number; rackIndices: number[] }

export const SCAN_ZONES: ScanZone[] = [
  { x: -10, z: 4,  rackIndices: [8, 9, 10, 11] },
  { x: -10, z: -2, rackIndices: [4, 5, 6, 7] },
  { x: -10, z: -8, rackIndices: [0, 1, 2, 3] },
  { x: 10,  z: -8, rackIndices: [12, 13, 14, 15] },
  { x: 10,  z: -2, rackIndices: [16, 17, 18, 19] },
  { x: 10,  z: 4,  rackIndices: [20, 21, 22, 23] },
]

export const rackStock: { level: number; target: number }[] = Array.from({ length: 24 }, () => {
  const lvl = 0.1 + Math.random() * 0.9
  return { level: lvl, target: lvl }
})

const PATH_PTS: [number, number, number][] = [
  [20, 0.08, -2],
  [20, 3.5, -2],
  [14, 3.5, -2],
  [4, 3.5, 0],
  [-10, 3.5, 4],
  [-10, 3.5, -2],
  [-10, 3.5, -8],
  [0, 3.5, -8],
  [10, 3.5, -8],
  [10, 3.5, -2],
  [10, 3.5, 4],
  [4, 3.5, 0],
  [14, 3.5, -2],
  [20, 3.5, -2],
  [20, 0.08, -2],
]

const _path = new THREE.CatmullRomCurve3(
  PATH_PTS.map(p => new THREE.Vector3(p[0], p[1], p[2])),
  true,
  'catmullrom',
  0.5,
)

export const dronePath = _path

function findClosestU(curve: THREE.CatmullRomCurve3, target: THREE.Vector3, samples = 300): number {
  let best = 0; let bestDist = Infinity
  for (let i = 0; i <= samples; i++) {
    const u = i / samples; const p = curve.getPointAt(u); const d = p.distanceTo(target)
    if (d < bestDist) { bestDist = d; best = u }
  }
  return best
}

const v = new THREE.Vector3()
export const ZONE_U: number[] = SCAN_ZONES.map(z => findClosestU(_path, v.set(z.x, 3.5, z.z)))
export const DRONE_SPEED = 0.04
export const SCAN_DURATION = 2
export const CHARGE_DURATION = 4
export const DOCK_U = findClosestU(_path, new THREE.Vector3(20, 0.08, -2))

export const dronePos = new THREE.Vector3(20, 0.08, -2)
export const droneScanState = {
  zoneIndex: -1,
  scanProgress: 0,
  isScanning: false,
  rackIndex: -1,
}
