<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api'
import { Wheat, Plus, Search, Edit, Trash2, X, AlertTriangle, FileText } from 'lucide-vue-next'

const ingredients = ref([])
const lowStockIngredients = ref([])
const isLoading = ref(true)
const searchQuery = ref('')
const showLowStockOnly = ref(false)

const showFormModal = ref(false)
const editingIngredient = ref(null)
const form = ref({
  name: '',
  base_unit: 'kg',
  stock_quantity: 0,
  min_stock_alert: 0,
  cost_per_unit: 0,
  supplier_info: '',
  track_stock: true
})

const showMutationsModal = ref(false)
const mutationsList = ref([])
const mutationsIngredientName = ref('')

const fetchIngredients = async () => {
  isLoading.value = true
  try {
    const params = {}
    if (searchQuery.value) params.search = searchQuery.value
    if (showLowStockOnly.value) params.low_stock = true

    const [ingredientsRes, lowRes] = await Promise.all([
      api.get('/admin/ingredients', { params }),
      api.get('/admin/ingredients/low-stock')
    ])
    ingredients.value = ingredientsRes.data.data.data || []
    lowStockIngredients.value = lowRes.data.data || []
  } catch (err) {
    console.error('Gagal mengambil data bahan baku:', err)
  } finally {
    isLoading.value = false
  }
}

const openCreateModal = () => {
  editingIngredient.value = null
  form.value = {
    name: '',
    base_unit: 'kg',
    stock_quantity: 0,
    min_stock_alert: 0,
    cost_per_unit: 0,
    supplier_info: '',
    track_stock: true
  }
  showFormModal.value = true
}

const openEditModal = (ingredient) => {
  editingIngredient.value = ingredient
  form.value = {
    name: ingredient.name,
    base_unit: ingredient.base_unit,
    stock_quantity: ingredient.stock_quantity,
    min_stock_alert: ingredient.min_stock_alert,
    cost_per_unit: ingredient.cost_per_unit,
    supplier_info: ingredient.supplier_info || '',
    track_stock: ingredient.track_stock
  }
  showFormModal.value = true
}

const submitForm = async () => {
  try {
    if (editingIngredient.value) {
      await api.put(`/admin/ingredients/${editingIngredient.value.id}`, form.value)
      alert('Bahan baku berhasil diperbarui!')
    } else {
      await api.post('/admin/ingredients', form.value)
      alert('Bahan baku berhasil ditambahkan!')
    }
    showFormModal.value = false
    await fetchIngredients()
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menyimpan bahan baku')
  }
}

const deleteIngredient = async (ingredient) => {
  if (!confirm(`Hapus bahan baku "${ingredient.name}"?`)) return
  try {
    await api.delete(`/admin/ingredients/${ingredient.id}`)
    await fetchIngredients()
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menghapus bahan baku')
  }
}

const showMutations = async (ingredient) => {
  mutationsIngredientName.value = ingredient.name
  try {
    const { data } = await api.get(`/admin/ingredients/${ingredient.id}/mutations`)
    mutationsList.value = data.data.data || []
    showMutationsModal.value = true
  } catch (err) {
    alert('Gagal mengambil riwayat mutasi')
  }
}

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0)

onMounted(() => fetchIngredients())
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-xl font-extrabold text-white flex items-center gap-2">
          <Wheat class="w-5 h-5 text-amber-400" /> Manajemen Bahan Baku
        </h1>
        <p class="text-xs text-slate-400">Kelola stok bahan baku, harga beli, dan level minimum alert</p>
      </div>

      <div class="flex items-center gap-2">
        <!-- Filter Toggle -->
        <button
          @click="showLowStockOnly = !showLowStockOnly; fetchIngredients()"
          :class="[
            'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border',
            showLowStockOnly
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-amber-500/30'
          ]"
        >
          <AlertTriangle class="w-4 h-4" />
          <span v-if="lowStockIngredients.length > 0" class="bg-amber-500 text-slate-900 px-1.5 rounded text-[10px] font-black">{{ lowStockIngredients.length }}</span>
          Stok Menipis
        </button>

        <button
          @click="openCreateModal"
          class="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-amber-600/20"
        >
          <Plus class="w-4 h-4" /> Tambah Bahan
        </button>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="relative">
      <Search class="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        v-model="searchQuery"
        @input="fetchIngredients"
        type="text"
        placeholder="Cari bahan baku..."
        class="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white outline-none focus:border-amber-500 transition-colors"
      />
    </div>

    <!-- Low Stock Alert -->
    <div v-if="lowStockIngredients.length > 0 && !showLowStockOnly" class="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between text-xs">
      <div class="flex items-center gap-3">
        <AlertTriangle class="w-5 h-5 text-amber-400 animate-pulse shrink-0" />
        <div>
          <span class="font-extrabold text-amber-300">{{ lowStockIngredients.length }} Bahan Baku Stok Menipis</span>
          <p class="text-amber-400/80 text-[11px]">Klik tombol "Stok Menipis" untuk filter atau segera lakukan restock.</p>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
      <div v-if="isLoading" class="p-12 text-center text-slate-500 text-xs font-semibold">Memuat data bahan baku...</div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead class="bg-slate-900 text-slate-400 border-b border-slate-800">
            <tr>
              <th class="p-4 font-bold">Nama Bahan</th>
              <th class="p-4 font-bold text-right">Stok Saat Ini</th>
              <th class="p-4 font-bold">Unit</th>
              <th class="p-4 font-bold text-right">Min. Alert</th>
              <th class="p-4 font-bold text-right">Harga/unit</th>
              <th class="p-4 font-bold">Status</th>
              <th class="p-4 font-bold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            <tr v-if="ingredients.length === 0">
              <td colspan="7" class="p-6 text-center text-slate-500">Belum ada bahan baku</td>
            </tr>
            <tr v-for="item in ingredients" :key="item.id" class="hover:bg-slate-900/50 transition-colors">
              <td class="p-4">
                <div class="font-bold text-white">{{ item.name }}</div>
                <div v-if="item.supplier_info" class="text-[10px] text-slate-500 truncate max-w-[200px]">{{ item.supplier_info }}</div>
              </td>
              <td class="p-4 text-right">
                <span :class="[
                  'font-mono font-bold',
                  item.track_stock && parseFloat(item.stock_quantity) <= parseFloat(item.min_stock_alert)
                    ? 'text-amber-400' : 'text-white'
                ]">
                  {{ parseFloat(item.stock_quantity).toFixed(2) }}
                </span>
              </td>
              <td class="p-4 font-mono text-slate-400">{{ item.base_unit }}</td>
              <td class="p-4 text-right font-mono text-slate-500">{{ parseFloat(item.min_stock_alert).toFixed(2) }}</td>
              <td class="p-4 text-right font-mono text-emerald-400">{{ formatRupiah(item.cost_per_unit) }}</td>
              <td class="p-4">
                <span v-if="item.track_stock" class="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">Dipantau</span>
                <span v-else class="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-slate-700/50 text-slate-500 border border-slate-700">Non-Aktif</span>
              </td>
              <td class="p-4">
                <div class="flex items-center justify-center gap-1">
                  <button @click="showMutations(item)" class="p-1.5 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-slate-800 transition-colors" title="Riwayat Mutasi">
                    <FileText class="w-4 h-4" />
                  </button>
                  <button @click="openEditModal(item)" class="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors" title="Edit">
                    <Edit class="w-4 h-4" />
                  </button>
                  <button @click="deleteIngredient(item)" class="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors" title="Hapus">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL FORM BAHAN BAKU -->
    <div v-if="showFormModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden">
        <div class="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h3 class="text-base font-extrabold text-white">{{ editingIngredient ? 'Edit Bahan Baku' : 'Tambah Bahan Baku' }}</h3>
          <button @click="showFormModal = false" class="text-slate-400 hover:text-white"><X class="w-5 h-5"/></button>
        </div>
        <div class="p-6 space-y-4 text-xs">
          <div>
            <label class="block font-bold text-slate-300 mb-1">Nama Bahan *</label>
            <input v-model="form.name" type="text" placeholder="Contoh: Beras, Telur, Minyak Goreng" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-300 mb-1">Unit Penyimpanan *</label>
              <select v-model="form.base_unit" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500">
                <option value="kg">Kilogram (kg)</option>
                <option value="liter">Liter</option>
                <option value="pcs">Pieces (pcs)</option>
                <option value="butir">Butir</option>
                <option value="bungkus">Bungkus</option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-slate-300 mb-1">Stok Awal</label>
              <input v-model="form.stock_quantity" type="number" step="0.001" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-amber-400 font-bold outline-none focus:border-amber-500" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-300 mb-1">Minimum Alert</label>
              <input v-model="form.min_stock_alert" type="number" step="0.001" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-white outline-none focus:border-amber-500" />
            </div>
            <div>
              <label class="block font-bold text-slate-300 mb-1">Harga per Unit (Rp)</label>
              <input v-model="form.cost_per_unit" type="number" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-emerald-400 font-bold outline-none focus:border-amber-500" />
            </div>
          </div>
          <div>
            <label class="block font-bold text-slate-300 mb-1">Info Supplier</label>
            <input v-model="form.supplier_info" type="text" placeholder="Nama supplier / catatan" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" />
          </div>
          <div class="flex items-center gap-3">
            <input v-model="form.track_stock" type="checkbox" id="track_stock" class="w-4 h-4 accent-amber-500" />
            <label for="track_stock" class="font-bold text-slate-300">Pantau stok bahan ini</label>
          </div>
        </div>
        <div class="p-4 border-t border-slate-800 bg-slate-900/50 flex gap-2">
          <button @click="showFormModal = false" class="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs">Batal</button>
          <button @click="submitForm" class="flex-1 py-2.5 bg-amber-600 text-white font-bold rounded-xl text-xs">Simpan</button>
        </div>
      </div>
    </div>

    <!-- MODAL RIWAYAT MUTASI -->
    <div v-if="showMutationsModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden max-h-[80vh] flex flex-col">
        <div class="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 shrink-0">
          <h3 class="text-base font-extrabold text-white">Riwayat Mutasi: {{ mutationsIngredientName }}</h3>
          <button @click="showMutationsModal = false" class="text-slate-400 hover:text-white"><X class="w-5 h-5"/></button>
        </div>
        <div class="overflow-y-auto flex-1">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-900 text-slate-400 border-b border-slate-800 sticky top-0">
              <tr>
                <th class="p-3 font-bold">Waktu</th>
                <th class="p-3 font-bold">Tipe</th>
                <th class="p-3 font-bold text-right">Sebelum</th>
                <th class="p-3 font-bold text-right">Mutasi</th>
                <th class="p-3 font-bold text-right">Setelah</th>
                <th class="p-3 font-bold">Oleh / Catatan</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60">
              <tr v-if="mutationsList.length === 0">
                <td colspan="6" class="p-6 text-center text-slate-500">Belum ada mutasi</td>
              </tr>
              <tr v-for="m in mutationsList" :key="m.id" class="hover:bg-slate-900/50">
                <td class="p-3 font-mono text-slate-400 text-[11px]">{{ new Date(m.created_at).toLocaleString('id-ID') }}</td>
                <td class="p-3">
                  <span :class="[
                    'px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono border',
                    m.type === 'in' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    m.type === 'out' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  ]">
                    {{ m.type === 'in' ? 'Masuk' : m.type === 'out' ? 'Keluar' : 'Opname' }}
                  </span>
                </td>
                <td class="p-3 text-right font-mono text-slate-400">{{ parseFloat(m.stock_before).toFixed(2) }}</td>
                <td class="p-3 text-right font-mono font-bold" :class="m.quantity > 0 ? 'text-emerald-400' : 'text-rose-400'">
                  {{ m.quantity > 0 ? `+${parseFloat(m.quantity).toFixed(2)}` : parseFloat(m.quantity).toFixed(2) }}
                </td>
                <td class="p-3 text-right font-mono font-bold text-white">{{ parseFloat(m.stock_after).toFixed(2) }}</td>
                <td class="p-3 text-slate-300">
                  <div>{{ m.user?.name || 'Admin' }}</div>
                  <div v-if="m.reference_note" class="text-[10px] text-slate-500 italic">{{ m.reference_note }}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
