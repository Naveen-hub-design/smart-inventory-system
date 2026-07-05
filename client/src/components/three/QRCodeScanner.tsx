import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scanData } from './BarcodeScanner'

const bodyGeo = new THREE.BoxGeometry(0.08, 0.04, 0.06)
const mountGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.12, 6)
const lensGeo = new THREE.BoxGeometry(0.03, 0.008, 0.008)
const crossX = new THREE.BoxGeometry(0.025, 0.002, 0.002)
const crossZ = new THREE.BoxGeometry(0.002, 0.002, 0.025)
const scanLineGeo = new THREE.PlaneGeometry(0.03, 0.002)
const ledGeo2 = new THREE.BoxGeometry(0.005, 0.003, 0.005)
const flashGeo2 = new THREE.PlaneGeometry(0.04, 0.04)

const bodyMat2 = new THREE.MeshStandardMaterial({ color: '#2a2a2a', metalness: 0.6, roughness: 0.4 })
const mountMat2 = new THREE.MeshStandardMaterial({ color: '#555555', metalness: 0.5, roughness: 0.3 })
const lensMat2 = new THREE.MeshBasicMaterial({ color: '#222266', transparent: true, opacity: 0.6 })
const crossMat = new THREE.MeshBasicMaterial({ color: '#4488ff', transparent: true, opacity: 0.7 })
const scanLineMat = new THREE.MeshBasicMaterial({ color: '#4488ff', transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending })
const ledMat2 = new THREE.MeshBasicMaterial({ color: '#4488ff', transparent: true, opacity: 0.4 })
const flashMat2 = new THREE.MeshBasicMaterial({ color: '#00ff44', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })

export default function QRCodeScanner() {
  const scanLineRef = useRef<THREE.Mesh>(null)
  const flashRef2 = useRef<THREE.Mesh>(null)
  const ledRef2 = useRef<THREE.Mesh>(null)
  const timer = useRef(0)
  const flashTimer = useRef(0)
  const wasScanned = useRef(false)

  useFrame((state, delta) => {
    timer.current += delta

    if (scanLineRef.current) {
      const y = Math.sin(timer.current * 1.5) * 0.015
      scanLineRef.current.position.y = y
      const op = 0.4 + Math.sin(timer.current * 3) * 0.2
      ;(scanLineRef.current.material as THREE.MeshBasicMaterial).opacity = op
    }

    if (scanData.justScanned && !wasScanned.current) {
      flashTimer.current = 0.3
    }
    wasScanned.current = scanData.justScanned

    if (flashTimer.current > 0) {
      flashTimer.current -= delta
      if (flashRef2.current) {
        const mat = flashRef2.current.material as THREE.MeshBasicMaterial
        mat.opacity = (flashTimer.current / 0.3) * 0.7
      }
      if (ledRef2.current) {
        ;(ledRef2.current.material as THREE.MeshBasicMaterial).color.setHex(0x00ff44)
        ;(ledRef2.current.material as THREE.MeshBasicMaterial).opacity = 0.9
      }
    } else {
      if (flashRef2.current) {
        ;(flashRef2.current.material as THREE.MeshBasicMaterial).opacity = 0
      }
      if (ledRef2.current) {
        ;(ledRef2.current.material as THREE.MeshBasicMaterial).color.setHex(0x4488ff)
        ;(ledRef2.current.material as THREE.MeshBasicMaterial).opacity = 0.4
      }
    }
  })

  return (
    <group position={[-0.5, 0.5, 6.85]}>
      <mesh geometry={mountGeo} position={[0, 0.08, 0]} material={mountMat2} />
      <group position={[0, 0.02, 0]}>
        <mesh geometry={bodyGeo} material={bodyMat2} />
        <mesh geometry={lensGeo} position={[0, -0.016, 0.032]} material={lensMat2} />
        <mesh geometry={crossX} position={[0, -0.016, 0.037]} material={crossMat} />
        <mesh geometry={crossZ} position={[0, -0.016, 0.037]} material={crossMat} />
        <mesh ref={scanLineRef} geometry={scanLineGeo} position={[0, 0, 0.037]} material={scanLineMat} />
        <mesh ref={ledRef2} geometry={ledGeo2} position={[0.035, 0, 0.032]} material={ledMat2} />
      </group>
      <mesh ref={flashRef2} geometry={flashGeo2} position={[0, -0.02, 0.001]} material={flashMat2} />
    </group>
  )
}
