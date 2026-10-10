<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api'
import { Layers, Plus, Edit3, Trash2, X } from 'lucide-vue-next'

const modifierGroups = ref([])
const isLoading = ref(true)

const showGroupModal = ref(false)
const showItemModal = ref(false)
const isEditingGroup = ref(false)
const activeGroupId = ref(null)

const groupForm = ref({
  name: '',
  is_required: false,
  min_selection: 0,
  max_selection: 1
})

const itemForm = ref({
  modifier_group_id: null,
  name: '',
  price: 0
})

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0)

const fetchModifierGroups = async () => {
  isLoading.value = true
  try {
    const { data } = await api.get('/admin/modifier-groups')
    modifierGroups.value = data.data
  } catch (err) {
    alert('Gagal mengambil data modifier')
  } finally {
    isLoading.value = false
  }
}

const openCreateGroup = () => {
  isEditingGroup.value = false
  activeGroupId.value = null
  groupForm.value = { name: '', is_required: false, min_selection: 0, max_selection: 1 }
  showGroupModal.value = true
}

const saveGroup = async () => {
  if (!groupForm.value.name) return
  try {
    if (isEditingGroup.value) {
      await api.put(`/admin/modifier-groups/${activeGroupId.value}`, groupForm.value)
    } else {
      await api.post('/admin/modifier-groups', groupForm.value)
    }
    showGroupModal.value = false
    await fetchModifierGroups()
  } catch (err) {
    alert('Gagal menyimpan grup modifier')
  }
}

const deleteGroup = async (group) => {
  if (!confirm(`Yakin ingin menghapus grup "${group.name}"?`)) return
  try {
    await api.delete(`/admin/modifier-groups/${group.id}`)
    await fetchModifierGroups()
  } catch (err) {
    alert('Gagal menghapus grup modifier')
  }
}

const openCreateItem = (group) => {
  itemForm.value = { modifier_group_id: group.id, name: '', price: 0 }
  showItemModal.value = true
}

const saveItem = async () => {
  if (!itemForm.value.name) return
  try {
    await api.post('/admin/modifier-items', itemForm.value)
    showItemModal.value = false
    await fetchModifierGroups()
  } catch (err) {
    alert('Gagal menyimpan item varian')
  }
}

const deleteItem = async (item) => {
  if (!confirm(`Hapus topping/varian "${item.name}"?`)) return
  try {
    await api.delete(`/admin/modifier-items/${item.id}`)
    await fetchModifierGroups()
  } catch (err) {
    alert('Gagal menghapus item')
  }
}

onMounted(() => {
  fetchModifierGroups()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-extrabold text-white flex items-center gap-2">
          <Layers class="w-5 h-5 text-indigo-400" /> Modifier, Topping & Varian
        </h1>
        <p class="text-xs text-slate-400">Atur pilihan opsional/wajib untuk produk seperti telur, level gula, dan ukuran</p>
      </div>
      <button @click="openCreateGroup" class="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-indigo-600/20">
        <Plus class="w-4 h-4" /> Tambah Grup Modifier
      </button>
    </div>

    <div v-if="isLoading" class="p-12 text-center text-slate-500 text-xs font-semibold">Memuat data modifier...</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="group in modifierGroups" :key="group.id" class="bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-extrabold text-white text-sm">{{ group.name }}</h3>
              <div class="flex items-center gap-2 mt-1">
                <span :class="['px-2 py-0.5 rounded text-[10px] font-bold border', group.is_required ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-slate-800 text-slate-400 border-slate-700']">
                  {{ group.is_required ? '*Wajib Dipilih' : 'Opsional' }}
                </span>
                <span class="text-[10px] text-slate-400">Max: {{ group.max_selection }} Pilihan</span>
              </div>
            </div>
            <button @click="deleteGroup(group)" class="text-slate-500 hover:text-rose-400 p-1"><Trash2 class="w-4 h-4"/></button>
          </div>

          <!-- Items List -->
          <div class="mt-4 space-y-2 border-t border-slate-800/80 pt-3">
            <div v-for="item in group.items" :key="item.id" class="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60 flex items-center justify-between text-xs">
              <span class="font-bold text-slate-200">{{ item.name }}</span>
              <div class="flex items-center gap-2">
                <span class="font-mono text-emerald-400 font-bold">+{{ formatRupiah(item.price) }}</span>
                <button @click="deleteItem(item)" class="text-slate-500 hover:text-rose-400 p-0.5"><X class="w-3.5 h-3.5"/></button>
              </div>
            </div>
          </div>
        </div>

        <button @click="openCreateItem(group)" class="w-full py-2 bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-indigo-500/20 rounded-xl text-xs font-bold flex items-center justify-center gap-1">
          <Plus class="w-3.5 h-3.5" /> Tambah Item Topping
        </button>
      </div>
    </div>

    <!-- MODAL GROUP -->
    <div v-if="showGroupModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden">
        <div class="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h3 class="text-base font-extrabold text-white">Tambah Grup Modifier</h3>
          <button @click="showGroupModal = false" class="text-slate-400 hover:text-white"><X class="w-5 h-5"/></button>
        </div>
        <div class="p-6 space-y-4 text-xs">
          <div>
            <label class="block font-bold text-slate-300 mb-1">Nama Kelompok (Group)</label>
            <input v-model="groupForm.name" type="text" placeholder="Contoh: Level Gula / Extra Topping" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500" />
          </div>
          <div class="flex items-center gap-2">
            <input type="checkbox" v-model="groupForm.is_required" id="mod_req" class="w-4 h-4 accent-indigo-600" />
            <label for="mod_req" class="font-bold text-slate-300 cursor-pointer">Wajib Dipilih Saat Pesan</label>
          </div>
        </div>
        <div class="p-4 border-t border-slate-800 bg-slate-900/50 flex gap-2">
          <button @click="showGroupModal = false" class="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs">Batal</button>
          <button @click="saveGroup" class="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs">Simpan</button>
        </div>
      </div>
    </div>

    <!-- MODAL ITEM -->
    <div v-if="showItemModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden">
        <div class="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h3 class="text-base font-extrabold text-white">Tambah Item Topping/Varian</h3>
          <button @click="showItemModal = false" class="text-slate-400 hover:text-white"><X class="w-5 h-5"/></button>
        </div>
        <div class="p-6 space-y-4 text-xs">
          <div>
            <label class="block font-bold text-slate-300 mb-1">Nama Item</label>
            <input v-model="itemForm.name" type="text" placeholder="Contoh: Telur Ceplok" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label class="block font-bold text-slate-300 mb-1">Tambahan Harga (Rp)</label>
            <input v-model="itemForm.price" type="number" min="0" placeholder="0" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-emerald-400 font-bold outline-none focus:border-indigo-500" />
          </div>
        </div>
        <div class="p-4 border-t border-slate-800 bg-slate-900/50 flex gap-2">
          <button @click="showItemModal = false" class="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs">Batal</button>
          <button @click="saveItem" class="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs">Simpan Item</button>
        </div>
      </div>
    </div>
  </div>
</template>
