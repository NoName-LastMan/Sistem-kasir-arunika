import { useEffect, useRef } from 'react'

export function useBarcodeScanner(onScan) {
  const bufferRef = useRef('')
  const lastKeyTimeRef = useRef(0)

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in regular text inputs (unless scanner triggers enter)
      const target = e.target
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'

      const currentTime = Date.now()
      const timeDiff = currentTime - lastKeyTimeRef.current
      lastKeyTimeRef.current = currentTime

      if (e.key === 'Enter') {
        if (bufferRef.current.length > 2) {
          // Scanner finished barcode
          onScan(bufferRef.current)
          bufferRef.current = ''
          if (!isInput) e.preventDefault()
        }
        return
      }

      // HID Barcode Scanners transmit keys rapidly (< 50ms between strokes)
      if (e.key.length === 1) {
        if (timeDiff > 80) {
          // Normal manual typing or new scan starting
          bufferRef.current = e.key
        } else {
          bufferRef.current += e.key
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onScan])
}
