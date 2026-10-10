<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api'
import { Trash2, Plus, Search, X, Camera, BarChart3, AlertCircle } from 'lucide-vue-next'

const wasteRecords = ref([])
const ingredients = ref([])
const isLoading = ref(true)
const summary = ref(null)

const showFormModal = ref(false)
const form = ref({
  ingredient_id: '',
  quantity: 0,
  reason: 'expired',
  notes: '',
  shift_id: null
})

const reasonLabels = {
  expired: 'Kedaluwarsa',
  damaged: 'Rusak',
  spoilage: 'Busuk/Tercemar',
  cooking_error: 'Kesalahan Masak',
  other: 'Lainnya'
}

const reasonColors = {
  expired: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  damaged: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  spoilage: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  cooking_error: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  other: 'bg-slate-700/50 text-slate-400 border-slate-600'
}

const fetchData = async () => {
  isLoading.value = true
  try {
    const [wasteRes, ingRes] = await Promise.all([
      api.get('/admin/waste'),
      api.get('/admin/ingredients')
    ])
    wasteRecords.value = wasteRes.data.data.data || []
    ingredients.value = ingRes.data.data.data || []

    // Fetch summary for this month
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
    const lastDay = today.toISOString().split('T')[0]

    try {
      const { data } = await api.get('/admin/waste/summary', {
        params: { start_date: firstDay, end_date: lastDay }
      })
      summary.value = data.data
    } catch (e) {
      summary.value = null
    }
  } catch (err) {
    console.error('Gagal mengambil data waste:', err)
  } finally {
    isLoading.value = false
  }
}

const openFormModal = () => {
  form.value = {
    ingredient_id: ingredients.value[0]?.id || '',
    quantity: 0,
    reason: 'expired',
    notes: '',
    shift_id: null
  }
  showFormModal.value = true
}

const submitWaste = async () => {
  if (!form.value.ingredient_id || form.value.quantity <= 0) {
    alert('Pilih bahan dan masukkan jumlah waste!')
    return
  }

  try {
    await api.post('/admin/waste', form.value)
    alert('Waste berhasil dicatat dan stok dikurangi!')
    showFormModal.value = false
    await fetchData()
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal mencatat waste')
  }
}

onMounted(() => fetchData())
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-xl font-extrabold text-white flex items-center gap-2">
          <Trash2 class="w-5 h-5 text-rose-400" /> Waste & Spoilage Tracking
        </h1>
        <p class="text-xs text-slate-400">Catat bahan baku yang terbuang, rusak, atau kedaluwarsa. Stok otomatis dikurangi.</p>
      </div>

      <button
        @click="openFormModal"
        class="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-rose-600/20"
      >
        <Plus class="w-4 h-4" /> Catat Waste
      </button>
    </div>

    <!-- Summary Cards -->
    <div v-if="summary" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Waste Bulan Ini</div>
        <div class="text-2xl font-black text-rose-400 font-mono">{{ parseFloat(summary.total_quantity).toFixed(2) }}</div>
        <p class="text-[11px] text-slate-500 mt-1">Jumlah bahan terbuang</p>
      </div>

      <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kategori Terbanyak</div>
        <div v-if="summary.by_reason && summary.by_reason.length > 0">
          <span :class="['px-2 py-1 rounded-lg text-xs font-bold border', reasonColors[summary.by_reason[0]?.reason] || reasonColors.other]">
            {{ reasonLabels[summary.by_reason[0]?.reason] || summary.by_reason[0]?.reason }}
          </span>
          <p class="text-[11px] text-slate-500 mt-1">{{ summary.by_reason[0]?.count }} kejadian</p>
        </div>
        <div v-else class="text-sm text-slate-500">-</div>
      </div>

      <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bahan Paling Sering</div>
        <div v-if="summary.by_ingredient && summary.by_ingredient.length > 0">
          <div class="text-sm font-bold text-white">{{ summary.by_ingredient[0]?.ingredient?.name || '-' }}</div>
          <p class="text-[11px] text-slate-500 mt-1">{{ parseFloat(summary.by_ingredient[0]?.total_quantity).toFixed(2) }} unit terbuang</p>
        </div>
        <div v-else class="text-sm text-slate-500">-</div>
      </div>
    </div>

    <!-- Alert -->
    <div v-if="wasteRecords.length > 0" class="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-center gap-3 text-xs">
      <AlertCircle class="w-5 h-5 text-rose-400 shrink-0" />
      <div>
        <span class="font-extrabold text-rose-300">{{ wasteRecords.length }} Catatan Waste Ditemukan</span>
        <p class="text-rose-400/80 text-[11px]">Semua waste tercatat dengan alasan dan siapa yang melaporkan. Stok bahan otomatis dikurangi.</p>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
      <div class="p-4 border-b border-slate-800 bg-slate-900/50">
        <h3 class="text-xs font-extrabold text-slate-300 uppercase font-mono tracking-wider">Riwayat Waste & Spoilage</h3>
      </div>

      <div v-if="isLoading" class="p-12 text-center text-slate-500 text-xs font-semibold">Memuat data waste...</div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead class="bg-slate-900 text-slate-400 border-b border-slate-800">
            <tr>
              <th class="p-4 font-bold">Waktu</th>
              <th class="p-4 font-bold">Bahan</th>
              <th class="p-4 font-bold text-right">Jumlah</th>
              <th class="p-4 font-bold">Alasan</th>
              <th class="p-4 font-bold">Dicatat Oleh</th>
              <th class="p-4 font-bold">Catatan</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            <tr v-if="wasteRecords.length === 0">
              <td colspan="6" class="p-6 text-center text-slate-500">Belum ada catatan waste</td>
            </tr>
            <tr v-for="w in wasteRecords" :key="w.id" class="hover:bg-slate-900/50 transition-colors">
              <td class="p-4 font-mono text-slate-400 text-[11px]">{{ new Date(w.created_at).toLocaleString('id-ID') }}</td>
              <td class="p-4 font-bold text-white">
                {{ w.ingredient?.name }}
                <span class="text-[10px] text-slate-500 ml-1">({{ w.ingredient?.base_unit }})</span>
              </td>
              <td class="p-4 text-right font-mono font-bold text-rose-400">
                -{{ parseFloat(w.quantity).toFixed(2) }}
              </td>
              <td class="p-4">
                <span :class="['px-2 py-0.5 rounded text-[10px] font-bold border', reasonColors[w.reason] || reasonColors.other]">
                  {{ reasonLabels[w.reason] || w.reason }}
                </span>
              </td>
              <td class="p-4 text-slate-300">
                <div class="font-bold">{{ w.user?.name || 'Admin' }}</div>
                <div v-if="w.shift" class="text-[10px] text-slate-500">Shift: {{ w.shift?.name }}</div>
              </td>
              <td class="p-4 text-slate-400 max-w-[200px] truncate">{{ w.notes || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL CATAT WASTE -->
    <div v-if="showFormModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden">
        <div class="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h3 class="text-base font-extrabold text-white">Catat Waste / Spoilage</h3>
          <button @click="showFormModal = false" class="text-slate-400 hover:text-white"><X class="w-5 h-5"/></button>
        </div>
        <div class="p-6 space-y-4 text-xs">
          <div>
            <label class="block font-bold text-slate-300 mb-1">Bahan Baku *</label>
            <select v-model="form.ingredient_id" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-rose-500">
              <option v-for="ing in ingredients" :key="ing.id" :value="ing.id">
                {{ ing.name }} (Stok: {{ parseFloat(ing.stock_quantity).toFixed(2) }} {{ ing.base_unit }})
              </option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-300 mb-1">Jumlah *</label>
              <input v-model="form.quantity" type="number" step="0.001" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-rose-400 font-bold outline-none focus:border-rose-500" />
            </div>
            <div>
              <label class="block font-bold text-slate-300 mb-1">Alasan *</label>
              <select v-model="form.reason" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-rose-500">
                <option value="expired">Kedaluwarsa</option>
                <option value="damaged">Rusak</option>
                <option value="spoilage">Busuk/Tercemar</option>
                <option value="cooking_error">Kesalahan Masak</option>
                <option value="other">Lainnya</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-300 mb-1">Catatan / Detail</label>
            <textarea v-model="form.notes" rows="3" placeholder="Jelaskan kronologi waste..." class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-rose-500 resize-none"></textarea>
          </div>
        </div>
        <div class="p-4 border-t border-slate-800 bg-slate-900/50 flex gap-2">
          <button @click="showFormModal = false" class="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs">Batal</button>
          <button @click="submitWaste" class="flex-1 py-2.5 bg-rose-600 text-white font-bold rounded-xl text-xs">Catat Waste</button>
        </div>
      </div>
    </div>
  </div>
</template>
