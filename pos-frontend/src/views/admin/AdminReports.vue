<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api'
import {
  TrendingUp, DollarSign, Calendar, Download, Users,
  Package, CreditCard, QrCode, Layers, ArrowUpRight,
  ShieldCheck, RefreshCw, BarChart3
} from 'lucide-vue-next'

// State Filter Tanggal
const dateFilterType = ref('30days') // 'today' | '7days' | '30days' | 'month'
const startDate = ref('')
const endDate = ref('')
const isLoading = ref(true)

// Data State
const salesSummary = ref(null)
const profitLoss = ref(null)
const topProducts = ref([])
const cashierList = ref([])

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0)

const setDateRange = (type) => {
  dateFilterType.value = type
  const today = new Date()
  const endStr = today.toISOString().split('T')[0]
  endDate.value = endStr

  if (type === 'today') {
    startDate.value = endStr
  } else if (type === '7days') {
    const past = new Date()
    past.setDate(today.getDate() - 6)
    startDate.value = past.toISOString().split('T')[0]
  } else if (type === '30days') {
    const past = new Date()
    past.setDate(today.getDate() - 29)
    startDate.value = past.toISOString().split('T')[0]
  } else if (type === 'month') {
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    startDate.value = firstDay.toISOString().split('T')[0]
  }

  fetchReports()
}

const fetchReports = async () => {
  isLoading.value = true
  try {
    const params = { start_date: startDate.value, end_date: endDate.value }
    const [summaryRes, profitRes, topRes, cashierRes] = await Promise.all([
      api.get('/reports/sales-summary', { params }),
      api.get('/reports/profit-loss', { params }),
      api.get('/reports/top-products', { params: { ...params, limit: 6 } }),
      api.get('/reports/cashier-sales', { params })
    ])

    salesSummary.value = summaryRes.data.data
    profitLoss.value = profitRes.data.data
    topProducts.value = topRes.data.data
    cashierList.value = cashierRes.data.data
  } catch (err) {
    console.error('Gagal mengambil laporan admin:', err)
  } finally {
    isLoading.value = false
  }
}

const downloadCsv = () => {
  const token = localStorage.getItem('pos_token')
  const url = `${api.defaults.baseURL}/reports/export-csv?start_date=${startDate.value}&end_date=${endDate.value}`
  
  fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.blob())
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
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header & Filter Periode -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-xl font-extrabold text-white flex items-center gap-2">
          <BarChart3 class="w-6 h-6 text-blue-400" />
          <span>Laporan Penjualan & Performa Kasir</span>
        </h1>
        <p class="text-xs text-slate-400">Analisis menyeluruh omzet, laba kotor, dan rekap pendapatan per kasir</p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <!-- Quick Preset Pills -->
        <div class="bg-slate-950 p-1 rounded-xl border border-slate-800 flex gap-1 text-xs">
          <button
            @click="setDateRange('today')"
            :class="['px-3 py-1.5 rounded-lg font-bold transition-all', dateFilterType === 'today' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white']"
          >
            Hari Ini
          </button>
          <button
            @click="setDateRange('7days')"
            :class="['px-3 py-1.5 rounded-lg font-bold transition-all', dateFilterType === '7days' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white']"
          >
            7 Hari
          </button>
          <button
            @click="setDateRange('30days')"
            :class="['px-3 py-1.5 rounded-lg font-bold transition-all', dateFilterType === '30days' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white']"
          >
            30 Hari
          </button>
          <button
            @click="setDateRange('month')"
            :class="['px-3 py-1.5 rounded-lg font-bold transition-all', dateFilterType === 'month' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white']"
          >
            Bulan Ini
          </button>
        </div>

        <!-- Export CSV Button -->
        <button
          @click="downloadCsv"
          class="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all"
        >
          <Download class="w-4 h-4" /> Ekspor CSV
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="p-16 text-center text-slate-500 text-xs font-semibold flex items-center justify-center gap-2">
      <RefreshCw class="w-5 h-5 animate-spin text-blue-500" />
      <span>Mengalkulasi data keuangan & penjualan...</span>
    </div>

    <div v-else class="space-y-6">
      
      <!-- 4 RINGKASAN EKSEKUTIF -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Total Omzet Bersih -->
        <div class="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Penjualan Bersih</span>
            <div class="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <DollarSign class="w-5 h-5" />
            </div>
          </div>
          <div class="mt-4">
            <div class="text-2xl font-black text-white font-mono">
              {{ formatRupiah(salesSummary?.kpi?.net_sales) }}
            </div>
            <p class="text-[11px] text-slate-500 mt-1">{{ salesSummary?.kpi?.total_orders || 0 }} Total Transaksi</p>
          </div>
        </div>

        <!-- Laba Kotor (Gross Profit) -->
        <div class="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Laba Kotor (Gross Profit)</span>
            <div class="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <TrendingUp class="w-5 h-5" />
            </div>
          </div>
          <div class="mt-4">
            <div class="text-2xl font-black text-emerald-400 font-mono">
              {{ formatRupiah(profitLoss?.gross_profit) }}
            </div>
            <p class="text-[11px] text-slate-500 mt-1">Margin: {{ profitLoss?.profit_margin_percent || 0 }}% dari HPP</p>
          </div>
        </div>

        <!-- Rata-rata Nilai Order (AOV) -->
        <div class="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Rata-rata Pembelian (AOV)</span>
            <div class="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <ArrowUpRight class="w-5 h-5" />
            </div>
          </div>
          <div class="mt-4">
            <div class="text-2xl font-black text-purple-400 font-mono">
              {{ formatRupiah(salesSummary?.kpi?.average_order_value) }}
            </div>
            <p class="text-[11px] text-slate-500 mt-1">Nilai per struk transaksi</p>
          </div>
        </div>

        <!-- Diskon & Promo -->
        <div class="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Diskon Diberikan</span>
            <div class="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
              <Layers class="w-5 h-5" />
            </div>
          </div>
          <div class="mt-4">
            <div class="text-2xl font-black text-rose-400 font-mono">
              {{ formatRupiah(salesSummary?.kpi?.total_discount) }}
            </div>
            <p class="text-[11px] text-slate-500 mt-1">Pajak Terkumpul: {{ formatRupiah(salesSummary?.kpi?.total_tax) }}</p>
          </div>
        </div>
      </div>

      <!-- TABEL REKAPITULASI KASIR (FITUR OWNER TRACKING) -->
      <div class="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div class="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Users class="w-5 h-5 text-blue-400" />
            <div>
              <h3 class="text-sm font-extrabold text-white">Performa & Rekap Uang Per Kasir (Owner Tracking)</h3>
              <p class="text-[11px] text-slate-400">Memantau setoran uang kasir & total transaksi setiap akun kasir</p>
            </div>
          </div>
          <span class="text-xs font-mono bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-lg border border-blue-500/20">
            {{ cashierList.length }} Akun Terdaftar
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-900/80 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th class="px-5 py-3">Nama Kasir / Staf</th>
                <th class="px-5 py-3">Role</th>
                <th class="px-5 py-3 text-center">Jumlah Transaksi</th>
                <th class="px-5 py-3 text-right">Uang Tunai (Cash)</th>
                <th class="px-5 py-3 text-right">Non-Tunai (QRIS/Card)</th>
                <th class="px-5 py-3 text-right">Total Penjualan</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              <tr v-if="cashierList.length === 0">
                <td colspan="6" class="px-5 py-8 text-center text-slate-500">
                  Tidak ada data penjualan kasir pada periode ini.
                </td>
              </tr>
              <tr
                v-for="cashier in cashierList"
                :key="cashier.id"
                class="hover:bg-slate-900/40 transition-colors"
              >
                <td class="px-5 py-3.5">
                  <div class="font-bold text-white text-sm">{{ cashier.name }}</div>
                  <div class="text-[10px] text-slate-500 font-mono">{{ cashier.email }}</div>
                </td>
                <td class="px-5 py-3.5">
                  <span :class="[
                    'px-2 py-0.5 rounded-md text-[10px] font-bold uppercase font-mono',
                    cashier.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  ]">
                    {{ cashier.role }}
                  </span>
                </td>
                <td class="px-5 py-3.5 text-center font-bold text-slate-200">
                  {{ cashier.total_orders }} Trx
                </td>
                <td class="px-5 py-3.5 text-right font-mono font-bold text-emerald-400">
                  {{ formatRupiah(cashier.cash_revenue) }}
                </td>
                <td class="px-5 py-3.5 text-right font-mono font-bold text-blue-400">
                  {{ formatRupiah(cashier.non_cash_revenue) }}
                </td>
                <td class="px-5 py-3.5 text-right font-mono font-extrabold text-white text-sm">
                  {{ formatRupiah(cashier.total_revenue) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- GRID DUA KOLOM: TOP PRODUK & METODE PEMBAYARAN -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Menu Terlaris -->
        <div class="bg-slate-950 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 class="text-sm font-extrabold text-white flex items-center gap-2">
              <Package class="w-4 h-4 text-amber-400" /> Menu Terlaris (Top Selling)
            </h3>
            <span class="text-[11px] text-slate-500 font-mono">Berdasarkan Qty Terjual</span>
          </div>

          <div v-if="topProducts.length === 0" class="py-10 text-center text-slate-500 text-xs">
            Belum ada data penjualan produk.
          </div>

          <div v-else class="space-y-2.5">
            <div
              v-for="(prod, idx) in topProducts"
              :key="prod.product_id"
              class="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between"
            >
              <div class="flex items-center gap-3">
                <span class="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-400 font-bold text-xs flex items-center justify-center font-mono">
                  #{{ idx + 1 }}
                </span>
                <div>
                  <div class="font-bold text-slate-200 text-xs">{{ prod.product?.name || 'Produk' }}</div>
                  <div class="text-[10px] text-slate-400">{{ prod.product?.category?.name || 'Umum' }}</div>
                </div>
              </div>

              <div class="text-right">
                <div class="text-xs font-bold text-emerald-400">{{ prod.total_sold }} Terjual</div>
                <div class="text-[10px] text-slate-400 font-mono">{{ formatRupiah(prod.total_sales_amount) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Breakdown Metode Pembayaran -->
        <div class="bg-slate-950 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 class="text-sm font-extrabold text-white flex items-center gap-2">
              <CreditCard class="w-4 h-4 text-indigo-400" /> Komposisi Metode Pembayaran
            </h3>
            <span class="text-[11px] text-slate-500 font-mono">Tunai vs Non-Tunai</span>
          </div>

          <div class="space-y-3 pt-1">
            <!-- Tunai -->
            <div class="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                  <DollarSign class="w-4 h-4" />
                </div>
                <div>
                  <div class="text-xs font-bold text-slate-200">Uang Tunai (Cash)</div>
                  <div class="text-[10px] text-slate-500">Diterima di laci kasir</div>
                </div>
              </div>
              <div class="font-mono font-bold text-emerald-400 text-sm">
                {{ formatRupiah(salesSummary?.by_payment_method?.cash) }}
              </div>
            </div>

            <!-- QRIS -->
            <div class="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                  <QrCode class="w-4 h-4" />
                </div>
                <div>
                  <div class="text-xs font-bold text-slate-200">QRIS Dinamis & Static</div>
                  <div class="text-[10px] text-slate-500">Settlement rekening toko</div>
                </div>
              </div>
              <div class="font-mono font-bold text-blue-400 text-sm">
                {{ formatRupiah(salesSummary?.by_payment_method?.qris) }}
              </div>
            </div>

            <!-- Kartu Debit / EDC -->
            <div class="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                  <CreditCard class="w-4 h-4" />
                </div>
                <div>
                  <div class="text-xs font-bold text-slate-200">Mesin EDC / Kartu Debit</div>
                  <div class="text-[10px] text-slate-500">BCA, Mandiri, BRI, dll.</div>
                </div>
              </div>
              <div class="font-mono font-bold text-purple-400 text-sm">
                {{ formatRupiah(salesSummary?.by_payment_method?.card) }}
              </div>
            </div>

            <!-- Transfer -->
            <div class="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-slate-800 text-slate-300 rounded-lg">
                  <Layers class="w-4 h-4" />
                </div>
                <div>
                  <div class="text-xs font-bold text-slate-200">Transfer Bank Langsung</div>
                  <div class="text-[10px] text-slate-500">Rekening giro / tabungan</div>
                </div>
              </div>
              <div class="font-mono font-bold text-slate-300 text-sm">
                {{ formatRupiah(salesSummary?.by_payment_method?.transfer) }}
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>
