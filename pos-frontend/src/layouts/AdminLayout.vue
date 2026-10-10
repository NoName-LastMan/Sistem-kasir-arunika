<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../api'
import {
  LayoutDashboard, Package, Tag, Layers, Users,
  UtensilsCrossed, Boxes, Settings, LogOut,
  ShoppingBag, Shield, Bell, ChevronRight, Menu, X, TrendingUp,
  Wheat, BookOpen, Trash2, Scale, Eye
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const currentUser = ref(null)
const lowStockCount = ref(0)
const isSidebarMobileOpen = ref(false)
const isSuperAdmin = ref(false)

const fetchProfileAndAlerts = async () => {
  try {
    const { data: userRes } = await api.get('/me')
    currentUser.value = userRes.user
    isSuperAdmin.value = userRes.user?.role === 'superadmin'

    // Fetch low stock alert count
    const { data: lowStockRes } = await api.get('/admin/inventory/low-stock')
    lowStockCount.value = lowStockRes.data ? lowStockRes.data.length : 0
  } catch (err) {
    console.error('Gagal mengambil profil admin:', err)
  }
}

const logout = async () => {
  try { await api.post('/logout') } catch (e) {}
  localStorage.clear()
  router.push('/login')
}

onMounted(() => {
  fetchProfileAndAlerts()
})

const navGroups = computed(() => {
  const groups = [
    {
      title: 'UTAMA',
      items: [
        { name: 'Dasbor Executive', path: '/admin/dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'MANAJEMEN KATALOG',
      items: [
        { name: 'Produk & Harga (HPP)', path: '/admin/products', icon: Package },
        { name: 'Kategori Menu', path: '/admin/categories', icon: Tag },
        { name: 'Modifier & Varian', path: '/admin/modifiers', icon: Layers }
      ]
    },
    {
      title: 'BAHAN BAKU & RESEP',
      items: [
        { name: 'Bahan Baku (Ingredients)', path: '/admin/ingredients', icon: Wheat },
        { name: 'Resep Produk (BOM)', path: '/admin/recipes', icon: BookOpen },
        { name: 'Waste & Spoilage', path: '/admin/waste', icon: Trash2 },
        ...(isSuperAdmin.value ? [
          { name: 'Rekonsiliasi Stok', path: '/admin/reconciliation', icon: Scale }
        ] : [])
      ]
    },
    {
      title: 'STAF & AKSES',
      items: [
        { name: 'Kelola Staf & Kasir', path: '/admin/users', icon: Users }
      ]
    },
    {
      title: 'RESTORAN & INVENTARIS',
      items: [
        { name: 'Meja Restoran', path: '/admin/tables', icon: UtensilsCrossed },
        { name: 'Inventaris & Mutasi Stok', path: '/admin/inventory', icon: Boxes, badge: lowStockCount }
      ]
    },
    {
      title: 'LAPORAN & MONITORING',
      items: [
        { name: 'Laporan Penjualan & Kasir', path: '/admin/reports', icon: TrendingUp },
        ...(isSuperAdmin.value ? [
          { name: 'Monitoring Owner (Semua Aktivitas)', path: '/admin/owner-monitoring', icon: Eye }
        ] : [])
      ]
    },
    {
      title: 'PENGATURAN',
      items: [
        { name: 'Toko & Struk Thermal', path: '/admin/settings', icon: Settings }
      ]
    }
  ]

  return groups
})
</script>

<template>
  <div class="min-h-screen flex bg-slate-900 text-slate-100 font-sans select-none overflow-hidden">
    
    <!-- SIDEBAR KIRI ELEGAN (SLATE-900 EXECUTIVE) -->
    <aside
      :class="[
        'w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col shrink-0 z-40 transition-all duration-300 fixed md:relative h-full',
        isSidebarMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      ]"
    >
      <!-- Logo Header -->
      <div class="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 bg-slate-950/50">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/20 border border-blue-400/30">
            <Shield class="w-5 h-5" />
          </div>
          <div>
            <h1 class="text-sm font-extrabold tracking-wide text-white">POS ADMIN</h1>
            <p class="text-[10px] text-blue-400 font-mono tracking-widest uppercase">Executive Suite</p>
          </div>
        </div>
        <button @click="isSidebarMobileOpen = false" class="md:hidden text-slate-400 hover:text-white">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Navigation Groups -->
      <div class="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
        <div v-for="(group, gIdx) in navGroups" :key="gIdx" class="space-y-1.5">
          <h2 class="px-3 text-[10px] font-extrabold text-slate-500 tracking-wider uppercase font-mono">
            {{ group.title }}
          </h2>

          <div class="space-y-1">
            <router-link
              v-for="item in group.items"
              :key="item.path"
              :to="item.path"
              :class="[
                'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all group',
                route.path === item.path
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-extrabold'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              ]"
            >
              <div class="flex items-center gap-3">
                <component :is="item.icon" :class="['w-4 h-4 transition-transform group-hover:scale-110', route.path === item.path ? 'text-white' : 'text-slate-400']" />
                <span>{{ item.name }}</span>
              </div>

              <!-- Badge Notifikasi Stok Menipis jika ada -->
              <span
                v-if="item.badge && item.badge > 0"
                class="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold animate-pulse"
              >
                {{ item.badge }}
              </span>
            </router-link>
          </div>
        </div>
      </div>

      <!-- Footer User Info -->
      <div class="p-3 border-t border-slate-800/80 bg-slate-950/60">
        <div class="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800">
          <div class="flex items-center gap-2.5 overflow-hidden">
            <div class="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs shrink-0 border border-blue-500/30">
              {{ currentUser?.name?.charAt(0) || 'A' }}
            </div>
            <div class="truncate">
              <div class="text-xs font-bold text-slate-200 truncate">{{ currentUser?.name || 'Administrator' }}</div>
              <div class="text-[10px] text-slate-400 uppercase font-mono">{{ currentUser?.role || 'admin' }}</div>
            </div>
          </div>
          <button @click="logout" class="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors">
            <LogOut class="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>

    <!-- AREA WORKSPACE KANAN -->
    <div class="flex-1 flex flex-col h-full overflow-hidden bg-slate-900">
      
      <!-- Top Bar Admin Header -->
      <header class="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between shrink-0 z-20">
        <div class="flex items-center gap-3">
          <button @click="isSidebarMobileOpen = true" class="md:hidden text-slate-400 hover:text-white p-1">
            <Menu class="w-6 h-6" />
          </button>
          <div class="flex items-center gap-2 text-xs text-slate-400">
            <span>Admin</span>
            <ChevronRight class="w-3.5 h-3.5 text-slate-600" />
            <span class="text-slate-200 font-bold capitalize">{{ route.name || 'Dashboard' }}</span>
          </div>
        </div>

        <!-- Right Quick Actions -->
        <div class="flex items-center gap-3">
          <!-- Alert Stok Widget -->
          <router-link
            to="/admin/inventory"
            v-if="lowStockCount > 0"
            class="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl text-xs font-bold hover:bg-amber-500/20 transition-colors"
          >
            <Bell class="w-4 h-4 text-amber-400 animate-bounce" />
            <span>{{ lowStockCount }} Stok Menipis</span>
          </router-link>

          <!-- Tombol Pindah ke Layar Kasir POS -->
          <button
            @click="router.push('/')"
            class="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-blue-600/20 border border-blue-400/30 transition-all"
          >
            <ShoppingBag class="w-4 h-4" />
            <span>Layar Kasir [POS]</span>
          </button>
        </div>
      </header>

      <!-- Main Dynamic Content Container -->
      <main class="flex-1 overflow-y-auto p-6 bg-slate-900/50">
        <router-view />
      </main>
    </div>

  </div>
</template>
