import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { forkliftPhase } from './Forklift'

const sharedPole = new THREE.BoxGeometry(0.03, 1.5, 0.03)
const sharedHousing = new THREE.BoxGeometry(0.12, 0.22, 0.08)
const sharedCircle = new THREE.CircleGeometry(0.035, 12)
const sharedBeaconBase = new THREE.BoxGeometry(0.05, 0.04, 0.05)
const sharedBeaconLight = new THREE.BoxGeometry(0.04, 0.03, 0.04)

const poleMat = new THREE.MeshStandardMaterial({ color: '#3a3a3a', metalness: 0.6, roughness: 0.4 })
const housingMat = new THREE.MeshStandardMaterial({ color: '#222222', metalness: 0.3, roughness: 0.6 })
const greenMat = new THREE.MeshBasicMaterial({ color: '#00ff44', transparent: true, opacity: 0.15 })
const redMat = new THREE.MeshBasicMaterial({ color: '#ff2200', transparent: true, opacity: 0.15 })
const beaconMat = new THREE.MeshBasicMaterial({ color: '#ff8800', transparent: true, opacity: 0.3 })

const SAFETY_POSITIONS: [number, number, number][] = [
  [14, 0, 6.5], [10, 0, 1], [6, 0, -5], [7, 0, 4],
]

function TrafficLight({ position, angle }: { position: [number, number, number], angle?: number }) {
  const greenRef = useRef<THREE.Mesh>(null)
  const redRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    const phase = forkliftPhase.current
    const isMoving = phase === 'driving' || phase === 'driving_loaded' || phase === 'returning'
    if (greenRef.current) {
      const mat = greenRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = isMoving ? 0.9 : 0.1
    }
    if (redRef.current) {
      const mat = redRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = isMoving ? 0.1 : 0.9
    }
  })

  return (
    <group position={position}>
      <mesh position={[0, 0.75, 0]} geometry={sharedPole} material={poleMat} />
      <mesh position={[0, 1.5, 0]} geometry={sharedHousing} material={housingMat} />
      <mesh ref={redRef} position={[0, 1.52, 0.045]} rotation={[0, 0, 0]} geometry={sharedCircle} material={redMat} />
      <mesh ref={greenRef} position={[0, 1.44, 0.045]} rotation={[0, 0, 0]} geometry={sharedCircle} material={greenMat} />
    </group>
  )
}

function SafetyBeacon({ position }: { position: [number, number, number] }) {
  const lightRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (lightRef.current) {
      const mat = lightRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.15 + Math.sin(state.clock.elapsedTime * 4 + position[0] + position[2]) * 0.1
    }
  })

  return (
    <group position={position}>
      <mesh position={[0, 0.02, 0]} geometry={sharedBeaconBase} material={poleMat} />
      <mesh ref={lightRef} position={[0, 0.04, 0]} geometry={sharedBeaconLight} material={beaconMat} />
    </group>
  )
}

export default function WarehouseSignals() {
  return (
    <>
      <TrafficLight position={[12, 0.08, 7]} />
      <TrafficLight position={[6, 0.08, -5.5]} />
      {SAFETY_POSITIONS.map((pos, i) => (
        <SafetyBeacon key={i} position={pos} />
      ))}
    </>
  )
}
