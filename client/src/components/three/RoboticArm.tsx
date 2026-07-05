import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import MechanicalGripper from './MechanicalGripper'

export type ArmPhase =
  | 'waiting' | 'rotating_to_conveyor' | 'lowering_to_conveyor' | 'opening'
  | 'grabbing' | 'lifting' | 'rotating_to_pallet' | 'lowering_to_pallet'
  | 'releasing' | 'returning'

export const robotPhase = { current: 'waiting' as ArmPhase }
export const robotHolding = { current: false }

interface Pose { base: number; shoulder: number; elbow: number; wrist: number; grip: number }

const POSES: Record<ArmPhase, Pose> = {
  waiting:             { base: 0,     shoulder: -0.5, elbow: -0.8,  wrist: 0,    grip: 0 },
  rotating_to_conveyor:{ base: 0.7,   shoulder: -0.5, elbow: -0.8,  wrist: 0,    grip: 0 },
  lowering_to_conveyor:{ base: 0.7,   shoulder: 0.6,  elbow: 0.7,   wrist: 0.2,  grip: 1 },
  opening:             { base: 0.7,   shoulder: 0.6,  elbow: 0.7,   wrist: 0.2,  grip: 1 },
  grabbing:            { base: 0.7,   shoulder: 0.6,  elbow: 0.7,   wrist: 0.2,  grip: 0 },
  lifting:             { base: 0.7,   shoulder: 0,    elbow: -0.3,  wrist: 0,    grip: 0 },
  rotating_to_pallet:  { base: -0.5,  shoulder: 0,    elbow: -0.3,  wrist: 0,    grip: 0 },
  lowering_to_pallet:  { base: -0.5,  shoulder: 0.5,  elbow: 0.6,   wrist: 0.1,  grip: 0 },
  releasing:           { base: -0.5,  shoulder: 0.5,  elbow: 0.6,   wrist: 0.1,  grip: 1 },
  returning:           { base: 0,     shoulder: -0.5, elbow: -0.8,  wrist: 0,    grip: 0 },
}

const DURATION: Record<ArmPhase, number> = {
  waiting: 1.5, rotating_to_conveyor: 0.8, lowering_to_conveyor: 0.6,
  opening: 0.3, grabbing: 0.4, lifting: 0.6, rotating_to_pallet: 0.8,
  lowering_to_pallet: 0.6, releasing: 0.4, returning: 0.7,
}

const ORDER: ArmPhase[] = [
  'waiting', 'rotating_to_conveyor', 'lowering_to_conveyor', 'opening',
  'grabbing', 'lifting', 'rotating_to_pallet', 'lowering_to_pallet',
  'releasing', 'returning',
]

const sharedBase = new THREE.CylinderGeometry(0.3, 0.35, 0.08, 16)
const sharedRing = new THREE.TorusGeometry(0.28, 0.02, 8, 24)
const sharedMotor = new THREE.CylinderGeometry(0.12, 0.14, 0.06, 12)
const sharedLower = new THREE.BoxGeometry(0.12, 0.5, 0.12)
const sharedUpper = new THREE.BoxGeometry(0.1, 0.4, 0.1)
const sharedJoint = new THREE.CylinderGeometry(0.07, 0.07, 0.04, 10)
const sharedPiston = new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6)
const sharedCylinder = new THREE.CylinderGeometry(0.02, 0.025, 0.25, 6)
const sharedHeldBox = new THREE.BoxGeometry(0.12, 0.1, 0.1)
const sharedSparkQuad = new THREE.PlaneGeometry(0.015, 0.015)
const sharedLedBox = new THREE.BoxGeometry(0.015, 0.01, 0.015)

const orangeMat = new THREE.MeshStandardMaterial({ color: '#e86b20', roughness: 0.4, metalness: 0.5 })
const darkMat = new THREE.MeshStandardMaterial({ color: '#2a2a2a', roughness: 0.7, metalness: 0.6 })
const grayMat = new THREE.MeshStandardMaterial({ color: '#555555', roughness: 0.5, metalness: 0.7 })
const pistonMat = new THREE.MeshStandardMaterial({ color: '#888888', metalness: 0.8, roughness: 0.2 })
const heldMat = new THREE.MeshStandardMaterial({ color: '#c4956a', roughness: 0.6, metalness: 0.1 })
const sparkMat = new THREE.MeshBasicMaterial({ color: '#ffaa44', transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide })
const warningMat = new THREE.MeshBasicMaterial({ color: '#ffcc00', transparent: true, opacity: 0.7, depthWrite: false })

const ledGreenMat = new THREE.MeshBasicMaterial({ color: '#00ff44' })
const ledBlueMat = new THREE.MeshBasicMaterial({ color: '#4488ff' })
const ledYellowMat = new THREE.MeshBasicMaterial({ color: '#ffcc00' })
const ledRedMat = new THREE.MeshBasicMaterial({ color: '#ff2200' })

function lerpAngles(current: Pose, target: Pose, speed: number): Pose {
  const f = Math.min(1, speed)
  return {
    base: current.base + (target.base - current.base) * f,
    shoulder: current.shoulder + (target.shoulder - current.shoulder) * f,
    elbow: current.elbow + (target.elbow - current.elbow) * f,
    wrist: current.wrist + (target.wrist - current.wrist) * f,
    grip: current.grip + (target.grip - current.grip) * f,
  }
}

const SPARK_POSITIONS: [number, number, number][] = [
  [0.04, 0.12, 0.01], [-0.03, 0.14, -0.01], [0.02, 0.1, 0.02], [-0.02, 0.13, -0.02],
  [0.03, 0.11, -0.01], [-0.04, 0.15, 0.01], [0.01, 0.09, 0.02], [-0.01, 0.14, -0.02],
]

const STATUS_LED_POSITIONS: [number, number, number][] = [
  [0.12, 0.07, 0], [0.14, 0.07, 0], [0.16, 0.07, 0], [0.18, 0.07, 0],
]

export default function RoboticArm() {
  const baseRef = useRef<THREE.Group>(null)
  const shoulderRef = useRef<THREE.Group>(null)
  const elbowRef = useRef<THREE.Group>(null)
  const wristRef = useRef<THREE.Group>(null)
  const sparkRef = useRef<THREE.Group>(null)

  const current = useRef<Pose>(POSES.waiting)
  const phase = useRef<ArmPhase>('waiting')
  const timer = useRef(0)
  const phaseIdx = useRef(0)
  const sparkTimer = useRef(0)
  const errorTimer = useRef(0)
  const showError = useRef(false)
  const heldVisible = useRef(false)

  useFrame((state, delta) => {
    timer.current += delta
    const target = POSES[phase.current]
    current.current = lerpAngles(current.current, target, delta * 5)

    if (timer.current >= DURATION[phase.current]) {
      phaseIdx.current = (phaseIdx.current + 1) % ORDER.length
      const newPhase = ORDER[phaseIdx.current]
      phase.current = newPhase
      robotPhase.current = newPhase
      timer.current = 0

      if (newPhase === 'grabbing') heldVisible.current = true
      if (newPhase === 'releasing') heldVisible.current = false
    }

    robotHolding.current = heldVisible.current

    if (baseRef.current) baseRef.current.rotation.y = current.current.base
    if (shoulderRef.current) shoulderRef.current.rotation.x = current.current.shoulder
    if (elbowRef.current) elbowRef.current.rotation.x = current.current.elbow
    if (wristRef.current) wristRef.current.rotation.x = current.current.wrist

    if (current.current.grip > 0.5 && sparkRef.current) {
      sparkTimer.current += delta
      sparkRef.current.visible = true
      sparkRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshBasicMaterial
          const phase2 = (sparkTimer.current * 20 + i * 0.8) % 1
          mat.opacity = Math.sin(phase2 * Math.PI) * 0.6
          child.position.set(
            SPARK_POSITIONS[i][0] + (Math.random() - 0.5) * 0.01,
            SPARK_POSITIONS[i][1] + (Math.random() - 0.5) * 0.01,
            SPARK_POSITIONS[i][2] + (Math.random() - 0.5) * 0.01,
          )
        }
      })
    } else if (sparkRef.current) {
      sparkRef.current.visible = false
    }

    errorTimer.current += delta
    if (errorTimer.current > 180 + Math.random() * 60) {
      showError.current = true
      errorTimer.current = 0
      setTimeout(() => { showError.current = false }, 300)
    }
  })

  const grip = current.current.grip

  return (
    <group position={[-7, 0.08, 6.5]}>
      <mesh geometry={sharedBase} position={[0, 0.04, 0]} material={darkMat} />
      <mesh geometry={sharedRing} position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]} material={grayMat} />
      <mesh geometry={sharedMotor} position={[0, 0.08, 0]} material={orangeMat} />

      {STATUS_LED_POSITIONS.map((pos, i) => {
        const mats = [ledGreenMat, ledBlueMat, ledYellowMat, ledRedMat]
        const phaseMap: ArmPhase[][] = [
          ['grabbing', 'lifting', 'rotating_to_pallet', 'lowering_to_pallet', 'releasing'],
          ['rotating_to_conveyor', 'lowering_to_conveyor', 'opening'],
          ['waiting', 'returning'],
          [],
        ]
        const isActive = phaseMap[i].includes(phase.current) || (i === 3 && showError.current)
        return (
          <mesh key={`led-${i}`} position={[pos[0], pos[1], pos[2]]} geometry={sharedLedBox}>
            <meshBasicMaterial
              color={mats[i].color}
              transparent
              opacity={isActive ? 0.9 : 0.05}
            />
          </mesh>
        )
      })}

      <group ref={baseRef}>
        <group ref={shoulderRef} position={[0, 0.08, 0]}>
          <mesh geometry={sharedLower} position={[0, 0.25, 0]} material={orangeMat} />
          <mesh geometry={sharedJoint} position={[0, 0, 0]} material={grayMat} />
          <mesh geometry={sharedPiston} position={[-0.07, 0.15, 0]} rotation={[0, 0, 0.1]} material={pistonMat} />
          <mesh geometry={sharedPiston} position={[0.07, 0.15, 0]} rotation={[0, 0, -0.1]} material={pistonMat} />

          <mesh position={[0, 0.25, 0.07]} geometry={new THREE.PlaneGeometry(0.06, 0.03)} material={warningMat} />
          <mesh position={[0, 0.25, -0.07]} geometry={new THREE.PlaneGeometry(0.06, 0.03)} rotation={[0, Math.PI, 0]} material={warningMat} />

          <group ref={elbowRef} position={[0, 0.5, 0]}>
            <mesh geometry={sharedUpper} position={[0, 0.2, 0]} material={orangeMat} />
            <mesh geometry={new THREE.CylinderGeometry(0.06, 0.06, 0.035, 10)} position={[0, 0, 0]} material={grayMat} />
            <mesh geometry={sharedCylinder} position={[-0.06, 0.12, 0]} rotation={[0, 0, 0.08]} material={pistonMat} />

            <group ref={wristRef} position={[0, 0.4, 0]}>
              <mesh geometry={new THREE.BoxGeometry(0.06, 0.04, 0.06)} position={[0, 0.02, 0]} material={grayMat} />
              <MechanicalGripper open={grip} />

              <mesh geometry={sharedHeldBox} position={[0, -0.04, 0]} material={heldMat} visible={heldVisible.current} />

              <group ref={sparkRef} visible={false}>
                {SPARK_POSITIONS.map((sp, i) => (
                  <mesh key={`spark-${i}`} position={[sp[0], sp[1], sp[2]]} geometry={sharedSparkQuad} material={sparkMat} />
                ))}
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}
