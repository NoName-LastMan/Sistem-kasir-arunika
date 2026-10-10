<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'
import {
  ArrowLeft, TrendingUp, Package, DollarSign,
  Calendar, Download, CreditCard, QrCode, Layers,
  ShoppingBag, Percent, RefreshCw, BarChart2
} from 'lucide-vue-next'

const router = useRouter()

// Filter State
const dateFilterType = ref('30days') // 'today' | '7days' | '30days' | 'custom'
const startDate = ref('')
const endDate = ref('')
const isLoading = ref(true)

// Data State
const dailyRevenue = ref([])
const topProducts = ref([])
const salesSummary = ref(null)
const profitLossData = ref(null)

const setDateRange = (type) => {
  dateFilterType.value = type
  const today = new Date()
  const end = today.toISOString().split('T')[0]
  endDate.value = end

  if (type === 'today') {
    startDate.value = end
  } else if (type === '7days') {
    const past = new Date()
    past.setDate(today.getDate() - 6)
    startDate.value = past.toISOString().split('T')[0]
  } else if (type === '30days') {
    const past = new Date()
    past.setDate(today.getDate() - 29)
    startDate.value = past.toISOString().split('T')[0]
  }
}

// Format Rupiah
const formatRupiah = (number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0)

const formatDate = (dateString) =>
  new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(dateString))

const fetchAllReports = async () => {
  isLoading.value = true
  try {
    const params = {
      start_date: startDate.value,
      end_date: endDate.value
    }

    const [revRes, topRes, summaryRes, profitRes] = await Promise.all([
      api.get('/reports/daily-revenue', { params }),
      api.get('/reports/top-products', { params: { ...params, limit: 10 } }),
      api.get('/reports/sales-summary', { params }),
      api.get('/reports/profit-loss', { params })
    ])

    dailyRevenue.value = revRes.data.data
    topProducts.value = topRes.data.data
    salesSummary.value = summaryRes.data.data
    profitLossData.value = profitRes.data.data
  } catch (error) {
    console.error('Gagal mengambil data laporan:', error)
  } finally {
    isLoading.value = false
  }
}

// Export CSV
const downloadCsv = () => {
  const token = localStorage.getItem('pos_token')
  const url = `${api.defaults.baseURL}/reports/export-csv?start_date=${startDate.value}&end_date=${endDate.value}`
  
  // Trigger download with auth header via fetch blob
  fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(response => response.blob())
    .then(blob => {
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `laporan_penjualan_${startDate.value}_sd_${endDate.value}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
    })
    .catch(err => alert('Gagal mendownload CSV: ' + err.message))
}

onMounted(() => {
  setDateRange('30days')
  fetchAllReports()
})

watch([startDate, endDate], () => {
  if (startDate.value && endDate.value) {
    fetchAllReports()
  }
})
</script>

<template>
  <div class="min-h-screen bg-slate-100 flex flex-col font-sans">
    
    <!-- Header -->
    <header class="bg-white shadow-sm h-16 flex items-center px-6 shrink-0 justify-between border-b border-slate-200">
      <div class="flex items-center gap-4">
        <button
          @click="router.push('/')"
          class="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 flex items-center gap-1 font-bold text-xs"
        >
          <ArrowLeft class="w-5 h-5" />
          <span>Kembali ke POS</span>
        </button>
        <div class="h-5 w-[1px] bg-slate-200"></div>
        <h1 class="text-base font-extrabold text-slate-800 flex items-center gap-2">
          <BarChart2 class="w-5 h-5 text-blue-600" />
          <span>Laporan Penjualan & Analytics</span>
        </h1>
      </div>

      <!-- Action: Export CSV & Refresh -->
      <div class="flex items-center gap-3">
        <button
          @click="fetchAllReports"
          class="p-2 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors"
          title="Refresh Data"
        >
          <RefreshCw :class="['w-4 h-4', isLoading ? 'animate-spin' : '']" />
        </button>
        <button
          @click="downloadCsv"
          class="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
        >
          <Download class="w-4 h-4" /> Ekspor CSV
        </button>
      </div>
    </header>

    <!-- Subheader Filter Periode Tanggal -->
    <div class="bg-white px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0">
      <div class="flex items-center gap-2">
        <span class="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1">
          <Calendar class="w-4 h-4" /> Periode:
        </span>
        <button
          type="button"
          @click="setDateRange('today')"
          :class="['px-3 py-1.5 rounded-xl text-xs font-bold transition-all', dateFilterType === 'today' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200']"
        >
          Hari Ini
        </button>
        <button
          type="button"
          @click="setDateRange('7days')"
          :class="['px-3 py-1.5 rounded-xl text-xs font-bold transition-all', dateFilterType === '7days' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200']"
        >
          7 Hari Terakhir
        </button>
        <button
          type="button"
          @click="setDateRange('30days')"
          :class="['px-3 py-1.5 rounded-xl text-xs font-bold transition-all', dateFilterType === '30days' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200']"
        >
          30 Hari Terakhir
        </button>
      </div>

      <!-- Custom Date Pickers -->
      <div class="flex items-center gap-2 text-xs">
        <input
          type="date"
          v-model="startDate"
          class="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span class="text-slate-400">s/d</span>
        <input
          type="date"
          v-model="endDate"
          class="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto space-y-6">
      <div v-if="isLoading" class="flex justify-center items-center py-24 text-slate-500 gap-2">
        <RefreshCw class="w-5 h-5 animate-spin text-blue-600" />
        <span class="text-sm font-semibold">Memuat data laporan...</span>
      </div>

      <div v-else class="space-y-6">
        
        <!-- 4 KPI SUMMARY CARDS -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Total Omzet -->
          <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div class="flex justify-between items-start">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Omzet Bersih</span>
              <div class="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <DollarSign class="w-5 h-5" />
              </div>
            </div>
            <div class="mt-3">
              <div class="text-2xl font-black text-slate-900 font-mono">
                {{ formatRupiah(salesSummary?.kpi?.net_sales) }}
              </div>
              <p class="text-[11px] text-slate-400 mt-1">Rata-rata: {{ formatRupiah(salesSummary?.kpi?.average_order_value) }} / trx</p>
            </div>
          </div>

          <!-- Total Transaksi -->
          <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div class="flex justify-between items-start">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Transaksi Selesai</span>
              <div class="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <ShoppingBag class="w-5 h-5" />
              </div>
            </div>
            <div class="mt-3">
              <div class="text-2xl font-black text-slate-900 font-mono">
                {{ salesSummary?.kpi?.total_orders || 0 }} <span class="text-xs font-normal text-slate-500">Trx</span>
              </div>
              <p class="text-[11px] text-slate-400 mt-1">Dine-in: {{ salesSummary?.by_order_type?.dine_in || 0 }} &bull; Bungkus: {{ salesSummary?.by_order_type?.takeaway || 0 }}</p>
            </div>
          </div>

          <!-- Laba Kotor (Gross Profit) -->
          <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div class="flex justify-between items-start">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimasi Laba Kotor</span>
              <div class="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <TrendingUp class="w-5 h-5" />
              </div>
            </div>
            <div class="mt-3">
              <div class="text-2xl font-black text-indigo-600 font-mono">
                {{ formatRupiah(profitLossData?.gross_profit) }}
              </div>
              <p class="text-[11px] text-indigo-500 font-bold mt-1">
                Margin: {{ profitLossData?.profit_margin_percent || 0 }}% (HPP: {{ formatRupiah(profitLossData?.cost_of_goods_sold) }})
              </p>
            </div>
          </div>

          <!-- Diskon & Pajak Terkumpul -->
          <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div class="flex justify-between items-start">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Diskon & Pajak</span>
              <div class="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Percent class="w-5 h-5" />
              </div>
            </div>
            <div class="mt-3">
              <div class="text-sm font-bold text-rose-600">
                Diskon: {{ formatRupiah(salesSummary?.kpi?.total_discount) }}
              </div>
              <div class="text-sm font-bold text-slate-700 mt-0.5">
                Pajak: {{ formatRupiah(salesSummary?.kpi?.total_tax) }}
              </div>
            </div>
          </div>
        </div>

        <!-- BREAKDOWN METODE PEMBAYARAN -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <h2 class="text-sm font-extrabold text-slate-800 mb-4 flex items-center gap-2">
            <CreditCard class="w-4 h-4 text-blue-600" /> Rincian Metode Pembayaran
          </h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
              <div class="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
                <DollarSign class="w-4 h-4 text-emerald-600" /> Tunai (Cash)
              </div>
              <div class="text-base font-extrabold text-slate-800 font-mono">
                {{ formatRupiah(salesSummary?.by_payment_method?.cash) }}
              </div>
            </div>
            <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
              <div class="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
                <QrCode class="w-4 h-4 text-blue-600" /> QRIS
              </div>
              <div class="text-base font-extrabold text-slate-800 font-mono">
                {{ formatRupiah(salesSummary?.by_payment_method?.qris) }}
              </div>
            </div>
            <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
              <div class="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
                <CreditCard class="w-4 h-4 text-purple-600" /> Kartu Debit/Kredit
              </div>
              <div class="text-base font-extrabold text-slate-800 font-mono">
                {{ formatRupiah(salesSummary?.by_payment_method?.card) }}
              </div>
            </div>
            <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
              <div class="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
                <Layers class="w-4 h-4 text-amber-600" /> Transfer Bank
              </div>
              <div class="text-base font-extrabold text-slate-800 font-mono">
                {{ formatRupiah(salesSummary?.by_payment_method?.transfer) }}
              </div>
            </div>
          </div>
        </div>

        <!-- TABEL OMZET & TOP PRODUK -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- Tabel Omzet Harian -->
          <div class="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col">
            <div class="p-4 border-b bg-slate-50 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                  <DollarSign class="w-4 h-4" />
                </div>
                <h2 class="text-sm font-extrabold text-slate-800">Riwayat Omzet Harian</h2>
              </div>
              <span class="text-[11px] text-slate-400 font-medium">{{ dailyRevenue.length }} Hari Transaksi</span>
            </div>
            <div class="p-0 flex-1 overflow-auto max-h-[420px]">
              <table class="w-full text-left border-collapse text-xs">
                <thead class="bg-slate-50/80 sticky top-0 border-b">
                  <tr>
                    <th class="p-3 font-bold text-slate-600">Tanggal</th>
                    <th class="p-3 font-bold text-slate-600 text-right">Pesanan</th>
                    <th class="p-3 font-bold text-slate-600 text-right">Diskon</th>
                    <th class="p-3 font-bold text-slate-600 text-right">Total Omzet</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-if="dailyRevenue.length === 0">
                    <td colspan="4" class="p-6 text-center text-slate-400">Belum ada transaksi di periode ini</td>
                  </tr>
                  <tr v-for="(day, index) in dailyRevenue" :key="index" class="hover:bg-slate-50/80 transition-colors">
                    <td class="p-3 font-semibold text-slate-800">{{ formatDate(day.date) }}</td>
                    <td class="p-3 text-right text-slate-600 font-mono">{{ day.total_orders }}</td>
                    <td class="p-3 text-right text-rose-500 font-mono">{{ formatRupiah(day.total_discount) }}</td>
                    <td class="p-3 text-right font-bold text-emerald-600 font-mono">{{ formatRupiah(day.total_revenue) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Tabel 10 Produk Terlaris -->
          <div class="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col">
            <div class="p-4 border-b bg-slate-50 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                  <Package class="w-4 h-4" />
                </div>
                <h2 class="text-sm font-extrabold text-slate-800">10 Menu Terlaris (Best Seller)</h2>
              </div>
            </div>
            <div class="p-0 flex-1 overflow-auto max-h-[420px]">
              <table class="w-full text-left border-collapse text-xs">
                <thead class="bg-slate-50/80 sticky top-0 border-b">
                  <tr>
                    <th class="p-3 font-bold text-slate-600">Menu</th>
                    <th class="p-3 font-bold text-slate-600">Kategori</th>
                    <th class="p-3 font-bold text-slate-600 text-right">Terjual</th>
                    <th class="p-3 font-bold text-slate-600 text-right">Total Penjualan</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-if="topProducts.length === 0">
                    <td colspan="4" class="p-6 text-center text-slate-400">Belum ada data penjualan produk</td>
                  </tr>
                  <tr v-for="(item, index) in topProducts" :key="index" class="hover:bg-slate-50/80 transition-colors">
                    <td class="p-3 font-semibold text-slate-800">{{ item.product?.name || '-' }}</td>
                    <td class="p-3 text-slate-500">{{ item.product?.category?.name || '-' }}</td>
                    <td class="p-3 text-right font-extrabold text-blue-600 font-mono">{{ item.total_sold }} porsi</td>
                    <td class="p-3 text-right font-bold text-slate-800 font-mono">{{ formatRupiah(item.total_sales_amount) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </main>
  </div>
</template>