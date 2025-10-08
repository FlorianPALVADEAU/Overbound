'use client'

import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'

interface SignaturePadProps {
  onChange: (dataUrl: string | null) => void
  height?: number
}

export default function SignaturePad({ onChange, height = 220 }: SignaturePadProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawing = useRef(false)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const dimensionsRef = useRef({ width: 600, height })
  const blankSnapshotRef = useRef<string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resizeCanvas = () => {
      const ratio = window.devicePixelRatio || 1
      const width = container.offsetWidth || 600
      const adjustedHeight = height
      dimensionsRef.current = { width, height: adjustedHeight }

      canvas.width = width * ratio
      canvas.height = adjustedHeight * ratio
      canvas.style.width = `${width}px`
      canvas.style.height = `${adjustedHeight}px`

      const context = canvas.getContext('2d')
      if (!context) return
      contextRef.current = context
      context.setTransform(1, 0, 0, 1, 0, 0)
      context.scale(ratio, ratio)
      context.lineCap = 'round'
      context.lineJoin = 'round'
      context.lineWidth = 2
      context.strokeStyle = 'hsl(var(--foreground))'
      context.fillStyle = 'white'
      context.fillRect(0, 0, width, adjustedHeight)
      blankSnapshotRef.current = canvas.toDataURL('image/png')
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [height])

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    const context = contextRef.current
    if (!canvas || !context) return

    const { x, y } = getCoordinates(event, canvas)
    context.beginPath()
    context.moveTo(x, y)
    drawing.current = true
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const canvas = canvasRef.current
    const context = contextRef.current
    if (!canvas || !context) return

    const { x, y } = getCoordinates(event, canvas)
    context.lineTo(x, y)
    context.stroke()
  }

  const endDrawing = () => {
    if (!drawing.current) return
    drawing.current = false
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    if (blankSnapshotRef.current && dataUrl === blankSnapshotRef.current) {
      onChange(null)
    } else {
      onChange(dataUrl)
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const context = contextRef.current
    if (!canvas || !context) return
    context.save()
    context.setTransform(1, 0, 0, 1, 0, 0)
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.restore()
    context.fillStyle = 'white'
    const { width, height: heightPx } = dimensionsRef.current
    context.fillRect(0, 0, width, heightPx)
    blankSnapshotRef.current = canvas.toDataURL('image/png')
    onChange(null)
  }

  return (
    <div ref={containerRef} className="space-y-3">
      <div className="rounded-lg border border-muted bg-white shadow-sm">
        <canvas
          ref={canvasRef}
          className="w-full touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrawing}
          onPointerLeave={endDrawing}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Signature manuscrite : utilisez votre souris ou votre doigt pour signer.</span>
        <Button type="button" variant="outline" size="sm" onClick={clearCanvas}>
          Effacer
        </Button>
      </div>
    </div>
  )
}

function getCoordinates(event: React.PointerEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect()
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}
