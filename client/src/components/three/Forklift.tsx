import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  forkliftPath, TOTAL_LENGTH,
  DRIVE_SPEED, PAUSE_DURATION, FORK_LERP_SPEED,
  FORK_HIGH, FORK_LOW, RACK_U, DOCK_U,
} from './ForkliftPath'

export const forkliftPos = new THREE.Vector3(22, 0.08, 10)
export type ForkPhase = 'driving' | 'lifting' | 'driving_loaded' | 'lowering' | 'returning'
export const forkliftPhase = { current: 'driving' as ForkPhase }

type PhaseState = 'drive1' | 'pause1' | 'drive2' | 'pause2' | 'drive3'

const sharedBody = new THREE.BoxGeometry(1.5, 0.28, 0.8)
const sharedCabin = new THREE.BoxGeometry(0.6, 0.28, 0.65)
const sharedCounter = new THREE.BoxGeometry(0.3, 0.25, 0.7)
const sharedMast = new THREE.BoxGeometry(0.06, 0.8, 0.22)
const sharedRoof = new THREE.BoxGeometry(0.55, 0.015, 0.6)
const sharedFork = new THREE.BoxGeometry(0.5, 0.025, 0.08)
const sharedPallet = new THREE.BoxGeometry(0.5, 0.06, 0.5)
const sharedWheel = new THREE.CylinderGeometry(0.08, 0.08, 0.055, 12)
const sharedBeacon = new THREE.CylinderGeometry(0.035, 0.02, 0.04, 8)
const sharedLight = new THREE.BoxGeometry(0.05, 0.03, 0.03)
const sharedLightRear = new THREE.BoxGeometry(0.05, 0.03, 0.02)

const bodyMat = new THREE.MeshStandardMaterial({ color: '#e8b820', roughness: 0.5, metalness: 0.3 })
const darkMat = new THREE.MeshStandardMaterial({ color: '#222222', roughness: 0.7, metalness: 0.5 })
const cabinMat = new THREE.MeshStandardMaterial({ color: '#1a1a2a', roughness: 0.4, metalness: 0.6, transparent: true, opacity: 0.7 })
const grayMat = new THREE.MeshStandardMaterial({ color: '#555555', roughness: 0.6, metalness: 0.5 })
const forkMat = new THREE.MeshStandardMaterial({ color: '#666666', roughness: 0.5, metalness: 0.7 })
const wheelMat = new THREE.MeshStandardMaterial({ color: '#111111', roughness: 0.9, metalness: 0 })
const palletMat = new THREE.MeshStandardMaterial({ color: '#6a5a3a', roughness: 0.9, metalness: 0 })
const beaconMat = new THREE.MeshBasicMaterial({ color: '#ff6600' })
const headlightMat = new THREE.MeshBasicMaterial({ color: '#ffffcc' })
const rearMat = new THREE.MeshBasicMaterial({ color: '#ff2200' })

const vec3 = new THREE.Vector3()
const quat = new THREE.Quaternion()

export default function Forklift() {
  const groupRef = useRef<THREE.Group>(null)
  const forksRef = useRef<THREE.Group>(null)
  const palletRef = useRef<THREE.Mesh>(null)
  const beaconRef = useRef<THREE.Mesh>(null)
  const rearRef = useRef<THREE.Mesh>(null)
  const wFL = useRef<THREE.Mesh>(null)
  const wFR = useRef<THREE.Mesh>(null)
  const wRL = useRef<THREE.Mesh>(null)
  const wRR = useRef<THREE.Mesh>(null)

  const state = useRef<PhaseState>('drive1')
  const u = useRef(0)
  const timer = useRef(0)
  const forkHeight = useRef(FORK_LOW)
  const prevU = useRef(0)
  const wheelRot = useRef(0)

  useFrame((state_, delta) => {
    const g = groupRef.current
    if (!g) return

    switch (state.current) {
      case 'drive1': {
        u.current += DRIVE_SPEED * delta
        if (u.current >= RACK_U) { u.current = RACK_U; state.current = 'pause1'; timer.current = 0 }
        forkliftPhase.current = 'driving'
        break
      }
      case 'pause1': {
        timer.current += delta
        forkHeight.current += (FORK_HIGH - forkHeight.current) * Math.min(1, delta * FORK_LERP_SPEED)
        forkliftPhase.current = 'lifting'
        if (palletRef.current) palletRef.current.visible = forkHeight.current > 0.1
        if (timer.current >= PAUSE_DURATION) { state.current = 'drive2' }
        break
      }
      case 'drive2': {
        u.current += DRIVE_SPEED * delta
        if (u.current >= DOCK_U) { u.current = DOCK_U; state.current = 'pause2'; timer.current = 0 }
        forkliftPhase.current = 'driving_loaded'
        break
      }
      case 'pause2': {
        timer.current += delta
        forkHeight.current += (FORK_LOW - forkHeight.current) * Math.min(1, delta * FORK_LERP_SPEED)
        forkliftPhase.current = 'lowering'
        if (palletRef.current) palletRef.current.visible = forkHeight.current > 0.1
        if (timer.current >= PAUSE_DURATION) { state.current = 'drive3' }
        break
      }
      case 'drive3': {
        u.current += DRIVE_SPEED * delta
        if (u.current >= 1) { u.current = 0; state.current = 'drive1' }
        forkliftPhase.current = 'returning'
        break
      }
    }

    const pos = forkliftPath.getPointAt(u.current, vec3)
    g.position.copy(pos)
    forkliftPos.copy(pos)

    const tangent = forkliftPath.getTangentAt(u.current, vec3)
    if (tangent.length() > 0.001) {
      const angle = Math.atan2(tangent.x, tangent.z)
      g.rotation.y = angle
    }

    const distTraveled = Math.abs(u.current - prevU.current) * TOTAL_LENGTH
    prevU.current = u.current
    wheelRot.current += distTraveled / 0.08

    const s = Math.sin(state_.clock.elapsedTime * 12) * 0.003
    g.position.y += s

    ;[wFL, wFR, wRL, wRR].forEach(ref => {
      if (ref.current) ref.current.rotation.x = wheelRot.current
    })

    if (forksRef.current) {
      forksRef.current.position.y = forkHeight.current
    }

    if (beaconRef.current) {
      beaconRef.current.rotation.y += delta * 3
    }

    if (rearRef.current) {
      const mat = rearRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.3 + Math.sin(state_.clock.elapsedTime * 8) * 0.3
      mat.transparent = true
    }
  })

  const wheelPositions = useMemo(() => [
    { x: 0.5, z: 0.42, ref: wFL },
    { x: 0.5, z: -0.42, ref: wFR },
    { x: -0.5, z: 0.42, ref: wRL },
    { x: -0.5, z: -0.42, ref: wRR },
  ], [])

  return (
    <group ref={groupRef} position={[22, 0.08, 10]}>
      <mesh geometry={sharedBody} position={[0, 0.14, 0]} material={bodyMat} />
      <mesh geometry={sharedCounter} position={[-0.65, 0.125, 0]} material={darkMat} />
      <mesh geometry={sharedCabin} position={[-0.15, 0.28, 0]} material={cabinMat} />
      <mesh geometry={sharedRoof} position={[-0.15, 0.43, 0]} material={darkMat} />
      <mesh geometry={sharedMast} position={[0.65, 0.4, 0]} material={grayMat} />

      <group ref={forksRef} position={[0.9, FORK_LOW, 0]}>
        <mesh geometry={sharedFork} position={[0.25, 0, -0.1]} material={forkMat} />
        <mesh geometry={sharedFork} position={[0.25, 0, 0.1]} material={forkMat} />
        <mesh ref={palletRef} geometry={sharedPallet} position={[0.2, -0.005, 0]} material={palletMat} visible={false} />
      </group>

      {wheelPositions.map((wp, i) => (
        <mesh key={`w${i}`} ref={wp.ref} position={[wp.x, 0.04, wp.z]} rotation={[0, 0, Math.PI / 2]} geometry={sharedWheel} material={wheelMat} />
      ))}

      <mesh position={[0.75, 0.18, 0.18]} geometry={sharedLight} material={headlightMat} />
      <mesh position={[0.75, 0.18, -0.18]} geometry={sharedLight} material={headlightMat} />
      <mesh ref={beaconRef} position={[-0.15, 0.46, 0]} geometry={sharedBeacon} material={beaconMat} />
      <mesh ref={rearRef} position={[-0.75, 0.14, 0]} geometry={sharedLightRear} material={rearMat} />
    </group>
  )
}
