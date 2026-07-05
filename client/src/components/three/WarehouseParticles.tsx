import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const COUNT = 1500
const BOUNDS = { x: 40, y: 6, z: 25 }

const texture = (() => {
  const c = document.createElement('canvas')
  c.width = 16
  c.height = 16
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(8, 8, 0, 8, 8, 8)
  g.addColorStop(0, 'rgba(220,225,235,1)')
  g.addColorStop(0.4, 'rgba(200,205,215,0.3)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 16, 16)
  return new THREE.CanvasTexture(c)
})()

export default function WarehouseParticles() {
  const ref = useRef<THREE.Points>(null)
  const speeds = useMemo(() => {
    return Array.from({ length: COUNT }, () => ({
      x: (Math.random() - 0.5) * 0.002,
      y: Math.random() * 0.001 + 0.0002,
      z: (Math.random() - 0.5) * 0.002,
    }))
  }, [])

  const geometry = useMemo(() => {
    const pos = new Float32Array(COUNT * 3)
    const sizes = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * BOUNDS.x
      pos[i * 3 + 1] = Math.random() * BOUNDS.y
      pos[i * 3 + 2] = (Math.random() - 0.5) * BOUNDS.z
      sizes[i] = Math.random() * 0.04 + 0.01
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    return geo
  }, [])

  useFrame((state) => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position.array as Float32Array
    const dt = state.clock.getDelta()
    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3
      pos[i3] += speeds[i].x * dt * 30
      pos[i3 + 1] += speeds[i].y * dt * 30
      pos[i3 + 2] += speeds[i].z * dt * 30
      if (pos[i3] > BOUNDS.x / 2) pos[i3] = -BOUNDS.x / 2
      if (pos[i3] < -BOUNDS.x / 2) pos[i3] = BOUNDS.x / 2
      if (pos[i3 + 1] > BOUNDS.y) pos[i3 + 1] = 0
      if (pos[i3 + 1] < 0) pos[i3 + 1] = BOUNDS.y
      if (pos[i3 + 2] > BOUNDS.z / 2) pos[i3 + 2] = -BOUNDS.z / 2
      if (pos[i3 + 2] < -BOUNDS.z / 2) pos[i3 + 2] = BOUNDS.z / 2
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={0.03}
        map={texture}
        transparent
        blending={THREE.NormalBlending}
        depthWrite={false}
        color="#c8ccd4"
        opacity={0.25}
        sizeAttenuation
      />
    </points>
  )
}
