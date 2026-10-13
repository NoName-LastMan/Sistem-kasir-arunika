import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Clock, QrCode, ShoppingBag, ArrowRight, RefreshCw,
  Trash2, AlertCircle, CheckCircle2, ChevronRight,
  Search, Utensils, ReceiptText, Sparkles
} from 'lucide-react'
import { useOrderStore } from '../store/orderStore'
import { useCartStore } from '../store/cartStore'
import { useMenuStore } from '../store/menuStore'
import { Button } from '../components/ui/Button'
import { formatCurrency } from '../api/mappers'

export function HistoryPage() {
  const navigate = useNavigate()
  const orderHistory = useOrderStore(state => state.orderHistory) || []
  const deleteOrder = useOrderStore(state => state.deleteOrderFromHistory)
  const clearHistory = useOrderStore(state => state.clearHistory)

  const addItemToCart = useCartStore(state => state.addItem)
  const setTableCode = useCartStore(state => state.setTableCode)
  const setCustomerName = useCartStore(state => state.setCustomerName)
  const products = useMenuStore(state => state.products)

  const [activeTab, setActiveTab] = useState('all') // 'all' | 'active' | 'completed'
  const [searchQuery, setSearchQuery] = useState('')
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // Format tanggal ramah pengguna
  const formatDate = (isoString) => {
    if (!isoString) return '-'
    try {
      const d = new Date(isoString)
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(d) + ' WIB'
    } catch {
      return isoString
    }
  }

  // Tampilkan toast notifikasi singkat
  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage('')
    }, 2800)
  }

  // Aksi Pesan Lagi (Re-order)
  const handleReorder = (order) => {
    if (!order.items || order.items.length === 0) return

    // Isi nomor meja dan nama jika tersedia
    if (order.tableCode && order.tableCode !== 'Counter') {
      setTableCode(order.tableCode)
    }
    if (order.customerName) {
      setCustomerName(order.customerName)
    }

    // Masukkan tiap item ke keranjang
    order.items.forEach(item => {
      // Cari produk asli di katalog jika ada untuk referensi lengkap
      const matchedProduct = products.find(p => p.id === item.productId) || {
        id: item.productId,
        name: item.name,
        price: item.unitPrice,
        image: null
      }

      addItemToCart(
        matchedProduct,
        item.quantity,
        [], // modifiers string dipertahankan pada notes
        item.notes || ''
      )
    })

    showToast(`Berhasil menambahkan menu dari pesanan #${order.invoiceNumber} ke keranjang!`)
    setTimeout(() => {
      navigate('/pesan')
    }, 600)
  }

  // Filter daftar pesanan
  const filteredOrders = useMemo(() => {
    return orderHistory.filter(order => {
      // Filter tab
      const isCompleted = order.status === 'completed'
      const isActive = ['pending', 'processing', 'ready'].includes(order.status)

      if (activeTab === 'active' && !isActive) return false
      if (activeTab === 'completed' && !isCompleted) return false

      // Filter pencarian
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchInvoice = String(order.invoiceNumber || '').toLowerCase().includes(query)
        const matchName = String(order.customerName || '').toLowerCase().includes(query)
        const matchItem = (order.items || []).some(i => i.name.toLowerCase().includes(query))
        return matchInvoice || matchName || matchItem
      }

      return true
    })
  }, [orderHistory, activeTab, searchQuery])

  // Hitung jumlah pesanan aktif
  const activeCount = useMemo(() => {
    return orderHistory.filter(o => ['pending', 'processing', 'ready'].includes(o.status)).length
  }, [orderHistory])

  return (
    <div className="py-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-forest-950 text-white px-5 py-3 rounded-2xl shadow-warm-lg border-2 border-sun-400 flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-4">
          <Sparkles className="w-4 h-4 text-sun-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 pb-6 border-b-2 border-pine-200">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 bg-mint-100 px-3 py-1 rounded-full mb-2 border border-emerald-600">
            <Clock className="w-3.5 h-3.5" />
            <span>Riwayat & Pelacakan Mandiri</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif text-forest-950 tracking-tight">
            Riwayat Pesanan Pelanggan
          </h1>
          <p className="text-sm text-pine-700 mt-1 max-w-xl font-normal">
            Daftar pesanan Anda di Arunika Coffee and Space (UNIMUS Semarang). Pantau status pesanan langsung atau pesan ulang dengan satu klik.
          </p>
        </div>

        {orderHistory.length > 0 && (
          <button
            type="button"
            onClick={() => setConfirmClearOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 p-2 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors self-start sm:self-auto"
            aria-label="Hapus semua riwayat pesanan"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Semua</span>
          </button>
        )}
      </div>

      {/* Dialog Konfirmasi Hapus Riwayat */}
      {confirmClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/80 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border-2 border-pine-200 shadow-warm-lg text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-forest-950">
              Hapus Riwayat Pesanan?
            </h3>
            <p className="text-xs text-pine-700 leading-relaxed">
              Seluruh daftar riwayat pesanan di perangkat ini akan dibersihkan. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 font-bold"
                onClick={() => setConfirmClearOpen(false)}
              >
                Batal
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
                onClick={() => {
                  clearHistory()
                  setConfirmClearOpen(false)
                  showToast('Riwayat pesanan berhasil dibersihkan.')
                }}
              >
                Ya, Hapus
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Baris Tab Filter & Pencarian */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 bg-paper-100 p-1.5 rounded-2xl border-2 border-pine-200">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all btn-press ${
              activeTab === 'all'
                ? 'bg-white text-forest-950 shadow-2xs'
                : 'text-pine-700 hover:text-forest-950'
            }`}
          >
            Semua ({orderHistory.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all btn-press flex items-center gap-1.5 ${
              activeTab === 'active'
                ? 'bg-white text-forest-950 shadow-2xs'
                : 'text-pine-700 hover:text-forest-950'
            }`}
          >
            <span>Aktif ({activeCount})</span>
            {activeCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all btn-press ${
              activeTab === 'completed'
                ? 'bg-white text-forest-950 shadow-2xs'
                : 'text-pine-700 hover:text-forest-950'
            }`}
          >
            Selesai
          </button>
        </div>

        {/* Input Pencarian */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-pine-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari ID atau nama menu..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white border-2 border-pine-200 text-xs text-forest-950 placeholder:text-pine-500 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>
      </div>

      {/* Konten Daftar Riwayat */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border-2 border-pine-200 shadow-warm-sm text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-mint-100 flex items-center justify-center text-emerald-700 mx-auto mb-4">
            <ReceiptText className="w-8 h-8 opacity-70" />
          </div>
          <h2 className="font-serif font-bold text-xl text-forest-950 mb-1.5">
            {orderHistory.length === 0
              ? 'Belum ada riwayat pesanan'
              : 'Tidak ada pesanan yang sesuai filter'}
          </h2>
          <p className="text-xs text-pine-700 mb-6 max-w-sm mx-auto leading-relaxed font-normal">
            {orderHistory.length === 0
              ? 'Pesanan yang Anda buat melalui meja atau kasir akan tercatat di sini sehingga Anda dapat melacak statusnya kapan pun.'
              : 'Coba ubah kata kunci pencarian atau ganti tab filter untuk melihat pesanan lainnya.'}
          </p>
          <Link to="/menu">
            <Button size="sm" className="font-bold shadow-2xs">
              <ShoppingBag className="w-4 h-4 mr-1.5" />
              <span>Buka Katalog Menu</span>
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => {
            const isFinished = order.status === 'completed'
            const isReady = order.status === 'ready'
            const isProcessing = order.status === 'processing'

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border-2 border-pine-200 shadow-warm-sm hover:border-emerald-600 card-interactive p-5 sm:p-6"
              >
                {/* Header Kartu Pesanan */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-pine-200">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-sm text-forest-950">
                      #{order.invoiceNumber || order.id}
                    </span>
                    <span className="text-pine-400">•</span>
                    <span className="text-xs text-pine-600 font-medium">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        order.statusInfo?.badgeClass || 'bg-paper-100 text-forest-900 border-pine-200'
                      }`}
                    >
                      {isReady && '🔔 '}
                      {isProcessing && '⏳ '}
                      {isFinished && '✓ '}
                      {order.statusInfo?.label || order.status}
                    </span>
                  </div>
                </div>

                {/* Info Meja & Pemesan */}
                <div className="py-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-pine-700">
                  <div className="flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-emerald-700" />
                    <span>Lokasi: <strong className="text-forest-950">{order.tableCode ? `Meja ${order.tableCode}` : 'Counter'}</strong></span>
                  </div>
                  {order.customerName && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-pine-400">•</span>
                      <span>Pemesan: <strong className="text-forest-950">{order.customerName}</strong></span>
                    </div>
                  )}
                  {order.notes && (
                    <div className="w-full text-[11px] text-wood-500 italic bg-paper-50 px-3 py-1.5 rounded-lg border border-pine-200 mt-1">
                      Catatan: "{order.notes}"
                    </div>
                  )}
                </div>

                {/* Daftar Menu Pesanan */}
                <div className="py-3 divide-y divide-pine-100">
                  {(order.items || []).map((item, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between text-xs gap-4">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-emerald-800 bg-mint-100 px-1.5 py-0.5 rounded text-[11px] shrink-0 border border-pine-200">
                          {item.quantity}x
                        </span>
                        <div>
                          <span className="font-bold text-forest-950 block">
                            {item.name}
                          </span>
                          {item.modifiers && (
                            <span className="text-[11px] text-pine-600 block mt-0.5 font-normal">
                              {item.modifiers}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-semibold text-forest-950 shrink-0">
                        {item.formattedSubtotal || formatCurrency(item.subtotal || item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer Kartu: Total & Aksi */}
                <div className="pt-4 border-t border-pine-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] text-pine-600 font-bold uppercase tracking-wider block">
                      Total Pesanan
                    </span>
                    <span className="text-lg font-bold text-emerald-700">
                      {order.formattedTotalAmount || formatCurrency(order.totalAmount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    {/* Tombol Lacak Pesanan Langsung */}
                    <Link
                      to={`/pesanan/${order.id}`}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-forest-900 text-white font-bold text-xs hover:bg-emerald-600 transition-all btn-press shadow-2xs touch-target"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Lacak Live</span>
                    </Link>

                    {/* Tombol Pesan Lagi */}
                    <button
                      type="button"
                      onClick={() => handleReorder(order)}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-mint-100 text-forest-950 border border-emerald-600 font-bold text-xs hover:bg-white transition-all btn-press shadow-2xs touch-target"
                      title="Masukkan kembali menu pesanan ini ke keranjang belanja"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Pesan Lagi</span>
                    </button>

                    {/* Tombol Hapus Tunggal */}
                    <button
                      type="button"
                      onClick={() => deleteOrder(order.id)}
                      className="p-2 rounded-xl text-pine-500 hover:text-red-600 hover:bg-red-50 transition-all btn-press touch-target"
                      title="Hapus pesanan ini dari riwayat"
                      aria-label="Hapus dari riwayat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
