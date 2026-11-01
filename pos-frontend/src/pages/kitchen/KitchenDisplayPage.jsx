import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { useAuthStore } from '../../stores/authStore'
import { useChime } from '../../hooks/useChime'
import { useOrderStream } from '../../hooks/useOrderStream'
import { 
  Utensils, Clock, CheckCircle2, Volume2, VolumeX, Maximize2, 
  ArrowLeft, RefreshCw, ChefHat, AlertTriangle
} from 'lucide-react'

export function KitchenDisplayPage() {
  const { user, logout } = useAuthStore()
  const { playSuccessChime } = useChime()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [completedTickets, setCompletedTickets] = useState(new Set())
  const prevOrderCountRef = useRef(0)

  const fetchKitchenOrders = async () => {
    try {
      // Dapur memantau pesanan yang SUDAH dikonfirmasi kasir (status: processing)
      const res = await api.get('/orders?today_only=1&status=processing')
      let list = res.data?.data || res.data || res || []
      
      // Jika belum ada yang processing, periksa juga pesanan aktif hari ini
      if (list.length === 0) {
        const fallbackRes = await api.get('/orders?today_only=1').catch(() => null)
        const fallbackList = fallbackRes?.data?.data || fallbackRes?.data || []
        list = fallbackList.filter(o => o.status === 'processing' || (o.status === 'completed' && !completedTickets.has(o.id)))
      }

      // Filter out tickets yang sudah disajikan
      const activeTickets = list.filter(o => !completedTickets.has(o.id))

      // Trigger audio chime saat pesanan baru masuk dari kasir
      if (soundEnabled && activeTickets.length > prevOrderCountRef.current && prevOrderCountRef.current > 0) {
        playSuccessChime()
      }
      prevOrderCountRef.current = activeTickets.length
      setOrders(activeTickets)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Fallback Polling dengan Tab Visibility Guard (frekuensi santai karena ada push SSE)
  useEffect(() => {
    fetchKitchenOrders()

    const timer = setInterval(() => {
      if (!document.hidden) {
        fetchKitchenOrders()
      }
    }, 30000)

    const handleVisibility = () => {
      if (!document.hidden) {
        fetchKitchenOrders()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [soundEnabled])

  // Real-time SSE: Memperbarui tampilan dapur secara instan begitu ada pesanan baru/konfirmasi kasir
  useOrderStream(
    useCallback(() => {
      fetchKitchenOrders()
    }, [])
  )

  const handleMarkReady = async (orderId) => {
    playSuccessChime()
    setCompletedTickets(prev => new Set([...prev, orderId]))
    setOrders(prev => prev.filter(o => o.id !== orderId))
    try {
      await api.post(`/orders/${orderId}/serve`)
    } catch (err) {
      console.error('Gagal memanggil endpoint serve:', err)
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  // Calculate elapsed time in minutes
  const getElapsedMinutes = (createdAt) => {
    const diffMs = Date.now() - new Date(createdAt).getTime()
    return Math.floor(diffMs / (1000 * 60))
  }

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col font-sans select-none">
      
      {/* KDS Header */}
      <header className="h-16 bg-stone-950 px-6 flex items-center justify-between border-b border-stone-800 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-sun-400 text-stone-950 flex items-center justify-center font-bold">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-lg text-white leading-tight">
              Kitchen Display System (KDS)
            </h1>
            <p className="text-[11px] text-stone-400 font-mono">
              Antrean Tiket Dapur & Barista Arunika • Live Updates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border transition cursor-pointer ${
              soundEnabled
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/40 hover:bg-emerald-900'
                : 'bg-stone-800 text-stone-400 border-stone-700 hover:bg-stone-700'
            }`}
            title={soundEnabled ? 'Suara Pesanan Aktif' : 'Suara Dimatikan'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Fullscreen */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition cursor-pointer"
            title="Layar Penuh (Fullscreen)"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Refresh */}
          <button
            type="button"
            onClick={fetchKitchenOrders}
            className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition cursor-pointer"
            title="Muat Ulang"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-stone-800" />

          <Link
            to="/pos"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-300 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ke POS</span>
          </Link>
        </div>
      </header>

      {/* Ticket Grid Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        {loading ? (
          <div className="py-24 text-center text-stone-500 text-sm">
            Sinkronisasi tiket dapur...
          </div>
        ) : orders.length === 0 ? (
          <div className="py-24 text-center text-stone-500 space-y-3">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto opacity-70" />
            <h3 className="font-serif text-xl font-bold text-stone-300">Semua Pesanan Selesai Disajikan!</h3>
            <p className="text-xs text-stone-400">Tidak ada tiket pesanan menunggu di dapur saat ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {orders.map((order) => {
              const elapsed = getElapsedMinutes(order.created_at)
              const isUrgent = elapsed >= 15
              const isWarning = elapsed >= 8 && elapsed < 15

              return (
                <div
                  key={order.id}
                  className={`rounded-3xl border flex flex-col justify-between overflow-hidden shadow-2xl transition duration-200 ${
                    isUrgent
                      ? 'bg-red-950/40 border-red-500/80'
                      : isWarning
                      ? 'bg-amber-950/30 border-amber-500/80'
                      : 'bg-stone-800/90 border-stone-700'
                  }`}
                >
                  {/* Ticket Header */}
                  <div className={`p-4 border-b flex items-center justify-between ${
                    isUrgent ? 'bg-red-900/60 border-red-500/40' : isWarning ? 'bg-amber-900/40 border-amber-500/30' : 'bg-stone-900 border-stone-700'
                  }`}>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                        {order.order_type === 'dine_in' ? 'Dine-In' : 'Takeaway'}
                      </span>
                      <h4 className="font-mono text-xl font-bold text-white">
                        {order.table?.table_number ? `MEJA ${order.table.table_number}` : 'BUNGKUS'}
                      </h4>
                    </div>

                    <div className="text-right space-y-1">
                      <span className="text-[11px] font-mono text-stone-400 block">
                        {order.invoice_number}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-xs font-bold ${
                        isUrgent ? 'bg-red-500 text-white animate-pulse' : isWarning ? 'bg-amber-500 text-stone-950' : 'bg-stone-700 text-stone-300'
                      }`}>
                        <Clock className="w-3 h-3" />
                        <span>{elapsed} mnt</span>
                      </span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="p-4 flex-1 space-y-3 overflow-y-auto max-h-72">
                    {(order.items || []).map((item, idx) => (
                      <div key={idx} className="pb-2 border-b border-stone-700/60 last:border-none last:pb-0">
                        <div className="flex items-start gap-2.5">
                          <span className="font-mono text-lg font-bold text-sun-400 shrink-0">
                            {item.quantity}x
                          </span>
                          <div className="flex-1">
                            <span className="font-bold text-stone-100 text-sm leading-tight block">
                              {item.product?.name || item.name}
                            </span>
                            {item.notes && (
                              <p className="text-xs font-semibold text-sun-300 mt-0.5 bg-stone-900/80 px-2 py-0.5 rounded-md inline-block">
                                ⚠️ Catatan: {item.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Serve Button */}
                  <div className="p-4 bg-stone-900/80 border-t border-stone-700/60">
                    <button
                      type="button"
                      onClick={() => handleMarkReady(order.id)}
                      className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Selesai Dimasak (Siap Saji)</span>
                    </button>
                  </div>

                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
