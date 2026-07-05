import * as THREE from 'three'

const sharedPostGeo = new THREE.BoxGeometry(0.08, 1.5, 0.08)
const sharedBeamGeo = new THREE.BoxGeometry(0.6, 0.06, 0.1)
const sharedLightGeo = new THREE.BoxGeometry(0.1, 0.04, 0.1)

export default function LoadingDock() {
  return (
    <group position={[7.2, 0.08, 7]}>
      <mesh position={[0, 0.75, -0.3]} geometry={sharedPostGeo}>
        <meshStandardMaterial color="#3a3a3a" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.75, 0.3]} geometry={sharedPostGeo}>
        <meshStandardMaterial color="#3a3a3a" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.48, 0]} geometry={sharedBeamGeo}>
        <meshStandardMaterial color="#4a4a4a" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.52, 0]} geometry={sharedLightGeo}>
        <meshBasicMaterial color="#4488ff" transparent opacity={0.9} />
      </mesh>
    </group>
  )
}
