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
        notes: notes.trim()
      })

      if (order && order.id) {
        // Bersihkan keranjang belanja setelah sukses kirim
        clearCart()
        // Arahkan ke halaman pelacakan pesanan
        navigate(`/pesanan/${order.id}`)
      }
    } catch (err) {
      // Error sudah ditangani di store, keranjang belanja TIDAK hilang
      console.error('Gagal membuat pesanan:', err)
    }
  }

  // Jika keranjang kosong
  if (items.length === 0) {
    return (
      <div className="py-20 max-w-xl mx-auto px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-mint-100 flex items-center justify-center text-emerald-600 mx-auto mb-4">
          <ShoppingBag className="w-8 h-8 opacity-60" />
        </div>
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
              {items.map(item => (
                <CartItemRow
                  key={item.itemKey}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </div>
          </div>

          {/* Kartu Informasi Pelanggan & Meja */}
          <div className="bg-white rounded-2xl p-6 border-2 border-pine-200 shadow-warm-sm space-y-4">
            <h2 className="font-serif font-bold text-lg text-forest-900 pb-3 border-b-2 border-pine-200">
              Informasi Pemesan
            </h2>

            <div>
              <label htmlFor="customer-name" className="block text-xs font-bold text-forest-950 mb-1.5">
                Nama Pemesan <span className="text-red-600">*</span>
              </label>
              <input
                id="customer-name"
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nama Anda untuk panggilan pesanan"
                className="w-full px-4 py-2.5 rounded-xl bg-paper-50 border-2 border-pine-200 text-sm text-forest-950 placeholder:text-pine-500 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label htmlFor="table-code" className="block text-xs font-bold text-forest-950 mb-1.5">
                Nomor Meja (Dari QR Code Meja)
              </label>
              <div className="flex gap-2">
                <input
                  id="table-code"
                  type="text"
                  value={tableCode}
                  onChange={(e) => setTableCode(e.target.value)}
                  placeholder="Contoh: 07, 03, atau kosongkan jika di counter"
                  className="w-full px-4 py-2.5 rounded-xl bg-paper-50 border-2 border-pine-200 text-sm text-forest-950 placeholder:text-pine-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono font-bold"
                />
              </div>
              <p className="text-xs text-pine-600 font-medium mt-1">
                Jika Anda memesan langsung di counter kasir, nomor meja dapat dikosongkan.
              </p>
            </div>

            <div>
              <label htmlFor="order-notes" className="block text-xs font-bold text-forest-950 mb-1.5">
                Catatan Keseluruhan Pesanan (Opsional)
              </label>
              <textarea
                id="order-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan tambahan untuk pelayan atau koki..."
                className="w-full px-4 py-2 rounded-xl bg-paper-50 border-2 border-pine-200 text-sm text-forest-950 placeholder:text-pine-500 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Ringkasan Biaya, Metode Bayar & Tombol Aksi */}
        <div className="lg:col-span-5 space-y-6">
          {/* Kartu Ringkasan Harga Server-Aligned */}
          <div className="bg-white rounded-2xl p-6 border-2 border-pine-200 shadow-warm-sm space-y-4">
            <h2 className="font-serif font-bold text-lg text-forest-950 pb-3 border-b-2 border-pine-200">
              Ringkasan Pembayaran
            </h2>

            <div className="space-y-2.5 text-sm">
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
                  <span className="font-serif font-bold text-base text-forest-950 block">Total Estimasi</span>
                  <span className="text-[11px] text-wood-500 font-medium italic block">
                    Estimasi, total final dari kasir
                  </span>
                </div>
                <span className="font-bold text-2xl text-emerald-700">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>

            {/* Pilihan Metode Bayar (Default Alur Toko F&B) */}
            <div className="pt-4 border-t-2 border-pine-200 space-y-2">
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

              {/* Opsi QRIS Langsung (Siap di balik flag / petunjuk) */}
              <div className="p-3 rounded-xl border-2 border-dashed border-pine-300 bg-paper-100 text-xs text-forest-950 flex items-center justify-between font-medium">
                <span>QRIS Otomatis dari Meja</span>
                <span className="bg-forest-950 text-white font-bold px-2 py-0.5 rounded text-[10px]">
                  Konfirmasi di Kasir
                </span>
              </div>
            </div>

            {/* Alert Error Jika Ada */}
            {(validationError || orderError) && (
              <div className="p-3.5 rounded-xl bg-red-50 border-2 border-red-300 text-red-900 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <div className="flex-1 font-medium">
                  <span>{validationError || orderError}</span>
                </div>
              </div>
            )}

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
