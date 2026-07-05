import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { droneScanState, dronePos, RACK_POS, SCAN_ZONES } from './DronePath'

const sharedBeamGeo = new THREE.BoxGeometry(0.003, 0.003, 1)
const sharedGlowGeo = new THREE.BoxGeometry(0.012, 0.012, 1)
const sharedParticleGeo = new THREE.PlaneGeometry(0.006, 0.006)
const sharedShelfGlowGeo = new THREE.PlaneGeometry(1.2, 0.15)

const beamMat = new THREE.MeshBasicMaterial({ color: '#4488ff', transparent: true, opacity: 0.9, depthWrite: false })
const glowMat = new THREE.MeshBasicMaterial({ color: '#4488ff', transparent: true, opacity: 0.15, depthWrite: false, blending: THREE.AdditiveBlending })
const particleMat = new THREE.MeshBasicMaterial({ color: '#88ccff', transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide })
const shelfGlowMat = new THREE.MeshBasicMaterial({ color: '#4488ff', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })

const rackTarget = new THREE.Vector3()
const camFrom = new THREE.Vector3()
const beamDir = new THREE.Vector3()
const beamMid = new THREE.Vector3()
const zAxis = new THREE.Vector3(0, 0, 1)
const quat = new THREE.Quaternion()
const pVels: THREE.Vector3[] = Array.from({ length: 6 }, () => new THREE.Vector3())

export default function ShelfScanner() {
  const beamRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const particleRef = useRef<THREE.Group>(null)
  const shelfGlowRefs = useRef<(THREE.Mesh | null)[]>([])
  const particleLife = useRef(0)
  const lastRack = useRef(-1)

  useFrame((state, delta) => {
    const { isScanning, rackIndex: ri, zoneIndex, scanProgress: sp } = droneScanState

    if (!isScanning || ri < 0 || zoneIndex < 0) {
      if (beamRef.current) beamRef.current.visible = false
      if (glowRef.current) glowRef.current.visible = false
      if (particleRef.current) particleRef.current.visible = false
      shelfGlowRefs.current.forEach((sg) => {
        if (sg) (sg.material as THREE.MeshBasicMaterial).opacity = 0
      })
      lastRack.current = -1
      return
    }

    const rp = RACK_POS[ri]
    rackTarget.set(rp[0], 2.8, rp[1])
    camFrom.copy(dronePos).add(new THREE.Vector3(0, -0.03, 0.08))

    beamDir.copy(rackTarget).sub(camFrom)
    const len = beamDir.length()
    if (len < 0.1) return
    beamDir.divideScalar(len)

    beamMid.copy(camFrom).add(rackTarget).multiplyScalar(0.5)

    if (beamRef.current) {
      beamRef.current.position.copy(beamMid)
      beamRef.current.scale.z = len
      quat.setFromUnitVectors(zAxis, beamDir)
      beamRef.current.quaternion.copy(quat)
      beamRef.current.visible = true
      const op = 0.6 + Math.sin(state.clock.elapsedTime * 20) * 0.3
      ;(beamRef.current.material as THREE.MeshBasicMaterial).opacity = op
    }

    if (glowRef.current) {
      glowRef.current.position.copy(beamMid)
      glowRef.current.scale.z = len
      glowRef.current.quaternion.copy(quat)
      glowRef.current.visible = true
    }

    if (particleRef.current) {
      particleRef.current.visible = true
      particleLife.current += delta
      if (ri !== lastRack.current) {
        lastRack.current = ri
        particleLife.current = 0
        particleRef.current.children.forEach((child, i) => {
          child.position.set(0, 0, 0)
          ;((child as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.7
          pVels[i].set((Math.random() - 0.5) * 0.2, Math.random() * 0.15, (Math.random() - 0.5) * 0.2)
        })
      }
      particleRef.current.position.copy(rackTarget)
      particleRef.current.children.forEach((child, i) => {
        child.position.x += pVels[i].x * delta
        child.position.y += pVels[i].y * delta
        child.position.z += pVels[i].z * delta
        const m = (child as THREE.Mesh).material as THREE.MeshBasicMaterial
        m.opacity = particleLife.current > 0.3 ? 0 : 0.7 * (1 - particleLife.current / 0.3)
      })
    }

    const zoneRacks = SCAN_ZONES[zoneIndex]?.rackIndices || []
    zoneRacks.forEach((zri, i) => {
      const sg = shelfGlowRefs.current[zri]
      if (!sg) return
      if (zri === ri) {
        const pulse = Math.sin(state.clock.elapsedTime * 8) * 0.3 + 0.7
        ;(sg.material as THREE.MeshBasicMaterial).opacity = 0.2 * pulse
      } else {
        ;(sg.material as THREE.MeshBasicMaterial).opacity = 0
      }
    })
  })

  return (
    <group>
      <mesh ref={beamRef} geometry={sharedBeamGeo} visible={false} material={beamMat} />
      <mesh ref={glowRef} geometry={sharedGlowGeo} visible={false} material={glowMat} />
      <group ref={particleRef} visible={false}>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={`sp-${i}`} geometry={sharedParticleGeo} material={particleMat.clone()} />
        ))}
      </group>
      {RACK_POS.map((rp, i) => (
        <mesh
          key={`sg-${i}`}
          ref={(el) => { shelfGlowRefs.current[i] = el }}
          geometry={sharedShelfGlowGeo}
          position={[rp[0], 2.8, rp[1]]}
          material={shelfGlowMat.clone()}
        />
      ))}
    </group>
  )
}
