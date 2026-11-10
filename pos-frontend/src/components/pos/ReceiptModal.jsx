import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Printer, CheckCircle, ArrowRight, X, Smartphone, Monitor } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { modalBackdrop, modalContent } from '../../lib/motion'

const PAPER_STORAGE_KEY = 'arunika_receipt_paper_size'

const PAPER_PROFILES = {
  '58mm': {
    rollMm: 58,
    marginMm: 3,
    printableLabel: 'Rol 58mm • Area cetak ±52mm (32 kol)',
    previewWidthClass: 'w-[220px] max-w-full',
    paddingClass: 'p-3.5 sm:p-4',
    fontClass: 'text-[10.5px] leading-[1.42]',
    titleClass: 'text-xs',
    metaClass: 'text-[9.5px]',
    totalClass: 'text-xs',
  },
  '80mm': {
    rollMm: 80,
    marginMm: 4,
    printableLabel: 'Rol 80mm • Area cetak ±72mm (48 kol)',
    previewWidthClass: 'w-[302px] max-w-full',
    paddingClass: 'p-4 sm:p-5',
    fontClass: 'text-[11.5px] leading-[1.45]',
    titleClass: 'text-sm',
    metaClass: 'text-[10.5px]',
    totalClass: 'text-sm',
  },
}

function ReceiptPaperContent({ order, storeSettings, profile }) {
  const items = order?.items || []
  const subtotal = Number(order?.subtotal || 0)
  const discountAmount = Number(order?.discount_amount || 0)
  const taxAmount = Number(order?.tax_amount || 0)
  const totalAmount = Number(order?.total_amount || 0)
  const paymentMethod = (order?.payment_method || 'cash').toLowerCase()
  const cashTendered = Number(order?.cash_tendered || 0)
  const changeDue = Number(order?.change_due || 0)
  const isCashPayment = paymentMethod === 'cash' || cashTendered > 0
  const paidDisplayAmount = isCashPayment ? cashTendered : totalAmount

  return (
    <div
      className={`thermal-receipt-sheet bg-white rounded-xl border border-pine-200 shadow-sm font-mono text-black shrink-0 transition-all duration-200 ${profile.previewWidthClass} ${profile.paddingClass} ${profile.fontClass}`}
    >
      {/* Store Header */}
      <div className="text-center pb-2.5 border-b border-dashed border-gray-400">
        <h2 className={`font-bold tracking-wide uppercase break-words ${profile.titleClass}`}>
          {storeSettings?.store_name || 'ARUNIKA COFFEE & SPACE'}
        </h2>
        <p className={`text-gray-600 mt-0.5 break-words ${profile.metaClass}`}>
          {storeSettings?.store_address || storeSettings?.address || 'Lt. 2 Gedung Unimus Mart, Semarang'}
        </p>
        <p className={`text-gray-500 ${profile.metaClass}`}>
          Telp: {storeSettings?.store_phone || storeSettings?.phone || '0889-8572-2088'}
        </p>
      </div>

      {/* Metadata */}
      <div className={`py-2 border-b border-dashed border-gray-400 space-y-0.5 ${profile.metaClass}`}>
        <div className="flex justify-between gap-2">
          <span className="font-semibold break-all">No: {order.invoice_number}</span>
          <span className="shrink-0">{new Date(order.created_at || Date.now()).toLocaleDateString('id-ID')}</span>
        </div>
        <div className="flex justify-between gap-2 text-gray-600">
          <span className="break-words min-w-0">Kasir: {order.user?.name || 'Kasir'}</span>
          <span className="shrink-0">{new Date(order.created_at || Date.now()).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className="flex justify-between gap-2 text-gray-600">
          <span>Tipe: {order.order_type === 'dine_in' ? 'Dine In' : order.order_type === 'delivery' ? 'Delivery' : 'Takeaway'}</span>
          {order.table?.table_number && <span className="shrink-0 font-semibold">Meja: {order.table.table_number}</span>}
        </div>
        {order.customer_name && (
          <div className="flex justify-between gap-2 text-gray-800 font-semibold">
            <span>Tamu:</span>
            <span className="break-words text-right min-w-0">{order.customer_name}</span>
          </div>
        )}
      </div>

      {/* Item List */}
      <div className="py-2 border-b border-dashed border-gray-400 space-y-1.5">
        {items.map((item, idx) => {
          const mods = item.modifiers || []
          return (
            <div key={idx}>
              <div className="flex justify-between items-start gap-2 font-medium">
                <span className="break-words min-w-0 flex-1">{item.product?.name || item.name}</span>
                <span className="shrink-0 whitespace-nowrap tabular-nums">
                  Rp {Number(item.subtotal || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className={`text-gray-600 tabular-nums ${profile.metaClass}`}>
                {item.quantity} x Rp {Number(item.unit_price || 0).toLocaleString('id-ID')}
              </div>
              {mods.length > 0 && (
                <div className={`text-gray-600 pl-2 space-y-0.5 ${profile.metaClass}`}>
                  {mods.map((mod, mIdx) => {
                    const modName = mod.modifier_item?.name || mod.modifierItem?.name || mod.name || 'Varian'
                    const modPrice = Number(mod.unit_price || mod.price || 0)
                    const hasInlinePrice = /\+?\s*rp/i.test(modName)
                    return (
                      <div key={mIdx} className="flex justify-between gap-1">
                        <span className="break-words">+ {modName}</span>
                        {modPrice > 0 && !hasInlinePrice && (
                          <span className="shrink-0 tabular-nums">+Rp {modPrice.toLocaleString('id-ID')}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              {item.notes && (
                <div className={`text-gray-600 italic pl-2 break-words ${profile.metaClass}`}>
                  * {item.notes}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Totals */}
      <div className="pt-2 space-y-1">
        <div className="flex justify-between gap-2 text-gray-600 tabular-nums">
          <span>Subtotal</span>
          <span className="shrink-0">Rp {subtotal.toLocaleString('id-ID')}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between gap-2 text-gray-600 tabular-nums">
            <span>Diskon</span>
            <span className="shrink-0">-Rp {discountAmount.toLocaleString('id-ID')}</span>
          </div>
        )}
        {taxAmount > 0 && (
          <div className="flex justify-between gap-2 text-gray-600 tabular-nums">
            <span>PPN (10%)</span>
            <span className="shrink-0">Rp {taxAmount.toLocaleString('id-ID')}</span>
          </div>
        )}
        <div className={`flex justify-between gap-2 font-bold pt-1.5 border-t border-dashed border-gray-400 tabular-nums ${profile.totalClass}`}>
          <span>TOTAL</span>
          <span className="shrink-0">Rp {totalAmount.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between gap-2 text-gray-700 pt-1 tabular-nums">
          <span>Bayar ({paymentMethod.toUpperCase()})</span>
          <span className="shrink-0">Rp {paidDisplayAmount.toLocaleString('id-ID')}</span>
        </div>
        {isCashPayment ? (
          <div className="flex justify-between gap-2 text-gray-700 tabular-nums">
            <span>Kembali</span>
            <span className="shrink-0">Rp {changeDue.toLocaleString('id-ID')}</span>
          </div>
        ) : (
          <div className="flex justify-between gap-2 text-gray-700">
            <span>Status</span>
            <span className="font-bold">LUNAS</span>
          </div>
        )}
      </div>

      {/* Footer Message */}
      <div className="mt-3 pt-2.5 border-t border-dashed border-gray-400 text-center space-y-0.5">
        <p className={`font-medium break-words ${profile.metaClass}`}>
          {storeSettings?.receipt_footer || 'Terima kasih atas kunjungan Anda!'}
        </p>
        <p className="text-[9px] text-gray-500">Arunika POS Suite • arunika.coffee</p>
      </div>
    </div>
  )
}

export function ReceiptModal({ isOpen, onClose, order, storeSettings }) {
  const receiptRef = useRef(null)
  const [paperSize, setPaperSize] = useState(() => {
    try {
      const saved = localStorage.getItem(PAPER_STORAGE_KEY)
      return saved === '80mm' ? '80mm' : '58mm'
    } catch {
      return '58mm'
    }
  })
  const [printHeightMm, setPrintHeightMm] = useState(145)

  const profile = PAPER_PROFILES[paperSize] || PAPER_PROFILES['58mm']

  const handleSelectPaperSize = (size) => {
    setPaperSize(size)
    try {
      localStorage.setItem(PAPER_STORAGE_KEY, size)
    } catch {
      // Abaikan bila storage privat diblokir
    }
  }

  // Hitung tinggi riil kertas termal agar @page pas 1 halaman tanpa kertas kosong berlebih
  useLayoutEffect(() => {
    if (!isOpen || !order || !receiptRef.current) return
    const pxHeight = receiptRef.current.scrollHeight || receiptRef.current.offsetHeight || 420
    const mmHeight = Math.ceil((pxHeight * 25.4) / 96) + 12
    setPrintHeightMm(Math.max(95, mmHeight))
  }, [isOpen, order, paperSize])

  // Aktifkan scope CSS print khusus struk hanya selama ReceiptModal terbuka
  useEffect(() => {
    if (!isOpen || !order) return undefined
    document.body.classList.add('arunika-receipt-open')
    return () => {
      document.body.classList.remove('arunika-receipt-open')
    }
  }, [isOpen, order])

  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && order && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4">
            {/* Suntikkan aturan @page & lebar cetak fisik persis sesuai pilihan 58mm / 80mm */}
            <style>{`
              @media print {
                @page {
                  size: ${profile.rollMm}mm ${printHeightMm}mm;
                  margin: 0;
                }
                body.arunika-receipt-open #thermal-receipt-print-root .thermal-receipt-sheet {
                  width: ${profile.rollMm}mm !important;
                  max-width: ${profile.rollMm}mm !important;
                  padding: 3mm ${profile.marginMm}mm !important;
                }
              }
            `}</style>

            <motion.div
              variants={modalBackdrop}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={onClose}
              className="fixed inset-0 bg-forest-950/60 backdrop-blur-xs print:hidden"
            />

            <motion.div
              variants={modalContent}
              initial="initial"
              animate="animate"
              exit="exit"
              className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full max-h-[94dvh] flex flex-col shadow-warm-lg border border-pine-200 overflow-hidden relative z-10"
            >
              {/* Header */}
              <div className="p-3.5 sm:p-5 bg-forest-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <CheckCircle className="w-5 h-5 text-mint-200 shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-serif font-bold text-base sm:text-lg truncate">Transaksi Berhasil</h3>
                    <p className="text-[11px] text-pine-200 font-sans truncate">Struk siap dicetak ke printer termal</p>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-white/10 text-pine-200 cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Paper Size Selector (58mm vs 80mm) */}
              <div className="px-3.5 sm:px-4 py-2.5 bg-paper-100 border-b border-pine-200 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-forest-950 block">Ukuran Kertas Struk</span>
                  <span className="text-[10px] text-ink-500 font-mono">{profile.printableLabel}</span>
                </div>
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-pine-200 text-xs shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSelectPaperSize('58mm')}
                    className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                      paperSize === '58mm'
                        ? 'bg-forest-900 text-white shadow-2xs'
                        : 'text-ink-600 hover:text-forest-950'
                    }`}
                  >
                    <Smartphone className="w-3 h-3" />
                    <span>58mm</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPaperSize('80mm')}
                    className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                      paperSize === '80mm'
                        ? 'bg-forest-900 text-white shadow-2xs'
                        : 'text-ink-600 hover:text-forest-950'
                    }`}
                  >
                    <Monitor className="w-3 h-3" />
                    <span>80mm</span>
                  </button>
                </div>
              </div>

              {/* Receipt View Container (Screen Preview) */}
              <div className="p-3 sm:p-5 bg-paper-50 max-h-[62dvh] sm:max-h-[66dvh] overflow-y-auto overflow-x-auto flex-1 flex justify-center items-start">
                <div id="thermal-receipt" ref={receiptRef} data-paper-size={paperSize}>
                  <ReceiptPaperContent order={order} storeSettings={storeSettings} profile={profile} />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-3.5 sm:p-4 bg-white border-t border-pine-100 flex items-center justify-between gap-2.5 sm:gap-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 py-2.5 sm:py-3 px-2.5 sm:px-4 rounded-xl border border-forest-800 text-forest-900 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-forest-50 transition cursor-pointer shadow-2xs whitespace-nowrap"
                >
                  <Printer className="w-4 h-4 text-forest-800 shrink-0" />
                  <span>Cetak ({paperSize})</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl bg-forest-900 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-forest-800 transition cursor-pointer shadow-warm-md whitespace-nowrap"
                >
                  <span>Selesai</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Portal cetak terisolasi langsung di document.body agar @page 58mm/80mm tepat 1 halaman */}
      {isOpen && order && typeof document !== 'undefined' && createPortal(
        <div id="thermal-receipt-print-root" className="hidden print:block">
          <ReceiptPaperContent order={order} storeSettings={storeSettings} profile={profile} />
        </div>,
        document.body
      )}
    </>
  )
}
