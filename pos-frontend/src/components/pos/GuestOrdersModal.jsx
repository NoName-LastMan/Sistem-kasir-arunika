import React, { useState, useEffect } from 'react'
import { api } from '../../api/client'
import { useChime } from '../../hooks/useChime'
import { 
  Bell, CheckCircle2, Clock, X, AlertCircle, Banknote, QrCode, 
  CreditCard, ArrowRight, UserCheck, Utensils
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { modalBackdrop, modalContent, springSnappy } from '../../lib/motion'

export function GuestOrdersModal({ isOpen, onClose, onOrderConfirmed }) {
  const [pendingOrders, setPendingOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [cashTendered, setCashTendered] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState(null)
  const { playSuccessChime, playAlertBeep } = useChime()

  const fetchPendingOrders = async () => {
    setLoading(true)
    try {
      const res = await api.get('/orders?status=pending&today_only=1')
      const list = res.data?.data || res.data || res || []
      setPendingOrders(list)
    } catch {
      setPendingOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      setSelectedOrder(null)
      setError(null)
      fetchPendingOrders()
    }
  }, [isOpen])

  const handleSelectToConfirm = (order) => {
    setSelectedOrder(order)
    setPaymentMethod('cash')
    setCashTendered(order.total_amount?.toString() || '')
    setError(null)
  }

  const handleConfirmOrder = async () => {
    if (!selectedOrder) return
    const tenderedNum = Number(cashTendered) || 0
    if (paymentMethod === 'cash' && tenderedNum < Number(selectedOrder.total_amount || 0)) {
      playAlertBeep()
      setError('Nominal uang tunai diterima kurang dari total tagihan!')
      return
    }

    setConfirming(true)
    setError(null)
    try {
      const changeDue = Math.max(0, tenderedNum - Number(selectedOrder.total_amount || 0))
      const res = await api.post(`/orders/${selectedOrder.id}/confirm`, {
        payment_method: paymentMethod,
        cash_tendered: paymentMethod === 'cash' ? tenderedNum : selectedOrder.total_amount,
        change_due: paymentMethod === 'cash' ? changeDue : 0
      })

      playSuccessChime()
      const confirmedOrder = res.data?.data || res.data || selectedOrder
      onOrderConfirmed(confirmedOrder)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Gagal memproses konfirmasi pesanan')
    } finally {
      setConfirming(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!selectedOrder) return
    const reason = window.prompt('Alasan pembatalan pesanan tamu (misal: Bahan habis, tamu batal):')
    if (!reason) return

    setConfirming(true)
    setError(null)
    try {
      await api.post(`/orders/${selectedOrder.id}/cancel`, { reason })
      playAlertBeep()
      setSelectedOrder(null)
      fetchPendingOrders()
    } catch (err) {
      setError(err.message || 'Gagal membatalkan pesanan tamu')
    } finally {
      setConfirming(false)
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
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90dvh] flex flex-col shadow-warm-lg border border-pine-200 overflow-hidden relative z-10"
          >
            {/* Header */}
            <div className="p-5 border-b border-pine-100 flex items-center justify-between bg-paper-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-forest-950">
                    Pesanan Masuk dari Pelanggan (QR Meja)
                  </h3>
                  <p className="text-xs text-ink-500">
                    Verifikasi pembayaran sebelum pesanan diteruskan ke koki dapur
                  </p>
                </div>
              </div>
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={onClose} 
                className="p-1.5 rounded-lg hover:bg-paper-100 text-ink-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="p-3.5 sm:p-6 overflow-y-auto flex-1">
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {selectedOrder ? (
                /* Detail Konfirmasi Order Tertentu */
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={springSnappy}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-pine-100">
                    <div>
                      <span className="text-xs font-mono text-ink-500">Nomor Invoice</span>
                      <h4 className="font-mono font-bold text-sm text-forest-950">
                        {selectedOrder.invoice_number}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono text-ink-500">Lokasi</span>
                      <h4 className="font-serif font-bold text-sm text-emerald-800">
                        {selectedOrder.table ? `Meja ${selectedOrder.table.table_number || selectedOrder.table.number}` : 'Takeaway'}
                      </h4>
                    </div>
                  </div>

                  {/* Ringkasan Item Pesanan */}
                  <div className="bg-paper-50 rounded-2xl p-4 border border-pine-200 space-y-2 max-h-48 overflow-y-auto">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-pine-600 block">
                      Rincian Hidangan Dipilih
                    </span>
                    {(selectedOrder.items || []).map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs pb-1.5 border-b border-pine-100 last:border-none last:pb-0">
                        <div>
                          <span className="font-semibold text-forest-950">{it.quantity}x {it.product?.name || it.name}</span>
                          {it.notes && <p className="text-[10px] text-wood-500 italic">Catatan: {it.notes}</p>}
                        </div>
                        <span className="font-mono font-bold text-forest-900">
                          Rp {Number(it.subtotal || (it.quantity * (it.unit_price || 0))).toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Pilihan Metode Bayar di Kasir */}
                  <div className="space-y-3 pt-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-ink-700">
                      Metode Pelunasan oleh Tamu di Kasir
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'cash', label: 'Tunai Kasir', icon: Banknote },
                        { id: 'qris', label: 'QRIS Scan', icon: QrCode },
                        { id: 'card', label: 'Debit / EDC', icon: CreditCard }
                      ].map(m => {
                        const Icon = m.icon
                        const isAct = paymentMethod === m.id
                        return (
                          <motion.button
                            key={m.id}
                            whileTap={{ scale: 0.96 }}
                            type="button"
                            onClick={() => setPaymentMethod(m.id)}
                            className={`p-3 rounded-xl border flex items-center gap-2 transition cursor-pointer ${
                              isAct 
                                ? 'bg-forest-900 text-white border-forest-900 shadow-sm'
                                : 'bg-white text-ink-700 border-pine-200 hover:bg-paper-50'
                            }`}
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="text-xs font-semibold">{m.label}</span>
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Input Tunai jika cash */}
                  {paymentMethod === 'cash' && (
                    <div className="p-3 bg-paper-50 rounded-xl border border-pine-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-ink-700">Uang Diterima:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold text-ink-500">Rp</span>
                        <input
                          type="number"
                          value={cashTendered}
                          onChange={(e) => setCashTendered(e.target.value)}
                          className="w-32 px-2.5 py-1 text-xs font-mono font-bold border border-pine-200 rounded-lg bg-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-3 flex items-center justify-between border-t border-pine-100">
                    <button
                      type="button"
                      disabled={confirming}
                      onClick={handleCancelOrder}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 transition cursor-pointer"
                    >
                      Batalkan Pesanan Ini
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(null)}
                        className="px-3.5 py-2 rounded-xl border border-pine-200 text-xs font-semibold text-ink-700 hover:bg-paper-100 transition"
                      >
                        Kembali ke List
                      </button>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        disabled={confirming}
                        onClick={handleConfirmOrder}
                        className="px-5 py-2 rounded-xl bg-forest-900 hover:bg-forest-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-warm-sm transition disabled:opacity-50 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-sun-400" />
                        <span>{confirming ? 'Memproses...' : 'Konfirmasi & Kirim Dapur'}</span>
                      </motion.button>
                    </div>
                  </div>

                </motion.div>
              ) : (
                /* List Seluruh Order Masuk */
                loading ? (
                  <div className="py-12 text-center text-ink-400 text-xs">Memeriksa pesanan tamu baru...</div>
                ) : pendingOrders.length === 0 ? (
                  <div className="py-12 text-center text-ink-400 text-xs space-y-2">
                    <UserCheck className="w-8 h-8 text-pine-300 mx-auto" />
                    <p className="font-medium text-forest-950">Tidak ada antrean pesanan tamu</p>
                    <p className="text-[11px]">Semua pesanan meja sudah diverifikasi dan lunas.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {pendingOrders.map((order) => (
                      <motion.div
                        key={order.id}
                        whileHover={{ y: -2 }}
                        transition={springSnappy}
                        className="p-4 rounded-2xl border border-pine-200 bg-paper-50/60 hover:border-forest-700 transition flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-serif font-bold text-sm text-forest-950">
                              {order.table ? `Meja ${order.table.table_number || order.table.number}` : 'Takeaway'}
                            </span>
                            <span className="font-mono text-[10px] text-ink-500">{order.invoice_number}</span>
                          </div>
                          <div className="text-xs text-ink-600 mt-1">
                            {(order.items || []).length} Menu • Rp {Number(order.total_amount || 0).toLocaleString('id-ID')}
                          </div>
                          <div className="text-[10px] font-mono text-ink-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {new Date(order.created_at).toLocaleTimeString('id-ID')}
                          </div>
                        </div>

                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          type="button"
                          onClick={() => handleSelectToConfirm(order)}
                          className="py-2 px-4 rounded-xl bg-forest-900 hover:bg-forest-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-warm-sm transition cursor-pointer"
                        >
                          <span>Proses Kasir</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                )
              )}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
