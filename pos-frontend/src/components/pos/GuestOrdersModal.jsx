import React, { useState, useEffect } from 'react'
import { api } from '../../api/client'
import { useChime } from '../../hooks/useChime'
import { 
  Bell, CheckCircle2, Clock, X, AlertCircle, Banknote, QrCode, 
  CreditCard, ArrowRight, UserCheck, Utensils
} from 'lucide-react'

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

  if (!isOpen) return null

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
      const res = await api.post(`/orders/${selectedOrder.id}/confirm`, {
        payment_method: paymentMethod,
        cash_tendered: paymentMethod === 'cash' ? tenderedNum : null
      })
      playSuccessChime()
      const confirmedOrder = res.data || res
      onOrderConfirmed(confirmedOrder)
      onClose()
    } catch (err) {
      playAlertBeep()
      setError(err.message || 'Gagal mengonfirmasi pesanan tamu')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-forest-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-warm-lg border border-pine-200 overflow-hidden">
        
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
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-paper-100 text-ink-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {selectedOrder ? (
            /* Confirm Selected Order View */
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-paper-50 border border-pine-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-serif font-bold text-base text-forest-950">
                    {selectedOrder.table ? `MEJA ${selectedOrder.table.table_number || selectedOrder.table.number}` : 'Tamu Mandiri (Takeaway)'}
                  </span>
                  <span className="font-mono text-xs text-ink-500">{selectedOrder.invoice_number}</span>
                </div>
                <div className="text-xs text-ink-600">
                  Waktu Pesan: {new Date(selectedOrder.created_at).toLocaleTimeString('id-ID')}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto text-xs border border-pine-100 rounded-xl p-3">
                {(selectedOrder.items || []).map((it, idx) => (
                  <div key={idx} className="flex justify-between py-1 border-b border-pine-50 last:border-none">
                    <div>
                      <span className="font-semibold text-forest-950">{it.product?.name || 'Menu'}</span>
                      <span className="text-[10px] text-ink-500 ml-2">x{it.quantity}</span>
                      {it.notes && <p className="text-[10px] text-amber-700 italic">* {it.notes}</p>}
                    </div>
                    <span className="font-mono font-bold text-forest-900">
                      Rp {Number(it.subtotal || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total Display */}
              <div className="p-4 rounded-2xl bg-forest-900 text-white flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-mint-200">Total Tagihan Tamu</span>
                  <div className="font-mono text-2xl font-bold">
                    Rp {Number(selectedOrder.total_amount || 0).toLocaleString('id-ID')}
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-400 text-forest-950">
                  Menunggu Pembayaran
                </span>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase text-ink-700 mb-2">
                  Metode Pembayaran yang Diterima Kasir
                </label>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {[
                    { id: 'cash', label: 'Tunai', icon: Banknote },
                    { id: 'qris', label: 'QRIS', icon: QrCode },
                    { id: 'card', label: 'Kartu', icon: CreditCard },
                    { id: 'transfer', label: 'Transfer', icon: ArrowRight }
                  ].map((m) => {
                    const Icon = m.icon
                    const isSelected = paymentMethod === m.id
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                          isSelected
                            ? 'border-forest-800 bg-forest-50 text-forest-900 font-bold'
                            : 'border-pine-200 bg-white text-ink-700 hover:bg-paper-50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{m.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {paymentMethod === 'cash' && (
                <div>
                  <label className="block text-xs font-semibold uppercase text-ink-700 mb-1">
                    Uang Tunai Diterima (Rp)
                  </label>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-pine-200 font-mono font-bold text-base"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t border-pine-100">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2.5 rounded-xl border border-pine-200 text-xs font-semibold"
                >
                  Kembali ke Daftar
                </button>
                <button
                  type="button"
                  disabled={confirming}
                  onClick={handleConfirmOrder}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-warm-md transition cursor-pointer"
                >
                  <Utensils className="w-4 h-4" />
                  <span>{confirming ? 'Memproses...' : 'Konfirmasi Bayar & Kirim ke Dapur'}</span>
                </button>
              </div>

            </div>
          ) : (
            /* Pending List View */
            loading ? (
              <div className="py-16 text-center text-ink-400 text-xs">Memeriksa pesanan tamu...</div>
            ) : pendingOrders.length === 0 ? (
              <div className="py-16 text-center text-ink-400 text-xs space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto opacity-60" />
                <p>Tidak ada pesanan tamu menunggu konfirmasi saat ini.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingOrders.map((order) => (
                  <div
                    key={order.id}
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

                    <button
                      type="button"
                      onClick={() => handleSelectToConfirm(order)}
                      className="py-2 px-4 rounded-xl bg-forest-900 hover:bg-forest-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-warm-sm transition cursor-pointer"
                    >
                      <span>Proses Kasir</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

      </div>
    </div>
  )
}
