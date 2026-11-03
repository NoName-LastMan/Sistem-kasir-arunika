import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ShoppingBag, QrCode, CreditCard, AlertCircle,
  ArrowRight, ArrowLeft, RefreshCw, CheckCircle2
} from 'lucide-react'
import { useCartStore, selectCartSubtotal } from '../store/cartStore'
import { useOrderStore } from '../store/orderStore'
import { useSettingsStore } from '../store/settingsStore'
import { CartItemRow } from '../components/cart/CartItemRow'
import { Button } from '../components/ui/Button'
import { formatCurrency } from '../api/mappers'
import { motion, AnimatePresence } from 'framer-motion'
import { cartItemVariant, springSnappy, fadeUp } from '../lib/motion'

export function CartPage() {
  const navigate = useNavigate()

  const items = useCartStore(state => state.items)
  const tableCode = useCartStore(state => state.tableCode)
  const customerName = useCartStore(state => state.customerName)
  const notes = useCartStore(state => state.notes)
  const updateQuantity = useCartStore(state => state.updateQuantity)
  const removeItem = useCartStore(state => state.removeItem)
  const clearCart = useCartStore(state => state.clearCart)
  const setTableCode = useCartStore(state => state.setTableCode)
  const setCustomerName = useCartStore(state => state.setCustomerName)
  const setNotes = useCartStore(state => state.setNotes)

  const submitOrder = useOrderStore(state => state.submitOrder)
  const isSubmitting = useOrderStore(state => state.isSubmitting)
  const orderError = useOrderStore(state => state.error)
  const settings = useSettingsStore(state => state.settings)

  const taxRate = settings?.taxRate ?? 10
  const subtotal = useCartStore(selectCartSubtotal)
  const tax = Math.round((subtotal * (Number(taxRate) || 0)) / 100)
  const grandTotal = subtotal + tax

  const [paymentMethod, setPaymentMethod] = useState('pay_at_cashier')
  const [validationError, setValidationError] = useState('')

  // Submit pesanan tamu
  const handleConfirmOrder = async (e) => {
    e.preventDefault()
    setValidationError('')

    if (items.length === 0) {
      setValidationError('Keranjang belanja Anda masih kosong.')
      return
    }

    if (!customerName.trim()) {
      setValidationError('Harap masukkan nama pemesan untuk panggilan pesanan.')
      return
    }

    try {
      const order = await submitOrder({
        tableCode: tableCode || 'Counter',
        customerName: customerName.trim(),
        items,
        notes: notes.trim(),
        subtotal,
        tax,
        total: grandTotal,
        paymentMethod
      })

      clearCart()
      navigate(`/pesanan/${order.invoiceNumber || order.id}`)
    } catch {
      // Error disimpan di state orderStore
    }
  }

  // Jika keranjang kosong
  if (items.length === 0) {
    return (
      <div className="py-20 max-w-2xl mx-auto px-4 text-center">
        <motion.div 
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="w-16 h-16 rounded-2xl bg-mint-100 flex items-center justify-center text-emerald-600 mx-auto mb-4"
        >
          <ShoppingBag className="w-8 h-8 opacity-60" />
        </motion.div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-forest-950 mb-2">
          Keranjang belanja kosong
        </h1>
        <p className="text-sm text-pine-700 mb-8 max-w-md mx-auto font-normal">
          Anda belum memilih menu apa pun. Silakan lihat katalog menu untuk memesan kopi dan makanan hangat.
        </p>
        <Link to="/menu">
          <Button size="lg" className="font-bold shadow-warm-sm">
            <span>Buka Katalog Menu</span>
            <ArrowRight className="w-5 h-5 ml-1" />
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="py-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Tombol Kembali ke Menu */}
      <div className="mb-6">
        <Link
          to="/menu"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-pine-700 hover:text-forest-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tambah menu lainnya</span>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-forest-950 mb-2">
          Konfirmasi pesanan
        </h1>
        <p className="text-pine-700 text-sm font-normal">
          Periksa kembali pesanan Anda sebelum dikirim ke antrean kasir dan dapur.
        </p>
      </div>

      <form onSubmit={handleConfirmOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Kolom Kiri: Rincian Item Keranjang & Informasi Pemesan */}
        <div className="lg:col-span-7 space-y-6">
          {/* Kartu Daftar Item */}
          <div className="bg-white rounded-2xl p-6 border-2 border-pine-200 shadow-warm-sm">
            <h2 className="font-serif font-bold text-lg text-forest-900 mb-4 pb-3 border-b-2 border-pine-200">
              Daftar Pesanan ({items.length} Menu)
            </h2>

            <div className="divide-y divide-pine-200">
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
            </div>
          </div>

          {/* Kartu Informasi Pemesan */}
          <div className="bg-white rounded-2xl p-6 border-2 border-pine-200 shadow-warm-sm space-y-4">
            <h2 className="font-serif font-bold text-lg text-forest-900 pb-3 border-b-2 border-pine-200">
              Informasi Meja & Pemesan
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="customer-name" className="block text-xs font-bold text-forest-950 mb-1.5">
                  Nama Anda / Pemesan <span className="text-red-600">*</span>
                </label>
                <input
                  id="customer-name"
                  type="text"
                  required
                  placeholder="Contoh: Rian, Dini"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-pine-200 bg-white text-forest-950 text-sm focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>

              <div>
                <label htmlFor="table-code" className="block text-xs font-bold text-forest-950 mb-1.5">
                  Nomor Meja Anda
                </label>
                <input
                  id="table-code"
                  type="text"
                  placeholder="Contoh: 04, B2, Meja Bar"
                  value={tableCode}
                  onChange={(e) => setTableCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-pine-200 bg-white text-forest-950 text-sm focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>
            </div>

            <div>
              <label htmlFor="order-notes" className="block text-xs font-bold text-forest-950 mb-1.5">
                Catatan Keseluruhan (Opsional)
              </label>
              <textarea
                id="order-notes"
                rows={2}
                placeholder="Contoh: Tolong disajikan bersamaan, sediakan sedotan ramah lingkungan..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border-2 border-pine-200 bg-white text-forest-950 text-sm focus:outline-none focus:border-emerald-600 font-medium resize-none"
              />
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Rincian Pembayaran & Tombol Final */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-6 border-2 border-pine-200 shadow-warm-md sticky top-24 space-y-5">
            <h2 className="font-serif font-bold text-lg text-forest-900 pb-3 border-b-2 border-pine-200">
              Rincian Pembayaran
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-pine-700 font-medium">
                <span>Subtotal Menu</span>
                <span className="font-bold text-forest-950">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-pine-700 font-medium">
                <span>Pajak Restoran ({taxRate}%)</span>
                <span className="font-bold text-forest-950">{formatCurrency(tax)}</span>
              </div>
              <div className="pt-3 border-t-2 border-pine-200 flex justify-between items-baseline">
                <div>
                  <span className="font-serif font-bold text-lg text-forest-950 block">Total Estimasi</span>
                  <span className="text-[11px] text-wood-500 font-medium italic block">
                    Total final divalidasi saat bayar di kasir
                  </span>
                </div>
                <span className="font-bold text-2xl text-emerald-800 font-mono">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>

            {/* Metode Bayar Pelanggan */}
            <div className="space-y-2.5 pt-2 border-t-2 border-pine-200">
              <span className="block text-xs font-bold text-forest-950">
                Metode Pembayaran
              </span>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border-2 border-emerald-600 bg-mint-100 cursor-pointer shadow-2xs transition-all btn-press">
                <input
                  type="radio"
                  name="payment_method"
                  value="pay_at_cashier"
                  checked={paymentMethod === 'pay_at_cashier'}
                  onChange={() => setPaymentMethod('pay_at_cashier')}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-600"
                />
                <div>
                  <span className="text-sm font-bold text-forest-950 block">
                    Bayar di Counter Kasir (Default)
                  </span>
                  <span className="text-xs text-pine-700 block mt-0.5 leading-relaxed font-normal">
                    Kirim pesanan dari meja, lalu selesaikan pembayaran di kasir dengan Tunai, QRIS, atau Kartu.
                  </span>
                </div>
              </label>

              {/* Opsi QRIS Langsung */}
              <div className="p-3 rounded-xl border-2 border-dashed border-pine-300 bg-paper-100 text-xs text-forest-950 flex items-center justify-between font-medium">
                <span>QRIS Otomatis dari Meja</span>
                <span className="bg-forest-950 text-white font-bold px-2 py-0.5 rounded text-[10px]">
                  Konfirmasi di Kasir
                </span>
              </div>
            </div>

            {/* Alert Error Jika Ada */}
            <AnimatePresence>
              {(validationError || orderError) && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3.5 rounded-xl bg-red-50 border-2 border-red-300 text-red-900 text-xs flex items-start gap-2.5 overflow-hidden"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <div className="flex-1 font-medium">
                    <span>{validationError || orderError}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tombol Kirim Pesanan dengan Anti-Double-Submit */}
            <Button
              type="submit"
              size="lg"
              loading={isSubmitting}
              disabled={isSubmitting}
              className="w-full justify-center font-bold shadow-warm-sm"
            >
              <span>Kirim Pesanan ke Kasir</span>
              {!isSubmitting && <ArrowRight className="w-5 h-5 ml-1" />}
            </Button>

            <p className="text-[11px] text-center text-pine-600 font-medium leading-relaxed">
              Dengan mengirim pesanan, tiket order Anda akan tercatat di sistem kasir dan siap diverifikasi.
            </p>
          </div>
        </div>
      </form>
    </div>
  )
}
