import { useEffect, useRef } from 'react'

/**
 * Hook polling yang pintar:
 * - Berhenti ketika condition stopFn bernilai true (misal: order sudah selesai/batal)
 * - Berhenti saat tab tidak aktif (document.hidden / visibilitychange) untuk hemat bandwidth & CPU
 * - Melakukan cleanup effect saat komponen unmount
 */
export function usePolling(callback, intervalMs = 6000, shouldStop = false) {
  const savedCallback = useRef(callback)
  const isTabVisible = useRef(!document.hidden)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (shouldStop) return

    let timerId = null

    const tick = async () => {
      if (isTabVisible.current && savedCallback.current) {
        try {
          await savedCallback.current()
        } catch (e) {
          console.warn('Polling error:', e)
        }
      }
    }

    const handleVisibilityChange = () => {
      isTabVisible.current = !document.hidden
      if (isTabVisible.current) {
        // Langsung eksekusi 1 kali saat user kembali ke tab
        tick()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    timerId = setInterval(tick, intervalMs)

    return () => {
      if (timerId) clearInterval(timerId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [intervalMs, shouldStop])
}
