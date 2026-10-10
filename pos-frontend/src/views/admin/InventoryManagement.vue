<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api'
import { Boxes, Plus, Search, AlertTriangle, FileText, X } from 'lucide-vue-next'

const products = ref([])
const logs = ref([])
const lowStockProducts = ref([])
const isLoading = ref(true)

const showAdjustModal = ref(false)
const adjustForm = ref({
  product_id: '',
  type: 'in', // 'in' | 'out' | 'opname'
  quantity: 0,
  reference_note: ''
})

const fetchInventoryData = async () => {
  isLoading.value = true
  try {
    const [prodRes, logRes, lowRes] = await Promise.all([
      api.get('/admin/products'),
      api.get('/admin/inventory/logs'),
      api.get('/admin/inventory/low-stock')
    ])
    products.value = prodRes.data.data
    logs.value = logRes.data.data.data || []
    lowStockProducts.value = lowRes.data.data || []
  } catch (err) {
    console.error('Gagal mengambil data inventaris:', err)
  } finally {
    isLoading.value = false
  }
}

const openAdjustModal = () => {
  adjustForm.value = {
    product_id: products.value[0]?.id || '',
    type: 'in',
    quantity: 10,
    reference_note: ''
  }
  showAdjustModal.value = true
}

const submitAdjustment = async () => {
  if (!adjustForm.value.product_id || adjustForm.value.quantity === null) {
    alert('Pilih produk dan masukkan jumlah penyesuaian!')
    return
  }
  try {
    await api.post('/admin/inventory/adjust', adjustForm.value)
    showAdjustModal.value = false
    await fetchInventoryData()
    alert('Penyesuaian stok berhasil disimpan!')
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menyesuaikan stok')
  }
}

onMounted(() => {
  fetchInventoryData()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-extrabold text-white flex items-center gap-2">
          <Boxes class="w-5 h-5 text-amber-400" /> Inventaris & Mutasi Stok
        </h1>
        <p class="text-xs text-slate-400">Stock Opname, Restock (Stock In), Pengurangan (Stock Out), dan Audit Log</p>
      </div>

      <button
        @click="openAdjustModal"
        class="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-amber-600/20"
      >
        <Plus class="w-4 h-4" /> Form Penyesuaian Stok
      </button>
    </div>

    <!-- Warning Widget Jika Stok Menipis -->
    <div v-if="lowStockProducts.length > 0" class="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between text-xs">
      <div class="flex items-center gap-3">
        <AlertTriangle class="w-5 h-5 text-amber-400 animate-pulse shrink-0" />
        <div>
          <span class="font-extrabold text-amber-300">Peringatan: {{ lowStockProducts.length }} Produk Memiliki Stok Menipis (&le; 10 porsi)</span>
          <p class="text-amber-400/80 text-[11px]">Segera lakukan restock bahan atau penyesuaian stok agar transaksi kasir tidak terhambat.</p>
        </div>
      </div>
    </div>

    <!-- Riwayat Mutasi Stok Table -->
    <div class="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
      <div class="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <h3 class="text-xs font-extrabold text-slate-300 uppercase font-mono tracking-wider">Log Riwayat Mutasi Stok</h3>
      </div>

      <div v-if="isLoading" class="p-12 text-center text-slate-500 text-xs font-semibold">Memuat log mutasi stok...</div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead class="bg-slate-900 text-slate-400 border-b border-slate-800">
            <tr>
              <th class="p-4 font-bold">Waktu</th>
              <th class="p-4 font-bold">Produk</th>
              <th class="p-4 font-bold">Jenis Mutasi</th>
              <th class="p-4 font-bold text-right">Sebelum</th>
              <th class="p-4 font-bold text-right">Mutasi (Qty)</th>
              <th class="p-4 font-bold text-right">Setelah</th>
              <th class="p-4 font-bold">Petugas / Catatan</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            <tr v-if="logs.length === 0">
              <td colspan="7" class="p-6 text-center text-slate-500">Belum ada riwayat mutasi stok</td>
            </tr>
            <tr v-for="log in logs" :key="log.id" class="hover:bg-slate-900/50 transition-colors">
              <td class="p-4 font-mono text-slate-400 text-[11px]">{{ new Date(log.created_at).toLocaleString('id-ID') }}</td>
              <td class="p-4 font-bold text-white">{{ log.product?.name }}</td>
              <td class="p-4">
                <span
                  :class="[
                    'px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono border',
                    log.type === 'in' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    log.type === 'out' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  ]"
                >
                  {{ log.type === 'in' ? 'Stock In' : log.type === 'out' ? 'Stock Out' : 'Opname' }}
                </span>
              </td>
              <td class="p-4 text-right font-mono text-slate-400">{{ log.stock_before }}</td>
              <td class="p-4 text-right font-mono font-bold" :class="log.quantity > 0 ? 'text-emerald-400' : 'text-rose-400'">
                {{ log.quantity > 0 ? `+${log.quantity}` : log.quantity }}
              </td>
              <td class="p-4 text-right font-mono font-bold text-white">{{ log.stock_after }}</td>
              <td class="p-4 text-slate-300">
                <div>{{ log.user?.name || 'Admin' }}</div>
                <div v-if="log.reference_note" class="text-[10px] text-slate-500 italic">{{ log.reference_note }}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL PENYESUAIAN STOK -->
    <div v-if="showAdjustModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden">
        <div class="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h3 class="text-base font-extrabold text-white">Form Penyesuaian Stok</h3>
          <button @click="showAdjustModal = false" class="text-slate-400 hover:text-white"><X class="w-5 h-5"/></button>
        </div>
        <div class="p-6 space-y-4 text-xs">
          <div>
            <label class="block font-bold text-slate-300 mb-1">Pilih Produk *</label>
            <select v-model="adjustForm.product_id" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500">
              <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }} (Stok Saat Ini: {{ p.stock }})</option>
            </select>
          </div>

          <div>
            <label class="block font-bold text-slate-300 mb-1">Jenis Penyesuaian *</label>
            <select v-model="adjustForm.type" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500 font-bold">
              <option value="in">Stock In (Penambahan Stok / Restock)</option>
              <option value="out">Stock Out (Pengurangan / Rusak / Expired)</option>
              <option value="opname">Stock Opname (Set Stok Akhir Baru)</option>
            </select>
          </div>

          <div>
            <label class="block font-bold text-slate-300 mb-1">
              {{ adjustForm.type === 'opname' ? 'Jumlah Stok Akhir Baru' : 'Jumlah Mutasi (Qty)' }}
            </label>
            <input v-model="adjustForm.quantity" type="number" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-amber-400 font-bold outline-none focus:border-amber-500" />
          </div>

          <div>
            <label class="block font-bold text-slate-300 mb-1">Catatan / Alasan Mutasi</label>
            <input v-model="adjustForm.reference_note" type="text" placeholder="Contoh: Restock dari supplier / Kemasan rusak" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" />
          </div>
        </div>
        <div class="p-4 border-t border-slate-800 bg-slate-900/50 flex gap-2">
          <button @click="showAdjustModal = false" class="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs">Batal</button>
          <button @click="submitAdjustment" class="flex-1 py-2.5 bg-amber-600 text-white font-bold rounded-xl text-xs">Simpan Mutasi</button>
        </div>
      </div>
    </div>
  </div>
</template>
