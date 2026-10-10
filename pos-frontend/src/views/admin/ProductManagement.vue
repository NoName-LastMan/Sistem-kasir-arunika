<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../../api'
import {
  Package, Plus, Search, Edit3, Trash2, X, Barcode, DollarSign, Layers
} from 'lucide-vue-next'

const products = ref([])
const categories = ref([])
const modifierGroups = ref([])
const searchQuery = ref('')
const selectedCategoryId = ref('')
const isLoading = ref(true)

// Modal State
const showProductModal = ref(false)
const isEditing = ref(false)
const activeProductId = ref(null)

const productForm = ref({
  category_id: '',
  name: '',
  sku: '',
  description: '',
  price: 0,
  cost_price: 0,
  stock: 0,
  track_stock: true,
  is_active: true,
  modifier_group_ids: []
})

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0)

const fetchData = async () => {
  isLoading.value = true
  try {
    const [prodRes, catRes, modRes] = await Promise.all([
      api.get('/admin/products'),
      api.get('/admin/categories'),
      api.get('/admin/modifier-groups')
    ])
    products.value = prodRes.data.data
    categories.value = catRes.data.data
    modifierGroups.value = modRes.data.data
  } catch (err) {
    alert('Gagal mengambil data produk master')
  } finally {
    isLoading.value = false
  }
}

const filteredProducts = computed(() => {
  return products.value.filter(p => {
    const matchCat = !selectedCategoryId.value || p.category_id == selectedCategoryId.value
    const matchSearch = !searchQuery.value ||
      p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.value.toLowerCase()))
    return matchCat && matchSearch
  })
})

const openCreateModal = () => {
  isEditing.value = false
  activeProductId.value = null
  productForm.value = {
    category_id: categories.value[0]?.id || '',
    name: '',
    sku: 'SKU-' + Math.floor(1000 + Math.random() * 9000),
    description: '',
    price: 0,
    cost_price: 0,
    stock: 0,
    track_stock: true,
    is_active: true,
    modifier_group_ids: []
  }
  showProductModal.value = true
}

const openEditModal = (prod) => {
  isEditing.value = true
  activeProductId.value = prod.id
  productForm.value = {
    category_id: prod.category_id,
    name: prod.name,
    sku: prod.sku || '',
    description: prod.description || '',
    price: Number(prod.price),
    cost_price: Number(prod.cost_price),
    stock: Number(prod.stock),
    track_stock: Boolean(prod.track_stock),
    is_active: Boolean(prod.is_active),
    modifier_group_ids: prod.modifier_groups ? prod.modifier_groups.map(g => g.id) : []
  }
  showProductModal.value = true
}

const saveProduct = async () => {
  if (!productForm.value.name || !productForm.value.category_id) {
    alert('Nama produk dan kategori wajib diisi!')
    return
  }
  try {
    if (isEditing.value) {
      await api.put(`/admin/products/${activeProductId.value}`, productForm.value)
    } else {
      await api.post('/admin/products', productForm.value)
    }
    showProductModal.value = false
    await fetchData()
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menyimpan produk')
  }
}

const deleteProduct = async (prod) => {
  if (!confirm(`Yakin ingin menghapus produk "${prod.name}"?`)) return
  try {
    await api.delete(`/admin/products/${prod.id}`)
    await fetchData()
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menghapus produk')
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header Page -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-xl font-extrabold text-white flex items-center gap-2">
          <Package class="w-5 h-5 text-indigo-400" /> Master Produk & Harga Modal (HPP)
        </h1>
        <p class="text-xs text-slate-400">Kelola daftar menu, SKU/Barcode, HPP, stok, dan grup varian</p>
      </div>

      <button
        @click="openCreateModal"
        class="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-indigo-600/20 border border-indigo-400/30 transition-all"
      >
        <Plus class="w-4 h-4" /> Tambah Produk Baru
      </button>
    </div>

    <!-- Filters Bar -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="relative flex-1 max-w-xs">
        <Search class="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari nama produk atau SKU..."
          class="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <select
        v-model="selectedCategoryId"
        class="p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
      >
        <option value="">Semua Kategori</option>
        <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
    </div>

    <!-- Master Products Table -->
    <div class="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
      <div v-if="isLoading" class="p-12 text-center text-slate-500 text-xs font-semibold">
        Memuat master produk...
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead class="bg-slate-900 text-slate-400 border-b border-slate-800">
            <tr>
              <th class="p-4 font-bold">Produk</th>
              <th class="p-4 font-bold">SKU / Barcode</th>
              <th class="p-4 font-bold">Kategori</th>
              <th class="p-4 font-bold text-right">Harga Jual</th>
              <th class="p-4 font-bold text-right">HPP (Modal)</th>
              <th class="p-4 font-bold text-right">Stok</th>
              <th class="p-4 font-bold">Status</th>
              <th class="p-4 font-bold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            <tr v-if="filteredProducts.length === 0">
              <td colspan="8" class="p-6 text-center text-slate-500">Tidak ada produk yang cocok</td>
            </tr>
            <tr v-for="prod in filteredProducts" :key="prod.id" class="hover:bg-slate-900/50 transition-colors">
              <td class="p-4 font-bold text-white">
                <div>{{ prod.name }}</div>
                <div v-if="prod.modifier_groups && prod.modifier_groups.length > 0" class="text-[10px] text-indigo-400 font-normal">
                  + {{ prod.modifier_groups.map(g => g.name).join(', ') }}
                </div>
              </td>
              <td class="p-4 font-mono text-slate-400 text-[11px]">{{ prod.sku || '-' }}</td>
              <td class="p-4 text-slate-300">{{ prod.category?.name || '-' }}</td>
              <td class="p-4 text-right font-mono font-bold text-emerald-400">{{ formatRupiah(prod.price) }}</td>
              <td class="p-4 text-right font-mono text-slate-400">{{ formatRupiah(prod.cost_price) }}</td>
              <td class="p-4 text-right font-mono font-bold" :class="prod.stock <= 10 ? 'text-amber-400' : 'text-slate-200'">
                {{ prod.track_stock ? prod.stock : 'Un-tracked' }}
              </td>
              <td class="p-4">
                <span :class="['px-2 py-0.5 rounded-md text-[10px] font-bold border', prod.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20']">
                  {{ prod.is_active ? 'Aktif' : 'Nonaktif' }}
                </span>
              </td>
              <td class="p-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button @click="openEditModal(prod)" class="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg" title="Edit Produk">
                    <Edit3 class="w-4 h-4" />
                  </button>
                  <button @click="deleteProduct(prod)" class="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg" title="Hapus Produk">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL CREATE/EDIT PRODUCT -->
    <div v-if="showProductModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        <div class="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h3 class="text-base font-extrabold text-white">{{ isEditing ? 'Edit Master Produk' : 'Tambah Master Produk Baru' }}</h3>
          <button @click="showProductModal = false" class="text-slate-400 hover:text-white"><X class="w-5 h-5"/></button>
        </div>
        <div class="p-6 space-y-4 text-xs overflow-y-auto flex-1">
          <div>
            <label class="block font-bold text-slate-300 mb-1">Kategori Menu *</label>
            <select v-model="productForm.category_id" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500">
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>

          <div>
            <label class="block font-bold text-slate-300 mb-1">Nama Produk *</label>
            <input v-model="productForm.name" type="text" placeholder="Contoh: Kopi Susu Aren" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-300 mb-1">SKU / Barcode</label>
              <input v-model="productForm.sku" type="text" placeholder="SKU-1234" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 font-mono" />
            </div>
            <div>
              <label class="block font-bold text-slate-300 mb-1">Jumlah Stok Awal</label>
              <input v-model="productForm.stock" type="number" min="0" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 font-mono" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-300 mb-1">Harga Jual (Rp) *</label>
              <input v-model="productForm.price" type="number" min="0" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-emerald-400 font-bold outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label class="block font-bold text-slate-300 mb-1">Harga Modal / HPP (Rp)</label>
              <input v-model="productForm.cost_price" type="number" min="0" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-slate-300 font-bold outline-none focus:border-indigo-500" />
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-300 mb-2">Kelompok Modifier / Topping Yang Dihubungkan</label>
            <div class="space-y-1.5 max-h-32 overflow-y-auto p-2 bg-slate-900 rounded-xl border border-slate-800">
              <label v-for="g in modifierGroups" :key="g.id" class="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-slate-800 rounded">
                <input type="checkbox" :value="g.id" v-model="productForm.modifier_group_ids" class="w-4 h-4 accent-indigo-600" />
                <span class="font-medium text-slate-200">{{ g.name }}</span>
              </label>
            </div>
          </div>

          <div class="flex items-center justify-between pt-2">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="productForm.track_stock" class="w-4 h-4 accent-indigo-600" />
              <span class="font-bold text-slate-300">Track Stok Produk</span>
            </label>

            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="productForm.is_active" class="w-4 h-4 accent-indigo-600" />
              <span class="font-bold text-slate-300">Status Aktif</span>
            </label>
          </div>
        </div>

        <div class="p-4 border-t border-slate-800 bg-slate-900/50 flex gap-2">
          <button @click="showProductModal = false" class="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs">Batal</button>
          <button @click="saveProduct" class="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs">Simpan Produk</button>
        </div>
      </div>
    </div>

  </div>
</template>
