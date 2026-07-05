import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RACK_POS, rackStock } from './DronePath'

const sharedIconGeo = new THREE.PlaneGeometry(0.15, 0.15)
const sharedBeaconGeo = new THREE.CylinderGeometry(0.02, 0.03, 0.04, 8)

const iconMat = new THREE.MeshBasicMaterial({ color: '#ff4444', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
const beaconMat = new THREE.MeshBasicMaterial({ color: '#ff4444', transparent: true, opacity: 0, depthWrite: false })

function createWarningTexture() {
  const c = document.createElement('canvas')
  c.width = 128; c.height = 128
  const ctx = c.getContext('2d')!

  ctx.fillStyle = 'rgba(255, 68, 68, 0.15)'
  ctx.beginPath()
  ctx.arc(64, 64, 60, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#ff4444'
  ctx.font = 'bold 48px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('!', 64, 64)

  ctx.strokeStyle = 'rgba(255, 68, 68, 0.4)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(64, 64, 52, 0, Math.PI * 2)
  ctx.stroke()

  const tex = new THREE.CanvasTexture(c)
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  return tex
}

const warningTex = createWarningTexture()

const LOW_THRESHOLD = 0.2

export default function InventoryAlert() {
  const iconRefs = useRef<(THREE.Mesh | null)[]>([])
  const beaconRefs = useRef<(THREE.Mesh | null)[]>([])

  useFrame((state) => {
    for (let i = 0; i < 24; i++) {
      const level = rackStock[i].level
      const isLow = level < LOW_THRESHOLD

      const icon = iconRefs.current[i]
      if (icon) {
        const mat = icon.material as THREE.MeshBasicMaterial
        if (isLow) {
          const pulse = Math.sin(state.clock.elapsedTime * 4 + i * 1.5) * 0.5 + 0.5
          mat.opacity = 0.3 + pulse * 0.5
          icon.visible = true
        } else {
          mat.opacity = 0
          icon.visible = false
        }
      }

      const beacon = beaconRefs.current[i]
      if (beacon) {
        const mat = beacon.material as THREE.MeshBasicMaterial
        if (isLow) {
          const pulse = Math.sin(state.clock.elapsedTime * 3 + i * 2) * 0.5 + 0.5
          mat.opacity = 0.2 + pulse * 0.6
          beacon.position.y = 3 + Math.sin(state.clock.elapsedTime * 2 + i) * 0.05
        } else {
          mat.opacity = 0
        }
      }
    }
  })

  return (
    <group>
      {RACK_POS.map((rp, i) => (
        <group key={`alert-${i}`}>
          <mesh
            ref={(el) => { iconRefs.current[i] = el }}
            geometry={sharedIconGeo}
            position={[rp[0], 5.2, rp[1]]}
          >
            <meshBasicMaterial map={warningTex} transparent depthWrite={false} opacity={0} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
          </mesh>
          <mesh
            ref={(el) => { beaconRefs.current[i] = el }}
            geometry={sharedBeaconGeo}
            position={[rp[0], 3, rp[1]]}
            material={beaconMat.clone()}
          />
        </group>
      ))}
    </group>
  )
}
