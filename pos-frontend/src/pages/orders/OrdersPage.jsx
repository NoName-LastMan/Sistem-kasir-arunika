import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { ReceiptModal } from '../../components/pos/ReceiptModal'
import { 
  ArrowLeft, Search, Filter, History, Printer, Ban, 
  CheckCircle, AlertCircle, Eye, Calendar, DollarSign
} from 'lucide-react'

export function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterToday, setFilterToday] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [receiptOrder, setReceiptOrder] = useState(null)
  const [showReceipt, setShowReceipt] = useState(false)
  const [storeSettings, setStoreSettings] = useState(null)
  const [voidLoading, setVoidLoading] = useState(false)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      let query = new URLSearchParams()
      if (filterToday) query.append('today_only', '1')
      if (filterStatus) query.append('status', filterStatus)
      const res = await api.get(`/orders?${query.toString()}`)
      const list = res.data?.data || res.data || res || []
      setOrders(list)
    } catch (err) {
      console.error(err)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    api.get('/settings/store').then(res => setStoreSettings(res.data || res)).catch(() => {})
  }, [filterToday, filterStatus])

  const handleVoid = async (order) => {
    const reason = window.prompt(`Masukkan alasan pembatalan (Void) untuk nota ${order.invoice_number}:`)
    if (!reason) return

    setVoidLoading(true)
    try {
      await api.post(`/orders/${order.id}/void`, { void_reason: reason })
      alert(`Transaksi ${order.invoice_number} berhasil di-void dan stok bahan baku telah dikembalikan ke gudang.`)
      fetchOrders()
      if (selectedOrder?.id === order.id) setSelectedOrder(null)
    } catch (err) {
      alert(err.message || 'Gagal membatalkan transaksi')
    } finally {
      setVoidLoading(false)
    }
  }

  const handleOpenReceipt = (order) => {
    setReceiptOrder(order)
    setShowReceipt(true)
  }

  const filteredOrders = orders.filter(o => 
    o.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
    o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    (o.table && `meja ${o.table.table_number || o.table.number}`.includes(search.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-paper-50 flex flex-col">
      {/* Header */}
      <header className="h-16 bg-forest-900 text-white px-6 flex items-center justify-between shadow-warm-md shrink-0">
        <div className="flex items-center gap-4">
          <Link
            to="/pos"
            className="p-2 rounded-xl bg-forest-800 text-pine-200 hover:text-white hover:bg-forest-700 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-serif font-bold text-lg leading-tight">Riwayat Transaksi & Order</h1>
            <p className="text-[10px] text-pine-300 font-mono">Daftar nota kasir hari ini & pembatalan (Void)</p>
          </div>
        </div>

        <Link
          to="/pos"
          className="px-4 py-2 rounded-xl bg-sun-400 text-forest-950 hover:bg-sun-400/90 text-xs font-semibold transition"
        >
          Kembali ke Kasir POS
        </Link>
      </header>

      {/* Filter Bar */}
      <div className="p-6 max-w-7xl mx-auto w-full space-y-4">
        <div className="bg-white p-4 rounded-2xl border border-pine-200 flex flex-wrap items-center justify-between gap-4 shadow-warm-sm">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-pine-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari no nota, kasir, meja..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-pine-200 text-xs bg-paper-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterToday(!filterToday)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                  filterToday
                    ? 'bg-forest-900 text-white border-forest-900'
                    : 'bg-white text-ink-700 border-pine-200 hover:bg-paper-50'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Hari Ini</span>
              </button>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs bg-white border border-pine-200 text-ink-800 font-medium"
              >
                <option value="">Semua Status</option>
                <option value="completed">Completed (Selesai)</option>
                <option value="voided">Voided (Dibatalkan)</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchOrders}
            className="px-4 py-2 rounded-xl bg-paper-100 hover:bg-pine-100 text-ink-800 text-xs font-semibold transition"
          >
            Muat Ulang
          </button>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-3xl border border-pine-200 shadow-warm-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-paper-100 text-ink-700 font-semibold uppercase text-[10px] tracking-wider border-b border-pine-200">
                <tr>
                  <th className="py-3.5 px-5">No. Nota</th>
                  <th className="py-3.5 px-4">Waktu</th>
                  <th className="py-3.5 px-4">Kasir</th>
                  <th className="py-3.5 px-4">Tipe / Meja</th>
                  <th className="py-3.5 px-4">Metode</th>
                  <th className="py-3.5 px-4 text-right">Total</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pine-100 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-ink-400">
                      Memuat daftar riwayat order...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-ink-400">
                      Tidak ada transaksi ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const isVoided = order.status === 'voided'
                    return (
                      <tr key={order.id} className="hover:bg-paper-50/60 transition">
                        <td className="py-3.5 px-5 font-mono font-bold text-forest-950">
                          {order.invoice_number}
                        </td>
                        <td className="py-3.5 px-4 text-ink-600">
                          {new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3.5 px-4 text-ink-800">
                          {order.user?.name || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-ink-700 uppercase">
                          {order.order_type} {order.table ? `(Meja ${order.table.table_number || order.table.number})` : ''}
                        </td>
                        <td className="py-3.5 px-4 uppercase font-semibold text-pine-700">
                          {order.payment_method}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-forest-900">
                          Rp {Number(order.total_amount || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isVoided 
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isVoided ? 'VOID' : 'LUNAS'}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(order)}
                              className="p-1.5 rounded-lg border border-pine-200 hover:bg-paper-100 text-ink-700"
                              title="Lihat Rincian"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenReceipt(order)}
                              className="p-1.5 rounded-lg border border-pine-200 hover:bg-paper-100 text-forest-800"
                              title="Cetak Struk"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            {!isVoided && (
                              <button
                                type="button"
                                disabled={voidLoading}
                                onClick={() => handleVoid(order)}
                                className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                                title="Void / Batalkan Pesanan"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-forest-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-warm-lg border border-pine-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-pine-100">
              <div>
                <h3 className="font-serif font-bold text-lg text-forest-950">Rincian Transaksi</h3>
                <span className="font-mono text-xs text-ink-500">{selectedOrder.invoice_number}</span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-ink-400 hover:text-ink-900">
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto text-xs">
              {(selectedOrder.items || []).map((it, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-paper-50 border border-pine-100 flex justify-between">
                  <div>
                    <span className="font-semibold block">{it.product?.name || 'Menu'}</span>
                    <span className="text-ink-500 text-[11px]">{it.quantity} x Rp {Number(it.unit_price || it.product?.price || 0).toLocaleString('id-ID')}</span>
                  </div>
                  <span className="font-mono font-bold">
                    Rp {Number(it.subtotal || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-pine-100 space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>Rp {Number(selectedOrder.subtotal || 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-forest-900">
                <span>Total:</span>
                <span>Rp {Number(selectedOrder.total_amount || 0).toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedOrder(null)
                  handleOpenReceipt(selectedOrder)
                }}
                className="flex-1 py-2.5 rounded-xl bg-forest-900 text-white text-xs font-semibold hover:bg-forest-800"
              >
                Cetak Struk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Preview Modal */}
      <ReceiptModal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        order={receiptOrder}
        storeSettings={storeSettings}
      />
    </div>
  )
}
