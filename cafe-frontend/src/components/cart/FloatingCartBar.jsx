import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ShoppingBag, ArrowRight } from 'lucide-react'
import { useCartStore, selectCartItemCount, selectCartSubtotal } from '../../store/cartStore'
import { useSettingsStore } from '../../store/settingsStore'
import { formatCurrency } from '../../api/mappers'

export function FloatingCartBar({ onOpenCart }) {
  const navigate = useNavigate()
  const location = useLocation()
  const itemCount = useCartStore(selectCartItemCount)
  const subtotal = useCartStore(selectCartSubtotal)
  const settings = useSettingsStore(state => state.settings)

  const taxRate = settings?.taxRate ?? 10
  const tax = Math.round((subtotal * (Number(taxRate) || 0)) / 100)
  const grandTotal = subtotal + tax

  // Sembunyikan bar jika keranjang kosong atau sedang berada di halaman /pesan
  if (itemCount === 0 || location.pathname === '/pesan' || location.pathname.startsWith('/pesanan/')) {
    return null
  }

  return (
    <aside
      role="region"
      aria-label="Ringkasan Pesanan Cepat"
      className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:bottom-6 z-40 max-w-md w-full sm:w-auto animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-forest-950 text-white rounded-2xl p-3.5 sm:px-5 shadow-warm-lg border-2 border-sun-400 flex items-center justify-between gap-4">
        {/* Kolom Kiri: Ikon, Jumlah, dan Total Harga */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-sm">
            <ShoppingBag className="w-5 h-5 text-sun-400" />
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-sun-400 text-forest-900 text-[11px] font-bold flex items-center justify-center shadow-xs">
              {itemCount}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-mint-100 block uppercase tracking-wider font-bold">
              {itemCount} Menu Dipilih
            </span>
            <span className="text-base font-bold text-white block leading-tight font-serif">
              {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>

        {/* Kolom Kanan: Tombol Aksi Buka Keranjang */}
        <button
          onClick={onOpenCart}
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sun-400 text-forest-900 font-bold text-sm hover:bg-white active:scale-95 transition-all shadow-sm touch-target btn-press"
        >
          <span>Lihat Pesanan</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </aside>
  )
}
