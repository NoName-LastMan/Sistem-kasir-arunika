import { onMounted, onUnmounted } from 'vue'

export function useBarcodeScanner(onBarcodeScanned) {
  let buffer = ''
  let lastKeyTime = Date.now()
  const KEY_INTERVAL_THRESHOLD = 50 // ms antar keystroke scanner

  const handleKeyDown = (event) => {
    // Abaikan event jika sedang fokus di input text biasa (kecuali jika enter di scan input)
    const target = event.target
    const isInputElement = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')
    
    // Khusus input search barcode, kita biarkan scanner mengirim Enter
    if (isInputElement && !target.dataset.scannerInput) {
      return
    }

    const currentTime = Date.now()

    if (event.key === 'Enter') {
      if (buffer.length >= 2) {
        event.preventDefault()
        const scannedCode = buffer.trim()
        buffer = ''
        if (onBarcodeScanned) {
          onBarcodeScanned(scannedCode)
        }
      }
      buffer = ''
      return
    }

    // Hanya tangkap karakter yang printable
    if (event.key.length === 1) {
      if (currentTime - lastKeyTime > KEY_INTERVAL_THRESHOLD && buffer.length > 0) {
        // Jika jeda terlalu lama, reset buffer karena kemungkinan ketikan manual manusia
        buffer = ''
      }
      buffer += event.key
      lastKeyTime = currentTime
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })

  return {
    clearBuffer: () => { buffer = '' }
  }
}
