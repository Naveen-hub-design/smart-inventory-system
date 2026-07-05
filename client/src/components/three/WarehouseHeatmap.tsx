import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const TILE_W = 0.35
const TILE_H = 0.12
const TILE_D = 0.2
const GAP = 0.06
const SCALE = 0.07

const sharedTileGeo = new THREE.BoxGeometry(TILE_W, TILE_H, TILE_D)
const sharedFloorGeo = new THREE.PlaneGeometry(3.2, 2.0)
const sharedFloorMat = new THREE.MeshBasicMaterial({ color: '#1a2a3a', transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false })

interface Zone {
  x: number; z: number; color: THREE.Color
  target: THREE.Color; level: number; targetLevel: number
}

const ZONE_COORDS: { x: number; z: number }[] = []
const RACK_POS = [
  [-16, -8], [-12, -8], [-8, -8], [-4, -8],
  [-16, -2], [-12, -2], [-8, -2], [-4, -2],
  [-16, 4],  [-12, 4],  [-8, 4],  [-4, 4],
  [4, -8],   [8, -8],   [12, -8], [16, -8],
  [4, -2],   [8, -2],   [12, -2], [16, -2],
  [4, 4],    [8, 4],    [12, 4],  [16, 4],
]
RACK_POS.forEach(([rx, rz]) => {
  ZONE_COORDS.push({ x: rx * SCALE, z: rz * SCALE })
})

const COLOR_GREEN = new THREE.Color(0x44cc66)
const COLOR_YELLOW = new THREE.Color(0xffcc44)
const COLOR_RED = new THREE.Color(0xff4444)
const COLOR_BLUE = new THREE.Color(0x4488ff)
const COLOR_WHITE = new THREE.Color(0xffffff)
const tmpColor = new THREE.Color()

function levelToColor(level: number, incoming: boolean): THREE.Color {
  if (incoming) return COLOR_BLUE
  if (level > 0.6) return COLOR_GREEN
  if (level > 0.3) return COLOR_YELLOW
  return COLOR_RED
}

export default function WarehouseHeatmap() {
  const zones = useRef<Zone[]>([])
  const changeTimer = useRef(0)

  const refs = useRef<(THREE.Mesh | null)[]>([])

  if (zones.current.length === 0) {
    zones.current = ZONE_COORDS.map((c) => {
      const lvl = 0.3 + Math.random() * 0.7
      const incoming = Math.random() < 0.08
      return {
        x: c.x, z: c.z,
        color: levelToColor(lvl, incoming).clone(),
        target: levelToColor(lvl, incoming).clone(),
        level: lvl, targetLevel: lvl,
      }
    })
  }

  useFrame((state, delta) => {
    changeTimer.current += delta
    if (changeTimer.current > 3 + Math.random() * 2) {
      changeTimer.current = 0
      zones.current.forEach((z) => {
        z.targetLevel = Math.max(0.05, Math.min(1, z.level + (Math.random() - 0.5) * 0.3))
        const incoming = Math.random() < 0.05
        z.target.copy(levelToColor(z.targetLevel, incoming))
      })
    }

    zones.current.forEach((z, i) => {
      z.level += (z.targetLevel - z.level) * delta * 2
      tmpColor.copy(z.color).lerp(z.target, delta * 2)
      z.color.copy(tmpColor)

      const mesh = refs.current[i]
      if (mesh) {
        ;(mesh.material as THREE.MeshBasicMaterial).color.copy(z.color)
        const glow = Math.sin(state.clock.elapsedTime * 0.5 + i * 1.3) * 0.08 + 0.92
        ;(mesh.material as THREE.MeshBasicMaterial).opacity = 0.7 * glow
        mesh.position.y = 0.06 + z.level * TILE_H * 0.6
        mesh.scale.y = 0.3 + z.level * 0.7
      }
    })
  })

  return (
    <group position={[10, 1.8, 4]} rotation={[0, 0.4, 0]}>
      <mesh geometry={sharedFloorGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} material={sharedFloorMat} />
      {ZONE_COORDS.map((c, i) => (
        <mesh
          key={i}
          ref={(el) => { refs.current[i] = el }}
          geometry={sharedTileGeo}
          position={[c.x, 0.06, c.z]}
        >
          <meshBasicMaterial
            color="#44cc66"
            transparent
            opacity={0.7}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}
