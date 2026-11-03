import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import { useAuthStore } from '../../stores/authStore'
import { useChime } from '../../hooks/useChime'
import { useOrderStream } from '../../hooks/useOrderStream'
import { motion, AnimatePresence } from 'framer-motion'
import { springSnappy, springGentle } from '../../lib/motion'
import { 
  Utensils, Clock, CheckCircle2, Volume2, VolumeX, Maximize2, 
  ArrowLeft, RefreshCw, ChefHat, AlertTriangle, LogOut
} from 'lucide-react'

export function KitchenDisplayPage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleBack = () => {
    // Jika ada riwayat navigasi sebelumnya dalam sesi aplikasi
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1)
      return
    }
    // Fallback berdasarkan peran akun yang sedang aktif
    if (user?.role === 'admin' || user?.role === 'superadmin') {
      navigate('/admin/reports')
    } else {
      navigate('/pos')
    }
  }
  const { playSuccessChime } = useChime()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [completedTickets, setCompletedTickets] = useState(new Set())
  const [pendingAtCashierCount, setPendingAtCashierCount] = useState(0)
  const prevOrderCountRef = useRef(0)

  const fetchKitchenOrders = useCallback(async () => {
    try {
      // Dapur memantau pesanan yang SUDAH dikonfirmasi kasir (status: processing)
      const res = await api.get('/orders?today_only=1&status=processing&per_page=50')
      const list = res.data?.data || res.data || res || []
      setOrders(list)

      // Cek apakah ada pesanan tamu yang masih tertahan di kasir (pending konfirmasi)
      api.get('/orders/pending-count')
        .then(r => setPendingAtCashierCount(typeof r?.count === 'number' ? r.count : (r?.data?.count ?? 0)))
        .catch(() => {})

      // Bersihkan completedTickets yang sudah tidak ada di backend
      const activeIds = new Set(list.map(o => o.id))
      setCompletedTickets(prev => {
        const next = new Set([...prev].filter(id => activeIds.has(id)))
        return next
      })

      // Audio notification jika ada tiket baru bertambah
      if (list.length > prevOrderCountRef.current && soundEnabled && prevOrderCountRef.current !== 0) {
        playSuccessChime()
      }
      prevOrderCountRef.current = list.length
    } catch (err) {
      console.error('Error fetching kitchen orders:', err)
    } finally {
      setLoading(false)
    }
  }, [soundEnabled, playSuccessChime])

  // Real-time polling adaptif (fallback) + SSE Hook
  useOrderStream(() => {
    fetchKitchenOrders()
  })

  useEffect(() => {
    fetchKitchenOrders()
    const interval = setInterval(fetchKitchenOrders, 7000)
    return () => clearInterval(interval)
  }, [fetchKitchenOrders])

  const handleMarkReady = async (orderId) => {
    try {
      // Tandai visual dulu agar transisi exit smooth
      setCompletedTickets(prev => new Set([...prev, orderId]))
      await api.post(`/orders/${orderId}/serve`)
      playSuccessChime()
      setTimeout(() => {
        fetchKitchenOrders()
      }, 400)
    } catch (err) {
      console.error('Failed to mark order ready:', err)
      // Rollback jika gagal
      setCompletedTickets(prev => {
        const next = new Set(prev)
        next.delete(orderId)
        return next
      })
      alert(err.message || 'Gagal menyelesaikan pesanan di dapur')
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  const getElapsedMinutes = (createdAt) => {
    if (!createdAt) return 0
    const created = new Date(createdAt)
    const now = new Date()
    return Math.max(0, Math.floor((now - created) / 60000))
  }

  // Filter tiket yang belum diselesaikan
  const visibleOrders = useMemo(() => {
    return orders.filter(order => !completedTickets.has(order.id))
  }, [orders, completedTickets])

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col font-sans select-none">
      
      {/* KDS Header Bar */}
      <header className="h-auto py-2.5 min-h-16 bg-stone-950 border-b border-stone-800 px-3 sm:px-6 flex items-center justify-between shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg text-white tracking-wide flex items-center gap-2">
                <span className="hidden sm:inline">Dapur Arunika (KDS)</span><span className="sm:hidden">Dapur (KDS)</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </h1>
              <p className="text-[10px] text-stone-400 font-mono uppercase tracking-wider hidden sm:block">
                Kitchen Display System • Live Stream
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Active Orders Counter Badge */}
          <div className="px-3.5 py-1.5 rounded-full bg-stone-800 border border-stone-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sun-400" />
            <span className="font-mono text-xs font-bold text-stone-200">
              {visibleOrders.length} Dimasak
            </span>
          </div>

          {/* Pending at Cashier Badge */}
          {pendingAtCashierCount > 0 && (
            <div className="px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 animate-pulse">
              <span>⏳</span>
              <span className="hidden sm:inline">{pendingAtCashierCount} pesanan di kasir</span>
              <span className="sm:hidden">{pendingAtCashierCount} kasir</span>
            </div>
          )}

          {/* Sound Toggle */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border transition cursor-pointer ${
              soundEnabled
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                : 'bg-stone-800 border-stone-700 text-stone-500'
            }`}
            title={soundEnabled ? 'Suara Chime Aktif' : 'Suara Dimatikan'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </motion.button>

          {/* Manual Refresh */}
          <motion.button
            whileTap={{ scale: 0.95, rotate: 180 }}
            transition={{ duration: 0.3 }}
            type="button"
            onClick={fetchKitchenOrders}
            className="p-2.5 rounded-xl bg-stone-800 border border-stone-700 hover:bg-stone-700 text-stone-300 transition cursor-pointer"
            title="Refresh Antrean"
          >
            <RefreshCw className="w-4 h-4" />
          </motion.button>

          {/* Fullscreen Mode */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-stone-800 border border-stone-700 hover:bg-stone-700 text-stone-300 transition cursor-pointer"
            title="Layar Penuh (F11)"
          >
            <Maximize2 className="w-4 h-4" />
          </motion.button>

          {/* Logout Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="p-2.5 rounded-xl bg-stone-800 border border-stone-700 hover:bg-red-950/60 hover:border-red-500/50 hover:text-red-300 text-stone-400 transition cursor-pointer"
            title="Keluar / Ganti Akun"
          >
            <LogOut className="w-4 h-4" />
          </motion.button>
        </div>
      </header>

      {/* Tickets Content View */}
      <div className="flex-1 p-3 sm:p-6 overflow-y-auto">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-stone-400 py-32">
            <div className="w-10 h-10 border-3 border-sun-400 border-t-transparent rounded-full animate-spin" />
            <p className="font-mono text-xs">Memuat antrean tiket dapur...</p>
          </div>
        ) : visibleOrders.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springGentle}
            className="h-full flex flex-col items-center justify-center text-center py-32 space-y-3"
          >
            <div className="w-20 h-20 rounded-3xl bg-stone-800/80 border border-stone-700 flex items-center justify-center text-stone-500 shadow-inner">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="font-serif text-xl font-bold text-stone-300">Semua Pesanan Selesai Disajikan!</h3>
            <p className="text-xs text-stone-400">Tidak ada tiket pesanan menunggu di dapur saat ini.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
            <AnimatePresence mode="popLayout">
              {visibleOrders.map((order) => {
                const elapsed = getElapsedMinutes(order.created_at)
                const isUrgent = elapsed >= 15
                const isWarning = elapsed >= 8 && elapsed < 15

                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85, y: -24, transition: { duration: 0.22 } }}
                    transition={springSnappy}
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
                      <div className="overflow-hidden pr-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block truncate">
                          {order.order_type === 'dine_in' ? 'Dine-In' : 'Takeaway'}
                          {order.customer_name ? ` • ${order.customer_name}` : ''}
                        </span>
                        <h4 className="font-mono text-xl font-bold text-white truncate">
                          {order.table?.table_number 
                            ? `MEJA ${order.table.table_number}` 
                            : (order.order_type === 'dine_in' ? 'DINE-IN' : 'BUNGKUS')}
                        </h4>
                      </div>

                      <div className="text-right space-y-1 shrink-0">
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
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={() => handleMarkReady(order.id)}
                        className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Selesai Dimasak (Siap Saji)</span>
                      </motion.button>
                    </div>

                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

    </div>
  )
}
