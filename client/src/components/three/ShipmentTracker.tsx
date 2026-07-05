import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const sharedBodyGeo = new THREE.BoxGeometry(0.5, 0.15, 0.25)
const sharedCabinGeo = new THREE.BoxGeometry(0.2, 0.12, 0.2)
const sharedWheelGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.03, 6)

const bodyMat = new THREE.MeshStandardMaterial({ color: '#4488cc', roughness: 0.4, metalness: 0.5 })
const cabinMat = new THREE.MeshStandardMaterial({ color: '#3366aa', roughness: 0.4, metalness: 0.5 })
const wheelMat = new THREE.MeshStandardMaterial({ color: '#222222', roughness: 0.8 })

interface Route { curve: THREE.CatmullRomCurve3; offset: number; speed: number }

function createTruck() {
  return (
    <group>
      <mesh geometry={sharedBodyGeo} position={[0, 0.1, 0]} material={bodyMat} />
      <mesh geometry={sharedCabinGeo} position={[-0.3, 0.08, 0]} material={cabinMat} />
      <mesh geometry={sharedWheelGeo} position={[0.15, 0.02, 0.13]} rotation={[Math.PI / 2, 0, 0]} material={wheelMat} />
      <mesh geometry={sharedWheelGeo} position={[0.15, 0.02, -0.13]} rotation={[Math.PI / 2, 0, 0]} material={wheelMat} />
      <mesh geometry={sharedWheelGeo} position={[-0.15, 0.02, 0.13]} rotation={[Math.PI / 2, 0, 0]} material={wheelMat} />
      <mesh geometry={sharedWheelGeo} position={[-0.15, 0.02, -0.13]} rotation={[Math.PI / 2, 0, 0]} material={wheelMat} />
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.04, 0.02, 0.04]} />
        <meshBasicMaterial color="#4488ff" transparent opacity={0.7} />
      </mesh>
    </group>
  )
}

function buildRoute(pts: THREE.Vector3[]): Route {
  const curve = new THREE.CatmullRomCurve3(pts)
  return { curve, offset: Math.random(), speed: 0.04 + Math.random() * 0.02 }
}

const ROUTE_CONFIGS = [
  { pts: [new THREE.Vector3(-10, 0.12, -2), new THREE.Vector3(-5, 0.12, 0), new THREE.Vector3(0, 0.12, 2), new THREE.Vector3(4, 0.12, 3)] },
  { pts: [new THREE.Vector3(-8, 0.12, -5), new THREE.Vector3(-3, 0.12, -1), new THREE.Vector3(0, 0.12, 2), new THREE.Vector3(5, 0.12, 5)] },
  { pts: [new THREE.Vector3(-6, 0.12, 0), new THREE.Vector3(-2, 0.12, 1), new THREE.Vector3(0, 0.12, 2), new THREE.Vector3(6, 0.12, 4)] },
]

function TruckInstance({ route }: { route: Route }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    route.offset += route.speed * delta
    if (route.offset >= 1) route.offset -= 1
    const u = route.offset
    const pt = route.curve.getPointAt(u)
    const tangent = route.curve.getTangentAt(u)
    if (groupRef.current) {
      groupRef.current.position.copy(pt)
      const angle = Math.atan2(tangent.x, tangent.z)
      groupRef.current.rotation.y = angle
    }
  })

  return <group ref={groupRef}>{createTruck()}</group>
}

function RouteLine({ route }: { route: Route }) {
  const pts = useMemo(() => route.curve.getPoints(30), [route.curve])
  const lineObj = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(pts)
    const mat = new THREE.LineBasicMaterial({ color: '#4488ff', transparent: true, opacity: 0.25 })
    return new THREE.Line(geo, mat)
  }, [pts])

  return <primitive object={lineObj} />
}

export default function ShipmentTracker() {
  const routes = useMemo(() => ROUTE_CONFIGS.map(r => buildRoute(r.pts)), [])

  return (
    <group position={[6, 0.08, 4]}>
      {routes.map((r, i) => (
        <group key={i}>
          <RouteLine route={r} />
          <TruckInstance route={r} />
        </group>
      ))}
    </group>
  )
}
