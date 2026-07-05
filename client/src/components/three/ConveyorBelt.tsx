import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const BELT_LENGTH = 14
const BELT_WIDTH = 1.5
const BELT_HEIGHT = 0.16

const sharedFrameGeo = new THREE.BoxGeometry(BELT_LENGTH, BELT_HEIGHT, BELT_WIDTH)
const sharedBeltGeo = new THREE.BoxGeometry(BELT_LENGTH - 0.5, 0.03, BELT_WIDTH - 0.15)
const sharedRailGeo = new THREE.BoxGeometry(BELT_LENGTH, 0.06, 0.04)
const sharedRollerGeo = new THREE.CylinderGeometry(0.04, 0.04, BELT_WIDTH - 0.1, 8)
const sharedLightGeo = new THREE.BoxGeometry(0.12, 0.04, 0.12)
const sharedLegGeo = new THREE.BoxGeometry(0.08, 0.3, 0.08)

function createBeltTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#2e2e2e'
  ctx.fillRect(0, 0, 256, 64)
  ctx.fillStyle = '#3a3a3a'
  for (let x = 0; x < 256; x += 12)
    ctx.fillRect(x, 0, 4, 64)
  ctx.fillStyle = '#252525'
  for (let x = 6; x < 256; x += 12)
    ctx.fillRect(x, 0, 1, 64)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(12, 1)
  tex.anisotropy = 4
  return tex
}

const beltTex = createBeltTexture()

const ROLLER_X = Array.from({ length: 9 }, (_, i) => -BELT_LENGTH / 2 + 0.8 + i * (BELT_LENGTH - 1.6) / 8)

const LEG_POSITIONS: [number, number, number][] = [
  [-BELT_LENGTH / 2 + 0.3, -BELT_HEIGHT / 2 - 0.15, BELT_WIDTH / 2 - 0.2],
  [BELT_LENGTH / 2 - 0.3, -BELT_HEIGHT / 2 - 0.15, BELT_WIDTH / 2 - 0.2],
  [-BELT_LENGTH / 2 + 0.3, -BELT_HEIGHT / 2 - 0.15, -BELT_WIDTH / 2 + 0.2],
  [BELT_LENGTH / 2 - 0.3, -BELT_HEIGHT / 2 - 0.15, -BELT_WIDTH / 2 + 0.2],
]

const LIGHT_POSITIONS: [number, number, number][] = [
  [-BELT_LENGTH / 2 + 0.4, -BELT_HEIGHT / 2, BELT_WIDTH / 2 - 0.2],
  [BELT_LENGTH / 2 - 0.4, -BELT_HEIGHT / 2, BELT_WIDTH / 2 - 0.2],
  [-BELT_LENGTH / 2 + 0.4, -BELT_HEIGHT / 2, -BELT_WIDTH / 2 + 0.2],
  [BELT_LENGTH / 2 - 0.4, -BELT_HEIGHT / 2, -BELT_WIDTH / 2 + 0.2],
]

export default function ConveyorBelt() {
  useFrame((state) => {
    beltTex.offset.x -= 0.15 * state.clock.getDelta()
  })

  return (
    <group position={[0, 0.08, 7]}>
      <mesh position={[0, 0, 0]} geometry={sharedFrameGeo}>
        <meshStandardMaterial color="#2a2a2a" metalness={0.7} roughness={0.4} />
      </mesh>

      <mesh position={[0, BELT_HEIGHT / 2 + 0.015, 0]} geometry={sharedBeltGeo}>
        <meshStandardMaterial map={beltTex} roughness={0.9} metalness={0} />
      </mesh>

      {([BELT_WIDTH / 2 - 0.02, -(BELT_WIDTH / 2 - 0.02)] as const).map((z, i) => (
        <mesh key={`rail-${i}`} position={[0, 0.06, z]} geometry={sharedRailGeo}>
          <meshStandardMaterial color="#444444" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}

      {ROLLER_X.map((x, i) => (
        <group key={`roller-${i}`}>
          <mesh position={[x, -BELT_HEIGHT / 2 - 0.02, BELT_WIDTH / 2 - 0.05]} rotation={[Math.PI / 2, 0, 0]} geometry={sharedRollerGeo}>
            <meshStandardMaterial color="#555555" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[x, -BELT_HEIGHT / 2 - 0.02, -BELT_WIDTH / 2 + 0.05]} rotation={[Math.PI / 2, 0, 0]} geometry={sharedRollerGeo}>
            <meshStandardMaterial color="#555555" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {LEG_POSITIONS.map((pos, i) => (
        <mesh key={`leg-${i}`} position={pos} geometry={sharedLegGeo}>
          <meshStandardMaterial color="#333333" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}

      {LIGHT_POSITIONS.map((pos, i) => (
        <mesh key={`light-${i}`} position={pos} geometry={sharedLightGeo}>
          <meshBasicMaterial color="#4488ff" transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  )
}
