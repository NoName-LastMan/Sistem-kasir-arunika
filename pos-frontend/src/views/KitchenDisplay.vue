<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'
import { useSoundFx } from '../composables/useSoundFx'
import {
  UtensilsCrossed, ArrowLeft, RefreshCw, CheckCircle2,
  Clock, Check, Volume2, VolumeX, Sparkles
} from 'lucide-vue-next'

const router = useRouter()
const { isMuted, toggleMute, playSuccess } = useSoundFx()

const orders = ref([])
const isLoading = ref(false)
const completedTicketIds = ref(new Set(JSON.parse(localStorage.getItem('kds_done_tickets') || '[]')))
let refreshInterval = null

const fetchKitchenOrders = async () => {
  isLoading.value = true
  try {
    const { data } = await api.get('/orders?today_only=1&per_page=40')
    orders.value = data.data?.data || []
  } catch (err) {
    console.error('Gagal mengambil tiket dapur:', err)
  } finally {
    isLoading.value = false
  }
}

// Hanya tampilkan pesanan yang belum ditandai selesai oleh dapur
const activeTickets = computed(() => {
  return orders.value.filter(order => !completedTicketIds.value.has(order.id) && order.status === 'completed')
})

const markAsDone = (orderId) => {
  playSuccess()
  completedTicketIds.value.add(orderId)
  localStorage.setItem('kds_done_tickets', JSON.stringify(Array.from(completedTicketIds.value)))
}

const getTimeAgo = (dateStr) => {
  const diff = Math.floor((new Date() - new Date(dateStr)) / 60000)
  if (diff < 1) return 'Baru saja'
  return `${diff} mnt lalu`
}

onMounted(() => {
  fetchKitchenOrders()
  refreshInterval = setInterval(fetchKitchenOrders, 15000)
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
    
    <!-- Top Bar KDS Minimalis -->
    <header class="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-3">
        <button
          @click="router.push('/')"
          class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
        >
          <ArrowLeft class="w-4 h-4" /> Kembali ke Kasir
        </button>
        <div class="flex items-center gap-2 pl-3 border-l border-slate-800">
          <UtensilsCrossed class="w-5 h-5 text-amber-400" />
          <h1 class="text-base font-extrabold tracking-wide text-white">Layar Dapur & Bar (KDS)</h1>
          <span class="bg-amber-500/20 text-amber-400 text-xs font-mono font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
            {{ activeTickets.length }} Antrean Aktif
          </span>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <!-- Sound Toggle -->
        <button
          @click="toggleMute"
          class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          :title="isMuted ? 'Nyalakan Suara' : 'Bisukan Suara'"
        >
          <Volume2 v-if="!isMuted" class="w-4 h-4 text-emerald-400" />
          <VolumeX v-else class="w-4 h-4 text-slate-500" />
        </button>

        <!-- Manual Refresh -->
        <button
          @click="fetchKitchenOrders"
          :disabled="isLoading"
          class="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
        >
          <RefreshCw :class="['w-3.5 h-3.5', isLoading ? 'animate-spin' : '']" />
          <span>Segarkan</span>
        </button>
      </div>
    </header>

    <!-- Konten Utama KDS: Grid Kartu Pesanan -->
    <main class="flex-1 p-6 overflow-y-auto">
      <!-- Jika tidak ada antrean -->
      <div v-if="activeTickets.length === 0" class="h-96 flex flex-col items-center justify-center text-slate-500">
        <Sparkles class="w-12 h-12 text-emerald-400/60 mb-3 animate-pulse" />
        <h3 class="text-base font-bold text-slate-300">Semua Pesanan Selesai!</h3>
        <p class="text-xs text-slate-500 mt-1">Dapur sedang santai, belum ada pesanan baru masuk.</p>
      </div>

      <!-- Grid Tiket Pesanan -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div
          v-for="ticket in activeTickets"
          :key="ticket.id"
          class="bg-slate-900 border-2 border-slate-800 hover:border-amber-500/50 rounded-2xl flex flex-col overflow-hidden shadow-xl transition-all"
        >
          <!-- Header Tiket -->
          <div class="p-4 bg-slate-800/80 border-b border-slate-800 flex items-center justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-base font-black text-amber-400">
                  {{ ticket.table ? `Meja ${ticket.table.table_number || ticket.table.number}` : (ticket.order_type === 'takeaway' ? 'Bungkus (Takeaway)' : 'Delivery') }}
                </span>
              </div>
              <div class="text-[11px] text-slate-400 font-mono mt-0.5">
                {{ ticket.invoice_number }} &bull; {{ ticket.user?.name || 'Kasir' }}
              </div>
            </div>

            <!-- Timer Menit Tunggu -->
            <div class="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-700 text-xs font-mono font-bold text-slate-300">
              <Clock class="w-3.5 h-3.5 text-amber-400" />
              <span>{{ getTimeAgo(ticket.created_at) }}</span>
            </div>
          </div>

          <!-- Daftar Menu Makanan & Catatan Koki -->
          <div class="p-4 flex-1 space-y-3 overflow-y-auto max-h-72">
            <div
              v-for="item in ticket.items"
              :key="item.id"
              class="border-b border-slate-800/80 pb-2.5 last:border-b-0"
            >
              <div class="flex items-start gap-2.5">
                <span class="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-black text-sm flex items-center justify-center shrink-0 border border-amber-500/30">
                  {{ item.quantity }}
                </span>
                <div class="flex-1 min-w-0">
                  <div class="font-bold text-slate-100 text-sm leading-tight">{{ item.product?.name }}</div>

                  <!-- Modifier / Topping Khusus -->
                  <div v-if="item.modifiers && item.modifiers.length > 0" class="mt-1 space-y-0.5">
                    <span
                      v-for="mod in item.modifiers"
                      :key="mod.id"
                      class="inline-block bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded mr-1"
                    >
                      + {{ mod.modifier_item?.name || 'Varian' }}
                    </span>
                  </div>

                  <!-- Catatan Pesanan (Highlight Kuning) -->
                  <div v-if="item.notes" class="mt-1 text-[11px] text-amber-300 italic bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                    Catatan: "{{ item.notes }}"
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tombol Selesaikan Masakan -->
          <div class="p-3 bg-slate-950 border-t border-slate-800">
            <button
              @click="markAsDone(ticket.id)"
              class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
            >
              <CheckCircle2 class="w-4 h-4" />
              <span>Tandai Siap / Selesai</span>
            </button>
          </div>
        </div>
      </div>
    </main>

  </div>
</template>
