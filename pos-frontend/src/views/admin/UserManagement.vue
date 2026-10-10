<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api'
import {
  Users, Plus, Search, Edit3, Key, Trash2, X, CheckCircle, ShieldAlert
} from 'lucide-vue-next'

const users = ref([])
const searchQuery = ref('')
const isLoading = ref(true)

// Modal State
const showUserModal = ref(false)
const showResetModal = ref(false)
const isEditing = ref(false)
const activeUserId = ref(null)

const userForm = ref({
  name: '',
  email: '',
  password: '',
  role: 'cashier',
  is_active: true
})

const resetPasswordInput = ref('')

const fetchUsers = async () => {
  isLoading.value = true
  try {
    const { data } = await api.get('/admin/users')
    users.value = data.data
  } catch (err) {
    alert('Gagal mengambil data user: ' + (err.response?.data?.message || err.message))
  } finally {
    isLoading.value = false
  }
}

const openCreateModal = () => {
  isEditing.value = false
  activeUserId.value = null
  userForm.value = { name: '', email: '', password: '', role: 'cashier', is_active: true }
  showUserModal.value = true
}

const openEditModal = (user) => {
  isEditing.value = true
  activeUserId.value = user.id
  userForm.value = {
    name: user.name,
    email: user.email,
    password: '',
    role: user.role,
    is_active: Boolean(user.is_active)
  }
  showUserModal.value = true
}

const saveUser = async () => {
  try {
    if (isEditing.value) {
      await api.put(`/admin/users/${activeUserId.value}`, userForm.value)
    } else {
      await api.post('/admin/users', userForm.value)
    }
    showUserModal.value = false
    await fetchUsers()
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menyimpan user')
  }
}

const openResetModal = (user) => {
  activeUserId.value = user.id
  resetPasswordInput.value = ''
  showResetModal.value = true
}

const submitResetPassword = async () => {
  if (!resetPasswordInput.value || resetPasswordInput.value.length < 6) {
    alert('Password minimal 6 karakter')
    return
  }
  try {
    await api.post(`/admin/users/${activeUserId.value}/reset-password`, { password: resetPasswordInput.value })
    showResetModal.value = false
    alert('Password berhasil di-reset!')
  } catch (err) {
    alert('Gagal reset password')
  }
}

const deleteUser = async (user) => {
  if (!confirm(`Yakin ingin menghapus user ${user.name}?`)) return
  try {
    await api.delete(`/admin/users/${user.id}`)
    await fetchUsers()
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menghapus user')
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header Page -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-xl font-extrabold text-white flex items-center gap-2">
          <Users class="w-5 h-5 text-blue-400" /> Kelola Staf & User
        </h1>
        <p class="text-xs text-slate-400">Atur akun kasir, staf dapur, dan administrator</p>
      </div>

      <button
        @click="openCreateModal"
        class="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-blue-600/20 border border-blue-400/30 transition-all"
      >
        <Plus class="w-4 h-4" /> Tambah User Baru
      </button>
    </div>

    <!-- Search & Filters -->
    <div class="relative max-w-md">
      <Search class="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Cari berdasarkan nama atau email..."
        class="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
      />
    </div>

    <!-- Data Table Users -->
    <div class="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
      <div v-if="isLoading" class="p-12 text-center text-slate-500 text-xs font-semibold">
        Memuat data user...
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead class="bg-slate-900 text-slate-400 border-b border-slate-800">
            <tr>
              <th class="p-4 font-bold">Nama Staf</th>
              <th class="p-4 font-bold">Email</th>
              <th class="p-4 font-bold">Role Hak Akses</th>
              <th class="p-4 font-bold">Status</th>
              <th class="p-4 font-bold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            <tr v-if="users.length === 0">
              <td colspan="5" class="p-6 text-center text-slate-500">Belum ada user yang terdaftar</td>
            </tr>
            <tr v-for="user in users" :key="user.id" class="hover:bg-slate-900/50 transition-colors">
              <td class="p-4 font-bold text-white flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 font-bold flex items-center justify-center border border-blue-500/20">
                  {{ user.name.charAt(0) }}
                </div>
                <span>{{ user.name }}</span>
              </td>
              <td class="p-4 text-slate-300 font-mono">{{ user.email }}</td>
              <td class="p-4">
                <span
                  :class="[
                    'px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase font-mono border',
                    user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                    user.role === 'cashier' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  ]"
                >
                  {{ user.role }}
                </span>
              </td>
              <td class="p-4">
                <span
                  :class="[
                    'px-2 py-0.5 rounded-md text-[10px] font-bold border',
                    user.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  ]"
                >
                  {{ user.is_active ? 'Aktif' : 'Nonaktif' }}
                </span>
              </td>
              <td class="p-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button @click="openEditModal(user)" class="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg" title="Edit Profil">
                    <Edit3 class="w-4 h-4" />
                  </button>
                  <button @click="openResetModal(user)" class="p-2 text-amber-400 hover:bg-amber-500/10 rounded-lg" title="Reset Password">
                    <Key class="w-4 h-4" />
                  </button>
                  <button @click="deleteUser(user)" class="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg" title="Hapus User">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL CREATE/EDIT USER -->
    <div v-if="showUserModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        <div class="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h3 class="text-base font-extrabold text-white">{{ isEditing ? 'Edit Profil Staf' : 'Tambah Staf Baru' }}</h3>
          <button @click="showUserModal = false" class="text-slate-400 hover:text-white"><X class="w-5 h-5"/></button>
        </div>
        <div class="p-6 space-y-4 text-xs">
          <div>
            <label class="block font-bold text-slate-300 mb-1">Nama Lengkap</label>
            <input v-model="userForm.name" type="text" placeholder="Contoh: Budi Kasir" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500" />
          </div>
          <div>
            <label class="block font-bold text-slate-300 mb-1">Alamat Email</label>
            <input v-model="userForm.email" type="email" placeholder="budi@pos.com" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500" />
          </div>
          <div v-if="!isEditing">
            <label class="block font-bold text-slate-300 mb-1">Password Awal</label>
            <input v-model="userForm.password" type="password" placeholder="Minimal 6 karakter" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500" />
          </div>
          <div>
            <label class="block font-bold text-slate-300 mb-1">Role Hak Akses</label>
            <select v-model="userForm.role" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500">
              <option value="cashier">Kasir (Cashier)</option>
              <option value="kitchen">Dapur (Kitchen)</option>
              <option value="admin">Administrator (Full Access)</option>
            </select>
          </div>
          <div class="flex items-center gap-2 pt-2">
            <input type="checkbox" v-model="userForm.is_active" id="is_active" class="w-4 h-4 accent-blue-600" />
            <label for="is_active" class="font-bold text-slate-300 cursor-pointer">Akun Aktif (Bisa Login)</label>
          </div>
        </div>
        <div class="p-4 border-t border-slate-800 bg-slate-900/50 flex gap-2">
          <button @click="showUserModal = false" class="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs">Batal</button>
          <button @click="saveUser" class="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs">Simpan</button>
        </div>
      </div>
    </div>

    <!-- MODAL RESET PASSWORD -->
    <div v-if="showResetModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div class="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h3 class="text-base font-extrabold text-white">Reset Password User</h3>
          <button @click="showResetModal = false" class="text-slate-400 hover:text-white"><X class="w-5 h-5"/></button>
        </div>
        <div class="p-6 space-y-4 text-xs">
          <div>
            <label class="block font-bold text-slate-300 mb-1">Password Baru</label>
            <input v-model="resetPasswordInput" type="password" placeholder="Minimal 6 karakter" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" />
          </div>
        </div>
        <div class="p-4 border-t border-slate-800 bg-slate-900/50 flex gap-2">
          <button @click="showResetModal = false" class="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs">Batal</button>
          <button @click="submitResetPassword" class="flex-1 py-2.5 bg-amber-600 text-white font-bold rounded-xl text-xs">Reset Password</button>
        </div>
      </div>
    </div>

  </div>
</template>
