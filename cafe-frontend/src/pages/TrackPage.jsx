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

export function TrackPage() {
  const { id } = useParams()
  const activeOrder = useOrderStore(state => state.activeOrder)
  const fetchOrderStatus = useOrderStore(state => state.fetchOrderStatus)
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

      if (currentStatus === 'ready') {
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
    7000,
    isTerminal
  )

  const steps = [
    { key: 'pending', step: 1, label: 'Menunggu di Kasir', desc: 'Silakan lakukan pembayaran di kasir' },
    { key: 'processing', step: 2, label: 'Sedang Disiapkan Dapur', desc: 'Pesanan sedang diracik oleh barista/koki' },
    { key: 'ready', step: 3, label: 'Pesanan Siap', desc: 'Pesanan siap disajikan ke meja Anda' },
    { key: 'completed', step: 4, label: 'Selesai', desc: 'Pesanan telah diterima. Selamat menikmati!' }
  ]

  const currentStepNum = activeOrder?.statusInfo?.step ?? 1

  return (
    <div className="py-12 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Aksesibilitas Live Announcement */}
      <div aria-live="polite" className="sr-only">
        {ariaAnnouncement}
      </div>

      {/* Navigasi Balik ke Menu & Kontrol Aksi */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/menu"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-pine-700 hover:text-forest-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Menu</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Tombol Refresh Status Manual */}
          <button
            onClick={handleManualRefresh}
            disabled={isManualRefreshing}
            type="button"
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border border-forest-900/15 bg-white hover:bg-mint-100 text-forest-950 transition-colors touch-target shadow-2xs cursor-pointer disabled:opacity-50"
            title="Perbarui status pesanan sekarang"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-forest-800 ${isManualRefreshing ? 'animate-spin text-emerald-700' : ''}`} />
            <span className="hidden sm:inline">{isManualRefreshing ? 'Memperbarui...' : 'Perbarui Status'}</span>
          </button>

          {/* Toggle Notifikasi Bunyi (Chime) */}
          <button
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
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl p-8 border-2 border-pine-200 shadow-warm-sm text-center py-16 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-mint-100 mx-auto mb-4" />
          <div className="h-6 w-48 bg-mint-100 mx-auto rounded-md mb-2" />
          <div className="h-4 w-64 bg-mint-100 mx-auto rounded-md" />
        </div>
      ) : activeOrder ? (
        <div className="space-y-8">
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

          {/* Linimasa Alur Dapur (Menunggu -> Diproses -> Siap/Selesai) */}
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

          {/* Rincian Item Pesanan */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-pine-200 shadow-warm-sm">
            <h3 className="font-serif font-bold text-base text-forest-950 mb-4 pb-3 border-b-2 border-pine-200">
              Rincian Item
            </h3>

            <div className="divide-y divide-pine-200 mb-6 text-sm">
              {(activeOrder.items || []).map((item, idx) => (
                <div key={idx} className="py-3 flex justify-between items-start">
                  <div>
                    <span className="font-semibold text-forest-950">
                      {item.quantity}x {item.name}
                    </span>
                    {item.modifiers && (
                      <span className="text-xs text-pine-600 block mt-0.5 font-medium">
                        {item.modifiers}
                      </span>
                    )}
                    {item.notes && (
                      <span className="text-xs italic text-wood-500 block mt-0.5 font-medium">
                        "{item.notes}"
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-forest-950 shrink-0">
                    {item.formattedSubtotal}
                  </span>
                </div>
              ))}
            </div>

            {/* Total Pembayaran */}
            <div className="pt-4 border-t-2 border-pine-200 space-y-2 text-sm">
              <div className="flex justify-between text-pine-700 font-medium">
                <span>Subtotal</span>
                <span className="text-forest-950 font-bold">{activeOrder.formattedSubtotal}</span>
              </div>
              <div className="flex justify-between text-pine-700 font-medium">
                <span>Pajak Restoran ({activeOrder.taxRate}%)</span>
                <span className="text-forest-950 font-bold">{activeOrder.formattedTaxAmount}</span>
              </div>
              <div className="pt-2 border-t-2 border-pine-200 flex justify-between font-bold text-base text-forest-950">
                <span>Total Tagihan</span>
                <span className="text-emerald-700 text-lg font-bold">{activeOrder.formattedTotalAmount}</span>
              </div>
            </div>

            {/* Tautan ke Riwayat Pesanan */}
            <div className="pt-4 text-center border-t border-pine-200">
              <Link
                to="/riwayat"
                className="inline-flex items-center gap-2 text-xs font-bold text-pine-700 hover:text-emerald-700 underline underline-offset-2 transition-colors"
              >
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                <span>Lihat Semua Riwayat Pesanan Saya</span>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-pine-200 p-8">
          <AlertCircle className="w-10 h-10 text-wood-500 mx-auto mb-3" />
          <h2 className="font-serif font-bold text-xl text-forest-950 mb-2">
            Pesanan tidak ditemukan
          </h2>
          <p className="text-sm text-pine-700 mb-6 font-normal">
            Nomor pesanan #{id} tidak ditemukan di sistem kasir.
          </p>
          <Link to="/menu">
            <Button size="sm">Kembali ke Katalog</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
