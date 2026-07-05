import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { forkliftPos } from './Forklift'

const origin = new THREE.Vector3(0, 1.5, 0)
const orbitCenter = new THREE.Vector3()

export default function ForkliftCameraController() {
  const { camera } = useThree()
  const mouseTarget = useRef({ x: 0, y: 0 })
  const mouseCurrent = useRef({ x: 0, y: 0 })
  const orbitAngle = useRef(0.8)
  const orbitRadius = useRef(18)
  const heightTarget = useRef(5)
  const heightCurrent = useRef(5)

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      mouseTarget.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouseTarget.current.y = -(e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  useFrame((state) => {
    const t = state.clock.elapsedTime

    mouseCurrent.current.x += (mouseTarget.current.x - mouseCurrent.current.x) * 0.015
    mouseCurrent.current.y += (mouseTarget.current.y - mouseCurrent.current.y) * 0.015

    orbitAngle.current += 0.001 + mouseCurrent.current.x * 0.00015

    const targetHeight = 5 + Math.sin(t * 0.035) * 0.5
    heightCurrent.current += (targetHeight - heightCurrent.current) * 0.003

    orbitCenter.copy(origin)
    orbitCenter.lerp(forkliftPos, 0.12)

    const x = Math.sin(orbitAngle.current) * orbitRadius.current + mouseCurrent.current.x * 1.5
    const z = Math.cos(orbitAngle.current) * orbitRadius.current + mouseCurrent.current.y * 1.2
    const y = heightCurrent.current + mouseCurrent.current.y * 0.4

    camera.position.x = x
    camera.position.y = y
    camera.position.z = z
    camera.lookAt(orbitCenter)
  })

  return null
}
