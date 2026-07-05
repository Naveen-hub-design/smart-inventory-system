import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scanData } from './BarcodeScanner'

const panelGeo = new THREE.PlaneGeometry(1.0, 0.55)

function createCanvasTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 280
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  const tex = new THREE.CanvasTexture(canvas)
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  return { canvas, ctx, tex }
}

function drawPanel(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  products: number, orders: number, materials: number,
  stockIn: number, stockTimer: number,
) {
  ctx.clearRect(0, 0, w, h)

  ctx.fillStyle = 'rgba(8, 18, 38, 0.78)'
  roundRect(ctx, 0, 0, w, h, 10)
  ctx.fill()

  ctx.strokeStyle = 'rgba(68, 136, 255, 0.25)'
  ctx.lineWidth = 2
  roundRect(ctx, 0, 0, w, h, 10)
  ctx.stroke()

  ctx.fillStyle = '#5588cc'
  ctx.font = 'bold 18px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText('INVENTORY', w / 2, 14)

  ctx.strokeStyle = 'rgba(68, 136, 255, 0.1)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(20, 44)
  ctx.lineTo(w - 20, 44)
  ctx.stroke()

  const items = [
    { label: 'Products', val: products, color: '#6699ff', bar: (products % 25) / 25 },
    { label: 'Orders', val: orders, color: '#44aaff', bar: (orders % 25) / 25 },
    { label: 'Materials', val: materials, color: '#6699ff', bar: (materials % 25) / 25 },
  ]

  ctx.font = '15px Arial'
  items.forEach((item, i) => {
    const y = 56 + i * 32

    ctx.fillStyle = item.color
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(item.label, 24, y)

    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'right'
    ctx.fillText(String(item.val), w - 24, y)

    ctx.fillStyle = 'rgba(68, 136, 255, 0.08)'
    ctx.fillRect(24, y + 22, w - 48, 3)
    ctx.fillStyle = 'rgba(68, 136, 255, 0.35)'
    ctx.fillRect(24, y + 22, (w - 48) * item.bar, 3)
  })

  if (stockTimer > 0) {
    const alpha = Math.min(1, stockTimer / 0.5) * (stockTimer > 2 ? (3 - stockTimer) : 1)
    ctx.fillStyle = `rgba(68, 255, 136, ${Math.max(0, alpha)})`
    ctx.font = '13px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(`+${stockIn} Stock In`, w / 2, 224)
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export default function InventoryCounter() {
  const { canvas, ctx, tex } = useMemo(createCanvasTexture, [])
  const meshRef = useRef<THREE.Mesh>(null)

  const displayProducts = useRef(208)
  const displayOrders = useRef(15)
  const displayMaterials = useRef(104)
  const displayStockIn = useRef(0)
  const stockTimer = useRef(0)
  const lastKey = useRef('')

  useFrame((state, delta) => {
    displayProducts.current += (scanData.products - displayProducts.current) * delta * 3
    displayOrders.current += (scanData.orders - displayOrders.current) * delta * 3
    displayMaterials.current += (scanData.materials - displayMaterials.current) * delta * 3

    if (scanData.justScanned) {
      displayStockIn.current = scanData.stockIn
      stockTimer.current = 3
    }
    stockTimer.current = Math.max(0, stockTimer.current - delta)

    const p = Math.round(displayProducts.current)
    const o = Math.round(displayOrders.current)
    const m = Math.round(displayMaterials.current)
    const s = scanData.stockIn
    const st = stockTimer.current
    const key = `${p}:${o}:${m}:${s}:${st > 0 ? Math.round(st * 10) : 0}`

    if (key !== lastKey.current) {
      lastKey.current = key
      drawPanel(ctx, canvas.width, canvas.height, p, o, m, s, st)
      tex.needsUpdate = true
    }
  })

  return (
    <group position={[-1.8, 1.0, 7.5]}>
      <mesh ref={meshRef} geometry={panelGeo} position={[0, 0, 0]}>
        <meshBasicMaterial map={tex} transparent depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  )
}
