'use client'

import { useEffect, useRef, useState } from 'react'

interface ScanResult {
  result: 'accepted' | 'denied'
  delegateName: string
  checkedInAt: string | null
}

interface Props {
  scannerId: string
}

export default function QRScanner({ scannerId }: Props) {
  const scannerRef = useRef<{ clear: () => void } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [feedback, setFeedback] = useState<ScanResult | null>(null)
  const [scanning, setScanning] = useState(false)
  const processingRef = useRef(false)

  useEffect(() => {
    let html5QrCode: { start: Function; stop: Function; clear: Function } | null = null

    async function startScanner() {
      const { Html5Qrcode } = await import('html5-qrcode')
      const id = 'qr-reader'
      html5QrCode = new Html5Qrcode(id)
      scannerRef.current = html5QrCode as unknown as { clear: () => void }

      try {
        await (html5QrCode as { start: Function }).start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText: string) => {
            if (processingRef.current) return
            processingRef.current = true

            // Extract token from URL or use raw value
            let token = decodedText
            try {
              const url = new URL(decodedText)
              const parts = url.pathname.split('/')
              token = parts[parts.length - 1]
            } catch {
              // not a URL, use as-is
            }

            const res = await fetch('/api/checkin', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token, scannerId }),
            })
            const data: ScanResult = await res.json()
            setFeedback(data)

            setTimeout(() => {
              setFeedback(null)
              processingRef.current = false
            }, 2500)
          },
          undefined
        )
        setScanning(true)
      } catch (err) {
        console.error('Camera error', err)
      }
    }

    startScanner()

    return () => {
      html5QrCode?.stop().then(() => html5QrCode?.clear()).catch(() => {})
    }
  }, [scannerId])

  return (
    <div className="relative w-full h-screen bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Camera viewport */}
      <div ref={containerRef} className="w-full max-w-sm">
        <div id="qr-reader" className="w-full" />
      </div>

      {!scanning && !feedback && (
        <p className="text-white text-sm mt-4 animate-pulse">Starting camera…</p>
      )}

      {/* Overlay feedback */}
      {feedback && (
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center text-white text-center px-6 transition-all ${
            feedback.result === 'accepted' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          <div className="text-6xl mb-4">
            {feedback.result === 'accepted' ? '✓' : '✗'}
          </div>
          <p className="text-2xl font-bold mb-2">
            {feedback.result === 'accepted' ? 'Accepted' : 'Denied'}
          </p>
          <p className="text-lg font-medium">{feedback.delegateName}</p>
          {feedback.result === 'denied' && feedback.checkedInAt && (
            <p className="text-sm mt-2 opacity-80">
              Already checked in at{' '}
              {new Date(feedback.checkedInAt).toLocaleTimeString()}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
