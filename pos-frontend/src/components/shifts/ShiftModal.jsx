import React, { useState, useEffect } from 'react'
import { useShiftStore } from '../../stores/shiftStore'
import { Clock, Banknote, AlertCircle, CheckCircle2, X, Printer, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { modalBackdrop, modalContent, springSnappy } from '../../lib/motion'

export function ShiftModal({ isOpen, onClose }) {
  const { currentShift, openShift, closeShift, fetchCurrentShift, lastClosedSummary } = useShiftStore()
  const [startingCash, setStartingCash] = useState('100000')
  const [actualCash, setActualCash] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showSummary, setShowSummary] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setError(null)
      fetchCurrentShift()
    }
  }, [isOpen])

  // Controlled via AnimatePresence below

  const handleOpen = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await openShift(startingCash)
    setLoading(false)
    if (res.success) {
      onClose()
    } else {
      setError(res.error)
    }
  }

  const handleClose = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await closeShift(actualCash, notes)
    setLoading(false)
    if (res.success) {
      setShowSummary(true)
    } else {
      setError(res.error)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <motion.div
            variants={modalBackdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-forest-950/60 backdrop-blur-xs"
          />
          <motion.div
            variants={modalContent}
            initial="initial"
            animate="animate"
            exit="exit"
            className="bg-white rounded-3xl max-w-md w-full max-h-[90dvh] flex flex-col shadow-warm-lg border border-pine-200 overflow-hidden relative z-10"
          >
        
        {/* Header */}
        <div className="p-5 border-b border-pine-100 flex items-center justify-between bg-paper-50/50">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-forest-800" />
            <div>
              <h3 className="font-serif font-bold text-lg text-forest-950">
                {showSummary 
                  ? 'Rekapitulasi Shift Ditutup' 
                  : currentShift 
                  ? 'Tutup Shift Kasir' 
                  : 'Buka Shift Kasir Baru'}
              </h3>
              <p className="text-xs text-ink-500">
                {currentShift ? 'Hitung fisik uang kas & rekonsiliasi' : 'Modal awal laci uang kasir'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-paper-100 text-ink-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {showSummary && lastClosedSummary ? (
            /* Summary View */
            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 rounded-2xl bg-paper-50 border border-pine-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-ink-600">Kas Awal:</span>
                  <span className="font-bold">Rp {Number(lastClosedSummary.starting_cash || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-600">Total Penjualan Tunai:</span>
                  <span className="font-bold text-forest-900">Rp {Number(lastClosedSummary.cash_sales || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between border-t border-pine-200 pt-2 font-bold text-sm">
                  <span>Ekspektasi Kas Sistem:</span>
                  <span>Rp {Number(lastClosedSummary.expected_cash || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-600">Uang Fisik Dihitung:</span>
                  <span className="font-bold">Rp {Number(lastClosedSummary.actual_cash || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className={`flex justify-between border-t border-pine-200 pt-2 font-bold ${Number(lastClosedSummary.cash_difference || 0) < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                  <span>Selisih Kas:</span>
                  <span>Rp {Number(lastClosedSummary.cash_difference || 0).toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-3 px-4 rounded-xl border border-pine-200 text-ink-800 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-paper-50 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Laporan</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setShowSummary(false); onClose() }}
                  className="flex-1 py-3 px-4 rounded-xl bg-forest-900 text-white text-xs font-semibold hover:bg-forest-800 cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            </div>
          ) : currentShift ? (
            /* Close Shift Form */
            <form onSubmit={handleClose} className="space-y-4">
              <div className="p-4 rounded-2xl bg-paper-50 border border-pine-200 text-xs space-y-1.5">
                <div className="flex justify-between text-ink-600">
                  <span>Dibuka Sejak:</span>
                  <span className="font-mono font-medium">{new Date(currentShift.opened_at).toLocaleTimeString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-ink-600">
                  <span>Modal Awal:</span>
                  <span className="font-mono font-medium">Rp {Number(currentShift.starting_cash || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-ink-600">
                  <span>Omzet Tunai Berjalan:</span>
                  <span className="font-mono font-bold text-emerald-700">Rp {Number(currentShift.cash_sales || 0).toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-700 mb-2">
                  Total Uang Fisik di Laci Kasir (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-ink-400">Rp</span>
                  <input
                    type="number"
                    required
                    autoFocus
                    placeholder="Hitung fisik uang kas di laci"
                    value={actualCash}
                    onChange={(e) => setActualCash(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-pine-200 font-mono text-base font-bold text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-700 mb-2">
                  Catatan Tutup Kas (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Misal: Tambahan pecahan kecil dari brankas..."
                  className="w-full p-3 rounded-xl border border-pine-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-700 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-forest-900 text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-forest-800 disabled:opacity-50 transition cursor-pointer shadow-warm-md"
              >
                {loading ? 'Menutup Shift...' : 'Tutup Shift & Rekonsiliasi Kas'}
              </button>
            </form>
          ) : (
            /* Open Shift Form */
            <form onSubmit={handleOpen} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-700 mb-2">
                  Modal Awal Kasir / Float (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-ink-400">Rp</span>
                  <input
                    type="number"
                    required
                    autoFocus
                    value={startingCash}
                    onChange={(e) => setStartingCash(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-pine-200 font-mono text-base font-bold text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-700"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                {['50000', '100000', '200000', '500000'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setStartingCash(amt)}
                    className="flex-1 py-1.5 rounded-lg border border-pine-200 text-xs font-semibold text-forest-900 hover:bg-paper-50 transition"
                  >
                    {Number(amt) / 1000}k
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-forest-900 text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-forest-800 disabled:opacity-50 transition cursor-pointer shadow-warm-md"
              >
                {loading ? 'Membuka Shift...' : 'Buka Shift Sekarang'}
              </button>
            </form>
          )}
        </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
