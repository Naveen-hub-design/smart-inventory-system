import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const CYCLE = 3.5
const IDLE_END = 2.5
const SCAN_END = 3.0
const CONFIRM_END = 3.15

const standGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.015, 12)
const poleGeo = new THREE.CylinderGeometry(0.008, 0.01, 0.1, 8)
const bodyGeo = new THREE.BoxGeometry(0.05, 0.035, 0.065)
const lensGeo = new THREE.CylinderGeometry(0.012, 0.015, 0.008, 8)
const ledGeo = new THREE.BoxGeometry(0.005, 0.003, 0.005)
const laserGeo = new THREE.BoxGeometry(0.003, 0.003, 0.35)
const glowGeo = new THREE.BoxGeometry(0.01, 0.01, 0.35)
const flashGeo = new THREE.PlaneGeometry(0.05, 0.05)
const particleGeo = new THREE.PlaneGeometry(0.008, 0.008)

const standMat = new THREE.MeshStandardMaterial({ color: '#444444', metalness: 0.7, roughness: 0.4 })
const poleMat = new THREE.MeshStandardMaterial({ color: '#555555', metalness: 0.6, roughness: 0.3 })
const bodyMat = new THREE.MeshStandardMaterial({ color: '#333333', metalness: 0.5, roughness: 0.5 })
const lensMat = new THREE.MeshBasicMaterial({ color: '#661111' })
const ledMat = new THREE.MeshBasicMaterial({ color: '#4488ff', transparent: true, opacity: 0.3 })
const laserMat = new THREE.MeshBasicMaterial({ color: '#ff2200', transparent: true, opacity: 0.9, depthWrite: false })
const glowMat = new THREE.MeshBasicMaterial({ color: '#ff2200', transparent: true, opacity: 0.15, depthWrite: false, blending: THREE.AdditiveBlending })
const flashMat = new THREE.MeshBasicMaterial({ color: '#00ff44', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
const particleMat = new THREE.MeshBasicMaterial({ color: '#ffcc44', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })

export const scanData = {
  products: 208,
  orders: 15,
  materials: 104,
  stockIn: 0,
  justScanned: false,
}

const particleVels: THREE.Vector3[] = Array.from({ length: 8 }, () => new THREE.Vector3())

export default function BarcodeScanner() {
  const timer = useRef(Math.random() * CYCLE)
  const phase = useRef<'idle' | 'scanning' | 'confirming'>('idle')
  const flashRef = useRef<THREE.Mesh>(null)
  const ledRef = useRef<THREE.Mesh>(null)
  const laserRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const particleRef = useRef<THREE.Group>(null)
  const particleVisible = useRef(false)
  const particleLife = useRef(0)

  useFrame((state, delta) => {
    timer.current += delta
    if (timer.current >= CYCLE) timer.current -= CYCLE

    const t = timer.current

    if (t < IDLE_END) phase.current = 'idle'
    else if (t < SCAN_END) {
      if (phase.current !== 'scanning') {
        phase.current = 'scanning'
        if (particleRef.current) {
          particleRef.current.children.forEach((child) => {
            child.position.set(0, 0, 0)
            ;((child as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0
          })
        }
        particleVisible.current = false
      }
    } else if (t < CONFIRM_END) {
      if (phase.current !== 'confirming') {
        phase.current = 'confirming'
        scanData.products++
        scanData.stockIn++
        if (scanData.products % 3 === 0) scanData.orders++
        if (scanData.products % 2 === 0) scanData.materials++
        scanData.justScanned = true
        setTimeout(() => { scanData.justScanned = false }, 100)

        if (particleRef.current) {
          particleVisible.current = true
          particleLife.current = 0
          particleRef.current.children.forEach((child, i) => {
            child.position.set(0, 0, 0)
            ;((child as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.8
            particleVels[i].set(
              (Math.random() - 0.5) * 0.3,
              Math.random() * 0.2,
              (Math.random() - 0.5) * 0.3,
            )
          })
        }
      }
    } else {
      if (phase.current !== 'idle') {
        phase.current = 'idle'
        particleVisible.current = false
      }
    }

    const isScanning = phase.current === 'scanning'
    const isConfirming = phase.current === 'confirming'

    if (ledRef.current) {
      const led = ledRef.current.material as THREE.MeshBasicMaterial
      if (isConfirming) {
        led.color.setHex(0x00ff44)
        led.opacity = 0.9
      } else if (isScanning) {
        led.color.setHex(0x4488ff)
        led.opacity = 0.6 + Math.sin(t * 40) * 0.3
      } else {
        led.color.setHex(0x4488ff)
        led.opacity = 0.3
      }
    }

    if (laserRef.current) {
      laserRef.current.visible = isScanning
      ;(laserRef.current.material as THREE.MeshBasicMaterial).opacity = 0.6 + Math.sin(t * 100) * 0.3
    }
    if (glowRef.current) {
      glowRef.current.visible = isScanning
      ;(glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.1 + Math.sin(t * 80) * 0.08
    }

    if (flashRef.current) {
      const mat = flashRef.current.material as THREE.MeshBasicMaterial
      if (isConfirming) {
        const progress = (t - SCAN_END) / (CONFIRM_END - SCAN_END)
        mat.opacity = Math.sin(progress * Math.PI) * 0.8
      } else {
        mat.opacity = 0
      }
    }

    if (particleRef.current && particleVisible.current) {
      particleLife.current += delta
      particleRef.current.visible = true
      particleRef.current.children.forEach((child, i) => {
        child.position.x += particleVels[i].x * delta
        child.position.y += particleVels[i].y * delta
        child.position.z += particleVels[i].z * delta
        ;((child as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity =
          particleLife.current > 0.3 ? 0 : 0.8 * (1 - particleLife.current / 0.3)
      })
    } else if (particleRef.current) {
      particleRef.current.visible = false
    }
  })

  return (
    <group position={[0.5, 0.08, 6.35]}>
      <mesh geometry={standGeo} position={[0, 0.008, 0]} material={standMat} />
      <mesh geometry={poleGeo} position={[0, 0.06, 0]} material={poleMat} />
      <group position={[0, 0.12, 0]} rotation={[0, -0.5, 0]}>
        <mesh geometry={bodyGeo} material={bodyMat} />
        <mesh geometry={lensGeo} position={[0, 0, 0.036]} rotation={[Math.PI / 2, 0, 0]} material={lensMat} />
        <mesh ref={ledRef} geometry={ledGeo} position={[0.026, 0.017, 0.032]} material={ledMat} />
        <mesh ref={laserRef} geometry={laserGeo} position={[-0.1, 0, 0.18]} rotation={[0.1, -0.6, 0]} visible={false} material={laserMat} />
        <mesh ref={glowRef} geometry={glowGeo} position={[-0.1, 0, 0.18]} rotation={[0.1, -0.6, 0]} visible={false} material={glowMat} />
      </group>
      <mesh ref={flashRef} geometry={flashGeo} position={[0.2, 0.1, 0.35]} material={flashMat} />
      <group ref={particleRef} visible={false} position={[0.2, 0.1, 0.35]}>
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={`p-${i}`} geometry={particleGeo} material={particleMat.clone()} />
        ))}
      </group>
    </group>
  )
}
