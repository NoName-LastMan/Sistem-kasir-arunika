<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api'
import { Settings, Save, CheckCircle } from 'lucide-vue-next'

const form = ref({
  store_name: '',
  store_address: '',
  store_phone: '',
  store_email: '',
  receipt_header: '',
  receipt_footer: '',
  default_tax_rate: 10,
  service_charge_rate: 0,
  invoice_prefix: 'INV-'
})

const isLoading = ref(true)
const isSaving = ref(false)
const successMsg = ref('')

const fetchSettings = async () => {
  isLoading.value = true
  try {
    const { data } = await api.get('/admin/settings')
    if (data.data) {
      form.value = {
        store_name: data.data.store_name || '',
        store_address: data.data.store_address || '',
        store_phone: data.data.store_phone || '',
        store_email: data.data.store_email || '',
        receipt_header: data.data.receipt_header || '',
        receipt_footer: data.data.receipt_footer || '',
        default_tax_rate: Number(data.data.default_tax_rate) || 10,
        service_charge_rate: Number(data.data.service_charge_rate) || 0,
        invoice_prefix: data.data.invoice_prefix || 'INV-'
      }
    }
  } catch (err) {
    console.error('Gagal mengambil pengaturan toko:', err)
  } finally {
    isLoading.value = false
  }
}

const saveSettings = async () => {
  isSaving.value = true
  successMsg.value = ''
  try {
    await api.put('/admin/settings', form.value)
    successMsg.value = 'Pengaturan toko berhasil disimpan!'
    setTimeout(() => { successMsg.value = '' }, 3000)
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menyimpan pengaturan')
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  fetchSettings()
})
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-extrabold text-white flex items-center gap-2">
          <Settings class="w-5 h-5 text-purple-400" /> Pengaturan Toko & Struk Thermal
        </h1>
        <p class="text-xs text-slate-400">Identitas bisnis, preferensi cetak struk kasir, dan persentase pajak default</p>
      </div>

      <button
        @click="saveSettings"
        :disabled="isSaving"
        class="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-purple-600/20 disabled:opacity-50 border border-purple-400/30"
      >
        <Save class="w-4 h-4" /> {{ isSaving ? 'Menyimpan...' : 'Simpan Pengaturan' }}
      </button>
    </div>

    <!-- Alert Sukses -->
    <div v-if="successMsg" class="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-emerald-400 text-xs font-bold flex items-center gap-2">
      <CheckCircle class="w-4 h-4" /> {{ successMsg }}
    </div>

    <div v-if="isLoading" class="p-12 text-center text-slate-500 text-xs font-semibold">Memuat pengaturan...</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      <!-- Profil Toko -->
      <div class="bg-slate-950 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
        <h3 class="text-sm font-extrabold text-white pb-2 border-b border-slate-800">Profil Identitas Toko</h3>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-bold text-slate-300 mb-1">Nama Restoran / Toko *</label>
            <input v-model="form.store_name" type="text" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-purple-500" />
          </div>

          <div>
            <label class="block font-bold text-slate-300 mb-1">Alamat Lengkap</label>
            <textarea v-model="form.store_address" rows="2" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-purple-500"></textarea>
          </div>

          <div>
            <label class="block font-bold text-slate-300 mb-1">Nomor Telepon / WhatsApp</label>
            <input v-model="form.store_phone" type="text" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-purple-500" />
          </div>

          <div>
            <label class="block font-bold text-slate-300 mb-1">Alamat Email Toko</label>
            <input v-model="form.store_email" type="email" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-purple-500" />
          </div>
        </div>
      </div>

      <!-- Teks Struk & Keuangan -->
      <div class="bg-slate-950 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
        <h3 class="text-sm font-extrabold text-white pb-2 border-b border-slate-800">Preferensi Struk Thermal & Keuangan</h3>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-bold text-slate-300 mb-1">Judul Header Struk Thermal</label>
            <input v-model="form.receipt_header" type="text" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-purple-500" />
          </div>

          <div>
            <label class="block font-bold text-slate-300 mb-1">Pesan Footer Struk (Terima Kasih)</label>
            <textarea v-model="form.receipt_footer" rows="2" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-purple-500"></textarea>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-300 mb-1">Default Pajak (%)</label>
              <input v-model="form.default_tax_rate" type="number" min="0" max="100" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-purple-400 font-bold outline-none focus:border-purple-500" />
            </div>

            <div>
              <label class="block font-bold text-slate-300 mb-1">Prefix Invoice</label>
              <input v-model="form.invoice_prefix" type="text" class="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-white outline-none focus:border-purple-500" />
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
