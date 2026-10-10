<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../../api'
import {
  Eye, RefreshCw, AlertTriangle, User, Clock, Package, Wheat,
  TrendingDown, TrendingUp, Search, Filter, Scale, Trash2,
  ShoppingCart, FileText, Bell, Shield
} from 'lucide-vue-next'

const isLoading = ref(true)
const stockMutations = ref([])
const anomalies = ref([])
const lowStockIngredients = ref([])
const wasteSummary = ref(null)
const reconciliationReport = ref([])

// Filters
const filterType = ref('all')
const filterUser = ref('')
const filterDateFrom = ref('')
const filterDateTo = ref('')
const searchQuery = ref('')

const dateFilterType = ref('7days')

const setDateRange = (type) => {
  dateFilterType.value = type
  const today = new Date()
  const endStr = today.toISOString().split('T')[0]
  filterDateTo.value = endStr

  if (type === 'today') {
    filterDateFrom.value = endStr
  } else if (type === '7days') {
    const past = new Date()
    past.setDate(today.getDate() - 6)
    filterDateFrom.value = past.toISOString().split('T')[0]
  } else if (type === '30days') {
    const past = new Date()
    past.setDate(today.getDate() - 29)
    filterDateFrom.value = past.toISOString().split('T')[0]
  } else if (type === 'month') {
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    filterDateFrom.value = firstDay.toISOString().split('T')[0]
  }

  fetchAllData()
}

const fetchAllData = async () => {
  isLoading.value = true
  try {
    const params = {}
    if (filterDateFrom.value) params.start_date = filterDateFrom.value
    if (filterDateTo.value) params.end_date = filterDateTo.value

    const [mutationsRes, lowStockRes, reconReportRes] = await Promise.all([
      api.get('/admin/inventory/logs', { params: { ...params, per_page: 100 } }),
      api.get('/admin/ingredients/low-stock'),
      api.get('/superadmin/reconciliation/report', { params })
    ])

    stockMutations.value = mutationsRes.data.data.data || []
    lowStockIngredients.value = lowStockRes.data.data || []
    reconciliationReport.value = reconReportRes.data.data.ingredients || []
    anomalies.value = reconReportRes.data.data.anomalies || []

    // Fetch waste summary
    try {
      const { data } = await api.get('/admin/waste/summary', { params })
      wasteSummary.value = data.data
    } catch (e) {
      wasteSummary.value = null
    }
  } catch (err) {
    console.error('Gagal mengambil data monitoring:', err)
  } finally {
    isLoading.value = false
  }
}

const filteredMutations = computed(() => {
  let result = [...stockMutations.value]

  if (filterType.value !== 'all') {
    result = result.filter(m => {
      if (filterType.value === 'order') return m.reference_type === 'order' || m.reference_note?.includes('Order')
      if (filterType.value === 'waste') return m.reference_type === 'waste' || m.reference_note?.includes('Waste')
      if (filterType.value === 'manual') return m.reference_type === 'manual' || m.type === 'opname'
      if (filterType.value === 'anomaly') return false
      return true
    })
  }

  if (filterUser.value) {
    result = result.filter(m => m.user?.name?.toLowerCase().includes(filterUser.value.toLowerCase()))
  }

  if (searchQuery.value) {
    result = result.filter(m =>
      m.product?.name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      m.reference_note?.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  return result
})

const uniqueUsers = computed(() => {
  const users = new Set(stockMutations.value.map(m => m.user?.name).filter(Boolean))
  return [...users]
})

const typeColors = {
  in: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  out: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  opname: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
}

const typeLabels = {
  in: 'Masuk',
  out: 'Keluar',
  opname: 'Opname'
}

onMounted(() => setDateRange('7days'))
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-xl font-extrabold text-white flex items-center gap-2">
          <Eye class="w-5 h-5 text-rose-400" /> Monitoring Aktivitas Stok Owner
        </h1>
        <p class="text-xs text-slate-400">Pantau SEMUA perubahan bahan baku secara real-time. Siapa, kapan, dan apa yang berubah.</p>
      </div>
      <button
        @click="fetchAllData"
        class="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-rose-600/20"
      >
        <RefreshCw class="w-4 h-4" /> Refresh Data
      </button>
    </div>

    <!-- Date Filter -->
    <div class="flex flex-wrap items-center gap-2">
      <div class="bg-slate-950 p-1 rounded-xl border border-slate-800 flex gap-1 text-xs">
        <button
          v-for="preset in [
            { key: 'today', label: 'Hari Ini' },
            { key: '7days', label: '7 Hari' },
            { key: '30days', label: '30 Hari' },
            { key: 'month', label: 'Bulan Ini' }
          ]"
          :key="preset.key"
          @click="setDateRange(preset.key)"
          :class="['px-3 py-1.5 rounded-lg font-bold transition-all', dateFilterType === preset.key ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white']"
        >
          {{ preset.label }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="p-16 text-center text-slate-500 text-xs font-semibold flex items-center justify-center gap-2">
      <RefreshCw class="w-5 h-5 animate-spin text-rose-500" />
      <span>Memuat data monitoring...</span>
    </div>

    <div v-else class="space-y-6">

      <!-- ALERT BANNER - ANOMALI -->
      <div v-if="anomalies.length > 0" class="bg-gradient-to-r from-rose-500/20 to-rose-500/5 border-2 border-rose-500/40 rounded-2xl p-5 shadow-xl shadow-rose-500/10">
        <div class="flex items-start gap-4">
          <div class="p-3 bg-rose-500/20 rounded-xl">
            <AlertTriangle class="w-6 h-6 text-rose-400 animate-pulse" />
          </div>
          <div class="flex-1">
            <h3 class="text-sm font-extrabold text-rose-300 uppercase tracking-wider">
              {{ anomalies.length }} ANOMALI STOK TERDETEKSI
            </h3>
            <p class="text-xs text-rose-400/80 mt-1 mb-3">Ditemukan selisih stok sistem vs fisik yang melebihi batas normal (> 5%). Segera investigasi!</p>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <div v-for="a in anomalies" :key="a.ingredient_id" class="bg-rose-950/40 border border-rose-500/20 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div class="text-xs font-bold text-white">{{ a.ingredient_name }}</div>
                  <div class="text-[10px] text-rose-400">Selisih: {{ parseFloat(a.discrepancy).toFixed(2) }} {{ a.base_unit }}</div>
                </div>
                <span class="text-xs font-mono font-black text-rose-400">{{ a.discrepancy_percent }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- RINGKASAN KPI -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Low Stock Alert -->
        <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-xl">
          <div class="flex items-center justify-between mb-3">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stok Menipis</span>
            <div class="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
              <Bell class="w-4 h-4" />
            </div>
          </div>
          <div class="text-2xl font-black text-amber-400 font-mono">{{ lowStockIngredients.length }}</div>
          <p class="text-[10px] text-slate-500 mt-1">Bahan di bawah minimum</p>
        </div>

        <!-- Total Mutations -->
        <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-xl">
          <div class="flex items-center justify-between mb-3">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Aktivitas</span>
            <div class="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
              <FileText class="w-4 h-4" />
            </div>
          </div>
          <div class="text-2xl font-black text-blue-400 font-mono">{{ filteredMutations.length }}</div>
          <p class="text-[10px] text-slate-500 mt-1">Mutasi stok tercatat</p>
        </div>

        <!-- Waste Total -->
        <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-xl">
          <div class="flex items-center justify-between mb-3">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Waste</span>
            <div class="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20">
              <Trash2 class="w-4 h-4" />
            </div>
          </div>
          <div class="text-2xl font-black text-rose-400 font-mono">{{ wasteSummary ? parseFloat(wasteSummary.total_quantity).toFixed(1) : '0' }}</div>
          <p class="text-[10px] text-slate-500 mt-1">Unit terbuang periode ini</p>
        </div>

        <!-- Anomalies -->
        <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-xl">
          <div class="flex items-center justify-between mb-3">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Anomali</span>
            <div :class="['p-1.5 rounded-lg border', anomalies.length > 0 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20']">
              <Shield :class="['w-4 h-4', anomalies.length > 0 ? 'animate-pulse' : '']" />
            </div>
          </div>
          <div :class="['text-2xl font-black font-mono', anomalies.length > 0 ? 'text-rose-400' : 'text-emerald-400']">
            {{ anomalies.length }}
          </div>
          <p class="text-[10px] text-slate-500 mt-1">Selisih stok > 5%</p>
        </div>
      </div>

      <!-- LOW STOCK LIST -->
      <div v-if="lowStockIngredients.length > 0" class="bg-slate-950 rounded-2xl border border-amber-500/20 overflow-hidden shadow-xl">
        <div class="p-4 border-b border-amber-500/20 bg-amber-500/5 flex items-center gap-2">
          <Bell class="w-4 h-4 text-amber-400 animate-bounce" />
          <h3 class="text-xs font-extrabold text-amber-300 uppercase tracking-wider">Bahan Baku Stok Menipis</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-900/50 text-slate-400 border-b border-slate-800">
              <tr>
                <th class="p-3 font-bold">Bahan</th>
                <th class="p-3 font-bold text-right">Stok Saat Ini</th>
                <th class="p-3 font-bold text-right">Minimum</th>
                <th class="p-3 font-bold">Unit</th>
                <th class="p-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              <tr v-for="item in lowStockIngredients" :key="item.id" class="hover:bg-slate-900/50">
                <td class="p-3 font-bold text-white">{{ item.name }}</td>
                <td class="p-3 text-right font-mono font-bold text-amber-400">{{ parseFloat(item.stock_quantity).toFixed(2) }}</td>
                <td class="p-3 text-right font-mono text-slate-400">{{ parseFloat(item.min_stock_alert).toFixed(2) }}</td>
                <td class="p-3 font-mono text-slate-500">{{ item.base_unit }}</td>
                <td class="p-3">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                    KRITIS
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- FILTERS -->
      <div class="bg-slate-950 rounded-2xl border border-slate-800 p-4 shadow-xl">
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-2 text-xs text-slate-400">
            <Filter class="w-4 h-4" />
            <span class="font-bold">Filter:</span>
          </div>

          <!-- Type Filter -->
          <select v-model="filterType" class="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-rose-500">
            <option value="all">Semua Tipe</option>
            <option value="order">Penjualan (Order)</option>
            <option value="waste">Waste/Spoilage</option>
            <option value="manual">Manual/Opname</option>
          </select>

          <!-- User Filter -->
          <select v-model="filterUser" class="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-rose-500">
            <option value="">Semua User</option>
            <option v-for="u in uniqueUsers" :key="u" :value="u">{{ u }}</option>
          </select>

          <!-- Search -->
          <div class="relative flex-1 min-w-[200px]">
            <Search class="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari produk/catatan..."
              class="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-rose-500"
            />
          </div>

          <span class="text-[10px] text-slate-500 font-mono">{{ filteredMutations.length }} hasil</span>
        </div>
      </div>

      <!-- MAIN ACTIVITY LOG TABLE -->
      <div class="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div class="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <FileText class="w-4 h-4 text-rose-400" />
            <h3 class="text-xs font-extrabold text-slate-300 uppercase font-mono tracking-wider">Log Aktivitas Stok Lengkap</h3>
          </div>
          <span class="text-[10px] text-slate-500 font-mono">
            {{ filteredMutations.length }} dari {{ stockMutations.length }} catatan
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-slate-900 text-slate-400 border-b border-slate-800">
              <tr>
                <th class="p-4 font-bold">Waktu</th>
                <th class="p-4 font-bold">Siapa</th>
                <th class="p-4 font-bold">Produk</th>
                <th class="p-4 font-bold">Tipe</th>
                <th class="p-4 font-bold text-right">Sebelum</th>
                <th class="p-4 font-bold text-right">Perubahan</th>
                <th class="p-4 font-bold text-right">Setelah</th>
                <th class="p-4 font-bold">Keterangan</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              <tr v-if="filteredMutations.length === 0">
                <td colspan="8" class="p-8 text-center text-slate-500">
                  <div class="flex flex-col items-center gap-2">
                    <Search class="w-5 h-5 text-slate-600" />
                    <span>Tidak ada data aktivitas stok ditemukan</span>
                  </div>
                </td>
              </tr>
              <tr v-for="m in filteredMutations" :key="m.id" class="hover:bg-slate-900/50 transition-colors">
                <td class="p-4 font-mono text-slate-400 text-[11px]">
                  <div class="flex items-center gap-1.5">
                    <Clock class="w-3 h-3 text-slate-600" />
                    {{ new Date(m.created_at).toLocaleString('id-ID') }}
                  </div>
                </td>
                <td class="p-4">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                      <User class="w-3 h-3" />
                    </div>
                    <span class="font-bold text-white text-xs">{{ m.user?.name || 'Admin' }}</span>
                  </div>
                </td>
                <td class="p-4 font-bold text-white">{{ m.product?.name || '-' }}</td>
                <td class="p-4">
                  <span :class="['px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono border', typeColors[m.type] || 'bg-slate-700/50 text-slate-400 border-slate-600']">
                    {{ typeLabels[m.type] || m.type }}
                  </span>
                </td>
                <td class="p-4 text-right font-mono text-slate-400">{{ m.stock_before }}</td>
                <td class="p-4 text-right font-mono font-bold" :class="m.quantity > 0 ? 'text-emerald-400' : 'text-rose-400'">
                  {{ m.quantity > 0 ? `+${m.quantity}` : m.quantity }}
                </td>
                <td class="p-4 text-right font-mono font-bold text-white">{{ m.stock_after }}</td>
                <td class="p-4 text-slate-400 max-w-[250px]">
                  <div class="truncate">{{ m.reference_note || '-' }}</div>
                  <div v-if="m.reference_type" class="text-[10px] text-slate-600 font-mono mt-0.5">
                    Ref: {{ m.reference_type }}{{ m.reference_id ? `#${m.reference_id}` : '' }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- REKONSILIASI RINGKASAN -->
      <div class="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div class="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Scale class="w-4 h-4 text-blue-400" />
            <h3 class="text-xs font-extrabold text-slate-300 uppercase font-mono tracking-wider">Status Rekonsiliasi Stok</h3>
          </div>
          <span class="text-[10px] text-slate-500 font-mono">
            {{ anomalies.length }} anomali dari {{ reconciliationReport.length }} bahan
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-slate-900 text-slate-400 border-b border-slate-800">
              <tr>
                <th class="p-3 font-bold">Bahan</th>
                <th class="p-3 font-bold text-right">Stok Sistem</th>
                <th class="p-3 font-bold text-right">Seharusnya</th>
                <th class="p-3 font-bold text-right">Selisih</th>
                <th class="p-3 font-bold text-right">%</th>
                <th class="p-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              <tr v-if="reconciliationReport.length === 0">
                <td colspan="6" class="p-6 text-center text-slate-500">Belum ada data rekonsiliasi</td>
              </tr>
              <tr
                v-for="item in reconciliationReport"
                :key="item.ingredient_id"
                :class="['hover:bg-slate-900/50 transition-colors', item.is_anomaly ? 'bg-rose-500/5' : '']"
              >
                <td class="p-3 font-bold text-white">{{ item.ingredient_name }}</td>
                <td class="p-3 text-right font-mono text-white">{{ parseFloat(item.system_stock).toFixed(2) }}</td>
                <td class="p-3 text-right font-mono text-slate-400">{{ parseFloat(item.expected_stock).toFixed(2) }}</td>
                <td class="p-3 text-right font-mono font-bold" :class="item.discrepancy > 0 ? 'text-emerald-400' : item.discrepancy < 0 ? 'text-rose-400' : 'text-slate-400'">
                  {{ item.discrepancy > 0 ? '+' : '' }}{{ parseFloat(item.discrepancy).toFixed(2) }}
                </td>
                <td class="p-3 text-right font-mono" :class="item.is_anomaly ? 'text-rose-400 font-bold' : 'text-slate-400'">
                  {{ item.discrepancy_percent }}%
                </td>
                <td class="p-3">
                  <span v-if="item.is_anomaly" class="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 w-fit">
                    <AlertTriangle class="w-3 h-3" /> ANOMALI
                  </span>
                  <span v-else class="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
                    OK
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
</template>
