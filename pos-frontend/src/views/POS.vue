<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { usePosStore } from '../stores/pos'
import { useBarcodeScanner } from '../composables/useBarcodeScanner'
import { useSoundFx } from '../composables/useSoundFx'
import api from '../api'
import {
  LogOut, Trash2, ShoppingBag, X, Search, Barcode,
  PauseCircle, PlayCircle, Clock, Percent, Printer,
  Plus, Minus, Check, AlertTriangle, Layers, DollarSign,
  CreditCard, QrCode, History, AlertCircle, UtensilsCrossed,
  Volume2, VolumeX, Eye, Users, CheckCircle2, Split,
  Store, ChefHat, UserCircle2, ArrowRight, Sparkles, LayoutGrid, List
} from 'lucide-vue-next'

const router = useRouter()
const store = usePosStore()
const { isMuted, toggleMute, playBeep, playSuccess, playWarning } = useSoundFx()

// User yang sedang login
const currentUser = computed(() => {
  try {
    return JSON.parse(localStorage.getItem('pos_user') || '{}')
  } catch (e) {
    return {}
  }
})

// Jam Digital Real-time di Header
const currentTime = ref('')
const currentDate = ref('')
let clockInterval = null

const updateClock = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
  currentDate.value = now.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

// Mode Tampilan Katalog (Grid vs List Kompak)
const viewMode = ref('grid') // 'grid' | 'compact'

// State Pencarian
const searchQuery = ref('')
const searchInputRef = ref(null)

// State Modal Pemilih Meja (Floor Plan)
const showTableModal = ref(false)

// State Modal Split Bill (Patungan)
const showSplitBillModal = ref(false)
const splitPersonCount = ref(2)
const splitPaidChecklist = ref({})

// State Modal Preview Struk Kasir (58mm vs 80mm)
const showReceiptPreviewModal = ref(false)
const previewPaperWidth = ref('58mm') // '58mm' | '80mm'
const activeReceiptPreview = ref(null)

// State Modal Pembayaran
const showPaymentModal = ref(false)
const isSubmitting = ref(false)
const paymentForm = ref({
  orderType: 'dine_in',
  tableId: '',
  paymentMethod: 'cash',
  cashTendered: '',
  notes: '',
  customerName: '',
  customerPhone: '',
  cardBank: 'BCA',
  cardApprovalCode: ''
})

// QRIS Countdown & Simulator
const qrisTimer = ref(300)
let qrisInterval = null

// State Modal Topping/Modifier
const showModifierModal = ref(false)
const activeProduct = ref(null)
const selectedModifiers = ref([])
const selectedRadios = ref({})
const itemNotes = ref('')

// State Modal Hold Order
const showHoldModal = ref(false)
const showHeldListModal = ref(false)
const holdForm = ref({
  customerName: '',
  referenceNote: '',
  orderType: 'dine_in',
  tableId: ''
})

// State Manajemen Shift & Rekonsiliasi Kasir
const showOpenShiftModal = ref(false)
const showCloseShiftModal = ref(false)
const shiftActiveTab = ref('summary') // 'summary' | 'my_orders' | 'calculator'
const startingCashInput = ref('')
const actualCashInput = ref('')
const shiftNotesInput = ref('')
const closeShiftSummary = ref(null)

// Kalkulator Hitung Uang Pecahan Kasir
const cashDenominations = ref({
  c100k: 0,
  c50k: 0,
  c20k: 0,
  c10k: 0,
  c5k: 0,
  c2k: 0,
  c1k: 0,
  coin: 0
})

const calculateTotalFromDenominations = () => {
  const total =
    (cashDenominations.value.c100k * 100000) +
    (cashDenominations.value.c50k * 50000) +
    (cashDenominations.value.c20k * 20000) +
    (cashDenominations.value.c10k * 10000) +
    (cashDenominations.value.c5k * 5000) +
    (cashDenominations.value.c2k * 2000) +
    (cashDenominations.value.c1k * 1000) +
    (Number(cashDenominations.value.coin) || 0)
  
  actualCashInput.value = total
}

// State Diskon & Pajak
const showDiscountModal = ref(false)
const tempDiscountType = ref('none')
const tempDiscountValue = ref(0)
const isTaxEnabled = ref(true)

// State Struk Cetak
const receiptData = ref(null)
const shiftReceiptData = ref(null)
const scanNotification = ref(null)

// State Riwayat Order & Void
const showOrderHistory = ref(false)
const showOrderDetail = ref(false)
const selectedOrder = ref(null)
const showVoidModal = ref(false)
const voidTargetOrder = ref(null)
const voidReason = ref('')
const voidSubmitting = ref(false)

// Format Rupiah
const formatRupiah = (number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0)

// Inisialisasi Data
onMounted(async () => {
  updateClock()
  clockInterval = setInterval(updateClock, 1000)

  await Promise.all([
    store.fetchCategories(),
    store.fetchProducts(),
    store.fetchHeldOrders(),
    store.fetchCurrentShift(),
    store.fetchStoreSettings(),
    store.fetchTables(),
    store.fetchCashierShiftOrders()
  ])
  window.addEventListener('keydown', handleGlobalShortcuts)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalShortcuts)
  if (clockInterval) clearInterval(clockInterval)
  if (qrisInterval) clearInterval(qrisInterval)
})

// Shortcut Keyboard Kasir Cepat
const handleGlobalShortcuts = (e) => {
  if (e.key === 'F2') {
    e.preventDefault()
    searchInputRef.value?.focus()
  } else if (e.key === 'F3') {
    e.preventDefault()
    showTableModal.value = true
  } else if (e.key === 'F4') {
    e.preventDefault()
    if (store.cart.length > 0) openHoldModal()
  } else if (e.key === 'F7') {
    e.preventDefault()
    showHeldListModal.value = true
  } else if (e.key === 'F8') {
    e.preventDefault()
    if (store.cart.length > 0) openPaymentModal()
  } else if (e.key === 'F9') {
    e.preventDefault()
    openOrderHistory()
  } else if (e.key === 'Escape') {
    showPaymentModal.value = false
    showModifierModal.value = false
    showHoldModal.value = false
    showHeldListModal.value = false
    showOpenShiftModal.value = false
    showCloseShiftModal.value = false
    showDiscountModal.value = false
    showOrderHistory.value = false
    showOrderDetail.value = false
    showVoidModal.value = false
    showTableModal.value = false
    showSplitBillModal.value = false
    showReceiptPreviewModal.value = false
  }
}

// Barcode Scanner Listener
useBarcodeScanner(async (barcode) => {
  try {
    const product = await store.fetchProductByBarcode(barcode)
    if (product) {
      handleProductClick(product)
      playBeep()
      showScanToast(`Discan: ${product.name}`)
    }
  } catch (err) {
    playWarning()
    showScanToast(`Barcode '${barcode}' tidak ditemukan!`, true)
  }
})

const showScanToast = (msg, isError = false) => {
  scanNotification.value = { msg, isError }
  setTimeout(() => {
    scanNotification.value = null
  }, 2500)
}

// Filter Produk Berdasarkan Pencarian Teks
const filteredProducts = computed(() => {
  if (!searchQuery.value) return store.products
  const query = searchQuery.value.toLowerCase()
  return store.products.filter(
    p => p.name.toLowerCase().includes(query) || (p.sku && p.sku.toLowerCase().includes(query))
  )
})

// Handler Klik Produk
const handleProductClick = (product) => {
  if (product.stock !== null && product.stock <= 0 && product.track_stock) {
    playWarning()
    showScanToast(`Stok "${product.name}" telah habis!`, true)
    return
  }

  playBeep()
  if (product.modifier_groups && product.modifier_groups.length > 0) {
    activeProduct.value = product
    selectedModifiers.value = []
    selectedRadios.value = {}
    itemNotes.value = ''
    showModifierModal.value = true
  } else {
    store.addToCart(product)
  }
}

// Konfirmasi Tambah Topping
const confirmAddToCart = () => {
  if (!activeProduct.value) return

  for (const group of activeProduct.value.modifier_groups) {
    if (group.is_required) {
      const hasRadio = selectedRadios.value[group.id]
      const hasCheckbox = selectedModifiers.value.some(m => m.modifier_group_id === group.id)
      if (!hasRadio && !hasCheckbox) {
        alert(`Pilihan "${group.name}" wajib dipilih!`)
        return
      }
    }
  }

  const combinedModifiers = [
    ...selectedModifiers.value,
    ...Object.values(selectedRadios.value)
  ]

  store.addToCart(activeProduct.value, combinedModifiers, itemNotes.value)
  playBeep()
  showModifierModal.value = false
}

// Meja Terpilih
const selectedTableObject = computed(() => {
  if (!paymentForm.value.tableId) return null
  return store.tables.find(t => t.id === Number(paymentForm.value.tableId)) || null
})

const selectTable = (table) => {
  if (table) {
    paymentForm.value.tableId = table.id
    paymentForm.value.orderType = 'dine_in'
  } else {
    paymentForm.value.tableId = ''
    paymentForm.value.orderType = 'takeaway'
  }
  showTableModal.value = false
}

// Pembayaran Cepat (Quick Cash Pecahan)
const setQuickCash = (amount) => {
  if (amount === 'exact') {
    paymentForm.value.cashTendered = store.grandTotal
  } else {
    paymentForm.value.cashTendered = amount
  }
}

const addCashPreset = (amount) => {
  const current = Number(paymentForm.value.cashTendered) || 0
  paymentForm.value.cashTendered = current + amount
}

const openPaymentModal = () => {
  if (store.cart.length === 0) return
  paymentForm.value.cashTendered = ''
  paymentForm.value.customerName = store.customerName || ''
  paymentForm.value.customerPhone = store.customerPhone || ''
  
  // Reset QRIS timer
  qrisTimer.value = 300
  if (qrisInterval) clearInterval(qrisInterval)
  qrisInterval = setInterval(() => {
    if (qrisTimer.value > 0) qrisTimer.value--
  }, 1000)

  showPaymentModal.value = true
}

// Submit Order Transaksi
const submitOrder = async () => {
  if (paymentForm.value.paymentMethod === 'cash') {
    const cash = Number(paymentForm.value.cashTendered) || 0
    if (cash < store.grandTotal) {
      playWarning()
      alert('Uang tunai kurang dari total tagihan!')
      return
    }
  }

  isSubmitting.value = true
  try {
    const payload = {
      order_type: paymentForm.value.orderType,
      table_id: paymentForm.value.tableId || null,
      payment_method: paymentForm.value.paymentMethod,
      cash_tendered: paymentForm.value.paymentMethod === 'cash' ? Number(paymentForm.value.cashTendered) : null,
      discount_type: store.discountType,
      discount_value: store.discountValue,
      tax_rate: store.taxRate,
      items: store.cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        notes: item.notes,
        modifiers: item.modifiers.map(m => ({ id: m.id }))
      }))
    }

    const { data } = await api.post('/orders', payload)
    receiptData.value = data.data
    playSuccess()

    await nextTick()
    setTimeout(() => {
      window.print()
      store.clearCart()
      showPaymentModal.value = false
      paymentForm.value.cashTendered = ''
      receiptData.value = null
      
      // Refresh shift data & riwayat transaksi kasir
      store.fetchCurrentShift()
      store.fetchCashierShiftOrders()
    }, 300)
  } catch (error) {
    playWarning()
    alert(error.response?.data?.message || 'Gagal memproses transaksi')
  } finally {
    isSubmitting.value = false
  }
}

// Simulasi Scan QRIS Berhasil (Untuk Demo Penjualan)
const simulateQrisSuccess = () => {
  submitOrder()
}

// Live Thermal Receipt Preview
const openReceiptPreview = (order = null) => {
  if (order) {
    activeReceiptPreview.value = order
  } else {
    // Bangun data preview dari cart aktif
    activeReceiptPreview.value = {
      invoice_number: 'PREVIEW-' + Math.floor(1000 + Math.random() * 9000),
      created_at: new Date().toISOString(),
      order_type: paymentForm.value.orderType,
      table: selectedTableObject.value,
      user: currentUser.value,
      payment_method: paymentForm.value.paymentMethod,
      subtotal: store.subtotal,
      discount_amount: store.discountAmount,
      tax_amount: store.tax,
      total_amount: store.grandTotal,
      cash_tendered: paymentForm.value.paymentMethod === 'cash' ? Number(paymentForm.value.cashTendered) || store.grandTotal : store.grandTotal,
      change_due: paymentForm.value.paymentMethod === 'cash' ? Math.max(0, (Number(paymentForm.value.cashTendered) || store.grandTotal) - store.grandTotal) : 0,
      items: store.cart.map(c => ({
        id: c.product_id,
        product: { name: c.name },
        quantity: c.quantity,
        unit_price: c.price,
        subtotal: c.price * c.quantity,
        modifiers: c.modifiers.map(m => ({ id: m.id, modifier_item: { name: m.name }, unit_price: m.price })),
        notes: c.notes
      }))
    }
  }
  showReceiptPreviewModal.value = true
}

const printDirectFromPreview = () => {
  receiptData.value = activeReceiptPreview.value
  showReceiptPreviewModal.value = false
  nextTick(() => {
    setTimeout(() => {
      window.print()
      receiptData.value = null
    }, 200)
  })
}

// Split Bill Handlers
const openSplitBillModal = () => {
  if (store.cart.length === 0) return
  splitPersonCount.value = 2
  splitPaidChecklist.value = {}
  showSplitBillModal.value = true
}

const splitPerPerson = computed(() => {
  const count = Number(splitPersonCount.value) || 1
  return Math.ceil(store.grandTotal / count)
})

// Hold Order Handlers
const openHoldModal = () => {
  holdForm.value = {
    customerName: store.customerName || '',
    referenceNote: '',
    orderType: paymentForm.value.orderType || 'dine_in',
    tableId: paymentForm.value.tableId || ''
  }
  showHoldModal.value = true
}

const confirmHoldOrder = async () => {
  try {
    await store.holdOrder(holdForm.value)
    showHoldModal.value = false
    showScanToast('Transaksi berhasil disimpan sementara')
  } catch (err) {
    alert('Gagal menyimpan transaksi')
  }
}

const resumeHeldOrder = async (held) => {
  await store.resumeHeldOrder(held)
  showHeldListModal.value = false
  showScanToast(`Order ${held.customer_name || 'Tanpa Nama'} dipulihkan`)
}

// Diskon & Pajak Handlers
const openDiscountModal = () => {
  tempDiscountType.value = store.discountType
  tempDiscountValue.value = store.discountValue
  showDiscountModal.value = true
}

const applyDiscount = () => {
  store.setDiscount(tempDiscountType.value, tempDiscountValue.value)
  showDiscountModal.value = false
}

const toggleTax = () => {
  isTaxEnabled.value = !isTaxEnabled.value
  store.setTaxRate(isTaxEnabled.value ? 10 : 0)
}

// Shift Handlers & Kasir Rekonsiliasi
const handleOpenShift = async () => {
  if (!startingCashInput.value || Number(startingCashInput.value) < 0) {
    alert('Masukkan kas awal yang valid')
    return
  }
  try {
    await store.openShift(Number(startingCashInput.value))
    showOpenShiftModal.value = false
    startingCashInput.value = ''
    playSuccess()
    showScanToast('Shift kasir berhasil dibuka')
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal membuka shift')
  }
}

const openCloseShiftDialog = async () => {
  await Promise.all([
    store.fetchCurrentShift(),
    store.fetchCashierShiftOrders()
  ])
  shiftActiveTab.value = 'summary'
  actualCashInput.value = ''
  shiftNotesInput.value = ''
  closeShiftSummary.value = null
  cashDenominations.value = { c100k: 0, c50k: 0, c20k: 0, c10k: 0, c5k: 0, c2k: 0, c1k: 0, coin: 0 }
  showCloseShiftModal.value = true
}

const handleCloseShift = async () => {
  if (actualCashInput.value === '' || Number(actualCashInput.value) < 0) {
    alert('Masukkan jumlah uang fisik di laci')
    return
  }
  try {
    const res = await store.closeShift(Number(actualCashInput.value), shiftNotesInput.value)
    closeShiftSummary.value = res.data
    shiftReceiptData.value = res.data
    playSuccess()
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menutup shift')
  }
}

const printShiftReceipt = () => {
  setTimeout(() => {
    window.print()
  }, 200)
}

const logout = async () => {
  try { await api.post('/logout') } catch (e) {}
  localStorage.clear()
  router.push('/login')
}

// Riwayat Order
const openOrderHistory = async () => {
  showOrderHistory.value = true
  await store.fetchRecentOrders()
}

const viewOrderDetail = async (order) => {
  try {
    const { data } = await api.get(`/orders/${order.id}`)
    selectedOrder.value = data.data
    showOrderDetail.value = true
  } catch (err) {
    alert('Gagal mengambil detail order')
  }
}

const reprintReceipt = (order) => {
  receiptData.value = order
  showOrderDetail.value = false
  showOrderHistory.value = false
  nextTick(() => {
    setTimeout(() => window.print(), 200)
  })
}

// Void Order
const openVoidModal = (order) => {
  voidTargetOrder.value = order
  voidReason.value = ''
  showVoidModal.value = true
}

const canVoidOrder = (order) => {
  if (order.status !== 'completed') return false
  const orderDate = new Date(order.created_at).toDateString()
  const today = new Date().toDateString()
  return orderDate === today
}

const confirmVoid = async () => {
  if (!voidReason.value || voidReason.value.length < 3) {
    alert('Alasan void minimal 3 karakter!')
    return
  }
  voidSubmitting.value = true
  try {
    await store.voidOrder(voidTargetOrder.value.id, voidReason.value)
    playWarning()
    showVoidModal.value = false
    showOrderDetail.value = false
    await Promise.all([
      store.fetchRecentOrders(),
      store.fetchCashierShiftOrders(),
      store.fetchCurrentShift()
    ])
    showScanToast('Order berhasil di-void dan stok dikembalikan')
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal void order')
  } finally {
    voidSubmitting.value = false
  }
}

const formatStatus = (status) => {
  const map = { completed: 'Selesai', cancelled: 'Dibatalkan', pending: 'Pending', processing: 'Diproses' }
  return map[status] || status
}

const formatPayment = (method) => {
  const map = { cash: 'Tunai', qris: 'QRIS', card: 'Kartu', transfer: 'Transfer' }
  return map[method] || method
}
</script>

<template>
  <div class="h-screen flex bg-slate-100 overflow-hidden relative select-none font-sans">
    
    <!-- NOTIFIKASI SCANNER / TOAST -->
    <div
      v-if="scanNotification"
      :class="[
        'fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl text-white font-bold flex items-center gap-3 transition-all animate-in fade-in slide-in-from-top-3',
        scanNotification.isError ? 'bg-red-600' : 'bg-emerald-600'
      ]"
    >
      <Barcode class="w-6 h-6 animate-pulse" />
      <span>{{ scanNotification.msg }}</span>
    </div>

    <!-- AREA KIRI: KATALOG PRODUK & BAR KONTROL UTAMA -->
    <div class="flex-1 flex flex-col h-full overflow-hidden">
      
      <!-- TOP NAVIGATION & STATUS BAR KASIR (PREMIUM FINTECH) -->
      <header class="bg-white shadow-sm h-16 flex items-center justify-between px-6 shrink-0 border-b border-slate-200">
        <div class="flex items-center gap-4">
          <!-- Logo & Brand -->
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-300">
              P
            </div>
            <div>
              <h1 class="text-sm font-extrabold text-slate-900 leading-tight flex items-center gap-1.5">
                <span>{{ store.storeSettings?.store_name || 'POS System' }}</span>
                <span class="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.2 rounded-md border border-emerald-200">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Sync
                </span>
              </h1>
              <p class="text-[10px] text-slate-400 font-mono">{{ currentDate }} &bull; {{ currentTime }}</p>
            </div>
          </div>

          <!-- Informasi Kasir Aktif & Status Shift -->
          <div class="ml-2 pl-4 border-l border-slate-200 flex items-center gap-2.5">
            <!-- Kasir Profile Chip -->
            <div class="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
              <div class="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                {{ currentUser?.name?.charAt(0) || 'K' }}
              </div>
              <div class="text-left">
                <div class="text-xs font-bold text-slate-800 leading-none">{{ currentUser?.name || 'Kasir Utama' }}</div>
                <div class="text-[9px] text-slate-400 uppercase font-mono">{{ currentUser?.role || 'cashier' }}</div>
              </div>
            </div>

            <!-- Status Shift Kasir -->
            <div v-if="store.activeShift" class="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-xl border border-emerald-200 text-xs font-bold">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Shift Aktif</span>
              <button
                @click="openCloseShiftDialog"
                class="ml-1 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded-lg shadow-sm font-bold transition-all"
              >
                Cek Kas & Tutup
              </button>
            </div>
            <div v-else class="flex items-center gap-2 bg-amber-50 text-amber-800 px-3 py-1 rounded-xl border border-amber-200 text-xs font-bold">
              <AlertTriangle class="w-4 h-4 text-amber-500" />
              <span>Shift Belum Dibuka</span>
              <button @click="showOpenShiftModal = true" class="ml-1 px-2.5 py-0.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-bold shadow-sm">
                Buka Shift
              </button>
            </div>
          </div>
        </div>

        <!-- Tombol Aksi Cepat Header -->
        <div class="flex items-center gap-2.5">
          <!-- Audio Toggle -->
          <button
            @click="toggleMute"
            class="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors"
            :title="isMuted ? 'Nyalakan Audio Register' : 'Bisukan Audio'"
          >
            <Volume2 v-if="!isMuted" class="w-4 h-4 text-emerald-600" />
            <VolumeX v-else class="w-4 h-4 text-slate-400" />
          </button>

          <!-- Tombol Layar Dapur (KDS) -->
          <button
            @click="router.push('/kitchen')"
            class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors"
          >
            <ChefHat class="w-4 h-4 text-amber-600" />
            <span>Dapur (KDS)</span>
          </button>

          <!-- Tombol Admin Executive Suite (Jika Admin) -->
          <button
            v-if="currentUser?.role === 'admin'"
            @click="router.push('/admin/dashboard')"
            class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100 transition-colors"
          >
            <Store class="w-4 h-4 text-purple-600" />
            <span>Admin Suite</span>
          </button>

          <!-- Tombol Riwayat Order [F9] -->
          <button
            @click="openOrderHistory"
            class="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <History class="w-4 h-4 text-blue-500" />
            <span>Riwayat [F9]</span>
          </button>

          <!-- Tombol Held Orders [F7] -->
          <button
            @click="showHeldListModal = true"
            class="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Clock class="w-4 h-4 text-amber-500" />
            <span>Hold [F7]</span>
            <span
              v-if="store.heldOrders.length > 0"
              class="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-extrabold shadow"
            >
              {{ store.heldOrders.length }}
            </span>
          </button>

          <!-- Logout -->
          <button
            @click="logout"
            class="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors"
            title="Keluar"
          >
            <LogOut class="w-4 h-4" />
          </button>
        </div>
      </header>

      <!-- SUB HEADER: SEARCH BAR & KATEGORI -->
      <div class="bg-white px-6 py-3 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0 shadow-sm">
        <!-- Input Pencarian & Barcode -->
        <div class="relative flex-1 max-w-md">
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            ref="searchInputRef"
            data-scanner-input="true"
            v-model="searchQuery"
            type="text"
            placeholder="Cari menu atau scan barcode... [F2]"
            class="w-full pl-9 pr-14 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
          />
          <div class="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
            <Barcode class="w-3.5 h-3.5 text-slate-600" />
            <span>AUTO</span>
          </div>
        </div>

        <!-- Toggle View Mode: Grid vs List -->
        <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            @click="viewMode = 'grid'"
            :class="['p-1.5 rounded-lg transition-all', viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800']"
            title="Tampilan Grid"
          >
            <LayoutGrid class="w-4 h-4" />
          </button>
          <button
            @click="viewMode = 'compact'"
            :class="['p-1.5 rounded-lg transition-all', viewMode === 'compact' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800']"
            title="Tampilan List Kompak"
          >
            <List class="w-4 h-4" />
          </button>
        </div>

        <!-- Kategori Pills -->
        <div class="flex gap-2 overflow-x-auto py-1 scrollbar-none max-w-lg">
          <button
            @click="store.fetchProducts('')"
            :class="[
              'px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all',
              store.activeCategory === ''
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            ]"
          >
            Semua Menu
          </button>
          <button
            v-for="cat in store.categories"
            :key="cat.id"
            @click="store.fetchProducts(cat.id)"
            :class="[
              'px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all',
              store.activeCategory === cat.id
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            ]"
          >
            {{ cat.name }}
          </button>
        </div>
      </div>

      <!-- KATALOG PRODUK -->
      <main class="flex-1 overflow-y-auto p-6">
        <div v-if="filteredProducts.length === 0" class="flex flex-col items-center justify-center h-64 text-slate-400">
          <Search class="w-12 h-12 mb-2 stroke-1" />
          <p class="font-medium text-sm">Menu tidak ditemukan</p>
        </div>

        <!-- GRID VIEW MODE -->
        <div v-else-if="viewMode === 'grid'" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <div
            v-for="product in filteredProducts"
            :key="product.id"
            @click="handleProductClick(product)"
            :class="[
              'bg-white rounded-2xl p-4 flex flex-col justify-between border shadow-sm transition-all relative group',
              product.track_stock && product.stock <= 0
                ? 'opacity-60 border-slate-200 cursor-not-allowed'
                : 'border-slate-200/80 hover:shadow-md hover:border-blue-400 cursor-pointer active:scale-[0.98]'
            ]"
          >
            <!-- Badge Varian / Topping -->
            <div v-if="product.modifier_groups && product.modifier_groups.length > 0" class="absolute top-3 right-3">
              <span class="bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md">
                + Varian
              </span>
            </div>

            <!-- SKU / Barcode -->
            <div class="text-[10px] font-mono text-slate-400 mb-1">
              {{ product.sku || 'NO-SKU' }}
            </div>

            <div class="font-bold text-slate-800 text-sm leading-snug line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
              {{ product.name }}
            </div>

            <!-- Harga & Status Stok -->
            <div class="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
              <span class="text-blue-600 font-black text-sm">{{ formatRupiah(product.price) }}</span>
              
              <span
                v-if="product.track_stock"
                :class="[
                  'text-[10px] font-bold px-1.5 py-0.5 rounded',
                  product.stock <= 0
                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                    : (product.stock <= 5 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-50 text-slate-500')
                ]"
              >
                {{ product.stock <= 0 ? 'Habis' : `Stok: ${product.stock}` }}
              </span>
            </div>
          </div>
        </div>

        <!-- COMPACT LIST VIEW MODE -->
        <div v-else class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table class="w-full text-left text-xs text-slate-700">
            <thead class="bg-slate-50 text-slate-400 font-bold border-b text-[10px] uppercase">
              <tr>
                <th class="p-3 pl-4">Menu</th>
                <th class="p-3">SKU</th>
                <th class="p-3">Kategori</th>
                <th class="p-3 text-center">Stok</th>
                <th class="p-3 text-right">Harga</th>
                <th class="p-3 pr-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="product in filteredProducts"
                :key="product.id"
                @click="handleProductClick(product)"
                class="hover:bg-blue-50/50 cursor-pointer transition-colors"
              >
                <td class="p-3 pl-4 font-bold text-slate-800">{{ product.name }}</td>
                <td class="p-3 font-mono text-slate-400 text-[11px]">{{ product.sku || '-' }}</td>
                <td class="p-3 text-slate-500">{{ product.category?.name || 'Umum' }}</td>
                <td class="p-3 text-center font-bold">
                  <span v-if="product.track_stock" :class="product.stock <= 0 ? 'text-rose-600' : (product.stock <= 5 ? 'text-amber-600' : 'text-slate-600')">
                    {{ product.stock <= 0 ? 'Habis' : product.stock }}
                  </span>
                  <span v-else class="text-slate-400">&infin;</span>
                </td>
                <td class="p-3 text-right font-black text-blue-600">{{ formatRupiah(product.price) }}</td>
                <td class="p-3 pr-4 text-center">
                  <button class="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-[11px] font-bold transition-colors">
                    + Tambah
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>

    <!-- AREA KANAN: KERANJANG KASIR (CHECKOUT WORKFLOW) -->
    <aside class="w-[420px] bg-white shadow-2xl h-full flex flex-col shrink-0 z-10 border-l border-slate-200">
      
      <!-- Header Keranjang Kasir -->
      <div class="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <ShoppingBag class="w-5 h-5 text-blue-600" />
          <h2 class="text-base font-black text-slate-800">Keranjang</h2>
          <span class="bg-blue-600 text-white text-xs font-black px-2 py-0.5 rounded-full shadow-sm">
            {{ store.totalItemCount }}
          </span>
        </div>
        <button
          @click="store.clearCart()"
          :disabled="store.cart.length === 0"
          class="text-xs text-rose-500 hover:text-rose-700 disabled:opacity-30 flex items-center gap-1 font-bold p-1 transition-colors"
        >
          <Trash2 class="w-4 h-4" /> Kosongkan
        </button>
      </div>

      <!-- Quick Action Chips: Pemilih Meja & Pelanggan -->
      <div class="p-3 border-b border-slate-200/80 bg-white grid grid-cols-2 gap-2">
        <!-- Chip Meja Restoran -->
        <button
          @click="showTableModal = true"
          class="flex items-center justify-between p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-left transition-all group"
        >
          <div class="flex items-center gap-2 overflow-hidden">
            <UtensilsCrossed class="w-4 h-4 text-amber-500 shrink-0" />
            <div class="truncate">
              <div class="text-[10px] text-slate-400 uppercase font-mono">Meja / Tipe</div>
              <div class="text-xs font-extrabold text-slate-800 truncate group-hover:text-blue-600">
                {{ selectedTableObject ? `Meja ${selectedTableObject.table_number}` : (paymentForm.orderType === 'takeaway' ? 'Bungkus' : 'Pilih Meja [F3]') }}
              </div>
            </div>
          </div>
          <span class="text-[10px] text-slate-400 font-mono">&rarr;</span>
        </button>

        <!-- Chip Nama Pelanggan -->
        <div class="p-2 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-2">
          <Users class="w-4 h-4 text-blue-500 shrink-0" />
          <div class="flex-1 min-w-0">
            <div class="text-[10px] text-slate-400 uppercase font-mono">Pelanggan</div>
            <input
              v-model="store.customerName"
              type="text"
              placeholder="Umum / Member"
              class="w-full text-xs font-bold text-slate-800 bg-transparent outline-none truncate placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      <!-- Daftar Item Pesanan -->
      <div class="flex-1 overflow-y-auto p-4 space-y-2.5">
        <div v-if="store.cart.length === 0" class="flex flex-col items-center justify-center h-full text-slate-400">
          <ShoppingBag class="w-12 h-12 mb-3 stroke-1 text-slate-300" />
          <p class="text-sm font-bold text-slate-500">Keranjang masih kosong</p>
          <p class="text-xs text-slate-400 mt-1">Pilih menu di kiri atau scan barcode</p>
        </div>

        <div
          v-for="(item, index) in store.cart"
          :key="index"
          class="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 hover:border-slate-300 transition-all flex flex-col gap-1.5 shadow-sm"
        >
          <div class="flex justify-between items-start gap-2">
            <div class="font-bold text-xs text-slate-900 leading-snug">{{ item.name }}</div>
            <button @click="store.removeFromCart(index)" class="text-slate-400 hover:text-rose-500 p-0.5 transition-colors">
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Modifiers / Topping -->
          <div v-if="item.modifierText" class="text-[11px] font-semibold text-blue-600 flex items-center gap-1">
            <span>+ {{ item.modifierText }}</span>
          </div>

          <!-- Notes -->
          <div v-if="item.notes" class="text-[11px] text-amber-700 italic bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60">
            "{{ item.notes }}"
          </div>

          <!-- Quantity Controls & Subtotal -->
          <div class="flex justify-between items-center mt-1 pt-2 border-t border-slate-200/60">
            <div class="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-1 py-0.5 shadow-sm">
              <button @click="store.updateQuantity(index, -1)" class="p-1 hover:bg-slate-100 rounded-lg text-slate-600 font-bold">
                <Minus class="w-3.5 h-3.5" />
              </button>
              <span class="text-xs font-black text-slate-800 w-5 text-center font-mono">{{ item.quantity }}</span>
              <button @click="store.updateQuantity(index, 1)" class="p-1 hover:bg-slate-100 rounded-lg text-slate-600 font-bold">
                <Plus class="w-3.5 h-3.5" />
              </button>
            </div>

            <div class="text-right font-black text-xs text-slate-900 font-mono">
              {{ formatRupiah(item.price * item.quantity) }}
            </div>
          </div>
        </div>
      </div>

      <!-- PANEL CHECKOUT & FINANCIAL SUMMARY -->
      <div class="p-4 bg-white border-t border-slate-200 shadow-xl space-y-3">
        
        <!-- Action Row: Diskon, Pajak, & Split Bill -->
        <div class="grid grid-cols-3 gap-2">
          <button
            @click="openDiscountModal"
            class="flex items-center justify-center gap-1 py-2 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors"
          >
            <Percent class="w-3.5 h-3.5 text-blue-600" />
            <span class="truncate">{{ store.discountType !== 'none' ? 'Diskon Aktif' : 'Diskon' }}</span>
          </button>

          <button
            @click="toggleTax"
            :class="[
              'flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold border transition-colors',
              isTaxEnabled
                ? 'bg-blue-50 text-blue-700 border-blue-200 font-extrabold'
                : 'bg-slate-50 text-slate-400 border-slate-200'
            ]"
          >
            <span>Pajak ({{ store.taxRate }}%)</span>
          </button>

          <!-- Tombol Split Bill (Patungan) -->
          <button
            @click="openSplitBillModal"
            :disabled="store.cart.length === 0"
            class="flex items-center justify-center gap-1 py-2 px-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold disabled:opacity-40 transition-colors"
          >
            <Split class="w-3.5 h-3.5 text-purple-600" />
            <span>Split Bill</span>
          </button>
        </div>

        <!-- Breakdown Total Belanja -->
        <div class="space-y-1.5 text-xs text-slate-600 pt-1">
          <div class="flex justify-between">
            <span>Subtotal:</span>
            <span class="font-bold text-slate-800 font-mono">{{ formatRupiah(store.subtotal) }}</span>
          </div>
          <div v-if="store.discountAmount > 0" class="flex justify-between text-rose-600 font-bold">
            <span>Diskon:</span>
            <span class="font-mono">- {{ formatRupiah(store.discountAmount) }}</span>
          </div>
          <div v-if="store.tax > 0" class="flex justify-between">
            <span>Pajak Restoran:</span>
            <span class="font-bold text-slate-800 font-mono">{{ formatRupiah(store.tax) }}</span>
          </div>
          <div class="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-100">
            <span>Total Tagihan:</span>
            <span class="text-blue-600 text-lg font-mono">{{ formatRupiah(store.grandTotal) }}</span>
          </div>
        </div>

        <!-- Tombol Aksi Utama: Hold, Preview, & Bayar -->
        <div class="flex gap-2 pt-1">
          <button
            @click="openHoldModal"
            :disabled="store.cart.length === 0"
            class="p-3 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl font-bold text-xs disabled:opacity-40 transition-colors flex items-center justify-center gap-1"
            title="Hold Order"
          >
            <PauseCircle class="w-4 h-4" />
          </button>

          <button
            @click="openReceiptPreview(null)"
            :disabled="store.cart.length === 0"
            class="p-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs disabled:opacity-40 transition-colors flex items-center justify-center gap-1"
            title="Preview Struk Thermal"
          >
            <Eye class="w-4 h-4 text-blue-600" />
          </button>

          <button
            @click="openPaymentModal"
            :disabled="store.cart.length === 0"
            class="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-extrabold text-sm shadow-lg shadow-blue-500/30 disabled:opacity-40 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Bayar [F8]</span>
            <span class="text-xs bg-blue-500/80 px-2 py-0.5 rounded-lg font-mono font-bold">{{ formatRupiah(store.grandTotal) }}</span>
          </button>
        </div>
      </div>
    </aside>

    <!-- ============================================================= -->
    <!-- MODAL-MODAL INTERAKTIF POS KOMERSIAL -->
    <!-- ============================================================= -->

    <!-- 1. MODAL DENAH / PEMILIH MEJA (FLOOR PLAN) -->
    <div v-if="showTableModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-150">
        <div class="p-5 border-b flex justify-between items-center bg-slate-50">
          <div>
            <h3 class="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <UtensilsCrossed class="w-5 h-5 text-amber-500" /> Denah Meja Restoran (Floor Plan)
            </h3>
            <p class="text-xs text-slate-500">Pilih meja untuk pesanan makan di tempat (Dine-in)</p>
          </div>
          <button @click="showTableModal = false" class="text-slate-400 hover:text-slate-700">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="p-6 overflow-y-auto flex-1 space-y-4">
          <!-- Opsi Tanpa Meja (Bungkus) -->
          <div
            @click="selectTable(null)"
            :class="[
              'p-3.5 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition-all',
              paymentForm.orderType === 'takeaway' ? 'border-blue-600 bg-blue-50/60' : 'border-slate-200 hover:border-slate-300 bg-slate-50'
            ]"
          >
            <div class="flex items-center gap-3">
              <ShoppingBag class="w-5 h-5 text-blue-600" />
              <div>
                <div class="font-extrabold text-sm text-slate-800">Pesanan Bungkus (Takeaway / Delivery)</div>
                <div class="text-xs text-slate-500">Tidak menempati meja restoran</div>
              </div>
            </div>
            <span v-if="paymentForm.orderType === 'takeaway'" class="text-xs font-bold text-blue-600">&check; Terpilih</span>
          </div>

          <!-- Grid Kartu Meja -->
          <div>
            <div class="text-xs font-extrabold text-slate-400 uppercase font-mono mb-2.5">Pilih Nomor Meja:</div>
            <div v-if="store.tables.length === 0" class="p-8 text-center text-slate-400 text-xs">
              Belum ada data meja. Tambahkan meja di menu Admin.
            </div>
            <div v-else class="grid grid-cols-3 sm:grid-cols-4 gap-3">
              <div
                v-for="table in store.tables"
                :key="table.id"
                @click="selectTable(table)"
                :class="[
                  'p-4 rounded-2xl border-2 cursor-pointer text-center flex flex-col items-center justify-between gap-1 transition-all',
                  paymentForm.tableId === table.id
                    ? 'border-blue-600 bg-blue-50 shadow-md shadow-blue-100 scale-105'
                    : 'border-slate-200 hover:border-blue-300 bg-white'
                ]"
              >
                <div class="text-base font-black text-slate-800 font-mono">Meja {{ table.table_number }}</div>
                <div class="text-[11px] text-slate-500 font-medium">{{ table.capacity || 4 }} Kursi</div>
                <span :class="[
                  'text-[9px] px-2 py-0.5 rounded-full font-bold uppercase mt-1',
                  table.status === 'occupied' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                ]">
                  {{ table.status === 'occupied' ? 'Terisi' : 'Tersedia' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 border-t bg-slate-50 text-right">
          <button @click="showTableModal = false" class="px-5 py-2.5 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs">
            Tutup
          </button>
        </div>
      </div>
    </div>

    <!-- 2. MODAL SPLIT BILL (BAYAR PATUNGAN) -->
    <div v-if="showSplitBillModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in duration-150">
        <div class="p-5 border-b flex justify-between items-center bg-purple-50">
          <div>
            <h3 class="text-base font-extrabold text-purple-900 flex items-center gap-2">
              <Split class="w-5 h-5 text-purple-600" /> Split Bill (Bagi Rata Tagihan)
            </h3>
            <p class="text-xs text-purple-700">Bagi total tagihan sama rata untuk pelanggan rombongan</p>
          </div>
          <button @click="showSplitBillModal = false" class="text-slate-400 hover:text-slate-700">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="p-6 space-y-4">
          <div class="bg-purple-50/60 border border-purple-200 rounded-2xl p-4 flex items-center justify-between">
            <span class="text-xs font-bold text-purple-800">Total Keseluruhan:</span>
            <span class="text-xl font-black text-purple-900 font-mono">{{ formatRupiah(store.grandTotal) }}</span>
          </div>

          <!-- Selector Jumlah Orang -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5">Dibagi Berapa Orang?</label>
            <div class="flex items-center gap-3">
              <button
                v-for="count in [2, 3, 4, 5]"
                :key="count"
                @click="splitPersonCount = count"
                :class="[
                  'flex-1 py-2.5 rounded-xl font-black text-xs border transition-all',
                  splitPersonCount === count ? 'bg-purple-600 text-white border-purple-600 shadow' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                ]"
              >
                {{ count }} Orang
              </button>
            </div>
          </div>

          <!-- Perhitungan Per Orang -->
          <div class="bg-slate-50 border rounded-2xl p-4 text-center space-y-1">
            <div class="text-xs text-slate-500 font-bold uppercase tracking-wider font-mono">Setiap Orang Membayar:</div>
            <div class="text-2xl font-black text-purple-700 font-mono">{{ formatRupiah(splitPerPerson) }}</div>
            <div class="text-[11px] text-slate-400">Total: {{ splitPersonCount }} x {{ formatRupiah(splitPerPerson) }}</div>
          </div>

          <!-- Checklist Status Pembayaran -->
          <div class="space-y-1.5">
            <div class="text-xs font-bold text-slate-600">Pelacakan Pembayaran:</div>
            <div
              v-for="p in splitPersonCount"
              :key="p"
              class="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border text-xs"
            >
              <span class="font-bold text-slate-800">Orang ke-{{ p }}</span>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="splitPaidChecklist[p]"
                  class="w-4 h-4 accent-purple-600 rounded"
                />
                <span :class="splitPaidChecklist[p] ? 'text-emerald-600 font-bold' : 'text-slate-400'">
                  {{ splitPaidChecklist[p] ? 'Lunas' : 'Belum Bayar' }}
                </span>
              </label>
            </div>
          </div>
        </div>

        <div class="p-4 border-t bg-slate-50 flex gap-2">
          <button @click="showSplitBillModal = false" class="flex-1 py-2.5 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs">
            Tutup
          </button>
          <button
            @click="showSplitBillModal = false; openPaymentModal()"
            class="flex-[2] py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
          >
            <span>Lanjut ke Kasir Pembayaran</span>
            <ArrowRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- 3. MODAL PEMBAYARAN KASIR CEPAT (DYNAMIC QRIS & MULTI-PAYMENT) -->
    <div v-if="showPaymentModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in duration-150">
        
        <div class="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 class="text-base font-extrabold text-slate-800">Kasir Pembayaran</h3>
            <p class="text-xs text-slate-500">Pilih metode bayar dan selesaikan transaksi</p>
          </div>
          <button @click="showPaymentModal = false" class="text-slate-400 hover:text-slate-700 p-1">
            <X class="w-6 h-6" />
          </button>
        </div>

        <div class="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <!-- Total Tagihan Jumbo -->
          <div class="bg-blue-50/80 border border-blue-100 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span class="text-xs font-bold text-blue-800 uppercase tracking-wider">Total Tagihan:</span>
              <div class="text-[11px] text-slate-500">
                {{ selectedTableObject ? `Meja ${selectedTableObject.table_number}` : paymentForm.orderType }} &bull; {{ store.customerName || 'Pelanggan Umum' }}
              </div>
            </div>
            <span class="text-2xl font-black text-blue-700 font-mono">{{ formatRupiah(store.grandTotal) }}</span>
          </div>

          <!-- Selector Metode Pembayaran -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-2">Metode Pembayaran</label>
            <div class="grid grid-cols-4 gap-2">
              <button
                type="button"
                @click="paymentForm.paymentMethod = 'cash'"
                :class="['p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 font-bold text-xs transition-all', paymentForm.paymentMethod === 'cash' ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-300' : 'bg-slate-50 text-slate-700 hover:bg-slate-100']"
              >
                <DollarSign class="w-5 h-5" /> Tunai
              </button>
              <button
                type="button"
                @click="paymentForm.paymentMethod = 'qris'"
                :class="['p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 font-bold text-xs transition-all', paymentForm.paymentMethod === 'qris' ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-300' : 'bg-slate-50 text-slate-700 hover:bg-slate-100']"
              >
                <QrCode class="w-5 h-5" /> QRIS
              </button>
              <button
                type="button"
                @click="paymentForm.paymentMethod = 'card'"
                :class="['p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 font-bold text-xs transition-all', paymentForm.paymentMethod === 'card' ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-300' : 'bg-slate-50 text-slate-700 hover:bg-slate-100']"
              >
                <CreditCard class="w-5 h-5" /> EDC / Kartu
              </button>
              <button
                type="button"
                @click="paymentForm.paymentMethod = 'transfer'"
                :class="['p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 font-bold text-xs transition-all', paymentForm.paymentMethod === 'transfer' ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-300' : 'bg-slate-50 text-slate-700 hover:bg-slate-100']"
              >
                <Layers class="w-5 h-5" /> Transfer
              </button>
            </div>
          </div>

          <!-- KONDISI 1: PEMBAYARAN TUNAI (CASH) -->
          <div v-if="paymentForm.paymentMethod === 'cash'" class="space-y-3 pt-1">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Uang Tunai Diterima (Rp)</label>
              <input
                v-model="paymentForm.cashTendered"
                type="number"
                placeholder="0"
                class="w-full p-3.5 bg-slate-50 border-2 border-slate-300 focus:border-blue-600 rounded-2xl font-mono text-2xl font-black outline-none text-slate-900"
              />
            </div>

            <!-- Tombol Cepat Pecahan Uang -->
            <div class="space-y-1.5">
              <span class="text-[11px] font-bold text-slate-400">Pecahan Cepat Kasir:</span>
              <div class="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  @click="setQuickCash('exact')"
                  class="py-2.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-extrabold hover:bg-emerald-100 transition-colors"
                >
                  Uang Pas
                </button>
                <button
                  type="button"
                  @click="setQuickCash(20000)"
                  class="py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold font-mono"
                >
                  20.000
                </button>
                <button
                  type="button"
                  @click="setQuickCash(50000)"
                  class="py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold font-mono"
                >
                  50.000
                </button>
                <button
                  type="button"
                  @click="setQuickCash(100000)"
                  class="py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold font-mono"
                >
                  100.000
                </button>
              </div>
            </div>

            <!-- Status Kembalian Real-time -->
            <div
              v-if="paymentForm.cashTendered !== ''"
              :class="[
                'p-3.5 rounded-2xl flex justify-between items-center border font-mono text-sm font-bold transition-all',
                Number(paymentForm.cashTendered) >= store.grandTotal
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              ]"
            >
              <span>{{ Number(paymentForm.cashTendered) >= store.grandTotal ? 'Kembalian:' : 'Uang Masih Kurang:' }}</span>
              <span class="text-xl font-black">
                {{ formatRupiah(Math.abs(Number(paymentForm.cashTendered) - store.grandTotal)) }}
              </span>
            </div>
          </div>

          <!-- KONDISI 2: PEMBAYARAN DYNAMIC QRIS -->
          <div v-else-if="paymentForm.paymentMethod === 'qris'" class="pt-1 text-center space-y-3">
            <div class="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center">
              <div class="flex items-center gap-2 mb-2">
                <span class="font-extrabold text-xs text-slate-800 tracking-wider">QRIS STANDAR NASIONAL</span>
              </div>
              
              <!-- SVG Mockup QR Code Dinamis -->
              <div class="w-44 h-44 bg-white p-3 rounded-2xl border-2 border-slate-900 shadow-md flex items-center justify-center relative">
                <QrCode class="w-36 h-36 text-slate-900" />
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-black text-xs shadow">
                    Q
                  </div>
                </div>
              </div>

              <div class="mt-3 font-mono text-xs text-slate-500">
                Sisa waktu scan: <span class="font-bold text-rose-600">{{ Math.floor(qrisTimer / 60) }}:{{ (qrisTimer % 60).toString().padStart(2, '0') }}</span>
              </div>
            </div>

            <!-- Tombol Simulasi Pembayaran Sukses (Client Demo) -->
            <button
              type="button"
              @click="simulateQrisSuccess"
              class="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 class="w-4 h-4 text-emerald-600" />
              <span>Simulasikan Scan QRIS Sukses</span>
            </button>
          </div>

          <!-- KONDISI 3: EDC / KARTU DEBIT -->
          <div v-else-if="paymentForm.paymentMethod === 'card'" class="space-y-3 pt-1">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Pilih Mesin EDC / Bank</label>
              <div class="grid grid-cols-4 gap-2">
                <button
                  v-for="bank in ['BCA', 'Mandiri', 'BRI', 'BNI']"
                  :key="bank"
                  type="button"
                  @click="paymentForm.cardBank = bank"
                  :class="[
                    'py-2 rounded-xl text-xs font-bold border transition-all',
                    paymentForm.cardBank === bank ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-slate-50 text-slate-700'
                  ]"
                >
                  {{ bank }}
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Approval Code / Trace No (Opsional)</label>
              <input
                v-model="paymentForm.cardApprovalCode"
                type="text"
                placeholder="Contoh: 849201"
                class="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-mono font-bold"
              />
            </div>
          </div>

          <!-- KONDISI 4: TRANSFER BANK -->
          <div v-else-if="paymentForm.paymentMethod === 'transfer'" class="space-y-3 pt-1">
            <div class="bg-slate-50 border rounded-2xl p-4 text-xs space-y-2">
              <div class="flex justify-between text-slate-600">
                <span>Bank Tujuan:</span>
                <strong class="text-slate-800">BCA Bisnis</strong>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>No. Rekening:</span>
                <strong class="text-blue-600 font-mono">827-019-4821</strong>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>Atas Nama:</span>
                <strong class="text-slate-800">{{ store.storeSettings?.store_name || 'Restoran POS' }}</strong>
              </div>
            </div>
          </div>
        </div>

        <div class="p-5 border-t border-slate-100 bg-slate-50 flex gap-2">
          <button @click="showPaymentModal = false" class="flex-1 py-3 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-300">
            Batal [ESC]
          </button>
          <button
            @click="submitOrder"
            :disabled="isSubmitting || (paymentForm.paymentMethod === 'cash' && Number(paymentForm.cashTendered) < store.grandTotal)"
            class="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-blue-200 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Printer class="w-4 h-4" />
            <span>{{ isSubmitting ? 'Memproses...' : 'Bayar & Cetak Struk' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 4. MODAL PREVIEW STRUK THERMAL (58MM VS 80MM) -->
    <div v-if="showReceiptPreviewModal && activeReceiptPreview" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-150">
        <div class="p-4 border-b flex justify-between items-center bg-slate-50">
          <div class="flex items-center gap-2">
            <Printer class="w-5 h-5 text-blue-600" />
            <div>
              <h3 class="text-sm font-extrabold text-slate-800">Preview Struk Thermal</h3>
              <p class="text-[11px] text-slate-400">Pilih ukuran kertas printer kasir</p>
            </div>
          </div>
          
          <!-- Toggle 58mm vs 80mm -->
          <div class="flex items-center gap-1 bg-slate-200 p-1 rounded-xl text-xs font-bold">
            <button
              @click="previewPaperWidth = '58mm'"
              :class="['px-2.5 py-1 rounded-lg transition-all', previewPaperWidth === '58mm' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600']"
            >
              58mm
            </button>
            <button
              @click="previewPaperWidth = '80mm'"
              :class="['px-2.5 py-1 rounded-lg transition-all', previewPaperWidth === '80mm' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600']"
            >
              80mm
            </button>
          </div>
        </div>

        <!-- Render Struk di Modal -->
        <div class="p-6 overflow-y-auto flex-1 bg-slate-100 flex justify-center">
          <div
            :class="[
              'bg-white p-5 shadow-md border font-mono text-slate-900 space-y-3 transition-all',
              previewPaperWidth === '58mm' ? 'w-64 text-[11px]' : 'w-80 text-xs'
            ]"
          >
            <!-- Header Toko -->
            <div class="text-center">
              <div class="font-extrabold text-sm uppercase">{{ store.storeSettings?.store_name || 'POS System' }}</div>
              <div class="text-[10px] text-slate-500 mt-0.5">{{ store.storeSettings?.store_address || '' }}</div>
              <div class="text-[10px] text-slate-500">Telp: {{ store.storeSettings?.store_phone || '' }}</div>
            </div>

            <div class="border-t border-dashed border-slate-300 my-2"></div>

            <div class="space-y-0.5 text-[10px]">
              <div>No: {{ activeReceiptPreview.invoice_number }}</div>
              <div>Kasir: {{ activeReceiptPreview.user?.name || currentUser?.name }}</div>
              <div>Tgl: {{ new Date(activeReceiptPreview.created_at).toLocaleString('id-ID') }}</div>
              <div>Tipe: {{ activeReceiptPreview.order_type?.toUpperCase() }} <span v-if="activeReceiptPreview.table">(Meja {{ activeReceiptPreview.table.table_number || activeReceiptPreview.table.number }})</span></div>
            </div>

            <div class="border-t border-dashed border-slate-300 my-2"></div>

            <!-- Items -->
            <div class="space-y-2">
              <div v-for="item in activeReceiptPreview.items" :key="item.id">
                <div class="font-bold flex justify-between">
                  <span>{{ item.product?.name }}</span>
                  <span>{{ formatRupiah(item.subtotal) }}</span>
                </div>
                <div class="text-[10px] text-slate-500">
                  {{ item.quantity }} x {{ formatRupiah(item.unit_price) }}
                </div>
                <div v-for="m in item.modifiers" :key="m.id" class="text-[9px] text-slate-500 pl-2">
                  + {{ m.modifier_item?.name }}
                </div>
              </div>
            </div>

            <div class="border-t border-dashed border-slate-300 my-2"></div>

            <div class="space-y-1 text-[11px]">
              <div class="flex justify-between"><span>Subtotal:</span><span>{{ formatRupiah(activeReceiptPreview.subtotal) }}</span></div>
              <div v-if="activeReceiptPreview.discount_amount > 0" class="flex justify-between text-rose-600"><span>Diskon:</span><span>- {{ formatRupiah(activeReceiptPreview.discount_amount) }}</span></div>
              <div v-if="activeReceiptPreview.tax_amount > 0" class="flex justify-between"><span>Pajak:</span><span>{{ formatRupiah(activeReceiptPreview.tax_amount) }}</span></div>
              <div class="flex justify-between font-black text-xs border-t pt-1"><span>TOTAL:</span><span>{{ formatRupiah(activeReceiptPreview.total_amount) }}</span></div>
              <div class="flex justify-between"><span>Bayar ({{ formatPayment(activeReceiptPreview.payment_method) }}):</span><span>{{ formatRupiah(activeReceiptPreview.cash_tendered || activeReceiptPreview.total_amount) }}</span></div>
              <div v-if="activeReceiptPreview.payment_method === 'cash'" class="flex justify-between font-bold"><span>Kembalian:</span><span>{{ formatRupiah(activeReceiptPreview.change_due) }}</span></div>
            </div>

            <div class="border-t border-dashed border-slate-300 my-2"></div>

            <div class="text-center text-[10px] text-slate-500">
              {{ store.storeSettings?.receipt_footer || 'Terima kasih atas kunjungan Anda!' }}
            </div>
          </div>
        </div>

        <div class="p-4 border-t bg-slate-50 flex gap-2">
          <button @click="showReceiptPreviewModal = false" class="flex-1 py-2.5 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs">
            Tutup
          </button>
          <button
            @click="printDirectFromPreview"
            class="flex-[2] py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
          >
            <Printer class="w-4 h-4" /> Cetak ke Printer
          </button>
        </div>
      </div>
    </div>

    <!-- 5. MODAL REKONSILIASI SHIFT & CEK TRANSAKSI KASIR (FITUR USER REQUEST) -->
    <div v-if="showCloseShiftModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-150">
        
        <!-- Header Modal Shift -->
        <div class="p-5 border-b bg-slate-50 flex justify-between items-center">
          <div>
            <h3 class="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <Store class="w-5 h-5 text-blue-600" /> Rekonsiliasi Kas & Shift Kasir
            </h3>
            <p class="text-xs text-slate-500">Kasir: <strong>{{ currentUser?.name }}</strong> &bull; Periksa uang di laci vs sistem sebelum tutup shift</p>
          </div>
          <button @click="showCloseShiftModal = false" class="text-slate-400 hover:text-slate-700">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Navigation Tabs: Ringkasan vs Transaksi Saya vs Hitung Pecahan -->
        <div class="bg-slate-100 px-6 py-2 border-b flex gap-2 text-xs font-bold">
          <button
            @click="shiftActiveTab = 'summary'"
            :class="['px-3 py-1.5 rounded-xl transition-all', shiftActiveTab === 'summary' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900']"
          >
            1. Ringkasan Kas Laci
          </button>
          <button
            @click="shiftActiveTab = 'my_orders'"
            :class="['px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5', shiftActiveTab === 'my_orders' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900']"
          >
            <span>2. Transaksi Shift Saya</span>
            <span class="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.2 rounded-full">{{ store.cashierShiftOrders.length }}</span>
          </button>
          <button
            @click="shiftActiveTab = 'calculator'"
            :class="['px-3 py-1.5 rounded-xl transition-all', shiftActiveTab === 'calculator' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900']"
          >
            3. Hitung Pecahan Uang
          </button>
        </div>

        <div class="p-6 overflow-y-auto flex-1 space-y-4">
          
          <!-- TAB 1: RINGKASAN REKONSILIASI KAS -->
          <div v-if="shiftActiveTab === 'summary'" class="space-y-4">
            <!-- Metrik Kas Berjalan -->
            <div v-if="store.activeShift" class="bg-slate-50 border rounded-2xl p-4 space-y-2 text-xs">
              <div class="flex justify-between text-slate-600">
                <span>Modal Kas Awal:</span>
                <span class="font-bold text-slate-800 font-mono">{{ formatRupiah(store.activeShift.starting_cash) }}</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>Total Penjualan Tunai (Cash):</span>
                <span class="font-bold text-emerald-600 font-mono">+ {{ formatRupiah(store.activeShift.metrics?.cash_sales) }}</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>Penjualan Non-Tunai (QRIS/Kartu):</span>
                <span class="font-bold text-blue-600 font-mono">{{ formatRupiah((store.activeShift.metrics?.qris_sales || 0) + (store.activeShift.metrics?.card_sales || 0) + (store.activeShift.metrics?.transfer_sales || 0)) }}</span>
              </div>
              <div class="flex justify-between text-slate-900 font-bold border-t pt-2 text-sm">
                <span>Ekspektasi Uang Tunai di Laci:</span>
                <span class="text-blue-700 font-mono font-black">{{ formatRupiah(store.activeShift.expected_cash) }}</span>
              </div>
            </div>

            <!-- Input Uang Aktual -->
            <div v-if="!closeShiftSummary">
              <div class="flex items-center justify-between mb-1">
                <label class="block text-xs font-bold text-slate-700">Jumlah Uang Fisik Aktual di Laci (Rp)</label>
                <button @click="shiftActiveTab = 'calculator'" class="text-[11px] text-blue-600 underline font-bold">
                  Buka Kalkulator Pecahan
                </button>
              </div>
              <input
                v-model="actualCashInput"
                type="number"
                placeholder="0"
                class="w-full p-3.5 bg-slate-50 border-2 rounded-2xl font-mono text-2xl font-black outline-none focus:border-blue-600 text-slate-900"
              />
            </div>

            <!-- Selisih Real-time jika sudah input -->
            <div
              v-if="actualCashInput !== '' && !closeShiftSummary"
              :class="[
                'p-3.5 rounded-2xl flex justify-between items-center border font-mono text-sm font-bold',
                Number(actualCashInput) - store.activeShift?.expected_cash === 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : (Number(actualCashInput) - store.activeShift?.expected_cash > 0 ? 'bg-blue-50 text-blue-800 border-blue-300' : 'bg-rose-50 text-rose-800 border-rose-300')
              ]"
            >
              <span>Selisih Uang Fisik vs Sistem:</span>
              <span class="text-lg font-black">
                {{ formatRupiah(Number(actualCashInput) - (store.activeShift?.expected_cash || 0)) }}
                <span class="text-xs font-normal">
                  ({{ Number(actualCashInput) - (store.activeShift?.expected_cash || 0) === 0 ? 'PAS' : (Number(actualCashInput) - (store.activeShift?.expected_cash || 0) > 0 ? 'LEBIH' : 'KURANG') }})
                </span>
              </span>
            </div>

            <!-- Catatan Shift -->
            <div v-if="!closeShiftSummary">
              <label class="block text-xs font-bold text-slate-700 mb-1">Catatan Penutupan Shift (Opsional)</label>
              <textarea v-model="shiftNotesInput" rows="2" placeholder="Catatan selisih kas atau insiden..." class="w-full p-2.5 bg-slate-50 border rounded-xl text-xs"></textarea>
            </div>

            <!-- Hasil Rekonsiliasi Sukses -->
            <div v-if="closeShiftSummary" class="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-2">
              <div class="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <Check class="w-6 h-6" />
              </div>
              <h4 class="font-extrabold text-emerald-900 text-sm">Shift Berhasil Ditutup</h4>
              <div class="text-xs text-slate-600">
                Selisih Kas: <strong :class="closeShiftSummary.reconciliation?.cash_difference < 0 ? 'text-rose-600' : 'text-emerald-700'">{{ formatRupiah(closeShiftSummary.reconciliation?.cash_difference) }}</strong>
              </div>
            </div>
          </div>

          <!-- TAB 2: DAFTAR TRANSAKSI SAYA (SHIFT AKTIF) -->
          <div v-else-if="shiftActiveTab === 'my_orders'" class="space-y-3">
            <div class="text-xs text-slate-500">
              Menampilkan seluruh transaksi yang diproses oleh akun kasir Anda hari ini.
            </div>

            <div v-if="store.cashierShiftOrders.length === 0" class="p-8 text-center text-slate-400 text-xs">
              Belum ada transaksi pada shift ini.
            </div>

            <div v-else class="space-y-2 max-h-80 overflow-y-auto">
              <div
                v-for="order in store.cashierShiftOrders"
                :key="order.id"
                class="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between hover:bg-blue-50/40 transition-colors"
              >
                <div>
                  <div class="font-extrabold text-xs text-slate-800 font-mono">{{ order.invoice_number }}</div>
                  <div class="text-[11px] text-slate-400">
                    {{ new Date(order.created_at).toLocaleTimeString('id-ID') }} &bull;
                    {{ formatPayment(order.payment_method) }} &bull;
                    {{ order.order_type }}
                  </div>
                </div>

                <div class="text-right flex items-center gap-3">
                  <span class="font-black text-xs text-blue-600 font-mono">{{ formatRupiah(order.total_amount) }}</span>
                  <button
                    @click="reprintReceipt(order)"
                    class="p-1.5 bg-slate-200 hover:bg-blue-600 hover:text-white rounded-lg text-slate-700 transition-colors"
                    title="Cetak Struk"
                  >
                    <Printer class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 3: KALKULATOR PECAHAN UANG KASIR -->
          <div v-else-if="shiftActiveTab === 'calculator'" class="space-y-4">
            <div class="text-xs text-slate-500">
              Masukkan lembar uang fisik di laci kasir untuk menghitung otomatis total aktual.
            </div>

            <div class="grid grid-cols-2 gap-2.5 text-xs">
              <div class="flex items-center justify-between p-2 bg-slate-50 border rounded-xl">
                <span class="font-bold text-slate-700 font-mono">Rp 100.000 x</span>
                <input
                  type="number"
                  min="0"
                  v-model.number="cashDenominations.c100k"
                  @input="calculateTotalFromDenominations"
                  class="w-16 p-1 bg-white border rounded text-center font-bold"
                />
              </div>
              <div class="flex items-center justify-between p-2 bg-slate-50 border rounded-xl">
                <span class="font-bold text-slate-700 font-mono">Rp 50.000 x</span>
                <input
                  type="number"
                  min="0"
                  v-model.number="cashDenominations.c50k"
                  @input="calculateTotalFromDenominations"
                  class="w-16 p-1 bg-white border rounded text-center font-bold"
                />
              </div>
              <div class="flex items-center justify-between p-2 bg-slate-50 border rounded-xl">
                <span class="font-bold text-slate-700 font-mono">Rp 20.000 x</span>
                <input
                  type="number"
                  min="0"
                  v-model.number="cashDenominations.c20k"
                  @input="calculateTotalFromDenominations"
                  class="w-16 p-1 bg-white border rounded text-center font-bold"
                />
              </div>
              <div class="flex items-center justify-between p-2 bg-slate-50 border rounded-xl">
                <span class="font-bold text-slate-700 font-mono">Rp 10.000 x</span>
                <input
                  type="number"
                  min="0"
                  v-model.number="cashDenominations.c10k"
                  @input="calculateTotalFromDenominations"
                  class="w-16 p-1 bg-white border rounded text-center font-bold"
                />
              </div>
              <div class="flex items-center justify-between p-2 bg-slate-50 border rounded-xl">
                <span class="font-bold text-slate-700 font-mono">Rp 5.000 x</span>
                <input
                  type="number"
                  min="0"
                  v-model.number="cashDenominations.c5k"
                  @input="calculateTotalFromDenominations"
                  class="w-16 p-1 bg-white border rounded text-center font-bold"
                />
              </div>
              <div class="flex items-center justify-between p-2 bg-slate-50 border rounded-xl">
                <span class="font-bold text-slate-700 font-mono">Rp 2.000 x</span>
                <input
                  type="number"
                  min="0"
                  v-model.number="cashDenominations.c2k"
                  @input="calculateTotalFromDenominations"
                  class="w-16 p-1 bg-white border rounded text-center font-bold"
                />
              </div>
              <div class="flex items-center justify-between p-2 bg-slate-50 border rounded-xl">
                <span class="font-bold text-slate-700 font-mono">Rp 1.000 x</span>
                <input
                  type="number"
                  min="0"
                  v-model.number="cashDenominations.c1k"
                  @input="calculateTotalFromDenominations"
                  class="w-16 p-1 bg-white border rounded text-center font-bold"
                />
              </div>
              <div class="flex items-center justify-between p-2 bg-slate-50 border rounded-xl">
                <span class="font-bold text-slate-700 font-mono">Koin (Rp)</span>
                <input
                  type="number"
                  min="0"
                  v-model.number="cashDenominations.coin"
                  @input="calculateTotalFromDenominations"
                  class="w-24 p-1 bg-white border rounded text-center font-bold"
                />
              </div>
            </div>

            <div class="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
              <span class="font-bold text-xs text-blue-900">Total Uang Fisik Terhitung:</span>
              <span class="text-base font-black text-blue-700 font-mono">{{ formatRupiah(actualCashInput) }}</span>
            </div>

            <button
              @click="shiftActiveTab = 'summary'"
              class="w-full py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs"
            >
              Gunakan Total Ini untuk Tutup Shift
            </button>
          </div>

        </div>

        <div class="p-4 border-t bg-slate-50 flex gap-2">
          <button @click="showCloseShiftModal = false" class="flex-1 py-2.5 bg-slate-200 font-bold rounded-xl text-xs">
            Batal
          </button>
          <button
            v-if="!closeShiftSummary"
            @click="handleCloseShift"
            class="flex-[2] py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs"
          >
            Konfirmasi Tutup Shift
          </button>
          <button
            v-else
            @click="printShiftReceipt"
            class="flex-[2] py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
          >
            <Printer class="w-4 h-4" /> Cetak Struk Rekap Shift (Z-Report)
          </button>
        </div>
      </div>
    </div>

    <!-- 6. MODAL BUKA SHIFT -->
    <div v-if="showOpenShiftModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div class="p-5 border-b bg-emerald-50 flex justify-between items-center">
          <div>
            <h3 class="text-base font-extrabold text-emerald-900">Buka Shift Kasir Baru</h3>
            <p class="text-xs text-emerald-700">Mulai sesi kerja kasir hari ini</p>
          </div>
          <button @click="showOpenShiftModal = false" class="text-slate-400 hover:text-slate-700">
            <X class="w-5 h-5" />
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Modal Kas Awal di Laci (Rp)</label>
            <input
              v-model="startingCashInput"
              type="number"
              placeholder="Contoh: 100000"
              class="w-full p-3.5 bg-slate-50 border-2 rounded-2xl font-mono text-xl font-bold outline-none focus:border-emerald-600 text-slate-800"
            />
          </div>
        </div>
        <div class="p-4 border-t bg-slate-50 flex gap-2">
          <button @click="showOpenShiftModal = false" class="flex-1 py-2.5 bg-slate-200 font-bold rounded-xl text-xs">Batal</button>
          <button @click="handleOpenShift" class="flex-[2] py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs">Mulai Buka Shift</button>
        </div>
      </div>
    </div>

    <!-- 7. MODAL HOLD ORDER -->
    <div v-if="showHoldModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div class="p-5 border-b flex justify-between items-center bg-amber-50">
          <div>
            <h3 class="text-base font-extrabold text-amber-900">Hold Order (Simpan Sementara)</h3>
            <p class="text-xs text-amber-700">Simpan keranjang saat pelanggan antre atau tambah pesanan</p>
          </div>
          <button @click="showHoldModal = false" class="text-slate-400 hover:text-slate-700">
            <X class="w-5 h-5" />
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Nama Pelanggan (Opsional)</label>
            <input v-model="holdForm.customerName" type="text" placeholder="Contoh: Mas Budi" class="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Catatan / Referensi Meja</label>
            <input v-model="holdForm.referenceNote" type="text" placeholder="Contoh: Meja 4 / Tunggu teman" class="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
        </div>
        <div class="p-4 border-t bg-slate-50 flex gap-2">
          <button @click="showHoldModal = false" class="flex-1 py-2.5 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs">Batal</button>
          <button @click="confirmHoldOrder" class="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs">Simpan Order</button>
        </div>
      </div>
    </div>

    <!-- 8. MODAL DAFTAR HELD ORDERS -->
    <div v-if="showHeldListModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div class="p-5 border-b flex justify-between items-center bg-slate-50">
          <div>
            <h3 class="text-base font-extrabold text-slate-800">Daftar Order Tertahan (Hold List)</h3>
            <p class="text-xs text-slate-500">Pilih transaksi untuk dipulihkan kembali ke keranjang</p>
          </div>
          <button @click="showHeldListModal = false" class="text-slate-400 hover:text-slate-700">
            <X class="w-5 h-5" />
          </button>
        </div>
        <div class="p-6 overflow-y-auto flex-1 space-y-3">
          <div v-if="store.heldOrders.length === 0" class="text-center text-slate-400 py-12">
            <Clock class="w-12 h-12 mx-auto mb-2 text-slate-300 stroke-1" />
            <p class="text-sm font-medium">Tidak ada transaksi yang sedang di-hold.</p>
          </div>
          <div
            v-for="held in store.heldOrders"
            :key="held.id"
            class="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between hover:border-blue-300 transition-all"
          >
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="font-extrabold text-slate-800 text-sm">{{ held.customer_name || 'Pelanggan Umum' }}</span>
                <span class="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                  {{ held.order_type }}
                </span>
                <span v-if="held.reference_note" class="text-xs text-slate-500 italic">({{ held.reference_note }})</span>
              </div>
              <div class="text-xs text-slate-400">
                Waktu: {{ new Date(held.created_at).toLocaleTimeString('id-ID') }} &bull; {{ held.cart_data?.cart?.length || 0 }} Menu
              </div>
              <div class="text-sm font-extrabold text-blue-600 mt-1">
                {{ formatRupiah(held.subtotal) }}
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="store.deleteHeldOrder(held.id)"
                class="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
              >
                <Trash2 class="w-4 h-4" />
              </button>
              <button
                @click="resumeHeldOrder(held)"
                class="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                <PlayCircle class="w-4 h-4" /> Ambil Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 9. MODAL MODIFIER / TOPPING -->
    <div v-if="showModifierModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
        <div class="p-4 border-b flex justify-between items-center bg-slate-50">
          <div>
            <h3 class="text-base font-extrabold text-slate-800">{{ activeProduct?.name }}</h3>
            <p class="text-xs text-blue-600 font-bold">{{ formatRupiah(activeProduct?.price) }}</p>
          </div>
          <button @click="showModifierModal = false" class="text-slate-400 hover:text-slate-700">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="p-6 overflow-y-auto flex-1 space-y-4">
          <div v-for="group in activeProduct?.modifier_groups" :key="group.id">
            <h4 class="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
              <span>{{ group.name }}</span>
              <span v-if="group.is_required" class="text-rose-500 text-[10px] font-bold">*Wajib</span>
            </h4>
            <div class="space-y-1.5">
              <label
                v-for="item in group.items"
                :key="item.id"
                class="flex items-center justify-between p-2.5 border border-slate-200 rounded-xl hover:bg-blue-50/50 cursor-pointer text-xs"
              >
                <div class="flex items-center gap-2.5">
                  <input
                    v-if="group.max_selection === 1"
                    type="radio"
                    :name="'group_' + group.id"
                    :value="item"
                    v-model="selectedRadios[group.id]"
                    class="w-4 h-4 text-blue-600 accent-blue-600"
                  />
                  <input
                    v-else
                    type="checkbox"
                    :value="item"
                    v-model="selectedModifiers"
                    class="w-4 h-4 text-blue-600 accent-blue-600 rounded"
                  />
                  <span class="font-medium text-slate-700">{{ item.name }}</span>
                </div>
                <span v-if="item.price > 0" class="text-slate-500 font-bold">+{{ formatRupiah(item.price) }}</span>
              </label>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Catatan Pesanan Khusus</label>
            <textarea v-model="itemNotes" rows="2" placeholder="Contoh: Jangan terlalu manis, ekstra es..." class="w-full p-2.5 bg-slate-50 border rounded-xl text-xs"></textarea>
          </div>
        </div>

        <div class="p-4 border-t bg-slate-50 flex gap-2">
          <button @click="showModifierModal = false" class="flex-1 py-2.5 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs">Batal</button>
          <button @click="confirmAddToCart" class="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs">Simpan ke Keranjang</button>
        </div>
      </div>
    </div>

    <!-- 10. MODAL DISKON TRANSAKSI -->
    <div v-if="showDiscountModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
        <div class="p-5 border-b bg-slate-50 flex justify-between items-center">
          <h3 class="text-base font-extrabold text-slate-800">Atur Diskon Transaksi</h3>
          <button @click="showDiscountModal = false" class="text-slate-400 hover:text-slate-700">
            <X class="w-5 h-5" />
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-2">Tipe Diskon</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                type="button"
                @click="tempDiscountType = 'none'"
                :class="['py-2 text-xs font-bold rounded-xl border', tempDiscountType === 'none' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700']"
              >
                Tanpa Diskon
              </button>
              <button
                type="button"
                @click="tempDiscountType = 'percentage'"
                :class="['py-2 text-xs font-bold rounded-xl border', tempDiscountType === 'percentage' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700']"
              >
                Persen (%)
              </button>
              <button
                type="button"
                @click="tempDiscountType = 'fixed'"
                :class="['py-2 text-xs font-bold rounded-xl border', tempDiscountType === 'fixed' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700']"
              >
                Nominal (Rp)
              </button>
            </div>
          </div>
          <div v-if="tempDiscountType !== 'none'">
            <label class="block text-xs font-bold text-slate-700 mb-1">
              {{ tempDiscountType === 'percentage' ? 'Persentase Diskon (%)' : 'Nominal Diskon (Rp)' }}
            </label>
            <input
              v-model="tempDiscountValue"
              type="number"
              min="0"
              class="w-full p-3 bg-slate-50 border-2 rounded-xl font-mono text-base font-bold outline-none focus:border-blue-600"
            />
          </div>
        </div>
        <div class="p-4 border-t bg-slate-50 flex gap-2">
          <button @click="showDiscountModal = false" class="flex-1 py-2.5 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs">Batal</button>
          <button @click="applyDiscount" class="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs">Terapkan</button>
        </div>
      </div>
    </div>

    <!-- 11. MODAL RIWAYAT ORDER (F9) -->
    <div v-if="showOrderHistory" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div class="p-5 border-b flex justify-between items-center bg-slate-50">
          <div>
            <h3 class="text-base font-extrabold text-slate-800">Riwayat Transaksi Hari Ini</h3>
            <p class="text-xs text-slate-500">Klik order untuk detail, cetak ulang, atau void</p>
          </div>
          <button @click="showOrderHistory = false" class="text-slate-400 hover:text-slate-700">
            <X class="w-5 h-5" />
          </button>
        </div>
        <div class="p-6 overflow-y-auto flex-1 space-y-2">
          <div v-if="store.recentOrdersLoading" class="text-center text-slate-400 py-12">
            <p class="text-sm">Memuat riwayat order...</p>
          </div>
          <div v-else-if="!store.recentOrders?.data || store.recentOrders.data.length === 0" class="text-center text-slate-400 py-12">
            <History class="w-12 h-12 mx-auto mb-2 text-slate-300 stroke-1" />
            <p class="text-sm font-medium">Belum ada transaksi hari ini.</p>
          </div>
          <div
            v-for="order in store.recentOrders?.data || []"
            :key="order.id"
            @click="viewOrderDetail(order)"
            class="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer transition-all"
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-0.5">
                <span class="font-extrabold text-slate-800 text-xs font-mono">{{ order.invoice_number }}</span>
                <span :class="[
                  'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                  order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                ]">
                  {{ formatStatus(order.status) }}
                </span>
              </div>
              <div class="text-[11px] text-slate-500">
                {{ new Date(order.created_at).toLocaleTimeString('id-ID') }} &bull; {{ order.user?.name }} &bull; {{ formatPayment(order.payment_method) }}
              </div>
            </div>
            <div class="text-right ml-3">
              <div class="text-sm font-extrabold text-blue-600">{{ formatRupiah(order.total_amount) }}</div>
              <div class="text-[10px] text-slate-400">{{ order.items?.length || 0 }} item</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 12. MODAL DETAIL ORDER -->
    <div v-if="showOrderDetail && selectedOrder" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        <div class="p-5 border-b flex justify-between items-center bg-slate-50">
          <div>
            <h3 class="text-base font-extrabold text-slate-800">{{ selectedOrder.invoice_number }}</h3>
            <p class="text-xs text-slate-500">{{ new Date(selectedOrder.created_at).toLocaleString('id-ID') }} &bull; {{ selectedOrder.user?.name }}</p>
          </div>
          <button @click="showOrderDetail = false" class="text-slate-400 hover:text-slate-700">
            <X class="w-5 h-5" />
          </button>
        </div>
        <div class="p-6 overflow-y-auto flex-1 space-y-3">
          <div class="flex items-center gap-2">
            <span :class="[
              'text-xs px-2.5 py-1 rounded-full font-bold',
              selectedOrder.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            ]">
              {{ formatStatus(selectedOrder.status) }}
            </span>
            <span class="text-xs text-slate-500">{{ selectedOrder.order_type }} <span v-if="selectedOrder.table">(Meja {{ selectedOrder.table.table_number || selectedOrder.table.number }})</span></span>
          </div>

          <div class="space-y-2">
            <div v-for="item in selectedOrder.items" :key="item.id" class="bg-slate-50 rounded-lg p-2.5 border border-slate-200/60">
              <div class="flex justify-between items-start">
                <div>
                  <div class="text-xs font-bold text-slate-800">{{ item.product?.name }}</div>
                  <div class="text-[10px] text-slate-500">{{ item.quantity }} x {{ formatRupiah(item.unit_price) }}</div>
                  <div v-for="mod in item.modifiers" :key="mod.id" class="text-[10px] text-blue-600 pl-2">+ {{ mod.modifier_item?.name }} {{ formatRupiah(mod.unit_price) }}</div>
                  <div v-if="item.notes" class="text-[10px] text-slate-400 italic pl-2">"{{ item.notes }}"</div>
                </div>
                <span class="text-xs font-bold text-slate-800">{{ formatRupiah(item.subtotal) }}</span>
              </div>
            </div>
          </div>

          <div class="bg-slate-50 rounded-xl p-3 space-y-1 text-xs border border-slate-200/60">
            <div class="flex justify-between"><span class="text-slate-500">Subtotal</span><span class="font-bold">{{ formatRupiah(selectedOrder.subtotal) }}</span></div>
            <div v-if="selectedOrder.discount_amount > 0" class="flex justify-between text-rose-600"><span>Diskon</span><span>- {{ formatRupiah(selectedOrder.discount_amount) }}</span></div>
            <div v-if="selectedOrder.tax_amount > 0" class="flex justify-between"><span class="text-slate-500">Pajak</span><span class="font-bold">{{ formatRupiah(selectedOrder.tax_amount) }}</span></div>
            <div class="flex justify-between font-extrabold text-sm border-t border-slate-200 pt-1"><span>Total</span><span class="text-blue-600">{{ formatRupiah(selectedOrder.total_amount) }}</span></div>
            <div class="flex justify-between"><span class="text-slate-500">Bayar ({{ formatPayment(selectedOrder.payment_method) }})</span><span class="font-bold">{{ selectedOrder.payment_method === 'cash' ? formatRupiah(selectedOrder.cash_tendered) : formatRupiah(selectedOrder.total_amount) }}</span></div>
            <div v-if="selectedOrder.payment_method === 'cash'" class="flex justify-between font-bold"><span>Kembali</span><span>{{ formatRupiah(selectedOrder.change_due) }}</span></div>
          </div>

          <div v-if="selectedOrder.status === 'cancelled'" class="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs">
            <div class="font-bold text-rose-700 mb-1">Dibatalkan (Void)</div>
            <div class="text-rose-600">Alasan: {{ selectedOrder.void_reason }}</div>
            <div class="text-rose-500 mt-0.5">Oleh: {{ selectedOrder.voidedBy?.name }} &bull; {{ selectedOrder.voided_at ? new Date(selectedOrder.voided_at).toLocaleString('id-ID') : '-' }}</div>
          </div>
        </div>

        <div class="p-4 border-t bg-slate-50 flex gap-2">
          <button @click="showOrderDetail = false" class="flex-1 py-2.5 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs">Tutup</button>
          <button
            v-if="selectedOrder.status === 'completed'"
            @click="reprintReceipt(selectedOrder)"
            class="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1"
          >
            <Printer class="w-3.5 h-3.5" /> Cetak Ulang
          </button>
          <button
            v-if="canVoidOrder(selectedOrder)"
            @click="openVoidModal(selectedOrder)"
            class="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1"
          >
            <AlertCircle class="w-3.5 h-3.5" /> Void
          </button>
        </div>
      </div>
    </div>

    <!-- 13. MODAL KONFIRMASI VOID -->
    <div v-if="showVoidModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div class="p-5 border-b bg-rose-50 flex justify-between items-center">
          <div>
            <h3 class="text-base font-extrabold text-rose-900">Batalkan Order (Void)</h3>
            <p class="text-xs text-rose-700">Order {{ voidTargetOrder?.invoice_number }} akan dibatalkan dan stok dikembalikan</p>
          </div>
          <button @click="showVoidModal = false" class="text-slate-400 hover:text-slate-700">
            <X class="w-5 h-5" />
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle class="w-4 h-4 mt-0.5 shrink-0" />
            <span>Order ini akan dibatalkan secara permanen. Stok produk akan otomatis dikembalikan.</span>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Alasan Pembatalan <span class="text-rose-500">*</span></label>
            <textarea
              v-model="voidReason"
              rows="3"
              placeholder="Contoh: Pelanggan memesan salah item, memesan batal..."
              class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
            ></textarea>
            <p class="text-[10px] text-slate-400 mt-1">Minimal 3 karakter</p>
          </div>
        </div>
        <div class="p-4 border-t bg-slate-50 flex gap-2">
          <button @click="showVoidModal = false" class="flex-1 py-2.5 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs">Batal</button>
          <button
            @click="confirmVoid"
            :disabled="voidSubmitting || !voidReason || voidReason.length < 3"
            class="flex-[2] py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs disabled:opacity-40"
          >
            {{ voidSubmitting ? 'Memproses...' : 'Konfirmasi Void' }}
          </button>
        </div>
      </div>
    </div>

  </div>

  <!-- AREA CETAK STRUK THERMAL PENJUALAN (Hidden di layar, tampil saat window.print) -->
  <div id="receipt-area" v-if="receiptData" class="hidden absolute top-0 left-0 bg-white p-2 text-black w-72 font-mono">
    <div class="text-center font-bold text-sm mb-1">{{ store.storeSettings?.store_name || 'POS System' }}</div>
    <div class="text-center text-xs mb-3 border-b pb-2 border-dashed border-gray-400">
      {{ store.storeSettings?.store_address || '' }}<br>
      Telp: {{ store.storeSettings?.store_phone || '' }}
    </div>
    
    <div class="text-xs mb-2 leading-tight">
      <div>No: {{ receiptData.invoice_number }}</div>
      <div>Kasir: {{ receiptData.user?.name || currentUser?.name || 'Kasir' }}</div>
      <div>Tipe: {{ receiptData.order_type }} <span v-if="receiptData.table">(Meja {{ receiptData.table.table_number || receiptData.table.number }})</span></div>
      <div>Tgl: {{ new Date(receiptData.created_at).toLocaleString('id-ID') }}</div>
    </div>

    <div class="border-t border-b border-dashed border-gray-400 py-2 mb-2 space-y-1.5">
      <div v-for="item in receiptData.items" :key="item.id">
        <div class="text-xs font-bold">{{ item.product?.name }}</div>
        <div class="flex justify-between text-xs">
          <span>{{ item.quantity }} x {{ formatRupiah(item.unit_price) }}</span>
          <span>{{ formatRupiah(item.subtotal) }}</span>
        </div>
        <div v-for="mod in item.modifiers" :key="mod.id" class="text-[10px] pl-2 text-gray-600 flex justify-between">
          <span>+ {{ mod.modifier_item?.name }}</span>
          <span>{{ formatRupiah(mod.unit_price) }}</span>
        </div>
        <div v-if="item.notes" class="text-[10px] italic text-gray-500 pl-2">Note: {{ item.notes }}</div>
      </div>
    </div>

    <div class="space-y-1 text-xs mb-2">
      <div class="flex justify-between">
        <span>Subtotal:</span>
        <span>{{ formatRupiah(receiptData.subtotal) }}</span>
      </div>
      <div v-if="receiptData.discount_amount > 0" class="flex justify-between text-rose-600">
        <span>Diskon:</span>
        <span>- {{ formatRupiah(receiptData.discount_amount) }}</span>
      </div>
      <div v-if="receiptData.tax_amount > 0" class="flex justify-between border-b border-dashed border-gray-400 pb-1">
        <span>Pajak ({{ store.taxRate }}%):</span>
        <span>{{ formatRupiah(receiptData.tax_amount) }}</span>
      </div>
      <div class="flex justify-between font-bold text-xs pt-1">
        <span>TOTAL:</span>
        <span>{{ formatRupiah(receiptData.total_amount) }}</span>
      </div>
      <div class="flex justify-between">
        <span>Bayar ({{ receiptData.payment_method?.toUpperCase() }}):</span>
        <span>{{ receiptData.payment_method === 'cash' ? formatRupiah(receiptData.cash_tendered) : formatRupiah(receiptData.total_amount) }}</span>
      </div>
      <div v-if="receiptData.payment_method === 'cash'" class="flex justify-between font-bold">
        <span>KEMBALI:</span>
        <span>{{ formatRupiah(receiptData.change_due) }}</span>
      </div>
    </div>

    <div class="text-center text-[10px] mt-4 border-t border-dashed border-gray-400 pt-2">
      {{ store.storeSettings?.receipt_footer || 'Terima kasih atas kunjungan Anda!' }}<br>
      <span>{{ store.storeSettings?.store_name || 'POS System' }}</span>
    </div>
  </div>

  <!-- AREA CETAK STRUK REKAP PENUTUPAN SHIFT (Z-REPORT) -->
  <div id="shift-receipt-area" v-if="shiftReceiptData" class="hidden absolute top-0 left-0 bg-white p-2 text-black w-72 font-mono">
    <div class="text-center font-bold text-sm mb-1">REKAPITULASI SHIFT KASIR (Z-REPORT)</div>
    <div class="text-center text-xs mb-3 border-b pb-2 border-dashed border-gray-400">
      {{ store.storeSettings?.store_name || 'POS System' }}
    </div>
    
    <div class="text-xs mb-2 space-y-0.5">
      <div>Kasir: {{ shiftReceiptData.user?.name || currentUser?.name || '-' }}</div>
      <div>Buka : {{ new Date(shiftReceiptData.opened_at).toLocaleString('id-ID') }}</div>
      <div>Tutup: {{ new Date(shiftReceiptData.closed_at || Date.now()).toLocaleString('id-ID') }}</div>
    </div>

    <div class="border-t border-b border-dashed border-gray-400 py-2 mb-2 space-y-1 text-xs">
      <div class="flex justify-between">
        <span>Kas Awal:</span>
        <span>{{ formatRupiah(shiftReceiptData.starting_cash) }}</span>
      </div>
      <div class="flex justify-between">
        <span>Total Pesanan:</span>
        <span>{{ shiftReceiptData.metrics?.total_orders || 0 }} Trx</span>
      </div>
      <div class="flex justify-between">
        <span>Penjualan Tunai:</span>
        <span>{{ formatRupiah(shiftReceiptData.metrics?.cash_sales) }}</span>
      </div>
      <div class="flex justify-between">
        <span>Penjualan QRIS:</span>
        <span>{{ formatRupiah(shiftReceiptData.metrics?.qris_sales) }}</span>
      </div>
      <div class="flex justify-between">
        <span>Penjualan Kartu:</span>
        <span>{{ formatRupiah(shiftReceiptData.metrics?.card_sales) }}</span>
      </div>
      <div class="flex justify-between font-bold pt-1 border-t border-dashed border-gray-300">
        <span>Total Omzet:</span>
        <span>{{ formatRupiah(shiftReceiptData.metrics?.total_revenue) }}</span>
      </div>
    </div>

    <div class="space-y-1 text-xs mb-3">
      <div class="flex justify-between">
        <span>Ekspektasi Kas:</span>
        <span>{{ formatRupiah(shiftReceiptData.expected_cash) }}</span>
      </div>
      <div class="flex justify-between">
        <span>Kas Aktual (Fisik):</span>
        <span>{{ formatRupiah(shiftReceiptData.actual_cash) }}</span>
      </div>
      <div class="flex justify-between font-bold border-t border-dashed border-gray-400 pt-1">
        <span>Selisih Kas:</span>
        <span>{{ formatRupiah(shiftReceiptData.cash_difference) }}</span>
      </div>
    </div>

    <div class="text-center text-[10px] mt-3 border-t border-dashed border-gray-400 pt-2">
      Tanda Tangan Kasir / Supervisor<br><br><br>
      ( {{ currentUser?.name || '____________________' }} )
    </div>
  </div>
</template>

<style scoped>
@media print {
  body * {
    visibility: hidden;
  }
  #receipt-area, #receipt-area *,
  #shift-receipt-area, #shift-receipt-area * {
    visibility: visible;
  }
  #receipt-area, #shift-receipt-area {
    position: absolute;
    left: 0;
    top: 0;
    display: block !important;
  }
}
</style>