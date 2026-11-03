import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import { useAuthStore } from '../../stores/authStore'
import { usePosStore } from '../../stores/posStore'
import { useShiftStore } from '../../stores/shiftStore'
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { useChime } from '../../hooks/useChime'
import { useOrderStream } from '../../hooks/useOrderStream'
import { PaymentModal } from '../../components/pos/PaymentModal'
import { ReceiptModal } from '../../components/pos/ReceiptModal'
import { HeldOrdersModal } from '../../components/pos/HeldOrdersModal'
import { TablePickerModal } from '../../components/pos/TablePickerModal'
import { ShiftModal } from '../../components/shifts/ShiftModal'
import { GuestOrdersModal } from '../../components/pos/GuestOrdersModal'
import { QuickAddProductModal } from '../../components/pos/QuickAddProductModal'
import { motion, AnimatePresence } from 'framer-motion'
import { cartItemVariant, toastVariant, badgePop, springSnappy } from '../../lib/motion'
import { 
  Search, ShoppingCart, Coffee, Trash2, Plus, Minus, Bookmark, Menu, X, 
  CreditCard, LayoutGrid, Clock, LogOut, Utensils, History,
  FileText, Shield, AlertCircle, Check, Bell,
  ArrowLeft, ArrowRight
} from 'lucide-react'

export function POSPage() {
  const { user, logout, hasRole } = useAuthStore()
  const { 
    cart, addToCart, updateQuantity, updateItemNote, removeItem, 
    clearCart, getTotals, orderType, setOrderType, selectedTable,
    holdOrder
  } = usePosStore()
  const { currentShift, fetchCurrentShift } = useShiftStore()
  const { playScanBeep, playAlertBeep, playSuccessChime } = useChime()
  const navigate = useNavigate()

  // Component states
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [storeSettings, setStoreSettings] = useState(null)

  // Modals
  const [showPayModal, setShowPayModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [showHeldModal, setShowHeldModal] = useState(false)
  const [showTableModal, setShowTableModal] = useState(false)
  const [showShiftModal, setShowShiftModal] = useState(false)
  const [showGuestModal, setShowGuestModal] = useState(false)
  const [showQuickAddModal, setShowQuickAddModal] = useState(false)
  const [successToast, setSuccessToast] = useState(null)
  const [pendingGuestCount, setPendingGuestCount] = useState(0)
  const [completedOrder, setCompletedOrder] = useState(null)
  const [mobileTab, setMobileTab] = useState('catalog') // 'catalog' | 'cart'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const searchInputRef = useRef(null)

  // Fetch initial data
  useEffect(() => {
    fetchCurrentShift()
    
    // Fetch categories
    api.get('/categories')
      .then(res => setCategories(res.data || res || []))
      .catch(() => setCategories([]))

    // Fetch store settings for receipt
    api.get('/settings/store')
      .then(res => setStoreSettings(res.data || res || null))
      .catch(() => setStoreSettings(null))

    fetchProducts()
    checkPendingGuestOrders()

    // Fallback polling santai jika SSE reconnect/terputus
    const interval = setInterval(() => {
      if (!document.hidden) {
        checkPendingGuestOrders()
      }
    }, 30000)

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkPendingGuestOrders()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Real-time SSE listener: Pesanan tamu / perubahan order langsung diterima instan tanpa nunggu polling
  useOrderStream(
    useCallback((data) => {
      if (typeof data?.pending_count === 'number') {
        setPendingGuestCount(prev => {
          if (data.pending_count > prev && prev > 0) {
            playSuccessChime()
          }
          return data.pending_count
        })
      } else {
        checkPendingGuestOrders()
      }
    }, [playSuccessChime])
  )

  const checkPendingGuestOrders = async () => {
    if (document.hidden) return
    try {
      const res = await api.get('/orders/pending-count')
      const count = typeof res?.count === 'number' ? res.count : (res?.data?.count ?? 0)
      if (count > pendingGuestCount && pendingGuestCount > 0) {
        playSuccessChime()
      }
      setPendingGuestCount(count)
    } catch {
      // ignore
    }
  }

  const fetchProducts = async () => {
    setLoadingProducts(true)
    try {
      const res = await api.get('/products')
      setProducts(res.data || res || [])
    } catch {
      setProducts([])
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleCategoryClick = (catId) => {
    setSelectedCategory(catId)
  }

  // Barcode scanner integration
  useBarcodeScanner(async (barcode) => {
    try {
      const res = await api.get(`/products/by-barcode/${barcode}`)
      const product = res.data || res
      if (product && product.id) {
        addToCart(product, 1)
        playScanBeep()
      }
    } catch {
      playAlertBeep()
    }
  })

  // Keyboard hotkeys mapping
  useKeyboardShortcuts({
    onSearch: () => searchInputRef.current?.focus(),
    onTable: () => setShowTableModal(true),
    onHold: () => handleHoldCurrentOrder(),
    onHeldOrders: () => setShowHeldModal(true),
    onPay: () => handleOpenPayment(),
    onEscape: () => {
      setShowPayModal(false)
      setShowReceiptModal(false)
      setShowHeldModal(false)
      setShowTableModal(false)
      setShowShiftModal(false)
      setShowQuickAddModal(false)
    }
  })

  const handleOpenPayment = () => {
    if (cart.length === 0) return
    if (!currentShift) {
      playAlertBeep()
      alert('Perhatian: Harap buka shift kasir terlebih dahulu dan masukkan modal awal laci kas sebelum memproses transaksi.')
      setShowShiftModal(true)
      return
    }
    setShowPayModal(true)
  }

  const handleHoldCurrentOrder = async () => {
    if (cart.length === 0) return
    const name = window.prompt('Nama atau Keterangan untuk Pesanan Tertunda:')
    if (name !== null) {
      try {
        await holdOrder(name)
        alert('Pesanan berhasil disimpan di daftar tertunda (F7).')
      } catch (err) {
        alert(err.message)
      }
    }
  }

  const handlePaymentSuccess = (order) => {
    setShowPayModal(false)
    setCompletedOrder(order)
    setShowReceiptModal(true)
    setMobileTab('catalog')
  }

  // Filtered products by search & category (Memoized to prevent render lag)
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return products.filter(p => {
      const matchesCategory = !selectedCategory || p.category_id === selectedCategory
      if (!matchesCategory) return false
      if (!q) return true
      return (
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q)
      )
    })
  }, [products, selectedCategory, searchQuery])

  const totals = getTotals()

  return (
    <div className="flex flex-col h-screen bg-paper-50 select-none overflow-hidden">
      
      {/* Top Navigation Bar */}
      <header className="h-16 bg-forest-900 text-white px-3 sm:px-5 flex items-center justify-between shadow-warm-md shrink-0 relative z-30">
        
        {/* Brand & Shift status */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-forest-800 border border-white/10 flex items-center justify-center shrink-0">
              <Coffee className="w-4 h-4 sm:w-5 sm:h-5 text-mint-200" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-sm sm:text-base leading-tight tracking-wide">
                Kasir Arunika
              </h1>
              <span className="text-[9px] sm:text-[10px] text-pine-300 font-mono hidden sm:block">Terminal Kasir F&B</span>
            </div>
          </div>

          <div className="hidden sm:block h-6 w-px bg-white/15" />

          {/* Shift Status Button (Desktop) */}
          <button
            onClick={() => setShowShiftModal(true)}
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
              currentShift 
                ? 'bg-emerald-950/60 text-emerald-200 border-emerald-500/40 hover:bg-emerald-900/60' 
                : 'bg-red-950/60 text-red-200 border-red-500/40 hover:bg-red-900/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{currentShift ? 'Shift Aktif' : 'Buka Shift'}</span>
          </button>

          {/* Guest Orders Pending Button */}
          <button
            onClick={() => setShowGuestModal(true)}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
              pendingGuestCount > 0
                ? 'bg-amber-400 text-forest-950 border-amber-300 shadow-md animate-bounce'
                : 'bg-forest-800/80 text-pine-200 border-white/10 hover:bg-forest-700'
            }`}
            title="Pesanan dari aplikasi tamu / scan QR yang menunggu konfirmasi kasir"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pesanan Tamu</span>
            <span className="font-mono">({pendingGuestCount})</span>
          </button>
        </div>

        {/* Shortcuts Hint Pills (Desktop Only) */}
        <div className="hidden xl:flex items-center gap-2 text-[11px] font-mono text-pine-300">
          <span className="px-2 py-0.5 rounded-lg bg-forest-800 border border-white/10 text-white">F2</span> Cari
          <span className="px-2 py-0.5 rounded-lg bg-forest-800 border border-white/10 text-white">F3</span> Meja
          <span className="px-2 py-0.5 rounded-lg bg-forest-800 border border-white/10 text-white">F4</span> Hold
          <span className="px-2 py-0.5 rounded-lg bg-forest-800 border border-white/10 text-white">F7</span> Held (&gt;)
          <span className="px-2 py-0.5 rounded-lg bg-forest-800 border border-white/10 text-white">F8</span> Bayar
        </div>

        {/* Navigation & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-2">
            <Link
              to="/orders"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest-800/80 hover:bg-forest-700 text-xs font-medium transition"
            >
              <History className="w-4 h-4 text-mint-200" />
              <span>Riwayat Order</span>
            </Link>

            {hasRole(['kitchen', 'admin', 'superadmin']) && (
              <Link
                to="/kitchen"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest-800/80 hover:bg-forest-700 text-xs font-medium transition"
              >
                <Utensils className="w-4 h-4 text-sun-400" />
                <span>Dapur (KDS)</span>
              </Link>
            )}

            {hasRole(['admin', 'superadmin']) && (
              <Link
                to="/admin/products"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest-800/80 hover:bg-forest-700 text-xs font-medium transition"
                title="Kelola Master Menu & Produk"
              >
                <Coffee className="w-4 h-4 text-sun-300" />
                <span>Master Menu</span>
              </Link>
            )}

            {hasRole(['admin', 'superadmin']) && (
              <Link
                to="/admin/reports"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sun-400 text-forest-950 hover:bg-sun-400/90 text-xs font-semibold transition"
              >
                <Shield className="w-4 h-4" />
                <span>Backoffice</span>
              </Link>
            )}

            <div className="h-6 w-px bg-white/15 mx-1" />

            <div className="text-right">
              <span className="text-xs font-semibold block leading-tight">{user?.name || 'Kasir'}</span>
              <span className="text-[10px] text-pine-300 capitalize">{user?.role || 'cashier'}</span>
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-xl text-pine-300 hover:text-white hover:bg-forest-800 transition cursor-pointer"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Cart Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setMobileTab(mobileTab === 'cart' ? 'catalog' : 'cart')}
            className={`lg:hidden relative p-2 rounded-xl border transition cursor-pointer ${
              mobileTab === 'cart'
                ? 'bg-sun-400 text-forest-950 border-sun-400'
                : 'bg-forest-800 border-forest-700 text-white'
            }`}
            title="Buka / Tutup Keranjang"
          >
            <ShoppingCart className="w-4 h-4" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-sun-400 text-forest-950 text-[9px] font-bold font-mono">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </span>
            )}
          </motion.button>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="lg:hidden p-2 rounded-xl text-pine-200 hover:text-white hover:bg-forest-800 border border-forest-700 transition cursor-pointer"
            aria-label="Menu Navigasi Mobile"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </header>

      {/* Mobile Navigation Drawer / Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-forest-950 border-b border-forest-800 px-4 py-3 text-white space-y-3 z-20 overflow-hidden"
          >
            <div className="flex items-center justify-between pb-2 border-b border-forest-800">
              <div>
                <span className="text-xs font-bold text-white block">{user?.name || 'Kasir'}</span>
                <span className="text-[10px] text-pine-300 font-mono capitalize">{user?.role || 'cashier'}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  setShowShiftModal(true)
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                  currentShift
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                    : 'bg-red-950/80 text-red-300 border-red-500/50'
                }`}
              >
                {currentShift ? 'Kelola Shift Aktif' : 'Buka Shift Baru'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                to="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-forest-900 hover:bg-forest-800 flex items-center gap-2 font-medium"
              >
                <History className="w-4 h-4 text-mint-200" />
                <span>Riwayat Order</span>
              </Link>

              {hasRole(['kitchen', 'admin', 'superadmin']) && (
                <Link
                  to="/kitchen"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2.5 rounded-xl bg-forest-900 hover:bg-forest-800 flex items-center gap-2 font-medium"
                >
                  <Utensils className="w-4 h-4 text-sun-400" />
                  <span>Dapur (KDS)</span>
                </Link>
              )}

              {hasRole(['admin', 'superadmin']) && (
                <Link
                  to="/admin/products"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2.5 rounded-xl bg-forest-900 hover:bg-forest-800 flex items-center gap-2 font-medium"
                >
                  <Coffee className="w-4 h-4 text-sun-300" />
                  <span>Master Menu</span>
                </Link>
              )}

              {hasRole(['admin', 'superadmin']) && (
                <Link
                  to="/admin/reports"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2.5 rounded-xl bg-sun-400 text-forest-950 flex items-center gap-2 font-bold"
                >
                  <Shield className="w-4 h-4" />
                  <span>Backoffice ERP</span>
                </Link>
              )}
            </div>

            <div className="pt-2 border-t border-forest-800 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  setShowTableModal(true)
                }}
                className="text-xs text-pine-300 hover:text-white flex items-center gap-1.5"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Pilih Meja ({selectedTable ? `Meja ${selectedTable.table_number || selectedTable.number}` : 'Bawa Pulang'})</span>
              </button>

              <button
                type="button"
                onClick={logout}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content: Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Product Catalog (65%) */}
        <div className={`flex-1 flex-col border-r border-pine-200 overflow-hidden bg-paper-50/50 ${mobileTab === 'cart' ? 'hidden lg:flex' : 'flex'}`}>
          
          {/* Subheader Filters */}
          <div className="p-4 border-b border-pine-200 space-y-3 bg-white">
            {/* Guest Order Notification Banner */}
            {pendingGuestCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-amber-400 text-forest-950 rounded-2xl flex items-center justify-between shadow-sm border border-amber-300"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-forest-950 text-amber-300 flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4 animate-bounce" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block leading-tight">
                      Ada {pendingGuestCount} Pesanan Tamu Baru Menunggu Konfirmasi!
                    </span>
                    <span className="text-[10px] text-forest-900/80">
                      Pelanggan memesan mandiri via scan QR / cafe portal.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGuestModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-forest-950 hover:bg-forest-900 text-amber-300 font-bold text-xs shadow-xs transition cursor-pointer shrink-0"
                >
                  Terima Pesanan
                </button>
              </motion.div>
            )}
            
            {/* Search & Actions Bar */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-pine-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Cari menu, SKU, atau scan barcode... (F2)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-pine-200 bg-paper-50 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-forest-700 focus:bg-white transition"
                />
              </div>

              {/* Floor Plan Button */}
              <button
                type="button"
                onClick={() => setShowTableModal(true)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                  selectedTable 
                    ? 'border-forest-700 bg-forest-50 text-forest-900 font-bold' 
                    : 'border-pine-200 bg-white text-ink-700 hover:bg-paper-50'
                }`}
              >
                <LayoutGrid className="w-4 h-4 text-forest-700" />
                <span className="hidden sm:inline">{selectedTable ? `Meja ${selectedTable.number || selectedTable.table_number}` : 'Pilih Meja (F3)'}</span><span className="sm:hidden font-mono font-bold">{selectedTable ? `M${selectedTable.number || selectedTable.table_number}` : 'Meja'}</span>
              </button>

              {/* Held Orders Drawer Toggle */}
              <button
                type="button"
                onClick={() => setShowHeldModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-pine-200 bg-white text-ink-700 hover:bg-paper-50 text-xs font-medium transition cursor-pointer"
              >
                <Bookmark className="w-4 h-4 text-wood-500" />
                <span className="hidden sm:inline">Held (F7)</span><span className="sm:hidden font-bold">Held</span>
              </button>

              {/* Quick Add Product Button */}
              <button
                type="button"
                onClick={() => setShowQuickAddModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-forest-900 hover:bg-forest-800 text-white text-xs font-bold transition shadow-warm-xs cursor-pointer shrink-0"
                title="Tambah menu baru langsung ke kasir"
              >
                <Plus className="w-4 h-4 text-sun-400" />
                <span className="hidden sm:inline">+ Tambah Menu</span><span className="sm:hidden font-bold">+ Menu</span>
              </button>
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => handleCategoryClick(null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === null
                    ? 'bg-forest-900 text-white shadow-warm-sm'
                    : 'bg-paper-100 text-ink-700 hover:bg-pine-100'
                }`}
              >
                Semua Menu
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-forest-900 text-white shadow-warm-sm'
                      : 'bg-paper-100 text-ink-700 hover:bg-pine-100'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

          </div>

          {/* Product Grid Container */}
          <div className="flex-1 p-2.5 sm:p-4 overflow-y-auto">
            {loadingProducts ? (
              <div className="py-24 text-center text-ink-400 text-xs">Memuat katalog menu...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-24 text-center text-ink-400 text-xs space-y-3">
                <Coffee className="w-8 h-8 text-pine-300 mx-auto" />
                <p>Tidak ada produk ditemukan untuk kriteria pencarian ini.</p>
                <button
                  type="button"
                  onClick={() => setShowQuickAddModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-forest-900 hover:bg-forest-800 text-white font-bold text-xs shadow-warm-xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-sun-400" />
                  <span>Tambah Menu Ini Sekarang</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3">
                {filteredProducts.map((product) => {
                  const isOutOfStock = product.stock !== null && product.stock <= 0
                  return (
                    <motion.button
                      whileHover={isOutOfStock ? {} : { y: -2 }}
                      whileTap={isOutOfStock ? {} : { scale: 0.98 }}
                      key={product.id}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => {
                        addToCart(product, 1)
                        playScanBeep()
                      }}
                      className={`p-3.5 rounded-2xl bg-white border border-pine-200 text-left flex flex-col justify-between hover:border-forest-700 hover:shadow-warm-sm active:scale-[0.98] transition cursor-pointer group ${
                        isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1 mb-1.5">
                          <span className="text-[10px] font-mono font-medium text-pine-500 uppercase tracking-wider">
                            {product.category?.name || 'Menu'}
                          </span>
                          {product.stock !== null && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                              product.stock <= 5 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              Stok: {product.stock}
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-xs text-forest-950 line-clamp-2 leading-snug group-hover:text-forest-800">
                          {product.name}
                        </h4>
                      </div>

                      <div className="mt-3 pt-2 border-t border-pine-100 flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-forest-900">
                          Rp {Number(product.price || 0).toLocaleString('id-ID')}
                        </span>
                        <div className="w-6 h-6 rounded-lg bg-paper-100 group-hover:bg-forest-900 group-hover:text-white flex items-center justify-center text-forest-800 transition">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Mobile Bottom Floating Cart Summary Bar */}
          {cart.length > 0 && (
            <div className="lg:hidden p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] bg-forest-950 text-white border-t border-forest-900 shadow-2xl flex items-center justify-between z-20 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-forest-800 flex items-center justify-center text-sun-400 font-mono text-xs font-bold">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </div>
                <div>
                  <span className="text-[10px] text-pine-300 block leading-tight">Total Keranjang</span>
                  <span className="font-mono font-bold text-xs sm:text-sm text-sun-400">
                    Rp {totals.totalAmount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={() => setMobileTab('cart')}
                className="px-3.5 py-2 rounded-xl bg-sun-400 text-forest-950 font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span>Lihat & Bayar</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          )}

        </div>

        {/* Right Side: Active Cart & Checkout (35%) */}
        <div className={`w-full lg:w-96 xl:w-[420px] flex-col bg-white shrink-0 shadow-warm-lg ${mobileTab === 'cart' ? 'flex' : 'hidden lg:flex'}`}>
          
          {/* Mobile Back Button to Catalog */}
          <div className="lg:hidden p-3 bg-paper-100 border-b border-pine-200 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={() => setMobileTab('catalog')}
              className="flex items-center gap-1.5 text-xs font-bold text-forest-950 hover:text-emerald-700 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Katalog Menu</span>
            </button>
            <span className="text-xs font-mono font-semibold text-pine-600">
              {cart.reduce((a, b) => a + b.quantity, 0)} Item
            </span>
          </div>

          {/* Cart Header */}
          <div className="p-4 border-b border-pine-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-forest-800" />
              <span className="font-serif font-bold text-base text-forest-950">Keranjang Kasir</span>
              <span className="px-2 py-0.5 rounded-full bg-forest-100 text-forest-900 text-[11px] font-mono font-bold">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </span>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Order Type Tabs */}
          <div className="px-4 py-2 border-b border-pine-100 flex gap-1.5 bg-paper-50/50">
            {[
              { id: 'dine_in', label: 'Dine-In' },
              { id: 'takeaway', label: 'Takeaway' },
              { id: 'delivery', label: 'Delivery' }
            ].map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setOrderType(type.id)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  orderType === type.id
                    ? 'bg-forest-900 text-white shadow-sm'
                    : 'bg-white border border-pine-200 text-ink-600 hover:bg-paper-100'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {/* Banner Notifikasi Pesanan Tamu di Drawer Kasir */}
            {pendingGuestCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-2 shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-400 text-forest-950 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm animate-pulse">
                    🔔
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold leading-tight truncate">
                      {pendingGuestCount} Pesanan Tamu Masuk!
                    </p>
                    <p className="text-[10px] text-amber-800 leading-tight">
                      Pelanggan telah order via scan QR Meja
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGuestModal(true)}
                  className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-forest-950 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Buka & Konfirmasi ({pendingGuestCount})</span>
                </button>
              </motion.div>
            )}

            {cart.length === 0 ? (
              <div className="py-20 text-center text-ink-400 space-y-2">
                <ShoppingCart className="w-10 h-10 text-pine-200 mx-auto" />
                <p className="text-xs font-semibold text-ink-600">Keranjang Kasir Kosong</p>
                <p className="text-[11px] text-ink-400 max-w-[220px] mx-auto">
                  Pilih menu katalog untuk pesanan langsung di kasir (Walk-in).
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {cart.map((item, idx) => {
                  const itemTotal = Number(item.product.price || 0) * item.quantity
                  const itemKey = item.product?.id ? `${item.product.id}-${idx}` : `cart-item-${idx}`
                  return (
                    <motion.div
                      key={itemKey}
                      layout
                      variants={cartItemVariant}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="p-3 rounded-2xl bg-paper-50 border border-pine-200 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h5 className="font-semibold text-xs text-forest-950 leading-tight">
                          {item.product.name}
                        </h5>
                        <span className="text-[11px] font-mono text-ink-500">
                          @ Rp {Number(item.product.price || 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-forest-900">
                        Rp {itemTotal.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {/* Qty increment / decrement */}
                      <div className="flex items-center gap-1.5 bg-white border border-pine-200 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(idx, -1)}
                          className="w-6 h-6 rounded-md hover:bg-paper-100 flex items-center justify-center text-ink-700 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono text-xs font-bold w-6 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(idx, 1)}
                          className="w-6 h-6 rounded-md hover:bg-paper-100 flex items-center justify-center text-ink-700 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Custom note */}
                      <input
                        type="text"
                        placeholder="Catatan (Less ice, pedas...)"
                        value={item.notes || ''}
                        onChange={(e) => updateItemNote(idx, e.target.value)}
                        className="w-40 text-[10px] px-2 py-1 bg-white border border-pine-200 rounded-lg text-ink-800 placeholder:text-ink-400 focus:outline-none focus:ring-1 focus:ring-forest-700"
                      />

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="p-1 rounded-md text-red-500 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}
          </div>

          {/* Cart Summary & Actions */}
          <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] border-t border-pine-100 bg-paper-50 space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-ink-600">
                <span>Subtotal:</span>
                <span className="font-mono font-medium">Rp {totals.subtotal.toLocaleString('id-ID')}</span>
              </div>
              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Diskon:</span>
                  <span className="font-mono font-medium">-Rp {totals.discountAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              {totals.taxAmount > 0 && (
                <div className="flex justify-between text-ink-600">
                  <span>PPN (10%):</span>
                  <span className="font-mono font-medium">Rp {totals.taxAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-pine-200">
                <span className="text-forest-950 font-serif">Total Tagihan:</span>
                <span className="font-mono text-lg text-forest-900">
                  Rp {totals.totalAmount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={handleHoldCurrentOrder}
                className="flex-1 py-3 px-3 rounded-xl border border-pine-200 bg-white hover:bg-paper-100 text-xs font-semibold text-ink-700 disabled:opacity-40 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Bookmark className="w-4 h-4 text-wood-500" />
                <span>Hold (F4)</span>
              </button>

              <button
                type="button"
                disabled={cart.length === 0}
                onClick={handleOpenPayment}
                className="flex-2 py-3 px-4 rounded-xl bg-forest-900 hover:bg-forest-800 text-white font-semibold text-xs disabled:opacity-40 shadow-warm-md hover:shadow-warm-lg transition cursor-pointer flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Bayar Sekarang (F8)</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Modals */}
      <PaymentModal
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        order={completedOrder}
        storeSettings={storeSettings}
      />

      <HeldOrdersModal
        isOpen={showHeldModal}
        onClose={() => setShowHeldModal(false)}
      />

      <TablePickerModal
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
      />

      <ShiftModal
        isOpen={showShiftModal}
        onClose={() => setShowShiftModal(false)}
      />

      <GuestOrdersModal
        isOpen={showGuestModal}
        onClose={() => {
          setShowGuestModal(false)
          checkPendingGuestOrders()
        }}
        onOrderConfirmed={(confirmedOrder) => {
          setCompletedOrder(confirmedOrder)
          setShowReceiptModal(true)
          checkPendingGuestOrders()
        }}
      />

      {/* Modal Cepat Tambah Menu Kasir */}
      <QuickAddProductModal
        isOpen={showQuickAddModal}
        onClose={() => setShowQuickAddModal(false)}
        categories={categories}
        onSuccess={(newProduct) => {
          fetchProducts(selectedCategory)
          playSuccessChime()
          setSuccessToast(`Menu "${newProduct.name}" berhasil ditambahkan ke katalog kasir!`)
          setTimeout(() => setSuccessToast(null), 4000)
        }}
      />

      {/* Toast Notifikasi Berhasil */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            variants={toastVariant}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed top-4 right-4 z-50 bg-forest-950 text-white px-4 py-2.5 rounded-2xl shadow-warm-lg border border-sun-400/50 flex items-center gap-2.5 text-xs font-bold"
          >
            <div className="w-5 h-5 rounded-full bg-sun-400 text-forest-950 flex items-center justify-center font-bold">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
