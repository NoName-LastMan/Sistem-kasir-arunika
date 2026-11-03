import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ShoppingBag, QrCode, ArrowRight, Clock } from 'lucide-react'
import { useCartStore, selectCartSubtotal } from '../../store/cartStore'
import { useSettingsStore } from '../../store/settingsStore'
import { CartItemRow } from './CartItemRow'
import { Button } from '../ui/Button'
import { formatCurrency } from '../../api/mappers'
import { motion, AnimatePresence } from 'framer-motion'
import { modalBackdrop, drawerRight, cartItemVariant } from '../../lib/motion'

export function CartDrawer({ isOpen, onClose }) {
  const navigate = useNavigate()
  const items = useCartStore(state => state.items)
  const tableCode = useCartStore(state => state.tableCode)
  const updateQuantity = useCartStore(state => state.updateQuantity)
  const removeItem = useCartStore(state => state.removeItem)
  const settings = useSettingsStore(state => state.settings)

  const taxRate = settings?.taxRate ?? 10
  const subtotal = useCartStore(selectCartSubtotal)
  const tax = Math.round((subtotal * (Number(taxRate) || 0)) / 100)
  const grandTotal = subtotal + tax

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  const handleCheckoutClick = () => {
    onClose()
    navigate('/pesan')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-title"
        >
          {/* Backdrop */}
          <motion.div
            variants={modalBackdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 bg-forest-950/80 backdrop-blur-xs"
            onClick={onClose}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-3 sm:pl-10 pointer-events-none">
            <motion.div
              variants={drawerRight}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-screen max-w-md bg-white shadow-warm-lg flex flex-col border-l-2 border-pine-200 pointer-events-auto"
            >
              {/* Header Drawer */}
              <div className="p-6 border-b border-pine-200 flex items-center justify-between bg-mint-100">
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-5 h-5 text-emerald-600" />
                  <h3 id="cart-title" className="font-serif font-bold text-xl text-forest-950">
                    Pesanan Anda
                  </h3>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  type="button"
                  className="p-1.5 rounded-lg text-forest-950 hover:bg-white transition-colors cursor-pointer"
                  aria-label="Tutup keranjang"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Nomor Meja Singkat */}
              <div className="px-6 py-3 bg-paper-100 border-b border-pine-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-forest-950 font-semibold">
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span>Lokasi Meja:</span>
                </div>
                {tableCode ? (
                  <span className="font-bold text-emerald-700 bg-mint-100 px-2 py-0.5 rounded-md border border-pine-200">
                    Meja {tableCode}
                  </span>
                ) : (
                  <span className="text-wood-500 italic">
                    Belum dipilih (Isi di kasir)
                  </span>
                )}
              </div>

              {/* Daftar Item */}
              <div className="flex-1 overflow-y-auto px-6 divide-y divide-pine-200 bg-white">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-16 bg-white">
                    <motion.div 
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-16 h-16 rounded-2xl bg-mint-100 flex items-center justify-center text-emerald-600 mb-4"
                    >
                      <ShoppingBag className="w-8 h-8 opacity-60" />
                    </motion.div>
                    <h4 className="font-serif font-bold text-lg text-forest-900 mb-1">
                      Keranjang masih kosong
                    </h4>
                    <p className="text-xs text-pine-700 max-w-xs mb-6 font-normal">
                      Pilih kopi atau makanan kesukaan Anda di halaman katalog menu.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => {
                        onClose()
                        navigate('/menu')
                      }}
                      className="font-bold shadow-2xs"
                    >
                      Buka Katalog Menu
                    </Button>

                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        navigate('/riwayat')
                      }}
                      className="mt-4 text-xs font-bold text-pine-700 hover:text-emerald-700 underline underline-offset-2 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Lihat Riwayat Pesanan Saya</span>
                    </button>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {items.map(item => (
                      <motion.div
                        key={item.itemKey}
                        layout
                        variants={cartItemVariant}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                      >
                        <CartItemRow
                          item={item}
                          onUpdateQuantity={updateQuantity}
                          onRemove={removeItem}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              {/* Footer Rincian Estimasi */}
              {items.length > 0 && (
                <div className="p-4 sm:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] border-t-2 border-pine-200 bg-white space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-pine-700 font-medium">
                      <span>Subtotal</span>
                      <span className="font-bold text-forest-950">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-pine-700 font-medium">
                      <span>Pajak Restoran ({taxRate}%)</span>
                      <span className="font-bold text-forest-950">{formatCurrency(tax)}</span>
                    </div>
                    <div className="pt-2 border-t border-pine-200 flex justify-between items-baseline">
                      <div>
                        <span className="font-serif font-bold text-base text-forest-950 block">Total Estimasi</span>
                        <span className="text-[11px] text-wood-500 font-medium italic block">
                          Estimasi, total final dari kasir
                        </span>
                      </div>
                      <span className="font-bold text-xl text-emerald-700 font-mono">
                        {formatCurrency(grandTotal)}
                      </span>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    onClick={handleCheckoutClick}
                    className="w-full justify-between shadow-warm-md"
                  >
                    <span>Lanjut ke Konfirmasi</span>
                    <ArrowRight className="w-5 h-5" />
                  </Button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        navigate('/riwayat')
                      }}
                      className="text-xs font-bold text-pine-700 hover:text-emerald-700 underline underline-offset-2 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Lihat Riwayat Pesanan</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
