import { useEffect, useRef } from 'react'

/**
 * Hook polling cerdas Arunika:
 * - Menerima format object { interval, enabled } atau positional (intervalMs, shouldStop)
 * - Berhenti ketika shouldStop / !enabled
 * - Hemat baterai & bandwidth: jeda saat tab background (document.hidden), lanjut otomatis saat tab aktif
 * - Melakukan cleanup effect saat komponen unmount
 */
export function usePolling(callback, optionsOrInterval = 2500, legacyShouldStop = false) {
  const savedCallback = useRef(callback)
  const isTabVisible = useRef(typeof document !== 'undefined' ? !document.hidden : true)

  // Ekstrak interval & status stop
  let intervalMs = 2500
  let isStopped = false

  if (typeof optionsOrInterval === 'object' && optionsOrInterval !== null) {
    intervalMs = Number(optionsOrInterval.interval || optionsOrInterval.intervalMs || 2500)
    if (optionsOrInterval.enabled !== undefined) {
      isStopped = !optionsOrInterval.enabled
    } else if (optionsOrInterval.shouldStop !== undefined) {
      isStopped = Boolean(optionsOrInterval.shouldStop)
    }
  } else {
    intervalMs = typeof optionsOrInterval === 'number' ? optionsOrInterval : 2500
    isStopped = Boolean(legacyShouldStop)
  }

  // Jaga callback tetap fresh
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (isStopped) return

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
      if (typeof document === 'undefined') return
      isTabVisible.current = !document.hidden
      if (isTabVisible.current) {
        // Langsung eksekusi 1 kali saat user kembali ke tab
        tick()
      }
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }

    // Jalankan segera tick pertama setelah delay singkat
    const initialTimer = setTimeout(tick, 300)

    timerId = setInterval(tick, Math.max(1000, intervalMs))

    return () => {
      clearTimeout(initialTimer)
      if (timerId) clearInterval(timerId)
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [intervalMs, isStopped])
}
