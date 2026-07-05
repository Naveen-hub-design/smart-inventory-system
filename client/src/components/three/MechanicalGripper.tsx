import { useMemo } from 'react'
import * as THREE from 'three'

const sharedMount = new THREE.BoxGeometry(0.05, 0.02, 0.05)
const sharedFinger = new THREE.BoxGeometry(0.02, 0.08, 0.025)
const sharedPad = new THREE.BoxGeometry(0.025, 0.015, 0.02)

const mountMat = new THREE.MeshStandardMaterial({ color: '#444444', metalness: 0.7, roughness: 0.3 })
const fingerMat = new THREE.MeshStandardMaterial({ color: '#555555', metalness: 0.6, roughness: 0.4 })
const padMat = new THREE.MeshStandardMaterial({ color: '#222222', roughness: 0.9, metalness: 0 })

export default function MechanicalGripper({ open }: { open: number }) {
  const offset = useMemo(() => 0.015 + open * 0.025, [open])

  return (
    <group position={[0, 0.04, 0]}>
      <mesh geometry={sharedMount} position={[0, 0, 0]} material={mountMat} />
      <mesh geometry={sharedFinger} position={[-offset, 0.05, 0]} material={fingerMat} />
      <mesh geometry={sharedFinger} position={[offset, 0.05, 0]} material={fingerMat} />
      <mesh geometry={sharedPad} position={[-offset, 0.09, 0]} material={padMat} />
      <mesh geometry={sharedPad} position={[offset, 0.09, 0]} material={padMat} />
    </group>
  )
}
