'use client'

import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'

interface SignaturePadProps {
  onChange: (dataUrl: string | null) => void
  height?: number
}

export default function SignaturePad({ onChange, height = 180 }: SignaturePadProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawing = useRef(false)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const dimensionsRef = useRef({ width: 300, height })
  const blankSnapshotRef = useRef<string | null>(null)
  const widthRef = useRef(0)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    // Sized to the box it sits in, and redrawn only when that width changes: on
    // phones the browser bars sliding in and out resize the window, which must
    // not wipe a signature.
    const fit = () => {
      const width = Math.floor(wrap.clientWidth)
      if (width === 0 || width === widthRef.current) return
      const hadSignature = widthRef.current !== 0
      widthRef.current = width

      const ratio = window.devicePixelRatio || 1
      dimensionsRef.current = { width, height }
      canvas.width = width * ratio
      canvas.height = height * ratio

      const context = canvas.getContext('2d')
      if (!context) return
      contextRef.current = context
      context.setTransform(1, 0, 0, 1, 0, 0)
      context.scale(ratio, ratio)
      context.lineCap = 'round'
      context.lineJoin = 'round'
      context.lineWidth = 2.5
      context.strokeStyle = '#111111'
      context.fillStyle = 'white'
      context.fillRect(0, 0, width, height)
      blankSnapshotRef.current = canvas.toDataURL('image/png')
      if (hadSignature) onChangeRef.current(null)
    }

    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(wrap)
    return () => observer.disconnect()
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
    <div className="w-full min-w-0 space-y-2">
      <div ref={wrapRef} className="w-full overflow-hidden rounded-xl border border-border bg-white">
        <canvas
          ref={canvasRef}
          style={{ height, width: '100%' }}
          className="block touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrawing}
          onPointerLeave={endDrawing}
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">Signe avec ton doigt ou ta souris.</span>
        <Button type="button" variant="outline" className="h-11 shrink-0" onClick={clearCanvas}>
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
