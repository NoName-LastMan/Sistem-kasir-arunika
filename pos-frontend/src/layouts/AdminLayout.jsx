import React from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { 
  BarChart3, Coffee, Package, Sparkles, Trash2, LayoutGrid, 
  Users, Settings, ShieldAlert, TrendingUp, LogOut, ArrowLeft, 
  ShieldCheck, AlertCircle, ChefHat, Layers, ArrowDownUp
} from 'lucide-react'

export function AdminLayout() {
  const { user, logout, hasRole } = useAuthStore()
  const navigate = useNavigate()
  const isSuperadmin = user?.role === 'superadmin'

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

  return (
    <div className="flex h-screen bg-paper-50 overflow-hidden font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-forest-950 text-white flex flex-col shrink-0 border-r border-forest-900 shadow-warm-lg">
        
        {/* Brand Header */}
        <div className="p-5 border-b border-forest-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-forest-800 border border-white/10 flex items-center justify-center">
              <Coffee className="w-5 h-5 text-mint-200" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-sm tracking-wide text-white leading-tight">
                Kasir Arunika
              </h2>
              <span className="text-[10px] text-pine-300 font-mono">Backoffice ERP Suite</span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
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
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-forest-800 text-mint-100 shadow-sm border border-forest-700'
                      : 'text-pine-200 hover:bg-forest-900/60 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sun-400 text-forest-950 font-bold uppercase">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Quick link to POS & User Card */}
        <div className="p-3 border-t border-forest-900 space-y-2 bg-forest-900/40">
          <Link
            to="/pos"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-sun-400 hover:bg-sun-400/90 text-forest-950 text-xs font-bold transition shadow-sm"
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
              className="p-1.5 rounded-lg text-pine-400 hover:text-white hover:bg-forest-800 transition cursor-pointer"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </aside>

      {/* Main Content View */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <Outlet />
      </main>

    </div>
  )
}
