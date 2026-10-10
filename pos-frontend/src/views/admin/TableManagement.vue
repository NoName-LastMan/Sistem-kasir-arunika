<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api'
import { UtensilsCrossed, Plus, Edit3, Trash2, X, Users } from 'lucide-vue-next'

const tables = ref([])
const isLoading = ref(true)
const showModal = ref(false)
const isEditing = ref(false)
const activeId = ref(null)

const form = ref({
  table_number: '',
  capacity: 4,
  status: 'available'
})

const fetchTables = async () => {
  isLoading.value = true
  try {
    const { data } = await api.get('/admin/tables')
    tables.value = data.data
  } catch (err) {
    alert('Gagal mengambil data meja')
  } finally {
    isLoading.value = false
  }
}

const openCreate = () => {
  isEditing.value = false
  activeId.value = null
  form.value = { table_number: `Meja 0${tables.value.length + 1}`, capacity: 4, status: 'available' }
  showModal.value = true
}

const openEdit = (t) => {
  isEditing.value = true
  activeId.value = t.id
  form.value = { table_number: t.table_number, capacity: t.capacity, status: t.status }
  showModal.value = true
}

const save = async () => {
  if (!form.value.table_number) return
  try {
    if (isEditing.value) {
      await api.put(`/admin/tables/${activeId.value}`, form.value)
    } else {
      await api.post('/admin/tables', form.value)
    }
    showModal.value = false
    await fetchTables()
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menyimpan meja')
  }
}

const destroy = async (t) => {
  if (!confirm(`Hapus meja "${t.table_number}"?`)) return
  try {
    await api.delete(`/admin/tables/${t.id}`)
    await fetchTables()
  } catch (err) {
    alert('Gagal menghapus meja')
  }
}

onMounted(() => {
  fetchTables()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-extrabold text-white flex items-center gap-2">
          <UtensilsCrossed class="w-5 h-5 text-amber-400" /> Meja Restoran (Floor Plan)
        </h1>
        <p class="text-xs text-slate-400">Pengelolaan nomor meja dine-in dan kapasitas tempat duduk</p>
      </div>
      <button @click="openCreate" class="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-amber-600/20">
        <Plus class="w-4 h-4" /> Tambah Meja Baru
      </button>
    </div>

    <div v-if="isLoading" class="p-12 text-center text-slate-500 text-xs font-semibold">Memuat daftar meja...</div>

    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div
        v-for="t in tables"
        :key="t.id"
        class="bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col justify-between items-center text-center shadow-xl hover:border-amber-500/50 transition-all relative group"
      >
        <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button @click="openEdit(t)" class="text-slate-400 hover:text-amber-400 p-1"><Edit3 class="w-3.5 h-3.5"/></button>
          <button @click="destroy(t)" class="text-slate-400 hover:text-rose-400 p-1"><Trash2 class="w-3.5 h-3.5"/></button>
        </div>

        <div class="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 font-black text-base flex items-center justify-center border border-amber-500/20 mb-2 mt-2">
          {{ t.table_number.replace('Meja ', '') }}
        </div>

        <div class="font-bold text-white text-sm leading-tight mb-1">{{ t.table_number }}</div>

        <div class="text-[11px] text-slate-400 flex items-center gap-1 font-mono mb-3">
          <Users class="w-3.5 h-3.5" /> {{ t.capacity }} Kursi
        </div>

        <span :class="['w-full py-1 rounded-lg text-[10px] font-bold border uppercase font-mono', t.status === 'available' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20']">
          {{ t.status }}
        </span>
      </div>
    </div>

    <!-- MODAL TABLE -->
    <div v-if="showModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden">
        <div class="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h3 class="text-base font-extrabold text-white">{{ isEditing ? 'Edit Meja' : 'Tambah Meja' }}</h3>
          <button @click="showModal = false" class="text-slate-400 hover:text-white"><X class="w-5 h-5"/></button>
        </div>
        <div class="p-6 space-y-4 text-xs">
          <div>
            <label class="block font-bold text-slate-300 mb-1">Nomor / Nama Meja</label>
            <input v-model="form.table_number" type="text" placeholder="Contoh: Meja 01" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" />
          </div>
          <div>
            <label class="block font-bold text-slate-300 mb-1">Kapasitas Kursi</label>
            <input v-model="form.capacity" type="number" min="1" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500 font-mono" />
          </div>
          <div>
            <label class="block font-bold text-slate-300 mb-1">Status Meja</label>
            <select v-model="form.status" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500">
              <option value="available">Tersedia (Available)</option>
              <option value="occupied">Terisi (Occupied)</option>
              <option value="reserved">Dipesan (Reserved)</option>
            </select>
          </div>
        </div>
        <div class="p-4 border-t border-slate-800 bg-slate-900/50 flex gap-2">
          <button @click="showModal = false" class="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs">Batal</button>
          <button @click="save" class="flex-1 py-2.5 bg-amber-600 text-white font-bold rounded-xl text-xs">Simpan Meja</button>
        </div>
      </div>
    </div>
  </div>
</template>
