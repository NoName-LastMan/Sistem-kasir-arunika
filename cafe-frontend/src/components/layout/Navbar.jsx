import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ShoppingBag, Menu, X, QrCode, MapPin, Clock, Music, Pencil, Plus } from 'lucide-react'
import { useCartStore, selectCartItemCount, selectCartSubtotal } from '../../store/cartStore'
import { useOrderStore } from '../../store/orderStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useAudioStore } from '../../store/audioStore'
import { useOpenStatus } from '../../hooks/useOpenStatus'
import { formatCurrency } from '../../api/mappers'
import { AmbientPlayer } from '../brand/AmbientPlayer'

export function Navbar({ onOpenCart }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  const itemCount = useCartStore(selectCartItemCount)
  const subtotal = useCartStore(selectCartSubtotal)
  const tableCode = useCartStore(state => state.tableCode)
  const orderHistory = useOrderStore(state => state.orderHistory) || []
  const activeOrderCount = orderHistory.filter(o => ['pending', 'processing', 'ready'].includes(o.status)).length

  const settings = useSettingsStore(state => state.settings)
  const { isOpen } = useOpenStatus(settings)
  const setAudioModalOpen = useAudioStore(state => state.setModalOpen)

  const navLinks = [
    { name: 'Beranda', path: '/' },
    { name: 'Katalog Menu', path: '/menu' },
    { name: 'Riwayat', path: '/riwayat' },
    { name: 'Ruang', path: '/#ruang' },
    { name: 'Cara Pesan', path: '/#cara-pesan' },
    { name: 'Reservasi', path: '/reservasi' }
  ]

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-pine-200 shadow-warm-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand Identity */}
          <Link
            to="/"
            className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-xl"
          >
            <div className="w-11 h-11 rounded-full overflow-hidden bg-white shadow-warm-sm border-2 border-pine-200 p-0.5 group-hover:scale-105 transition-transform shrink-0 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Arunika Coffee & Space"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="font-serif font-bold text-xl tracking-tight text-forest-900 block leading-tight">
                ARUNIKA
              </span>
              <span className="text-[11px] font-bold text-pine-700 tracking-wider block">
                COFFEE & SPACE
              </span>
            </div>
          </Link>

          {/* Navigasi Desktop Penuh */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-forest-900">
            {navLinks.map((link) => {
              if (link.path.startsWith('/#')) {
                return (
                  <a
                    key={link.name}
                    href={link.path}
                    className="hover:text-emerald-600 transition-colors"
                  >
                    {link.name}
                  </a>
                )
              }
              return (
                <NavLink
                  key={link.name}
                  to={link.path}
                  className={({ isActive }) =>
                    isActive
                      ? 'text-emerald-600 font-semibold border-b-2 border-emerald-600 pb-1'
                      : 'hover:text-emerald-600 transition-colors'
                  }
                >
                  {link.name}
                </NavLink>
              )
            })}
          </nav>

          {/* Aksi Kanan: Ambient Player, Badge Meja, Riwayat, & Tombol Keranjang */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Ambient Player (Suasana Kafe) */}
            <AmbientPlayer />

            {/* Indikator Meja Aktif (Alur QR) */}
            {tableCode ? (
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-mint-100 text-forest-900 text-xs font-semibold border border-pine-200">
                <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                <span>Meja {tableCode}</span>
              </div>
            ) : null}

            {/* Tombol Cepat Riwayat Pesanan */}
            <Link
              to="/riwayat"
              className="relative p-2.5 rounded-xl border border-pine-200 text-forest-950 hover:bg-mint-100 hover:border-emerald-600 transition-all btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 touch-target"
              aria-label="Riwayat pesanan pelanggan"
              title="Riwayat Pesanan Saya"
            >
              <Clock className="w-5 h-5 text-emerald-700" />
              {activeOrderCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-leaf-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </Link>

            {/* Tombol Keranjang Pesanan */}
            <button
              onClick={onOpenCart}
              type="button"
              className="relative inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-forest-900 text-white hover:bg-emerald-600 active:bg-forest-900 transition-all btn-press shadow-warm-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 touch-target"
              aria-label={`Keranjang pesanan, ${itemCount} item`}
            >
              <ShoppingBag className="w-5 h-5 text-sun-400" />
              <span className="hidden sm:inline text-sm font-medium">Pesanan</span>
              {itemCount > 0 ? (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-sun-400 text-forest-900 text-xs font-bold">
                  {itemCount}
                </span>
              ) : null}
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              type="button"
              className="lg:hidden p-2 rounded-xl text-forest-950 hover:bg-mint-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 transition-all btn-press touch-target"
              aria-expanded={mobileMenuOpen}
              aria-label="Buka menu navigasi"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer with Smooth Framer Motion */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden py-4 border-t border-pine-200 overflow-hidden space-y-3"
            >
              <nav className="flex flex-col gap-1.5">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2.5 rounded-lg text-base font-medium text-forest-900 hover:bg-mint-100 transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>

              {/* Aksi Tambahan di Drawer Mobile */}
              <div className="pt-3 border-t border-pine-200 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    setAudioModalOpen(true)
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-mint-50 text-forest-950 border border-emerald-300 text-xs font-bold text-left cursor-pointer"
                >
                  <Music className="w-4 h-4 text-emerald-600" />
                  <span>Ganti Suasana Musik Kafe</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
