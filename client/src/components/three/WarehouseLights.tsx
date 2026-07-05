import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const STRIP_POSITIONS = [
  [-12, 5.8, -6], [-6, 5.8, -6], [0, 5.8, -6], [6, 5.8, -6], [12, 5.8, -6],
  [-12, 5.8, -2], [-6, 5.8, -2], [0, 5.8, -2], [6, 5.8, -2], [12, 5.8, -2],
  [-12, 5.8, 2],  [-6, 5.8, 2],  [0, 5.8, 2],  [6, 5.8, 2],  [12, 5.8, 2],
  [-12, 5.8, 6],  [-6, 5.8, 6],  [0, 5.8, 6],  [6, 5.8, 6],  [12, 5.8, 6],
]

const sharedStripGeo = new THREE.PlaneGeometry(2.5, 0.15)
const sharedGlowGeo = new THREE.PlaneGeometry(2.0, 0.6)
const dockLightGeo = new THREE.SpotLight(0xffeedd, 0.8, 8, Math.PI / 6, 0.5, 1)

const stripMat = new THREE.MeshBasicMaterial({ color: '#f0f4fa', transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide })
const glowMat = new THREE.MeshBasicMaterial({ color: '#d0d8e8', transparent: true, opacity: 0.06, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })

export default function WarehouseLights() {
  const stripRefs = useRef<(THREE.Mesh | null)[]>([])
  const glowRefs = useRef<(THREE.Mesh | null)[]>([])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    stripRefs.current.forEach((mesh, i) => {
      if (!mesh) return
      const mat = mesh.material as THREE.MeshBasicMaterial
      mat.opacity = 0.8 + Math.sin(t * 0.15 + i * 0.4) * 0.03
    })
    glowRefs.current.forEach((mesh, i) => {
      if (!mesh) return
      const mat = mesh.material as THREE.MeshBasicMaterial
      mat.opacity = 0.04 + Math.sin(t * 0.1 + i * 0.5) * 0.02
    })
  })

  return (
    <>
      <ambientLight intensity={0.35} color="#d0d8e8" />
      <directionalLight
        position={[0, 12, 0]}
        intensity={0.6}
        color="#f0f4fa"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={20}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.001}
      />
      <directionalLight position={[-5, 8, 5]} intensity={0.25} color="#d0d8e8" />
      <hemisphereLight args={['#e8eef5', '#6a7a95', 0.25]} />
      <fog attach="fog" args={['#181820', 10, 35]} />

      {STRIP_POSITIONS.map((pos, i) => (
        <group key={i}>
          <mesh
            ref={(el) => { stripRefs.current[i] = el }}
            position={[pos[0], pos[1], pos[2]]}
            geometry={sharedStripGeo}
            rotation={[-Math.PI / 2, 0, 0]}
            material={stripMat}
          />
          <mesh
            ref={(el) => { glowRefs.current[i] = el }}
            position={[pos[0], pos[1] - 0.01, pos[2]]}
            geometry={sharedGlowGeo}
            rotation={[-Math.PI / 2, 0, 0]}
            material={glowMat}
          />
        </group>
      ))}

      <spotLight position={[8, 1.5, 6.5]} angle={0.4} penumbra={0.5} intensity={0.4} color="#ffeedd" distance={10} decay={1} />
      <spotLight position={[7, 1.5, 7]} angle={0.5} penumbra={0.4} intensity={0.3} color="#ffeedd" distance={10} decay={1} />
    </>
  )
}
