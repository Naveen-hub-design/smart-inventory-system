import { useState, useRef, useEffect, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import RoboticArm, { robotPhase, robotHolding } from './RoboticArm'
import Pallet, { StackedBox } from './Pallet'

const CATEGORIES = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3]

export default function SortingStation() {
  const [boxes, setBoxes] = useState<StackedBox[]>([])
  const counter = useRef(0)
  const prevHolding = useRef(false)

  useFrame(() => {
    if (robotHolding.current === false && prevHolding.current === true) {
      const id = counter.current++
      const total = boxes.length
      const layer = Math.floor(total / 4)
      const gridIdx = total % 4
      const cat = CATEGORIES[id % CATEGORIES.length]
      setBoxes((prev) => [...prev, { id, layer, gridIdx, category: cat }])
    }
    prevHolding.current = robotHolding.current
  })

  return (
    <group>
      <RoboticArm />
      <Pallet boxes={boxes} />
    </group>
  )
}
