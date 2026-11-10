import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { useAuthStore } from '../../stores/authStore'
import { useOrderStream } from '../../hooks/useOrderStream'
import { ReceiptModal } from '../../components/pos/ReceiptModal'
import { motion, AnimatePresence } from 'framer-motion'
import { modalBackdrop, modalPop, springSnappy, springGentle } from '../../lib/motion'
import {
  ArrowLeft, Search, Filter, History, Printer, Ban,
  CheckCircle, AlertCircle, Eye, Calendar, DollarSign, RefreshCw,
  ShoppingBag, X, User, Layers, Receipt, Clock
} from 'lucide-react'

export function OrdersPage() {
  const { user } = useAuthStore()
  const canVoid = ['cashier', 'admin', 'superadmin'].includes(user?.role)

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterToday, setFilterToday] = useState(true)
  const [filterDate, setFilterDate] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [receiptOrder, setReceiptOrder] = useState(null)
  const [showReceipt, setShowReceipt] = useState(false)
  const [storeSettings, setStoreSettings] = useState(null)
  const [voidLoading, setVoidLoading] = useState(false)

  const fetchOrders = useCallback(async () => {
    try {
      let query = new URLSearchParams()
      if (filterDate) {
        query.append('date', filterDate)
      } else if (filterToday) {
        query.append('today_only', '1')
      }
      if (filterStatus) {
        query.append('status', filterStatus)
      }
      query.append('per_page', '100')

      const res = await api.get(`/orders?${query.toString()}`)
      const list = res.data?.data || res.data || res || []
      setOrders(list)
    } catch (err) {
      console.error('Error fetching orders:', err)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [filterToday, filterDate, filterStatus])

  // Live order stream listener: pembaruan otomatis saat kasir/dapur menyelesaikan transaksi
  useOrderStream(() => {
    fetchOrders()
  })

  useEffect(() => {
    setLoading(true)
    fetchOrders()
    api.get('/settings/store').then(res => setStoreSettings(res.data || res)).catch(() => {})

    const interval = setInterval(fetchOrders, 8000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  const handleVoid = async (order) => {
    const isToday = new Date(order.created_at).toDateString() === new Date().toDateString()
    if (!isToday && user?.role === 'cashier') {
      alert('Hanya transaksi hari ini yang dapat di-void oleh kasir. Hubungi Admin atau Owner untuk pembatalan transaksi hari sebelumnya.')
      return
    }

    const reason = window.prompt(`Masukkan alasan pembatalan (Void) untuk nota ${order.invoice_number}:\n(Contoh: Pelanggan salah pesan / batal bayar)`)
    if (!reason || reason.trim().length < 3) {
      if (reason !== null) alert('Alasan pembatalan harus minimal 3 karakter.')
      return
    }

    setVoidLoading(true)
    try {
      await api.post(`/orders/${order.id}/void`, { void_reason: reason.trim() })
      alert(`Transaksi ${order.invoice_number} berhasil di-void!\nStok produk dan bahan baku gudang telah dikembalikan otomatis.`)
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

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const q = search.toLowerCase().trim()
      if (!q) return true
      const matchInv = String(o.invoice_number || '').toLowerCase().includes(q)
      const matchCust = String(o.customer_name || '').toLowerCase().includes(q)
      const matchUser = String(o.user?.name || '').toLowerCase().includes(q)
      const matchTable = o.table && `meja ${o.table.table_number || o.table.number}`.toLowerCase().includes(q)
      const matchMethod = String(o.payment_method || '').toLowerCase().includes(q)
      return matchInv || matchCust || matchUser || matchTable || matchMethod
    })
  }, [orders, search])

  // Ringkasan Statistik Cepat
  const stats = useMemo(() => {
    const totalTransactions = filteredOrders.length
    const completedOrders = filteredOrders.filter(o => o.status === 'completed' || o.payment_status === 'paid')
    const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
    const voidOrders = filteredOrders.filter(o => o.status === 'cancelled' || o.status === 'voided' || Boolean(o.voided_at)).length
    const pendingOrders = filteredOrders.filter(o => o.status === 'pending').length

    return { totalTransactions, totalRevenue, voidOrders, pendingOrders }
  }, [filteredOrders])

  return (
    <div className="min-h-screen bg-paper-50 flex flex-col font-sans">
      {/* Header */}
      <header className="min-h-16 py-2.5 sm:py-0 sm:h-16 bg-forest-900 text-white px-3 sm:px-6 flex items-center justify-between gap-2 shadow-warm-md shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
          <Link
            to="/pos"
            className="p-2 rounded-xl bg-forest-800 text-pine-200 hover:text-white hover:bg-forest-700 transition cursor-pointer shrink-0"
            title="Kembali ke Layar Kasir POS"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="font-serif font-bold text-sm sm:text-lg leading-tight flex items-center gap-2 truncate">
              <span className="truncate">Riwayat Transaksi & Nota</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            </h1>
            <p className="hidden sm:block text-[10px] text-pine-300 font-mono truncate">Pencarian nota, audit penjualan real-time & pembatalan (Void)</p>
          </div>
        </div>

        <Link
          to="/pos"
          className="px-3 sm:px-4 py-2 rounded-xl bg-sun-400 text-forest-950 hover:bg-sun-400/90 text-xs font-semibold transition cursor-pointer shadow-sm shrink-0 whitespace-nowrap"
        >
          <span className="hidden sm:inline">Kembali ke </span>Kasir POS
        </Link>
      </header>

      {/* Main Content Area */}
      <div className="p-3 sm:p-6 max-w-7xl mx-auto w-full space-y-4 flex-1 min-w-0">
        
        {/* Quick KPI Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-pine-200 shadow-warm-xs flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-forest-900/10 text-forest-900 flex items-center justify-center shrink-0">
              <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[10px] text-ink-500 font-bold uppercase tracking-wider block truncate">Total Transaksi</span>
              <span className="font-mono text-sm sm:text-lg font-bold text-forest-950 block">{stats.totalTransactions} Nota</span>
            </div>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-pine-200 shadow-warm-xs flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[10px] text-ink-500 font-bold uppercase tracking-wider block truncate">Omzet Bersih</span>
              <span className="font-mono text-sm sm:text-lg font-bold text-emerald-700 block break-words">
                Rp {stats.totalRevenue.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-pine-200 shadow-warm-xs flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[10px] text-ink-500 font-bold uppercase tracking-wider block truncate">Menunggu Kasir</span>
              <span className="font-mono text-sm sm:text-lg font-bold text-amber-700 block">{stats.pendingOrders} Pesanan</span>
            </div>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-pine-200 shadow-warm-xs flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
              <Ban className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[10px] text-ink-500 font-bold uppercase tracking-wider block truncate">Dibatalkan (Void)</span>
              <span className="font-mono text-sm sm:text-lg font-bold text-red-600 block">{stats.voidOrders} Nota</span>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-pine-200 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 shadow-warm-sm">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 flex-1 w-full min-w-0">
            {/* Search Input */}
            <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
              <Search className="w-4 h-4 text-pine-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nota, kasir, meja, metode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-pine-200 text-xs bg-paper-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-700 font-medium"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Date Filters */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setFilterDate('')
                  setFilterToday(!filterToday)
                }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                  filterToday && !filterDate
                    ? 'bg-forest-900 text-white border-forest-900'
                    : 'bg-white text-ink-700 border-pine-200 hover:bg-paper-50'
                }`}
                title="Tampilkan transaksi hari ini saja"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Hari Ini</span>
              </button>

              <input
                type="date"
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value)
                  setFilterToday(false)
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs border transition cursor-pointer ${
                  filterDate
                    ? 'bg-forest-900 text-white border-forest-900 font-bold'
                    : 'bg-white text-ink-700 border-pine-200 hover:bg-paper-50'
                }`}
                title="Pilih tanggal transaksi tertentu"
              />
            </div>

            {/* Status Select */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs bg-white border border-pine-200 text-ink-800 font-semibold cursor-pointer"
            >
              <option value="">Semua Status</option>
              <option value="pending">Menunggu Kasir (Pending)</option>
              <option value="processing">Sedang Dimasak (Dapur)</option>
              <option value="ready">Siap Saji</option>
              <option value="completed">Selesai (Completed)</option>
              <option value="cancelled">Void / Dibatalkan</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {(filterDate || filterStatus || search || !filterToday) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setFilterDate('')
                  setFilterStatus('')
                  setFilterToday(true)
                }}
                className="px-3 py-2 rounded-xl text-xs text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition font-medium"
              >
                Reset Filter
              </button>
            )}

            <button
              type="button"
              onClick={fetchOrders}
              className="px-4 py-2 rounded-xl bg-paper-100 hover:bg-pine-100 text-ink-800 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
              title="Perbarui daftar data transaksi"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-forest-800' : ''}`} />
              <span>Muat Ulang</span>
            </button>
          </div>
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
                  <th className="py-3.5 px-4 text-right">Total Tagihan</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pine-100 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-ink-400">
                      <div className="w-6 h-6 border-2 border-forest-800 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <span>Memuat daftar riwayat order...</span>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-ink-400">
                      <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50 text-pine-300" />
                      <p className="font-semibold text-ink-600">Tidak ada transaksi ditemukan.</p>
                      <p className="text-[11px] text-ink-400 mt-0.5">Coba ubah kata kunci pencarian atau ganti filter tanggal.</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const isVoided = order.status === 'cancelled' || order.status === 'voided' || Boolean(order.voided_at)
                    const isToday = new Date(order.created_at).toDateString() === new Date().toDateString()

                    return (
                      <tr 
                        key={order.id} 
                        className={`hover:bg-paper-50/80 transition ${isVoided ? 'bg-red-50/20' : ''}`}
                      >
                        {/* No. Nota */}
                        <td className="py-3.5 px-5 font-mono font-bold text-forest-950">
                          <span className={isVoided ? 'line-through text-red-800' : ''}>
                            {order.invoice_number}
                          </span>
                        </td>

                        {/* Waktu */}
                        <td className="py-3.5 px-4 text-ink-600">
                          <span className="block font-medium">
                            {new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                          </span>
                          <span className="text-[10px] text-ink-400 block font-mono">
                            {new Date(order.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                          </span>
                        </td>

                        {/* Kasir */}
                        <td className="py-3.5 px-4 text-ink-800">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-pine-500" />
                            <span>{order.user?.name || '-'}</span>
                          </div>
                        </td>

                        {/* Tipe / Meja & Nama Tamu */}
                        <td className="py-3.5 px-4 text-ink-700">
                          <span className="font-bold text-forest-950 block truncate max-w-[180px]">
                            {order.customer_name || (order.table ? `Meja ${order.table.table_number || order.table.number}` : 'Tamu Walk-In')}
                          </span>
                          <span className="text-[10px] text-ink-500 uppercase tracking-wider block">
                            {order.order_type === 'dine_in' ? 'Dine In' : order.order_type === 'takeaway' ? 'Takeaway' : 'Delivery'}
                            {order.table ? ` • Meja ${order.table.table_number || order.table.number}` : ''}
                          </span>
                        </td>

                        {/* Metode Pembayaran */}
                        <td className="py-3.5 px-4 uppercase font-bold text-pine-800">
                          <span className="px-2 py-0.5 rounded-md bg-paper-100 border border-pine-200 inline-block font-mono text-[10px]">
                            {order.payment_method || 'CASH'}
                          </span>
                        </td>

                        {/* Total Tagihan */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-forest-950">
                          <span className={isVoided ? 'line-through text-red-600' : ''}>
                            Rp {Number(order.total_amount || 0).toLocaleString('id-ID')}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block ${
                            isVoided 
                              ? 'bg-red-100 text-red-700 border border-red-300' 
                              : order.status === 'pending'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : order.status === 'processing'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : order.status === 'ready'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isVoided 
                              ? 'VOID' 
                              : order.status === 'pending' 
                              ? 'MENUNGGU KASIR' 
                              : order.status === 'processing' 
                              ? 'DIMASAK' 
                              : order.status === 'ready' 
                              ? 'SIAP SAJI' 
                              : 'LUNAS'}
                          </span>
                        </td>

                        {/* Aksi */}
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Rincian */}
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(order)}
                              className="p-1.5 rounded-lg border border-pine-200 hover:bg-paper-100 text-ink-700 transition cursor-pointer"
                              title="Lihat Rincian Transaksi"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Cetak Struk */}
                            <button
                              type="button"
                              onClick={() => handleOpenReceipt(order)}
                              className="p-1.5 rounded-lg border border-pine-200 hover:bg-forest-900 hover:text-white text-forest-800 transition cursor-pointer"
                              title="Cetak Ulang Struk Kasir"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Tombol Void */}
                            {!isVoided && canVoid && (
                              <button
                                type="button"
                                disabled={voidLoading || (!isToday && user?.role === 'cashier')}
                                onClick={() => handleVoid(order)}
                                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                  !isToday && user?.role === 'cashier'
                                    ? 'border-gray-200 text-gray-400 opacity-50 cursor-not-allowed'
                                    : 'border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300'
                                }`}
                                title={
                                  !isToday && user?.role === 'cashier'
                                    ? 'Hanya transaksi hari ini yang dapat di-void oleh kasir'
                                    : 'Void / Batalkan Pesanan & Pulihkan Stok'
                                }
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

      {/* Detail Modal Transaksi */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              variants={modalBackdrop}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={() => setSelectedOrder(null)}
              className="fixed inset-0 bg-forest-950/60 backdrop-blur-xs"
            />
            <motion.div
              variants={modalPop}
              initial="initial"
              animate="animate"
              exit="exit"
              className="relative bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-warm-lg border border-pine-200 space-y-4 z-10 max-h-[90dvh] flex flex-col"
            >
              {/* Header Modal */}
              <div className="flex items-center justify-between pb-3 border-b border-pine-100 shrink-0">
                <div>
                  <h3 className="font-serif font-bold text-lg text-forest-950">Rincian Transaksi</h3>
                  <span className="font-mono text-xs text-ink-500">{selectedOrder.invoice_number}</span>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)} 
                  className="w-8 h-8 rounded-full bg-paper-100 hover:bg-paper-200 text-ink-600 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Box Peringatan Jika Void */}
              {(selectedOrder.status === 'cancelled' || selectedOrder.status === 'voided' || selectedOrder.void_reason) && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-300 text-red-950 text-xs space-y-1 shrink-0">
                  <div className="flex items-center gap-1.5 font-bold text-red-700">
                    <Ban className="w-4 h-4" />
                    <span>Transaksi Telah Dibatalkan (VOID)</span>
                  </div>
                  {selectedOrder.void_reason && (
                    <p className="text-[11px] text-red-900">Alasan: <strong>{selectedOrder.void_reason}</strong></p>
                  )}
                  {selectedOrder.voided_at && (
                    <p className="text-[10px] text-red-700 font-mono">
                      Waktu Void: {new Date(selectedOrder.voided_at).toLocaleString('id-ID')}
                      {selectedOrder.voided_by ? ` • Oleh User #${selectedOrder.voided_by}` : ''}
                    </p>
                  )}
                </div>
              )}

              {/* Items List */}
              <div className="space-y-2.5 overflow-y-auto flex-1 pr-1 text-xs">
                {(selectedOrder.items || []).map((it, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-paper-50 border border-pine-100 flex justify-between items-start">
                    <div className="space-y-0.5">
                      <span className="font-bold text-forest-950 block">{it.product?.name || it.name || 'Menu Sajian'}</span>
                      <span className="text-ink-500 text-[11px]">
                        {it.quantity}x @ Rp {Number(it.unit_price || it.product?.price || 0).toLocaleString('id-ID')}
                      </span>
                      {it.modifiers && it.modifiers.length > 0 && (
                        <span className="text-[10px] text-pine-700 block font-medium">
                          +{it.modifiers.map(m => m.modifier_item?.name || m.modifierItem?.name || m.name).filter(Boolean).join(', ')}
                        </span>
                      )}
                      {it.notes && (
                        <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded italic block mt-0.5">
                          Catatan: {it.notes}
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-bold text-forest-950 shrink-0">
                      Rp {Number(it.subtotal || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals Breakdown */}
              <div className="pt-3 border-t border-pine-100 space-y-1.5 text-xs shrink-0">
                <div className="flex justify-between text-ink-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-medium">Rp {Number(selectedOrder.subtotal || 0).toLocaleString('id-ID')}</span>
                </div>
                {Number(selectedOrder.discount_amount || 0) > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Diskon:</span>
                    <span className="font-mono font-medium">- Rp {Number(selectedOrder.discount_amount).toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between text-ink-600">
                  <span>Pajak (PPN):</span>
                  <span className="font-mono font-medium">Rp {Number(selectedOrder.tax_amount || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-bold text-base text-forest-950 pt-1.5 border-t border-pine-100">
                  <span>Total Tagihan:</span>
                  <span className="font-mono text-emerald-800">
                    Rp {Number(selectedOrder.total_amount || 0).toLocaleString('id-ID')}
                  </span>
                </div>

                {selectedOrder.payment_method === 'cash' && selectedOrder.cash_tendered && (
                  <div className="text-[11px] text-ink-500 pt-1 flex justify-between font-mono">
                    <span>Tunai Diterima: Rp {Number(selectedOrder.cash_tendered).toLocaleString('id-ID')}</span>
                    <span>Kembalian: Rp {Number(selectedOrder.change_due || 0).toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrder(null)
                    handleOpenReceipt(selectedOrder)
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-forest-900 text-white text-xs font-semibold hover:bg-forest-800 transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Ulang Struk</span>
                </button>

                {!(selectedOrder.status === 'cancelled' || selectedOrder.status === 'voided' || selectedOrder.void_reason) && canVoid && (
                  <button
                    type="button"
                    disabled={voidLoading}
                    onClick={() => handleVoid(selectedOrder)}
                    className="py-2.5 px-4 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Void Nota</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        order={receiptOrder}
        storeSettings={storeSettings}
      />
    </div>
  )
}
