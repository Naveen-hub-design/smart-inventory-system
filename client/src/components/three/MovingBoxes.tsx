import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const BOX_COUNT = 8
const BELT_LENGTH = 14
const BOX_SPEED = 0.5
const BOX_W = 0.5
const BOX_H = 0.35
const BOX_D = 0.4
const BOX_Y = 0.285

const sharedBoxGeo = new THREE.BoxGeometry(BOX_W, BOX_H, BOX_D)
const sharedLabelGeo = new THREE.PlaneGeometry(0.3, 0.18)
const sharedTopGeo = new THREE.PlaneGeometry(0.25, 0.12)

const COLORS = ['#c4956a', '#6b8fa3', '#8f7a5a', '#5a7a6a', '#d4a574', '#7a9fb3', '#a08b6b', '#4a6a5a']

function texBarcode() {
  const c = document.createElement('canvas')
  c.width = 128; c.height = 64
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 128, 64)
  for (let i = 0; i < 16; i++) {
    const x = 6 + i * 7.5, w = 1 + Math.random() * 3
    ctx.fillStyle = '#222222'
    ctx.fillRect(x, 4, w, 56)
  }
  return new THREE.CanvasTexture(c)
}

function texFragile() {
  const c = document.createElement('canvas')
  c.width = 128; c.height = 64
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#ff6633'
  ctx.fillRect(0, 0, 128, 64)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 18px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('FRAGILE', 64, 32)
  return new THREE.CanvasTexture(c)
}

function texSIMS() {
  const c = document.createElement('canvas')
  c.width = 128; c.height = 64
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#2255aa'
  ctx.fillRect(0, 0, 128, 64)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 18px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('SIMS', 64, 32)
  return new THREE.CanvasTexture(c)
}

const barcodeTex = texBarcode()
const topTex = [texFragile(), texFragile(), texSIMS(), texSIMS(), texFragile(), texSIMS(), texFragile(), texSIMS()]

export default function MovingBoxes() {
  const groupRefs = useRef<(THREE.Group | null)[]>([])
  const progress = useRef(Array.from({ length: BOX_COUNT }, (_, i) => i / BOX_COUNT))
  const initX = useMemo(() => Array.from({ length: BOX_COUNT }, (_, i) => -BELT_LENGTH / 2 + (i / BOX_COUNT) * BELT_LENGTH), [])

  useFrame((state, delta) => {
    const inc = BOX_SPEED * delta / BELT_LENGTH
    for (let i = 0; i < BOX_COUNT; i++) {
      progress.current[i] += inc
      if (progress.current[i] >= 1) progress.current[i] -= 1
      const g = groupRefs.current[i]
      if (!g) continue
      const p = progress.current[i]
      g.position.x = -BELT_LENGTH / 2 + p * BELT_LENGTH
      let op = 1
      if (p > 0.88) op = 1 - (p - 0.88) / 0.12
      if (p < 0.12) op = p / 0.12
      op = Math.max(0, Math.min(1, op))
      g.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.Material
          mat.opacity = op
          mat.transparent = op < 0.99
        }
      })
      const t = state.clock.elapsedTime
      g.rotation.z = Math.sin(t * 1.8 + i * 1.2) * 0.02
      g.rotation.x = Math.cos(t * 1.2 + i * 0.8) * 0.015
    }
  })

  return (
    <group position={[0, 0.08, 7]}>
      {Array.from({ length: BOX_COUNT }, (_, i) => (
        <group key={i} ref={(el) => { groupRefs.current[i] = el }} position={[initX[i], BOX_Y, 0]}>
          <mesh geometry={sharedBoxGeo}>
            <meshStandardMaterial color={COLORS[i]} roughness={0.6} metalness={0.2} transparent opacity={1} />
          </mesh>
          <mesh geometry={sharedLabelGeo} position={[0, 0, BOX_D / 2 + 0.001]}>
            <meshBasicMaterial map={barcodeTex} transparent depthWrite={false} opacity={1} />
          </mesh>
          <mesh geometry={sharedTopGeo} position={[0, BOX_H / 2 + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <meshBasicMaterial map={topTex[i]} transparent depthWrite={false} opacity={1} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
