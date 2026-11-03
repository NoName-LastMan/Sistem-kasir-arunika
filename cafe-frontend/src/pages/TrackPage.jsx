import React, { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Clock, CheckCircle2, UtensilsCrossed, Volume2,
  VolumeX, ArrowLeft, RefreshCw, AlertCircle
} from 'lucide-react'
import { useOrderStore } from '../store/orderStore'
import { usePolling } from '../hooks/usePolling'
import { useChime } from '../hooks/useChime'
import { Button } from '../components/ui/Button'
import { formatCurrency } from '../api/mappers'
import { motion, AnimatePresence } from 'framer-motion'
import { springSnappy, fadeUp, springGentle } from '../lib/motion'

export function TrackPage() {
  const { id } = useParams()
  const activeOrder = useOrderStore(state => state.activeOrder)
  const fetchOrderStatus = useOrderStore(state => state.fetchOrderStatus)
  const cancelOrder = useOrderStore(state => state.cancelOrder)
  const [isCancelling, setIsCancelling] = useState(false)

  const handleCancelPendingOrder = async () => {
    if (!window.confirm('Apakah Anda yakin ingin membatalkan pesanan ini?')) return
    setIsCancelling(true)
    try {
      const orderIdentifier = activeOrder.invoiceNumber || activeOrder.id || id
      await cancelOrder(orderIdentifier, 'Dibatalkan oleh pelanggan dari layar pelacakan HP')
    } catch (err) {
      alert(err.friendlyMessage || err.message || 'Gagal membatalkan pesanan.')
    } finally {
      setIsCancelling(false)
    }
  }
  const { isMuted, toggleMute, playReadyChime } = useChime()

  const [isLoading, setIsLoading] = useState(!activeOrder)
  const [isManualRefreshing, setIsManualRefreshing] = useState(false)
  const previousStatusRef = useRef(activeOrder?.status)
  const [ariaAnnouncement, setAriaAnnouncement] = useState('')

  // Ambil data awal status pesanan
  useEffect(() => {
    setIsLoading(true)
    fetchOrderStatus(id).finally(() => {
      setIsLoading(false)
    })
  }, [id])

  const handleManualRefresh = async () => {
    setIsManualRefreshing(true)
    try {
      await fetchOrderStatus(id)
    } finally {
      setTimeout(() => setIsManualRefreshing(false), 500)
    }
  }

  // Cek jika status berubah dan picu chime saat siap
  useEffect(() => {
    if (!activeOrder) return

    const currentStatus = activeOrder.status
    const prevStatus = previousStatusRef.current

    if (currentStatus !== prevStatus) {
      previousStatusRef.current = currentStatus
      setAriaAnnouncement(`Pembaruan status pesanan: ${activeOrder.statusInfo?.label}`)

      if (currentStatus === 'ready' || currentStatus === 'completed') {
        playReadyChime()
      }
    }
  }, [activeOrder, playReadyChime])

  // Hook polling cerdas: berhenti jika status sudah selesai (terminal) atau tab disembunyikan
  const isTerminal = activeOrder?.statusInfo?.isTerminal || false
  usePolling(
    async () => {
      await fetchOrderStatus(id)
    },
    {
      interval: 2500,
      enabled: !isTerminal && Boolean(id)
    }
  )

  // Step indicator
  const steps = [
    { key: 'pending', label: 'Menunggu Konfirmasi', desc: 'Pesanan telah diterima sistem kasir', step: 1 },
    { key: 'processing', label: 'Sedang Disiapkan', desc: 'Barista & koki sedang meracik menu', step: 2 },
    { key: 'ready', label: 'Siap Disajikan', desc: 'Silakan ambil di counter atau tunggu diantar ke meja', step: 3 },
    { key: 'completed', label: 'Selesai', desc: 'Selamat menikmati sajian Arunika', step: 4 }
  ]

  const getStepNumber = (status) => {
    switch (status) {
      case 'pending': return 1
      case 'processing': return 2
      case 'ready': return 3
      case 'completed': return 4
      case 'cancelled': return 0
      default: return 1
    }
  }

  const currentStepNum = getStepNumber(activeOrder?.status)

  return (
    <div className="py-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Live Region Tersembunyi untuk Pembaca Layar (A11y) */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {ariaAnnouncement}
      </div>

      {/* Kontrol Bar Atas: Kembali & Refresh */}
      <div className="flex items-center justify-between mb-8">
        <Link
          to="/menu"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-pine-700 hover:text-forest-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Menu</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Tombol Refresh Status Manual */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleManualRefresh}
            disabled={isManualRefreshing}
            type="button"
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border border-forest-900/15 bg-white hover:bg-mint-100 text-forest-950 transition-colors touch-target shadow-2xs cursor-pointer disabled:opacity-50"
            title="Perbarui status pesanan sekarang"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-forest-800 ${isManualRefreshing ? 'animate-spin text-emerald-700' : ''}`} />
            <span className="hidden sm:inline">{isManualRefreshing ? 'Memperbarui...' : 'Perbarui Status'}</span>
          </motion.button>

          {/* Toggle Notifikasi Bunyi (Chime) */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={toggleMute}
            type="button"
            className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl border border-forest-900/15 bg-white hover:bg-mint-100 text-forest-950 transition-colors touch-target shadow-2xs cursor-pointer"
            aria-label={isMuted ? 'Aktifkan suara notifikasi pesanan' : 'Senyapkan suara notifikasi pesanan'}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-red-600" />
                <span>Bunyi: Mati</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Bunyi: Aktif</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl p-8 border-2 border-pine-200 shadow-warm-sm text-center py-16 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-mint-100 mx-auto mb-4" />
          <div className="h-6 w-48 bg-mint-100 mx-auto rounded-md mb-2" />
          <div className="h-4 w-64 bg-mint-100 mx-auto rounded-md" />
        </div>
      ) : activeOrder ? (
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springGentle}
          className="space-y-8"
        >
          {/* Kartu Status Header */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-pine-200 shadow-warm-md text-center relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-xs font-bold px-3.5 py-1 rounded-full bg-paper-100 border border-pine-200 text-forest-950 inline-block mb-3 shadow-2xs">
                Nomor Pesanan: <strong className="font-mono">{activeOrder.invoiceNumber || activeOrder.id}</strong>
              </span>

              <h1 className="text-2xl sm:text-3xl font-bold font-serif text-forest-950 mb-2">
                {activeOrder.statusInfo?.label}
              </h1>

              <p className="text-pine-700 text-sm max-w-md mx-auto mb-6 font-normal">
                {activeOrder.statusInfo?.description}
              </p>

              {/* Tag Info Meja */}
              <div className="inline-flex items-center gap-4 text-xs font-semibold text-forest-950 bg-paper-100 px-4 py-2 rounded-xl border border-pine-200 shadow-2xs">
                <span>Atas Nama: <strong>{activeOrder.customerName}</strong></span>
                <span>•</span>
                <span>Lokasi: <strong>Meja {activeOrder.tableCode}</strong></span>
              </div>
            </div>
          </div>

          {/* Jika Pesanan Dibatalkan / Void */}
          {(activeOrder.status === 'cancelled' || activeOrder.status === 'voided') ? (
            <div className="bg-red-50 rounded-2xl p-6 sm:p-8 border-2 border-red-200 text-center space-y-3 shadow-warm-sm">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-xl text-red-950">Pesanan Dibatalkan</h3>
              <p className="text-xs sm:text-sm text-red-800 max-w-md mx-auto">
                {activeOrder.statusInfo?.description || 'Pesanan ini telah dibatalkan oleh staf kasir. Silakan pesan kembali atau hubungi barista kami.'}
              </p>
              <div className="pt-2">
                <Link
                  to="/menu"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-900 text-white font-bold text-xs hover:bg-forest-800 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Pesan Menu Baru</span>
                </Link>
              </div>
            </div>
          ) : (
          /* Linimasa Alur Dapur (Menunggu -> Diproses -> Siap/Selesai) */
          <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-pine-200 shadow-warm-sm">
            <h2 className="font-serif font-bold text-lg text-forest-950 mb-6 pb-3 border-b-2 border-pine-200">
              Perjalanan Pesanan Anda
            </h2>

            <div className="space-y-6">
              {steps.map((st, idx) => {
                const isPassed = currentStepNum >= st.step
                const isCurrent = currentStepNum === st.step

                return (
                  <div key={st.key} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`relative w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        isPassed
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-paper-100 text-pine-600 border border-pine-200'
                      }`}>
                        {isCurrent && !isPassed && (
                          <span className="absolute -inset-1 rounded-full bg-emerald-600/30 animate-ping pointer-events-none" />
                        )}
                        {isPassed ? <CheckCircle2 className="w-4 h-4 stroke-[2.5]" /> : st.step}
                      </div>
                      {idx < steps.length - 1 && (
                        <div className={`w-0.5 h-10 my-1 transition-colors duration-500 ${
                          currentStepNum > st.step ? 'bg-emerald-600' : 'bg-pine-200'
                        }`} />
                      )}
                    </div>

                    <div className="flex-1 pt-1">
                      <div className="flex items-baseline justify-between">
                        <span className={`text-sm font-bold ${
                          isCurrent ? 'text-forest-950 font-serif text-base' : isPassed ? 'text-forest-950' : 'text-pine-600'
                        }`}>
                          {st.label}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-mint-100 border border-emerald-600 px-2 py-0.5 rounded-md animate-pulse">
                            Sedang Berjalan
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-pine-700 mt-0.5 font-normal">
                        {st.desc}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          )}

          {/* Tombol Batalkan Pesanan Mandiri (Hanya jika status MASIH pending) */}
          {activeOrder.status === 'pending' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs shadow-2xs">
              <div className="text-amber-950 font-medium">
                <span className="font-bold text-sm block mb-0.5">Salah pesan menu atau nomor meja?</span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Anda dapat membatalkan pesanan ini secara mandiri selama kasir belum memproses pembayaran.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCancelPendingOrder}
                disabled={isCancelling}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white border border-red-300 text-red-700 hover:bg-red-50 font-bold shrink-0 transition cursor-pointer disabled:opacity-50"
              >
                {isCancelling ? 'Membatalkan...' : 'Batalkan Pesanan'}
              </button>
            </div>
          )}

          {/* Rincian Item Pesanan */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-pine-200 shadow-warm-sm">
            <h3 className="font-serif font-bold text-base text-forest-950 mb-4 pb-3 border-b-2 border-pine-200">
              Rincian Item
            </h3>

            <div className="divide-y divide-pine-200">
              {(activeOrder.items || []).map((item, idx) => (
                <div key={idx} className="py-3 flex justify-between items-start text-xs sm:text-sm">
                  <div>
                    <span className="font-bold text-forest-950 block">
                      {item.quantity}x {item.product?.name || item.name}
                    </span>
                    {item.modifiers && (
                      <span className="text-xs text-pine-600 block mt-0.5">
                        +{item.modifiers}
                      </span>
                    )}
                    {item.notes && (
                      <span className="text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded italic block mt-0.5">
                        Catatan: {item.notes}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-forest-950 font-mono">
                    {formatCurrency(item.subtotal || item.totalPrice)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t-2 border-pine-200 space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between text-pine-700">
                <span>Subtotal</span>
                <span className="font-bold text-forest-950">{activeOrder.formattedSubtotal || formatCurrency(activeOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-pine-700">
                <span>Pajak Restoran (PPN {activeOrder.taxRate ?? 10}%)</span>
                <span className="font-bold text-forest-950">{activeOrder.formattedTaxAmount || formatCurrency(activeOrder.taxAmount || activeOrder.tax || 0)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-emerald-800 pt-2 border-t border-pine-200">
                <span>Total Biaya</span>
                <span className="font-mono">{activeOrder.formattedTotalAmount || formatCurrency(activeOrder.totalAmount || activeOrder.total || 0)}</span>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-pine-200 p-8 shadow-warm-sm">
          <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
          <h2 className="font-serif font-bold text-xl text-forest-950 mb-2">
            Pesanan tidak ditemukan
          </h2>
          <p className="text-sm text-pine-700 mb-6 font-normal">
            Nomor pesanan yang Anda cari mungkin telah kedaluwarsa atau tidak terdaftar.
          </p>
          <Link to="/menu">
            <Button size="sm">Buka Katalog Menu</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
