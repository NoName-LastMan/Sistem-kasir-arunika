<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api'
import { Tag, Plus, Edit3, Trash2, X } from 'lucide-vue-next'

const categories = ref([])
const isLoading = ref(true)
const showModal = ref(false)
const isEditing = ref(false)
const activeId = ref(null)

const form = ref({
  name: '',
  is_active: true
})

const fetchCategories = async () => {
  isLoading.value = true
  try {
    const { data } = await api.get('/admin/categories')
    categories.value = data.data
  } catch (err) {
    alert('Gagal mengambil data kategori')
  } finally {
    isLoading.value = false
  }
}

const openCreate = () => {
  isEditing.value = false
  activeId.value = null
  form.value = { name: '', is_active: true }
  showModal.value = true
}

const openEdit = (cat) => {
  isEditing.value = true
  activeId.value = cat.id
  form.value = { name: cat.name, is_active: Boolean(cat.is_active) }
  showModal.value = true
}

const save = async () => {
  if (!form.value.name) return
  try {
    if (isEditing.value) {
      await api.put(`/admin/categories/${activeId.value}`, form.value)
    } else {
      await api.post('/admin/categories', form.value)
    }
    showModal.value = false
    await fetchCategories()
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menyimpan kategori')
  }
}

const destroy = async (cat) => {
  if (!confirm(`Yakin ingin menghapus kategori "${cat.name}"? Produk terkait juga akan terhapus.`)) return
  try {
    await api.delete(`/admin/categories/${cat.id}`)
    await fetchCategories()
  } catch (err) {
    alert('Gagal menghapus kategori')
  }
}

onMounted(() => {
  fetchCategories()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-extrabold text-white flex items-center gap-2">
          <Tag class="w-5 h-5 text-emerald-400" /> Kategori Menu
        </h1>
        <p class="text-xs text-slate-400">Pengelompokan jenis makanan dan minuman</p>
      </div>
      <button @click="openCreate" class="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-600/20">
        <Plus class="w-4 h-4" /> Tambah Kategori
      </button>
    </div>

    <div class="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
      <div v-if="isLoading" class="p-12 text-center text-slate-500 text-xs font-semibold">Memuat kategori...</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead class="bg-slate-900 text-slate-400 border-b border-slate-800">
            <tr>
              <th class="p-4 font-bold">Nama Kategori</th>
              <th class="p-4 font-bold">Slug URL</th>
              <th class="p-4 font-bold">Jumlah Produk</th>
              <th class="p-4 font-bold">Status</th>
              <th class="p-4 font-bold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            <tr v-for="cat in categories" :key="cat.id" class="hover:bg-slate-900/50 transition-colors">
              <td class="p-4 font-bold text-white">{{ cat.name }}</td>
              <td class="p-4 text-slate-400 font-mono">{{ cat.slug }}</td>
              <td class="p-4 text-slate-300 font-bold font-mono">{{ cat.products_count || 0 }} produk</td>
              <td class="p-4">
                <span :class="['px-2 py-0.5 rounded-md text-[10px] font-bold border', cat.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20']">
                  {{ cat.is_active ? 'Aktif' : 'Nonaktif' }}
                </span>
              </td>
              <td class="p-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button @click="openEdit(cat)" class="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg"><Edit3 class="w-4 h-4"/></button>
                  <button @click="destroy(cat)" class="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg"><Trash2 class="w-4 h-4"/></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL CATEGORY -->
    <div v-if="showModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden">
        <div class="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h3 class="text-base font-extrabold text-white">{{ isEditing ? 'Edit Kategori' : 'Tambah Kategori' }}</h3>
          <button @click="showModal = false" class="text-slate-400 hover:text-white"><X class="w-5 h-5"/></button>
        </div>
        <div class="p-6 space-y-4 text-xs">
          <div>
            <label class="block font-bold text-slate-300 mb-1">Nama Kategori</label>
            <input v-model="form.name" type="text" placeholder="Contoh: Minuman Dingin" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500" />
          </div>
          <div class="flex items-center gap-2">
            <input type="checkbox" v-model="form.is_active" id="cat_active" class="w-4 h-4 accent-emerald-600" />
            <label for="cat_active" class="font-bold text-slate-300 cursor-pointer">Status Aktif</label>
          </div>
        </div>
        <div class="p-4 border-t border-slate-800 bg-slate-900/50 flex gap-2">
          <button @click="showModal = false" class="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs">Batal</button>
          <button @click="save" class="flex-1 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs">Simpan</button>
        </div>
      </div>
    </div>
  </div>
</template>
