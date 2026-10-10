<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api'
import { Scale, Search, RefreshCw, AlertTriangle, CheckCircle, X } from 'lucide-vue-next'

const ingredients = ref([])
const reconciliationReport = ref([])
const isLoading = ref(true)
const anomalies = ref([])

const showReconcileModal = ref(false)
const selectedIngredient = ref(null)
const reconcileForm = ref({
  actual_stock: 0,
  notes: ''
})

const fetchReport = async () => {
  isLoading.value = true
  try {
    const [reportRes, ingRes] = await Promise.all([
      api.get('/superadmin/reconciliation/report'),
      api.get('/admin/ingredients')
    ])
    reconciliationReport.value = reportRes.data.data.ingredients || []
    anomalies.value = reportRes.data.data.anomalies || []
    ingredients.value = ingRes.data.data.data || []
  } catch (err) {
    console.error('Gagal mengambil data rekonsiliasi:', err)
  } finally {
    isLoading.value = false
  }
}

const openReconcileModal = (ingredient) => {
  selectedIngredient.value = ingredient
  reconcileForm.value = {
    actual_stock: ingredient.system_stock || 0,
    notes: ''
  }
  showReconcileModal.value = true
}

const submitReconciliation = async () => {
  if (!selectedIngredient.value) return

  try {
    const { data } = await api.post('/superadmin/reconciliation', {
      ingredient_id: selectedIngredient.value.ingredient_id,
      actual_stock: parseFloat(reconcileForm.value.actual_stock),
      notes: reconcileForm.value.notes
    })

    if (data.data.is_anomaly) {
      alert(`ANOMALI TERDETEKSI!\n\nSelisih: ${parseFloat(data.data.discrepancy).toFixed(2)} (${data.data.discrepancy_percent}%)\n\nSistem: ${data.data.expected_stock}\nFisik: ${data.data.actual_stock}\n\nTercatat oleh user ID: ${data.data.user_id}`)
    } else {
      alert('Rekonsiliasi berhasil! Selisih dalam batas normal (< 5%)')
    }

    showReconcileModal.value = false
    await fetchReport()
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal melakukan rekonsiliasi')
  }
}

onMounted(() => fetchReport())
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-xl font-extrabold text-white flex items-center gap-2">
          <Scale class="w-5 h-5 text-blue-400" /> Rekonsiliasi Stok (Stock Opname)
        </h1>
        <p class="text-xs text-slate-400">Bandingkan stok sistem dengan stok fisik. Sistem akan otomatis flag selisih > 5% sebagai anomali.</p>
      </div>
      <button
        @click="fetchReport"
        class="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-blue-600/20"
      >
        <RefreshCw class="w-4 h-4" /> Refresh
      </button>
    </div>

    <!-- Anomaly Alert -->
    <div v-if="anomalies.length > 0" class="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-center gap-3 text-xs">
      <AlertTriangle class="w-5 h-5 text-rose-400 animate-pulse shrink-0" />
      <div>
        <span class="font-extrabold text-rose-300">{{ anomalies.length }} ANOMALI TERDETEKSI</span>
        <p class="text-rose-400/80 text-[11px]">Ditemukan selisih stok > 5% pada beberapa bahan baku. Periksa segera!</p>
      </div>
    </div>

    <!-- Reconciliation Table -->
    <div class="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
      <div class="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
        <h3 class="text-xs font-extrabold text-slate-300 uppercase font-mono tracking-wider">Tabel Rekonsiliasi Stok</h3>
        <span class="text-[10px] text-slate-500 font-mono">
          {{ reconciliationReport.length }} Bahan | {{ anomalies.length }} Anomali
        </span>
      </div>

      <div v-if="isLoading" class="p-12 text-center text-slate-500 text-xs font-semibold">Memuat data...</div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead class="bg-slate-900 text-slate-400 border-b border-slate-800">
            <tr>
              <th class="p-4 font-bold">Bahan</th>
              <th class="p-4 font-bold text-right">Stok Sistem</th>
              <th class="p-4 font-bold text-right">Stok Seharusnya</th>
              <th class="p-4 font-bold text-right">Selisih</th>
              <th class="p-4 font-bold text-right">Selisih %</th>
              <th class="p-4 font-bold">Status</th>
              <th class="p-4 font-bold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            <tr v-if="reconciliationReport.length === 0">
              <td colspan="7" class="p-6 text-center text-slate-500">Belum ada bahan baku untuk direkonsiliasi</td>
            </tr>
            <tr
              v-for="item in reconciliationReport"
              :key="item.ingredient_id"
              :class="['hover:bg-slate-900/50 transition-colors', item.is_anomaly ? 'bg-rose-500/5' : '']"
            >
              <td class="p-4">
                <div class="font-bold text-white">{{ item.ingredient_name }}</div>
                <div class="text-[10px] text-slate-500">({{ item.base_unit }})</div>
              </td>
              <td class="p-4 text-right font-mono font-bold text-white">
                {{ parseFloat(item.system_stock).toFixed(2) }}
              </td>
              <td class="p-4 text-right font-mono text-slate-400">
                {{ parseFloat(item.expected_stock).toFixed(2) }}
              </td>
              <td class="p-4 text-right font-mono font-bold" :class="item.discrepancy > 0 ? 'text-emerald-400' : item.discrepancy < 0 ? 'text-rose-400' : 'text-slate-400'">
                {{ item.discrepancy > 0 ? '+' : '' }}{{ parseFloat(item.discrepancy).toFixed(2) }}
              </td>
              <td class="p-4 text-right font-mono" :class="item.is_anomaly ? 'text-rose-400 font-bold' : 'text-slate-400'">
                {{ item.discrepancy_percent }}%
              </td>
              <td class="p-4">
                <span v-if="item.is_anomaly" class="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-rose-500/10 text-rose-400 border border-riose-500/20">
                  <AlertTriangle class="w-3 h-3" /> ANOMALI
                </span>
                <span v-else class="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle class="w-3 h-3" /> Normal
                </span>
              </td>
              <td class="p-4 text-center">
                <button
                  @click="openReconcileModal(item)"
                  class="px-3 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-[10px] font-bold hover:bg-blue-600/30 transition-colors"
                >
                  Opname
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Info Box -->
    <div class="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-xs text-blue-300/80">
      <p class="font-bold text-blue-300 mb-1">Cara Kerja Rekonsiliasi:</p>
      <ul class="space-y-1 ml-4 list-disc">
        <li>Sistem menghitung stok seharusnya berdasarkan: stok awal + masuk - keluar (penjualan & waste)</li>
        <li>Klik "Opname" untuk input stok fisik aktual hasil penghitungan</li>
        <li>Sistem akan hitung selisih dan otomatis flag jika > 5%</li>
        <li>Semua rekonsiliasi tercatat dengan user ID dan timestamp</li>
      </ul>
    </div>

    <!-- MODAL REKONSILIASI -->
    <div v-if="showReconcileModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden">
        <div class="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h3 class="text-base font-extrabold text-white">Rekonsiliasi: {{ selectedIngredient?.ingredient_name }}</h3>
          <button @click="showReconcileModal = false" class="text-slate-400 hover:text-white"><X class="w-5 h-5"/></button>
        </div>
        <div class="p-6 space-y-4 text-xs">
          <div class="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <div class="text-[10px] text-slate-500 uppercase font-bold mb-1">Stok Sistem</div>
                <div class="text-lg font-mono font-bold text-white">{{ parseFloat(selectedIngredient?.system_stock).toFixed(2) }}</div>
              </div>
              <div>
                <div class="text-[10px] text-slate-500 uppercase font-bold mb-1">Unit</div>
                <div class="text-lg font-mono font-bold text-slate-400">{{ selectedIngredient?.base_unit }}</div>
              </div>
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-300 mb-1">Stok Fisik Aktual *</label>
            <input v-model="reconcileForm.actual_stock" type="number" step="0.001" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-amber-400 font-bold text-lg outline-none focus:border-blue-500" />
            <p class="text-[10px] text-slate-500 mt-1">Input hasil hitungan fisik di gudang/dapur</p>
          </div>

          <div>
            <label class="block font-bold text-slate-300 mb-1">Catatan</label>
            <textarea v-model="reconcileForm.notes" rows="2" placeholder="Keterangan opname..." class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500 resize-none"></textarea>
          </div>
        </div>
        <div class="p-4 border-t border-slate-800 bg-slate-900/50 flex gap-2">
          <button @click="showReconcileModal = false" class="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs">Batal</button>
          <button @click="submitReconciliation" class="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs">Simpan Rekonsiliasi</button>
        </div>
      </div>
    </div>
  </div>
</template>
