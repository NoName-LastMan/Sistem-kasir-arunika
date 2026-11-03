import { useEffect, useRef } from 'react'
import { useAuthStore } from '../stores/authStore'
import { BASE_URL } from '../api/client'

/**
 * Hook Server-Sent Events (SSE) untuk menerima notifikasi pesanan baru / perubahan status secara real-time.
 * Menggantikan polling berat dengan push streaming instan dari backend.
 */
export function useOrderStream(onOrderUpdate) {
  const { token } = useAuthStore()
  const eventSourceRef = useRef(null)
  const onUpdateRef = useRef(onOrderUpdate)

  useEffect(() => {
    onUpdateRef.current = onOrderUpdate
  }, [onOrderUpdate])

  useEffect(() => {
    let isMounted = true
    let eventSource = null

    const connect = () => {
      if (document.hidden || !token || !isMounted) return

      // Tutup koneksi lama jika ada
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      const streamUrl = `${BASE_URL}/orders/stream?token=${encodeURIComponent(token)}`
      try {
        eventSource = new EventSource(streamUrl)
        eventSourceRef.current = eventSource

        eventSource.addEventListener('order_update', (e) => {
          try {
            const data = JSON.parse(e.data)
            if (onUpdateRef.current) {
              onUpdateRef.current(data)
            }
          } catch {
            // Ignore parse error
          }
        })

        eventSource.onerror = () => {
          // EventSource akan otomatis reconnect sesuai petunjuk 'retry: 2500' dari server
          if (eventSource && eventSource.readyState === EventSource.CLOSED) {
            eventSource.close()
          }
        }
      } catch {
        // Fallback gracefully jika EventSource tidak didukung browser
      }
    }

    connect()

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (eventSourceRef.current) {
          eventSourceRef.current.close()
          eventSourceRef.current = null
        }
      } else {
        // Saat tab aktif kembali, sambungkan ulang SSE
        connect()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      isMounted = false
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [token])
}
