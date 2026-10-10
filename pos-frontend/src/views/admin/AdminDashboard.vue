<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api'
import {
  Users, Package, TrendingUp, AlertTriangle,
  ArrowRight, Shield, Layers, UtensilsCrossed, Settings, DollarSign
} from 'lucide-vue-next'

const router = useRouter()
const stats = ref({
  totalUsers: 0,
  totalProducts: 0,
  totalCategories: 0,
  lowStockCount: 0,
  grossProfitMonth: 0,
})

const lowStockList = ref([])
const isLoading = ref(true)

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0)

const fetchDashboardStats = async () => {
  isLoading.value = true
  try {
    const [usersRes, productsRes, categoriesRes, lowStockRes, profitRes] = await Promise.all([
      api.get('/admin/users'),
      api.get('/admin/products'),
      api.get('/admin/categories'),
      api.get('/admin/inventory/low-stock'),
      api.get('/reports/profit-loss')
    ])

    stats.value.totalUsers = usersRes.data.data.length
    stats.value.totalProducts = productsRes.data.data.length
    stats.value.totalCategories = categoriesRes.data.data.length
    stats.value.lowStockCount = lowStockRes.data.data.length
    stats.value.grossProfitMonth = profitRes.data.data.gross_profit || 0

    lowStockList.value = lowStockRes.data.data
  } catch (err) {
    console.error('Gagal mengambil statistik dasbor admin:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchDashboardStats()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header Title -->
    <div>
      <h1 class="text-xl font-extrabold text-white">Dasbor Executive Admin</h1>
      <p class="text-xs text-slate-400">Ringkasan performa master data dan operasional restoran</p>
    </div>

    <div v-if="isLoading" class="flex justify-center items-center py-20 text-slate-500 text-sm font-semibold">
      Memuat dasbor executive...
    </div>

    <div v-else class="space-y-6">
      <!-- 4 EXECUTIVE KPI CARDS -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Total Staf -->
        <div class="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 shadow-lg flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Staf & Kasir</span>
            <div class="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Users class="w-5 h-5" />
            </div>
          </div>
          <div class="mt-4">
            <div class="text-3xl font-black text-white font-mono">{{ stats.totalUsers }}</div>
            <p class="text-[11px] text-slate-500 mt-1">Role: Admin, Cashier, Kitchen</p>
          </div>
        </div>

        <!-- Master Produk -->
        <div class="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 shadow-lg flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Master Produk Menu</span>
            <div class="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Package class="w-5 h-5" />
            </div>
          </div>
          <div class="mt-4">
            <div class="text-3xl font-black text-white font-mono">{{ stats.totalProducts }}</div>
            <p class="text-[11px] text-slate-500 mt-1">{{ stats.totalCategories }} Kategori Menu</p>
          </div>
        </div>

        <!-- Profit Bulan Ini -->
        <div
          @click="router.push('/admin/reports')"
          class="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 hover:border-emerald-500/50 cursor-pointer shadow-lg flex flex-col justify-between transition-all group"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-emerald-400 transition-colors">Laba Kotor Bulan Ini</span>
            <div class="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <TrendingUp class="w-5 h-5" />
            </div>
          </div>
          <div class="mt-4">
            <div class="text-2xl font-black text-emerald-400 font-mono">{{ formatRupiah(stats.grossProfitMonth) }}</div>
            <p class="text-[11px] text-slate-500 mt-1">Pendapatan dikurangi HPP &bull; Lihat Laporan &rarr;</p>
          </div>
        </div>

        <!-- Alert Stok -->
        <div class="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 shadow-lg flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Stok Menipis</span>
            <div class="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <AlertTriangle class="w-5 h-5" />
            </div>
          </div>
          <div class="mt-4">
            <div class="text-3xl font-black text-amber-400 font-mono">{{ stats.lowStockCount }}</div>
            <p class="text-[11px] text-slate-500 mt-1">Perlu Restock Segera</p>
          </div>
        </div>
      </div>

      <!-- QUICK MENU NAVIGATION CARDS -->
      <div>
        <h2 class="text-sm font-extrabold text-slate-300 mb-3 uppercase tracking-wider font-mono">Pintas Manajemen Master</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <button
            @click="router.push('/admin/users')"
            class="bg-slate-950 p-4 rounded-2xl border border-slate-800 hover:border-blue-500/50 transition-all text-left flex items-center justify-between group"
          >
            <div class="flex items-center gap-3">
              <div class="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
                <Users class="w-5 h-5" />
              </div>
              <div>
                <div class="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors">Kelola Staf</div>
                <div class="text-[11px] text-slate-500">Tambah & Edit Kasir</div>
              </div>
            </div>
            <ArrowRight class="w-4 h-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
          </button>

          <button
            @click="router.push('/admin/products')"
            class="bg-slate-950 p-4 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition-all text-left flex items-center justify-between group"
          >
            <div class="flex items-center gap-3">
              <div class="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
                <Package class="w-5 h-5" />
              </div>
              <div>
                <div class="text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">Katalog & HPP</div>
                <div class="text-[11px] text-slate-500">Harga & Barcode</div>
              </div>
            </div>
            <ArrowRight class="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
          </button>

          <button
            @click="router.push('/admin/inventory')"
            class="bg-slate-950 p-4 rounded-2xl border border-slate-800 hover:border-amber-500/50 transition-all text-left flex items-center justify-between group"
          >
            <div class="flex items-center gap-3">
              <div class="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
                <AlertTriangle class="w-5 h-5" />
              </div>
              <div>
                <div class="text-xs font-bold text-slate-200 group-hover:text-amber-400 transition-colors">Mutasi Inventaris</div>
                <div class="text-[11px] text-slate-500">Stock Opname & Restock</div>
              </div>
            </div>
            <ArrowRight class="w-4 h-4 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
          </button>

          <button
            @click="router.push('/admin/settings')"
            class="bg-slate-950 p-4 rounded-2xl border border-slate-800 hover:border-purple-500/50 transition-all text-left flex items-center justify-between group"
          >
            <div class="flex items-center gap-3">
              <div class="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl">
                <Settings class="w-5 h-5" />
              </div>
              <div>
                <div class="text-xs font-bold text-slate-200 group-hover:text-purple-400 transition-colors">Pengaturan Toko</div>
                <div class="text-[11px] text-slate-500">Struk & Pajak</div>
              </div>
            </div>
            <ArrowRight class="w-4 h-4 text-slate-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
          </button>

        </div>
      </div>

      <!-- LOW STOCK ALERT TABLE -->
      <div class="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
        <div class="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div class="flex items-center gap-2 text-xs font-extrabold text-amber-400">
            <AlertTriangle class="w-4 h-4" />
            <span>Peringatan Stok Menipis (Sisa &le; 10)</span>
          </div>
          <router-link to="/admin/inventory" class="text-xs font-bold text-blue-400 hover:underline">
            Kelola Stok &rarr;
          </router-link>
        </div>
        <div class="p-0 overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-slate-900/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th class="p-3 font-bold">Produk</th>
                <th class="p-3 font-bold">SKU</th>
                <th class="p-3 font-bold">Kategori</th>
                <th class="p-3 font-bold text-right">Harga Jual</th>
                <th class="p-3 font-bold text-right">Sisa Stok</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              <tr v-if="lowStockList.length === 0">
                <td colspan="5" class="p-6 text-center text-slate-500">Semua stok produk aman!</td>
              </tr>
              <tr v-for="item in lowStockList" :key="item.id" class="hover:bg-slate-900/50 transition-colors">
                <td class="p-3 font-bold text-white">{{ item.name }}</td>
                <td class="p-3 font-mono text-slate-400 text-[11px]">{{ item.sku || '-' }}</td>
                <td class="p-3 text-slate-400">{{ item.category?.name || '-' }}</td>
                <td class="p-3 text-right font-mono text-slate-300">{{ formatRupiah(item.price) }}</td>
                <td class="p-3 text-right font-mono font-bold text-amber-400">{{ item.stock }} porsi</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
