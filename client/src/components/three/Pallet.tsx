import { useMemo } from 'react'
import * as THREE from 'three'

const sharedPalletBase = new THREE.BoxGeometry(0.7, 0.06, 0.7)
const sharedBoxGeo = new THREE.BoxGeometry(0.2, 0.13, 0.18)
const sharedLabelGeo = new THREE.PlaneGeometry(0.15, 0.07)

const palletMat = new THREE.MeshStandardMaterial({ color: '#6a5a3a', roughness: 0.9, metalness: 0 })
const boxMat = new THREE.MeshStandardMaterial({ color: '#d4c4a4', roughness: 0.6, metalness: 0.1 })
const labelMats = [
  new THREE.MeshBasicMaterial({ color: '#4488ff', transparent: true, opacity: 0.85, depthWrite: false }), // Electronics
  new THREE.MeshBasicMaterial({ color: '#44cc44', transparent: true, opacity: 0.85, depthWrite: false }), // Food
  new THREE.MeshBasicMaterial({ color: '#ff8844', transparent: true, opacity: 0.85, depthWrite: false }), // Materials
  new THREE.MeshBasicMaterial({ color: '#ff4444', transparent: true, opacity: 0.85, depthWrite: false }), // Fragile
]

const GRID: [number, number][] = [
  [-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15],
]

export interface StackedBox {
  id: number
  layer: number
  gridIdx: number
  category: number
}

export default function Pallet({ boxes }: { boxes: StackedBox[] }) {
  return (
    <group position={[-5.5, 0.08, 5.5]}>
      <mesh geometry={sharedPalletBase} position={[0, 0.03, 0]} material={palletMat} />
      {boxes.map((b) => {
        const y = 0.06 + b.layer * 0.13 + 0.065
        return (
          <group key={b.id} position={[GRID[b.gridIdx][0], y, GRID[b.gridIdx][1]]}>
            <mesh geometry={sharedBoxGeo} material={boxMat} />
            <mesh
              geometry={sharedLabelGeo}
              position={[0, 0.066, 0.091]}
              material={labelMats[b.category]}
            />
          </group>
        )
      })}
    </group>
  )
}
