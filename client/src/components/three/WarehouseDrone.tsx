import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { dronePath, ZONE_U, DOCK_U, DRONE_SPEED, SCAN_DURATION, CHARGE_DURATION, SCAN_ZONES, rackStock, droneScanState, dronePos } from './DronePath'

type DroneState = 'charging' | 'flying' | 'scanning'

const sharedBody = new THREE.BoxGeometry(0.35, 0.06, 0.35)
const sharedArm = new THREE.BoxGeometry(0.2, 0.015, 0.015)
const sharedMotor = new THREE.CylinderGeometry(0.02, 0.025, 0.012, 8)
const sharedProp = new THREE.CylinderGeometry(0.1, 0.1, 0.001, 12)
const sharedCamera = new THREE.CylinderGeometry(0.012, 0.015, 0.025, 8)
const sharedSpotlight = new THREE.CylinderGeometry(0.003, 0.1, 0.25, 8)
const sharedLed = new THREE.BoxGeometry(0.004, 0.001, 0.004)
const sharedBattery = new THREE.BoxGeometry(0.025, 0.004, 0.005)
const sharedPad = new THREE.BoxGeometry(0.6, 0.02, 0.6)
const sharedPadLight = new THREE.BoxGeometry(0.04, 0.005, 0.04)

const darkMat = new THREE.MeshStandardMaterial({ color: '#2a2a3a', roughness: 0.4, metalness: 0.7 })
const accentMat = new THREE.MeshStandardMaterial({ color: '#4488ff', roughness: 0.3, metalness: 0.5 })
const grayMat = new THREE.MeshStandardMaterial({ color: '#555555', roughness: 0.5, metalness: 0.6 })
const propMat = new THREE.MeshBasicMaterial({ color: '#888888', transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide })
const cameraMat = new THREE.MeshStandardMaterial({ color: '#222222', roughness: 0.3, metalness: 0.8 })
const spotMat = new THREE.MeshBasicMaterial({ color: '#4488ff', transparent: true, opacity: 0.06, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
const ledMat = new THREE.MeshBasicMaterial({ color: '#4488ff', transparent: true, opacity: 0.8 })
const batteryMat = new THREE.MeshBasicMaterial({ color: '#44cc66', transparent: true, opacity: 0.7 })
const padMat = new THREE.MeshStandardMaterial({ color: '#333344', roughness: 0.6, metalness: 0.3 })
const padLightMat = new THREE.MeshBasicMaterial({ color: '#4488ff', transparent: true, opacity: 0.5 })

const v3 = new THREE.Vector3()
const quat = new THREE.Quaternion()

function Propeller({ groupRef }: { groupRef: React.RefObject<THREE.Group> }) {
  return (
    <group ref={groupRef}>
      <mesh geometry={sharedProp} material={propMat} />
    </group>
  )
}

export default function WarehouseDrone() {
  const groupRef = useRef<THREE.Group>(null)
  const propFL = useRef<THREE.Group>(null)
  const propFR = useRef<THREE.Group>(null)
  const propRL = useRef<THREE.Group>(null)
  const propRR = useRef<THREE.Group>(null)
  const spotRef = useRef<THREE.Mesh>(null)
  const batteryRef = useRef<THREE.Mesh>(null)
  const bodyRef = useRef<THREE.Group>(null)

  const state = useRef<DroneState>('charging')
  const u = useRef(DOCK_U)
  const chargeTimer = useRef(0)
  const scanTimer = useRef(0)
  const zoneIndex = useRef(0)
  const nextZoneIdx = useRef(0)
  const batteryLevel = useRef(1)
  const hoverPhase = useRef(0)
  const stockChangeTimer = useRef(0)

  useFrame((state_, delta) => {
    const g = groupRef.current
    if (!g) return

    hoverPhase.current += delta
    stockChangeTimer.current += delta
    if (stockChangeTimer.current > 5 + Math.random() * 3) {
      stockChangeTimer.current = 0
      rackStock.forEach((rs) => {
        rs.target = Math.max(0.05, Math.min(1, rs.level + (Math.random() - 0.5) * 0.25))
      })
    }
    rackStock.forEach((rs) => {
      rs.level += (rs.target - rs.level) * delta * 2
    })

    switch (state.current) {
      case 'charging': {
        chargeTimer.current += delta
        batteryLevel.current = Math.min(1, batteryLevel.current + delta * 0.15)
        droneScanState.isScanning = false
        if (chargeTimer.current >= CHARGE_DURATION) {
          chargeTimer.current = 0
          state.current = 'flying'
          nextZoneIdx.current = 0
          u.current = DOCK_U
        }
        break
      }
      case 'flying': {
        batteryLevel.current = Math.max(0.1, batteryLevel.current - delta * 0.005)
        u.current += DRONE_SPEED * delta
        if (u.current >= 1) {
          u.current = 0
          nextZoneIdx.current = 0
        }
        droneScanState.isScanning = false

        if (nextZoneIdx.current < ZONE_U.length) {
          const zu = ZONE_U[nextZoneIdx.current]
          let d = zu - u.current
          if (d < 0) d += 1
          if (d < 0.04) {
            u.current = zu
            state.current = 'scanning'
            scanTimer.current = 0
            zoneIndex.current = nextZoneIdx.current
            nextZoneIdx.current++
            droneScanState.zoneIndex = zoneIndex.current
            droneScanState.scanProgress = 0
            droneScanState.isScanning = true
          }
        }
        break
      }
      case 'scanning': {
        batteryLevel.current = Math.max(0.1, batteryLevel.current - delta * 0.008)
        scanTimer.current += delta
        droneScanState.scanProgress = scanTimer.current / SCAN_DURATION
        const racks = SCAN_ZONES[zoneIndex.current]?.rackIndices || []
        droneScanState.rackIndex = racks[Math.min(Math.floor(droneScanState.scanProgress * racks.length), racks.length - 1)]
        if (scanTimer.current >= SCAN_DURATION) {
          state.current = 'flying'
          droneScanState.isScanning = false
        }
        break
      }
    }

    const pos = dronePath.getPointAt(u.current, v3)
    g.position.copy(pos)
    dronePos.copy(g.position)

    g.position.y += Math.sin(hoverPhase.current * 3) * 0.02
    g.rotation.z = Math.sin(hoverPhase.current * 1.5) * 0.015
    g.rotation.x = Math.cos(hoverPhase.current * 1.2) * 0.01

    if (state.current === 'flying') {
      const tangent = dronePath.getTangentAt(u.current, v3)
      if (tangent.length() > 0.001) {
        const angle = Math.atan2(tangent.x, tangent.z)
        g.rotation.y = angle
      }
    }

    const propSpeed = 40 + (state.current === 'charging' ? 5 : 35)
    ;[propFL, propFR, propRL, propRR].forEach(ref => {
      if (ref.current) ref.current.rotation.y += delta * propSpeed
    })

    if (spotRef.current) {
      const s = spotRef.current.material as THREE.MeshBasicMaterial
      s.opacity = state.current === 'charging' ? 0.02 : 0.06
    }

    if (batteryRef.current) {
      const s = batteryRef.current.scale
      s.x = batteryLevel.current
      const m = batteryRef.current.material as THREE.MeshBasicMaterial
      m.color.setHSL(0.3 - batteryLevel.current * 0.3, 1, 0.4)
      m.opacity = 0.4 + batteryLevel.current * 0.4
    }
  })

  const armPositions = [
    { x: 0.18, z: 0.18, ref: propFL, aY: Math.PI / 4 },
    { x: -0.18, z: 0.18, ref: propFR, aY: -Math.PI / 4 },
    { x: 0.18, z: -0.18, ref: propRL, aY: -Math.PI / 4 },
    { x: -0.18, z: -0.18, ref: propRR, aY: Math.PI / 4 },
  ]

  return (
    <group>
      <group position={[20, 0.08, -2]}>
        <mesh geometry={sharedPad} position={[0, 0.01, 0]} material={padMat} />
        {[[-0.2, -0.2], [-0.2, 0.2], [0.2, -0.2], [0.2, 0.2]].map(([px, pz], i) => (
          <mesh key={`pl-${i}`} position={[px, 0.025, pz]} geometry={sharedPadLight} material={padLightMat} />
        ))}
      </group>
      <group ref={groupRef} position={[20, 0.08, -2]}>
        <group ref={bodyRef}>
          <mesh geometry={sharedBody} position={[0, 0.03, 0]} material={darkMat} />
          <mesh geometry={sharedBody} position={[0, 0.035, 0]} material={accentMat}>
            <boxGeometry args={[0.28, 0.005, 0.28]} />
          </mesh>

          {armPositions.map((arm, i) => (
            <group key={`arm-${i}`} position={[arm.x * 0.5, 0.03, arm.z * 0.5]} rotation={[0, arm.aY, 0]}>
              <mesh geometry={sharedArm} position={[0.1, 0, 0]} material={darkMat} />
              <mesh geometry={sharedMotor} position={[0.2, 0, 0]} material={grayMat} />
              <Propeller groupRef={arm.ref} />
              <mesh geometry={sharedLed} position={[0.2, 0.01, 0]} material={ledMat} />
            </group>
          ))}

          <mesh geometry={sharedCamera} position={[0, -0.03, 0.08]} rotation={[0.2, 0, 0]} material={cameraMat} />
          <mesh ref={spotRef} geometry={sharedSpotlight} position={[0, -0.06, 0.05]} rotation={[0.3, 0, 0]} material={spotMat} />
          <mesh ref={batteryRef} geometry={sharedBattery} position={[0, 0.01, -0.18]} material={batteryMat} />
        </group>
      </group>
    </group>
  )
}
