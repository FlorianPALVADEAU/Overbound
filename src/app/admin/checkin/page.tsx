'use client'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { useEffect, useRef, useState } from 'react'

export default function Checkin() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [result, setResult] = useState<string>('')

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader()
    let stopped = false
    ;(async () => {
      const devices = await BrowserMultiFormatReader.listVideoInputDevices()
      await codeReader.decodeFromVideoDevice(devices[0]?.deviceId, videoRef.current!, (res) => {
        if (res && !stopped) {
          setResult(res.getText())
          fetch('/api/checkin', { method: 'POST', body: JSON.stringify({ token: res.getText() }) })
          stopped = true
        }
      })
    })()
    return () => {
      stopped = true
    }
  }, [])

  return (
    <main className="p-6">
      <video ref={videoRef} className="w-full max-w-md" />
      <div className="mt-4">{result}</div>
    </main>
  )
}