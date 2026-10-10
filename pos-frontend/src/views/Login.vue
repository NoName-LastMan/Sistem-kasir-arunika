<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'
import {
  Shield, Eye, EyeOff, Sparkles, CheckCircle2,
  Lock, Mail, ArrowRight, Store, ChefHat, UserCircle2
} from 'lucide-vue-next'

const router = useRouter()
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const errorMessage = ref('')
const isLoading = ref(false)

const handleLogin = async () => {
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    const response = await api.post('/login', {
      email: email.value,
      password: password.value
    })
    
    localStorage.setItem('pos_token', response.data.token)
    localStorage.setItem('pos_user', JSON.stringify(response.data.user))
    
    // Jika login sebagai kitchen, arahkan langsung ke /kitchen
    if (response.data.user?.role === 'kitchen') {
      router.push('/kitchen')
    } else {
      router.push('/')
    }
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Email atau password yang Anda masukkan salah.'
  } finally {
    isLoading.value = false
  }
}

// Fitur Quick Fill Akun Demo untuk Kemudahan Evaluasi & Presentasi
const fillDemoAccount = (role) => {
  if (role === 'admin') {
    email.value = 'admin@pos.com'
    password.value = 'password'
  } else if (role === 'kasir') {
    email.value = 'kasir@pos.com'
    password.value = 'password'
  } else if (role === 'kitchen') {
    email.value = 'kitchen@pos.com'
    password.value = 'password'
  }
}
</script>

<template>
  <div class="min-h-screen flex bg-slate-950 text-slate-100 font-sans select-none">
    
    <!-- SISI KIRI: BRANDING & ENTERPRISE VALUE SHOWCASE -->
    <div class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 p-12 flex-col justify-between relative overflow-hidden border-r border-slate-800/80">
      <!-- Glow background decoration -->
      <div class="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <!-- Brand Header -->
      <div class="relative z-10">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-xl shadow-blue-600/30 border border-blue-400/30">
            P
          </div>
          <div>
            <h1 class="text-xl font-black tracking-tight text-white">APEX POS CLOUD</h1>
            <p class="text-[11px] text-blue-400 font-mono tracking-widest uppercase">Point of Sale Enterprise</p>
          </div>
        </div>
      </div>

      <!-- Feature Highlight List -->
      <div class="relative z-10 space-y-6 my-auto max-w-md">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold">
          <Sparkles class="w-3.5 h-3.5 text-blue-400" />
          <span>Sistem Kasir Modern Siap Pakai & Komersial</span>
        </div>

        <h2 class="text-3xl font-black text-white leading-tight">
          Kelola Transaksi, Kasir, & Laporan dengan <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Presisi Tinggi.</span>
        </h2>

        <div class="space-y-3.5 text-xs text-slate-300">
          <div class="flex items-center gap-3">
            <CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>Multi-Payment & QRIS Dinamis</strong> dengan settlement instan</span>
          </div>
          <div class="flex items-center gap-3">
            <CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>Layar Dapur Minimalis (KDS)</strong> untuk efisiensi koki & barista</span>
          </div>
          <div class="flex items-center gap-3">
            <CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>Rekonsiliasi Shift Kasir</strong> pencocokan kas fisik vs sistem</span>
          </div>
          <div class="flex items-center gap-3">
            <CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>Denah Meja Restoran (Floor Plan)</strong> & Cetak Struk 58mm/80mm</span>
          </div>
        </div>
      </div>

      <!-- Footer Info -->
      <div class="relative z-10 text-[11px] text-slate-500 font-mono">
        &copy; 2026 APEX Point of Sale System &bull; Version 2.0 Pro
      </div>
    </div>

    <!-- SISI KANAN: FORM LOGIN & QUICK DEMO CHIPS -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
      <div class="w-full max-w-md space-y-6">
        
        <!-- Header Mobile Logo -->
        <div class="text-center lg:text-left space-y-1">
          <div class="lg:hidden inline-flex w-10 h-10 bg-blue-600 rounded-xl items-center justify-center text-white font-black mb-3">
            P
          </div>
          <h2 class="text-2xl font-black text-white">Selamat Datang</h2>
          <p class="text-xs text-slate-400">Masukkan kredensial akun Anda untuk mengakses sistem kasir</p>
        </div>

        <!-- Tombol Quick Demo Fill Chips -->
        <div class="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
          <div class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono flex items-center justify-between">
            <span>Pilih Akun Demo Cepat:</span>
            <span class="text-blue-400">Sekali Klik</span>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <button
              type="button"
              @click="fillDemoAccount('admin')"
              class="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 hover:border-purple-500/50 flex flex-col items-center gap-1 transition-all"
            >
              <Store class="w-4 h-4 text-purple-400" />
              <span class="text-[11px]">Admin Owner</span>
            </button>
            <button
              type="button"
              @click="fillDemoAccount('kasir')"
              class="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 hover:border-blue-500/50 flex flex-col items-center gap-1 transition-all"
            >
              <UserCircle2 class="w-4 h-4 text-blue-400" />
              <span class="text-[11px]">Kasir Utama</span>
            </button>
            <button
              type="button"
              @click="fillDemoAccount('kitchen')"
              class="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 hover:border-amber-500/50 flex flex-col items-center gap-1 transition-all"
            >
              <ChefHat class="w-4 h-4 text-amber-400" />
              <span class="text-[11px]">Koki Dapur</span>
            </button>
          </div>
        </div>

        <!-- Alert Error Message -->
        <div v-if="errorMessage" class="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-bold flex items-center gap-2">
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Form Login -->
        <form @submit.prevent="handleLogin" class="space-y-4">
          <!-- Input Email -->
          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1.5">Alamat Email Staf / Kasir</label>
            <div class="relative">
              <Mail class="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="email"
                type="email"
                required
                class="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                placeholder="nama@pos.com"
              />
            </div>
          </div>

          <!-- Input Password -->
          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1.5">Kata Sandi (Password)</label>
            <div class="relative">
              <Lock class="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="w-full pl-10 pr-11 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                placeholder="••••••••"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
              >
                <EyeOff v-if="showPassword" class="w-4 h-4" />
                <Eye v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Tombol Submit -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.99]"
          >
            <span>{{ isLoading ? 'Memverifikasi Kredensial...' : 'Masuk ke Sistem Kasir' }}</span>
            <ArrowRight class="w-4 h-4" />
          </button>
        </form>

        <div class="text-center pt-2 text-[11px] text-slate-500">
          Butuh bantuan akses staf? Hubungi Manager Restoran / Administrator.
        </div>

      </div>
    </div>

  </div>
</template>