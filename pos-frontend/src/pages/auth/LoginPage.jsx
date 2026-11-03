import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { Coffee, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Utensils, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { fadeUp, springSnappy, springBouncy, staggerContainer } from '../../lib/motion'

const DEMO_ACCOUNTS = [
  { role: 'Owner (Superadmin)', email: 'owner@pos.com', icon: ShieldCheck, color: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
  { role: 'Admin (Gudang)', email: 'admin@pos.com', icon: UserCheck, color: 'bg-blue-50 text-blue-800 border-blue-300' },
  { role: 'Kasir Utama', email: 'kasir@pos.com', icon: Coffee, color: 'bg-amber-50 text-amber-800 border-amber-300' },
  { role: 'Koki Dapur (KDS)', email: 'kitchen@pos.com', icon: Utensils, color: 'bg-purple-50 text-purple-800 border-purple-300' }
]

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, loading, error } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await login(email, password)
    if (result.success) {
      const role = result.user?.role
      if (role === 'cashier') {
        navigate('/pos')
      } else if (role === 'kitchen') {
        navigate('/kitchen')
      } else {
        navigate('/admin/reports')
      }
    }
  }

  const fillDemo = (demoEmail) => {
    setEmail(demoEmail)
    setPassword('password')
  }

  return (
    <div className="min-h-screen bg-paper-50 flex items-center justify-center p-4">
      <motion.div 
        variants={staggerContainer(0.08, 0.05)}
        initial="initial"
        animate="animate"
        className="w-full max-w-md"
      >
        {/* Header Branding */}
        <motion.div variants={fadeUp} className="text-center mb-8">
          <motion.div 
            whileHover={{ scale: 1.06, rotate: 6 }}
            transition={springBouncy}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-forest-900 text-mint-100 shadow-warm-md mb-4 cursor-default"
          >
            <Coffee className="w-8 h-8" />
          </motion.div>
          <h1 className="font-serif text-3xl font-bold text-forest-950 tracking-tight">
            Kasir Arunika POS
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            Sistem Kasir & Fraud Prevention Suite F&B
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div 
          variants={fadeUp}
          className="bg-white rounded-2xl border border-pine-200 p-8 shadow-warm-lg"
        >
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={springSnappy}
                className="overflow-hidden"
              >
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-700 mb-2">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-pine-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kasir@pos.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-pine-200 bg-paper-50/50 text-ink-900 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-700 mb-2">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-pine-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-pine-200 bg-paper-50/50 text-ink-900 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700 focus:bg-white transition"
                />
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-forest-900 hover:bg-forest-800 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-warm-md hover:shadow-warm-lg transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Masuk ke Sistem POS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Quick Fill Demo Chips */}
          <div className="mt-8 pt-6 border-t border-pine-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-3 text-center">
              Quick Fill Akun Demo
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => {
                const Icon = acc.icon
                return (
                  <motion.button
                    key={acc.email}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => fillDemo(acc.email)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium text-left transition cursor-pointer ${acc.color}`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <div className="truncate">
                      <div className="font-semibold leading-tight">{acc.role}</div>
                      <div className="text-[10px] opacity-75">{acc.email}</div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>
        </motion.div>

        <motion.p variants={fadeUp} className="text-center text-xs text-ink-500 mt-6">
          Sistem Kasir Arunika &copy; {new Date().getFullYear()} — F&B Hospitality Standard
        </motion.p>
      </motion.div>
    </div>
  )
}
