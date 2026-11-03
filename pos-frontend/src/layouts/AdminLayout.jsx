import React, { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { AnimatedOutlet } from '../components/animation/AnimatedOutlet'
import { motion, AnimatePresence } from 'framer-motion'
import { modalBackdrop, springSnappy } from '../lib/motion'
import { 
  BarChart3, Coffee, Package, Sparkles, Trash2, LayoutGrid, 
  Users, Settings, ShieldAlert, TrendingUp, LogOut, ArrowLeft, 
  ShieldCheck, AlertCircle, ChefHat, Layers, ArrowDownUp, Menu, X
} from 'lucide-react'

export function AdminLayout() {
  const { user, logout, hasRole } = useAuthStore()
  const navigate = useNavigate()
  const isSuperadmin = user?.role === 'superadmin'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { to: '/admin/reports', label: 'Laporan & Omzet', icon: BarChart3, roles: ['admin', 'superadmin'] },
    { to: '/admin/products', label: 'Master Menu / Produk', icon: Coffee, roles: ['admin', 'superadmin'] },
    { to: '/admin/modifiers', label: 'Varian & Topping', icon: Layers, roles: ['admin', 'superadmin'] },
    { to: '/admin/inventory-adjust', label: 'Penyesuaian Stok (ERP)', icon: ArrowDownUp, roles: ['admin', 'superadmin'] },
    { to: '/admin/ingredients', label: 'Bahan Baku (Gudang)', icon: Package, roles: ['admin', 'superadmin'] },
    { to: '/admin/recipes', label: 'Resep Produk (BOM)', icon: ChefHat, roles: ['admin', 'superadmin'] },
    { to: '/admin/waste', label: 'Waste & Basi', icon: Trash2, roles: ['admin', 'superadmin'] },
    { to: '/admin/tables', label: 'Denah Meja', icon: LayoutGrid, roles: ['admin', 'superadmin'] },
    { to: '/admin/users', label: 'Kelola Staf & Kasir', icon: Users, roles: ['admin', 'superadmin'] },
    { to: '/admin/forecasting', label: 'Prediksi Stok Belanja', icon: TrendingUp, roles: ['admin', 'superadmin'] },
    // Superadmin specific (Owner)
    { to: '/superadmin/reconciliation', label: 'Stock Opname & Anomali', icon: ShieldAlert, roles: ['superadmin'], badge: 'Owner' },
    { to: '/superadmin/audit', label: 'Audit Mutasi & Fraud', icon: ShieldCheck, roles: ['superadmin'], badge: 'Owner' },
    { to: '/admin/settings', label: 'Pengaturan Struk & Toko', icon: Settings, roles: ['admin', 'superadmin'] }
  ]

  const renderNavLinks = (onItemClick) => (
    <nav className="flex-1 p-3 overflow-y-auto space-y-1">
      <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-pine-400">
        Menu Operasional
      </div>

      {navItems.map((item) => {
        if (!hasRole(item.roles)) return null
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onItemClick}
            className={({ isActive }) =>
              `group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-forest-800 text-mint-100 shadow-sm border border-forest-700 font-bold'
                  : 'text-pine-200 hover:bg-forest-900/60 hover:text-white'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
              <span>{item.label}</span>
            </div>
            {item.badge && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sun-400 text-forest-950 font-bold uppercase shadow-2xs">
                {item.badge}
              </span>
            )}
          </NavLink>
        )
      })}
    </nav>
  )

  const renderUserFooter = () => (
    <div className="p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] border-t border-forest-900 space-y-2 bg-forest-900/40">
      <Link
        to="/pos"
        className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-sun-400 hover:bg-sun-400/90 active:scale-[0.98] text-forest-950 text-xs font-bold transition shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Buka Layar Kasir (POS)</span>
      </Link>

      <div className="p-2.5 rounded-xl bg-forest-950 border border-forest-900 flex items-center justify-between">
        <div className="truncate">
          <span className="text-xs font-semibold text-white block truncate leading-tight">
            {user?.name || 'Administrator'}
          </span>
          <span className="text-[10px] text-pine-300 font-mono capitalize">
            {user?.role || 'admin'}
          </span>
        </div>
        <button
          onClick={logout}
          className="p-1.5 rounded-lg text-pine-400 hover:text-white hover:bg-forest-800 transition cursor-pointer active:scale-95"
          title="Keluar"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-paper-50 overflow-hidden font-sans">
      
      {/* Mobile Top Navbar (Tampil hanya di layar smartphone / tablet < lg) */}
      <header className="lg:hidden h-14 bg-forest-950 text-white px-4 flex items-center justify-between border-b border-forest-900 shrink-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-forest-800 border border-white/10 flex items-center justify-center">
            <Coffee className="w-4 h-4 text-mint-200" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-xs tracking-wide text-white leading-tight">
              Kasir Arunika
            </h2>
            <span className="text-[9px] text-pine-300 font-mono">Backoffice</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/pos"
            className="px-2.5 py-1.5 rounded-lg bg-sun-400 text-forest-950 text-[11px] font-bold"
          >
            POS
          </Link>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl text-pine-200 hover:text-white hover:bg-forest-900 cursor-pointer"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Slide-Out Drawer with Backdrop */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <motion.div
              variants={modalBackdrop}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-forest-950/70 backdrop-blur-xs"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={springSnappy}
              className="relative w-72 max-w-[85vw] bg-forest-950 text-white flex flex-col h-full z-10 shadow-2xl border-r border-forest-900"
            >
              <div className="p-4 border-b border-forest-900 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-forest-800 flex items-center justify-center">
                    <Coffee className="w-4 h-4 text-mint-200" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm text-white">Kasir Arunika</h3>
                    <span className="text-[10px] text-pine-300 font-mono">ERP Mobile</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-pine-400 hover:text-white hover:bg-forest-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {renderNavLinks(() => setMobileMenuOpen(false))}
              {renderUserFooter()}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop Sticky Sidebar Navigation */}
      <aside className="hidden lg:flex w-64 bg-forest-950 text-white flex-col shrink-0 border-r border-forest-900 shadow-warm-lg">
        {/* Brand Header */}
        <div className="p-5 border-b border-forest-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="w-9 h-9 rounded-xl bg-forest-800 border border-white/10 flex items-center justify-center cursor-default"
            >
              <Coffee className="w-5 h-5 text-mint-200" />
            </motion.div>
            <div>
              <h2 className="font-serif font-bold text-sm tracking-wide text-white leading-tight">
                Kasir Arunika
              </h2>
              <span className="text-[10px] text-pine-300 font-mono">Backoffice ERP Suite</span>
            </div>
          </div>
        </div>

        {renderNavLinks(null)}
        {renderUserFooter()}
      </aside>

      {/* Main Content View with Smooth Page Transition */}
      <main className="flex-1 flex flex-col overflow-y-auto min-w-0">
        <AnimatedOutlet />
      </main>

    </div>
  )
}
