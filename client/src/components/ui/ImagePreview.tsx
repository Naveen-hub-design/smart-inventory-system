import { useEffect, useState } from 'react'
import { X, ZoomIn, ZoomOut } from 'lucide-react'

interface ImagePreviewProps {
  src: string
  onClose: () => void
}

export default function ImagePreview({ src, onClose }: ImagePreviewProps) {
  const [scale, setScale] = useState(1)
  const [isFitToScreen, setIsFitToScreen] = useState(true)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleDoubleClick = () => {
    if (isFitToScreen) {
      setScale(1)
      setIsFitToScreen(false)
    } else {
      setScale(1)
      setIsFitToScreen(true)
    }
  }

  const zoomIn = () => {
    setScale(s => Math.min(5, s + 0.5))
    setIsFitToScreen(false)
  }

  const zoomOut = () => {
    setScale(s => Math.max(0.5, s - 0.5))
    setIsFitToScreen(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={handleOverlayClick}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all duration-200"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-center justify-center w-full h-full p-12 animate-scale-in">
        <img
          src={src}
          alt="Preview"
          className={`select-none transition-transform duration-200 ease-out cursor-pointer ${
            isFitToScreen
              ? 'max-w-full max-h-full object-contain'
              : ''
          }`}
          style={{ transform: isFitToScreen ? 'none' : `scale(${scale})` }}
          onDoubleClick={handleDoubleClick}
          draggable={false}
        />
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/50 backdrop-blur-md rounded-full px-4 py-2 animate-fade-in">
        <button onClick={zoomOut} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors" title="Zoom out">
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-white text-sm font-medium min-w-[3rem] text-center tabular-nums">
          {Math.round(scale * 100)}%
        </span>
        <button onClick={zoomIn} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors" title="Zoom in">
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
