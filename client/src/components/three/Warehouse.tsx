import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const RACK_WIDTH = 3.2
const RACK_HEIGHT = 5.5
const RACK_DEPTH = 1.6
const SHELF_COUNT = 5
const POST_THICKNESS = 0.1
const SHELF_THICKNESS = 0.06

const BOX_WIDTH = 0.45
const BOX_HEIGHT = 0.3
const BOX_DEPTH = 0.4

const sharedBoxGeo = new THREE.BoxGeometry(BOX_WIDTH, BOX_HEIGHT, BOX_DEPTH)
const sharedPostGeo = new THREE.BoxGeometry(POST_THICKNESS, RACK_HEIGHT, POST_THICKNESS)
const sharedShelfGeo = new THREE.BoxGeometry(RACK_WIDTH - 0.3, SHELF_THICKNESS, RACK_DEPTH - 0.3)
const sharedPalletGeo = new THREE.BoxGeometry(1.0, 0.08, 1.2)

const RACK_POSITIONS = [
  [-16, -8], [-12, -8], [-8, -8], [-4, -8],
  [-16, -2], [-12, -2], [-8, -2], [-4, -2],
  [-16, 4],  [-12, 4],  [-8, 4],  [-4, 4],
  [4, -8],   [8, -8],   [12, -8], [16, -8],
  [4, -2],   [8, -2],   [12, -2], [16, -2],
  [4, 4],    [8, 4],    [12, 4],  [16, 4],
]

const BOX_COLORS = [
  '#d4a574', '#c4956a', '#e8c49a', '#b8845a',
  '#6b8fa3', '#5a7d8f', '#7a9fb3', '#4a6d7f',
  '#8f7a5a', '#a08b6b', '#7f6a4a', '#b09b7b',
  '#5a7a6a', '#4a6a5a', '#6a8a7a', '#3a5a4a',
]

const CONTAINER_COLORS = ['#5a6a7a', '#4a5a6a', '#6a7a8a', '#3a4a5a']

const CONTAINER_POSITIONS = [
  [-20, 0, -13], [-15, 0, -13], [-10, 0, -13],
  [10, 0, -13],  [15, 0, -13],  [20, 0, -13],
  [-20, 2.5, -13], [-15, 2.5, -13], [-10, 2.5, -13],
  [10, 2.5, -13],  [15, 2.5, -13],  [20, 2.5, -13],
]

interface BoxData {
  x: number
  baseY: number
  z: number
  color: string
  phase: number
}

function RackFrame({ x, z }: { x: number; z: number }) {
  const hw = RACK_WIDTH / 2 - POST_THICKNESS / 2
  const hd = RACK_DEPTH / 2 - POST_THICKNESS / 2
  const shelfSpacing = RACK_HEIGHT / SHELF_COUNT
  const shelfY = Array.from({ length: SHELF_COUNT - 1 }, (_, i) => -RACK_HEIGHT / 2 + shelfSpacing * (i + 1))

  const postPositions = useMemo(() => [
    [-hw, 0, -hd] as const, [hw, 0, -hd] as const, [-hw, 0, hd] as const, [hw, 0, hd] as const,
  ], [hw, hd])

  return (
    <group position={[x, RACK_HEIGHT / 2, z]}>
      {postPositions.map((p, i) => (
        <mesh key={`post-${i}`} position={[p[0], p[1], p[2]]} geometry={sharedPostGeo}>
          <meshStandardMaterial color="#3a3a3a" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {shelfY.map((sy, i) => (
        <mesh key={`shelf-${i}`} position={[0, sy, 0]} geometry={sharedShelfGeo}>
          <meshStandardMaterial color="#4a4a4a" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

const InstancedBoxes = React.memo(({ instances: initialInstances }: { instances: BoxData[] }) => {
  const ref = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const stored = useRef(initialInstances)
  const color = useMemo(() => new THREE.Color(), [])

  useMemo(() => {
    if (!ref.current) return
    const colors = new Float32Array(initialInstances.length * 3)
    initialInstances.forEach((inst, i) => {
      dummy.position.set(inst.x, inst.baseY, inst.z)
      dummy.updateMatrix()
      ref.current!.setMatrixAt(i, dummy.matrix)
      color.set(inst.color)
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    })
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.instanceColor = new THREE.InstancedBufferAttribute(colors, 3)
  }, [initialInstances, dummy, color])

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    for (let i = 0; i < stored.current.length; i++) {
      const inst = stored.current[i]
      const floatOffset = Math.sin(t * 0.3 + inst.phase) * 0.015
      dummy.position.set(inst.x, inst.baseY + floatOffset, inst.z)
      dummy.updateMatrix()
      ref.current!.setMatrixAt(i, dummy.matrix)
    }
    ref.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[sharedBoxGeo, undefined, initialInstances.length]}>
      <meshStandardMaterial roughness={0.7} metalness={0.1} />
    </instancedMesh>
  )
})

export default function Warehouse() {
  const { boxes, rackPositions } = useMemo(() => {
    const racks: { x: number; z: number }[] = []
    const boxes: BoxData[] = []

    RACK_POSITIONS.forEach(([x, z], ri) => {
      racks.push({ x, z })
      const shelfSpacing = RACK_HEIGHT / SHELF_COUNT
      const boxesPerShelf = Math.floor((RACK_WIDTH - 0.6) / (BOX_WIDTH + 0.08))
      const gapX = (RACK_WIDTH - 0.6 - boxesPerShelf * BOX_WIDTH) / 2

      for (let si = 0; si < SHELF_COUNT - 1; si++) {
        const sy = -RACK_HEIGHT / 2 + shelfSpacing * (si + 1) + SHELF_THICKNESS / 2 + BOX_HEIGHT / 2
        const count = Math.max(1, boxesPerShelf - Math.floor(Math.random() * 2))
        for (let bi = 0; bi < count; bi++) {
          const bx = x - RACK_WIDTH / 2 + 0.3 + gapX + bi * (BOX_WIDTH + 0.08) + BOX_WIDTH / 2
          boxes.push({
            x: bx,
            baseY: sy,
            z,
            color: BOX_COLORS[Math.floor(Math.random() * BOX_COLORS.length)],
            phase: Math.random() * Math.PI * 2,
          })
        }
      }
    })
    return { boxes, rackPositions: racks }
  }, [])

  const palletPositions = useMemo(() => rackPositions.map(r => ({ x: r.x, z: r.z })), [rackPositions])

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[55, 35]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.3} metalness={0.05} />
      </mesh>

      {palletPositions.map((p, i) => (
        <mesh key={`pallet-${i}`} position={[p.x, 0.04, p.z]} geometry={sharedPalletGeo}>
          <meshStandardMaterial color="#6a5a3a" roughness={0.9} metalness={0} />
        </mesh>
      ))}

      {rackPositions.map((r, i) => (
        <RackFrame key={i} x={r.x} z={r.z} />
      ))}

      <InstancedBoxes instances={boxes} />

      {CONTAINER_POSITIONS.map((pos, i) => (
        <mesh key={`container-${i}`} position={[pos[0], pos[1] + 1.2, pos[2]]}>
          <boxGeometry args={[3.5, 2.4, 2.5]} />
          <meshStandardMaterial
            color={CONTAINER_COLORS[i % CONTAINER_COLORS.length]}
            roughness={0.6}
            metalness={0.4}
          />
        </mesh>
      ))}
    </group>
  )
}
