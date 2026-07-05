import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const origin = new THREE.Vector3(0, 1.5, 0)
const orbitCenter = new THREE.Vector3()
const smoothPos = new THREE.Vector3()
const targetPos = new THREE.Vector3()

export default function CameraController() {
  const { camera } = useThree()
  const mouseTarget = useRef({ x: 0, y: 0 })
  const mouseCurrent = useRef({ x: 0, y: 0 })
  const orbitAngle = useRef(0.8)
  const orbitRadius = useRef(18)
  const heightCurrent = useRef(5)
  const heightTarget = useRef(5)
  const idleTimer = useRef(0)
  const isIdle = useRef(false)
  const idleLookDir = useRef(1)

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      mouseTarget.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouseTarget.current.y = -(e.clientY / window.innerHeight - 0.5) * 2
      idleTimer.current = 0
      isIdle.current = false
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const dt = Math.min(state.clock.getDelta(), 0.05)
    idleTimer.current += dt

    mouseCurrent.current.x += (mouseTarget.current.x - mouseCurrent.current.x) * (isIdle.current ? 0.005 : 0.03)
    mouseCurrent.current.y += (mouseTarget.current.y - mouseCurrent.current.y) * (isIdle.current ? 0.005 : 0.03)

    if (idleTimer.current > 5 && !isIdle.current) {
      isIdle.current = true
      idleLookDir.current = Math.random() > 0.5 ? 1 : -1
    }

    if (isIdle.current) {
      const idleAngle = t * 0.03 * idleLookDir.current
      mouseTarget.current.x = Math.sin(idleAngle) * 0.6
      mouseTarget.current.y = Math.sin(t * 0.02 + 1) * 0.3
    }

    orbitAngle.current += 0.001 + mouseCurrent.current.x * 0.00018

    heightTarget.current = 5 + Math.sin(t * 0.035) * 0.8 + (isIdle.current ? Math.sin(t * 0.01) * 0.4 : 0)
    heightCurrent.current += (heightTarget.current - heightCurrent.current) * dt * 0.3

    const speed = isIdle.current ? 0.5 : 0.8
    const slowZone = 0.98

    orbitCenter.copy(origin)
    const blend = isIdle.current ? 0.08 : 0.15
    orbitCenter.x += mouseCurrent.current.x * 1.5 * (isIdle.current ? 0.5 : 1)
    orbitCenter.z += mouseCurrent.current.y * 1.2 * (isIdle.current ? 0.3 : 1)

    const dampFactor = isIdle.current ? 0.02 : 0.04
    targetPos.x = Math.sin(orbitAngle.current) * orbitRadius.current + mouseCurrent.current.x * 1.8
    targetPos.z = Math.cos(orbitAngle.current) * orbitRadius.current + mouseCurrent.current.y * 1.5
    targetPos.y = heightCurrent.current + mouseCurrent.current.y * 0.5

    smoothPos.copy(camera.position)
    smoothPos.lerp(targetPos, isIdle.current ? 0.015 : 0.04)

    camera.position.copy(smoothPos)
    camera.lookAt(orbitCenter)
  })

  return null
}
