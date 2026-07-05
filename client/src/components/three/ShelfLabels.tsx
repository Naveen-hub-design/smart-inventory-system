import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RACK_POS, RACK_LABELS, rackStock } from './DronePath'

const sharedLabelGeo = new THREE.PlaneGeometry(0.6, 0.25)

function createLabelTexture(label: string, pct: number) {
  const c = document.createElement('canvas')
  c.width = 256; c.height = 96
  const ctx = c.getContext('2d')!

  ctx.fillStyle = 'rgba(10, 10, 18, 0.75)'
  ctx.beginPath()
  ctx.roundRect(0, 0, 256, 96, 6)
  ctx.fill()

  ctx.strokeStyle = 'rgba(68, 136, 255, 0.3)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(1, 1, 254, 94, 5)
  ctx.stroke()

  ctx.fillStyle = '#88ccff'
  ctx.font = 'bold 28px Arial'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, 16, 38)

  ctx.font = 'bold 24px Arial'
  if (pct > 0.4) ctx.fillStyle = '#44ff88'
  else if (pct > 0.2) ctx.fillStyle = '#ffcc44'
  else ctx.fillStyle = '#ff4444'
  ctx.textAlign = 'right'
  ctx.fillText(`${Math.round(pct * 100)}%`, 240, 38)

  if (pct < 0.2) {
    ctx.fillStyle = '#ff4444'
    ctx.font = 'bold 18px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('LOW', 128, 74)
  } else if (pct > 0.7) {
    ctx.fillStyle = 'rgba(68, 255, 136, 0.3)'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('STOCK OK', 128, 74)
  }

  const tex = new THREE.CanvasTexture(c)
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  return tex
}

const texCache = new Map<string, THREE.CanvasTexture>()

function getOrCreateTexture(label: string, pct: number) {
  const key = `${label}-${Math.round(pct * 100)}`
  if (texCache.has(key)) return texCache.get(key)!
  const tex = createLabelTexture(label, pct)
  texCache.set(key, tex)
  return tex
}

function clearCache() {
  texCache.forEach((tex) => tex.dispose())
  texCache.clear()
}

export default function ShelfLabels() {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([])
  const lastPct = useRef<number[]>(Array.from({ length: 24 }, () => -1))

  useFrame(() => {
    for (let i = 0; i < 24; i++) {
      const lvl = rackStock[i].level
      const pct = Math.round(lvl * 100)
      if (pct === lastPct.current[i]) continue
      lastPct.current[i] = pct

      const mesh = meshRefs.current[i]
      if (!mesh) continue
      const label = RACK_LABELS[i]
      const tex = getOrCreateTexture(label, lvl)
      const mat = mesh.material as THREE.MeshBasicMaterial
      if (mat.map && mat.map !== tex) {
        const old = mat.map
        mat.map = tex
        mat.needsUpdate = true
        setTimeout(() => { if (old) old.dispose() }, 0)
      } else if (!mat.map || mat.map !== tex) {
        mat.map = tex
        mat.needsUpdate = true
      }
    }
  })

  useEffect(() => () => clearCache(), [])

  return (
    <group>
      {RACK_POS.map((rp, i) => {
        const isLeft = rp[0] < 0
        const facingX = isLeft ? -1 : 1
        const overhead = 0.30
        return (
          <mesh
            key={`label-${i}`}
            ref={(el) => { meshRefs.current[i] = el }}
            geometry={sharedLabelGeo}
            position={[rp[0] + facingX * overhead, 3.5, rp[1]]}
          >
            <meshBasicMaterial
              map={getOrCreateTexture(RACK_LABELS[i], rackStock[i].level)}
              transparent
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        )
      })}
    </group>
  )
}
