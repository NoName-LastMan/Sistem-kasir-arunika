import React, { useRef, useState } from 'react'
import { Printer, CheckCircle, ArrowRight, X, Smartphone, Monitor } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { modalBackdrop, modalContent } from '../../lib/motion'

export function ReceiptModal({ isOpen, onClose, order, storeSettings }) {
  const receiptRef = useRef(null)
  const [paperSize, setPaperSize] = useState('58mm') // '58mm' | '80mm'

  const handlePrint = () => {
    window.print()
  }

  const items = order?.items || []
  const subtotal = Number(order?.subtotal || 0)
  const discountAmount = Number(order?.discount_amount || 0)
  const taxAmount = Number(order?.tax_amount || 0)
  const totalAmount = Number(order?.total_amount || 0)
  const cashTendered = Number(order?.cash_tendered || 0)
  const changeDue = Number(order?.change_due || 0)

  return (
    <AnimatePresence>
      {isOpen && order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
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
            className="bg-white rounded-3xl max-w-md w-full max-h-[92dvh] flex flex-col shadow-warm-lg border border-pine-200 overflow-hidden relative z-10 print:m-0 print:p-0 print:border-none print:shadow-none print:max-w-none print:w-auto"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 bg-forest-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-5 h-5 text-mint-200" />
                <div>
                  <h3 className="font-serif font-bold text-base sm:text-lg">Transaksi Berhasil</h3>
                  <p className="text-[11px] text-pine-200 font-sans">Struk siap dicetak ke printer termal</p>
                </div>
              </div>
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={onClose} 
                className="p-1 rounded-lg hover:bg-white/10 text-pine-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Paper Size Selector (58mm vs 80mm) */}
            <div className="px-4 py-2 bg-paper-100 border-b border-pine-200 flex items-center justify-between print:hidden">
              <span className="text-[11px] font-bold text-forest-950">Ukuran Kertas:</span>
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-pine-200 text-xs">
                <button
                  type="button"
                  onClick={() => setPaperSize('58mm')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                    paperSize === '58mm'
                      ? 'bg-forest-900 text-white shadow-2xs'
                      : 'text-ink-600 hover:text-forest-950'
                  }`}
                >
                  <Smartphone className="w-3 h-3" />
                  <span>58mm (Mini)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaperSize('80mm')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                    paperSize === '80mm'
                      ? 'bg-forest-900 text-white shadow-2xs'
                      : 'text-ink-600 hover:text-forest-950'
                  }`}
                >
                  <Monitor className="w-3 h-3" />
                  <span>80mm (Standar)</span>
                </button>
              </div>
            </div>

            {/* Receipt View Container */}
            <div className="p-4 sm:p-6 bg-paper-50 max-h-[58dvh] overflow-y-auto flex-1 flex justify-center print:p-0 print:m-0 print:max-h-none print:bg-white">
              <div 
                id="thermal-receipt" 
                ref={receiptRef}
                className={`bg-white p-5 sm:p-6 rounded-xl border border-pine-200 shadow-sm font-mono text-xs text-black leading-relaxed transition-all duration-200 print:border-none print:shadow-none print:p-0 ${
                  paperSize === '58mm' ? 'w-[280px] text-[11px]' : 'w-[360px] text-xs'
                }`}
              >
                {/* Store Header */}
                <div className="text-center pb-3 border-b border-dashed border-gray-400">
                  <h2 className="font-bold text-sm tracking-wide uppercase">
                    {storeSettings?.store_name || 'ARUNIKA COFFEE & SPACE'}
                  </h2>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    {storeSettings?.store_address || storeSettings?.address || 'Lt. 2 Gedung Unimus Mart, Semarang'}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    Telp: {storeSettings?.store_phone || storeSettings?.phone || '0889-8572-2088'}
                  </p>
                </div>

                {/* Metadata */}
                <div className="py-2 border-b border-dashed border-gray-400 text-[11px] space-y-0.5">
                  <div className="flex justify-between">
                    <span>No: {order.invoice_number}</span>
                    <span>{new Date(order.created_at || Date.now()).toLocaleDateString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Kasir: {order.user?.name || 'Kasir'}</span>
                    <span>{new Date(order.created_at || Date.now()).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tipe: {order.order_type === 'dine_in' ? 'Dine In' : 'Takeaway'}</span>
                    {order.table?.table_number && <span>Meja: {order.table.table_number}</span>}
                  </div>
                  {order.customer_name && (
                    <div className="flex justify-between text-gray-700 font-semibold">
                      <span>Tamu:</span>
                      <span>{order.customer_name}</span>
                    </div>
                  )}
                </div>

                {/* Item List */}
                <div className="py-2 border-b border-dashed border-gray-400 space-y-1.5">
                  {items.map((item, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between font-medium">
                        <span className="truncate pr-2">{item.product?.name || item.name}</span>
                        <span>Rp {Number(item.subtotal || 0).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {item.quantity} x Rp {Number(item.unit_price || 0).toLocaleString('id-ID')}
                      </div>
                      {item.notes && (
                        <div className="text-[10px] text-gray-500 italic pl-2">
                          * {item.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="pt-2 space-y-1 text-right">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Diskon:</span>
                      <span>-Rp {discountAmount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  {taxAmount > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>PPN (10%):</span>
                      <span>Rp {taxAmount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm pt-1 border-t border-dashed border-gray-400">
                    <span>TOTAL:</span>
                    <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 pt-1">
                    <span>Bayar ({order.payment_method?.toUpperCase()}):</span>
                    <span>Rp {cashTendered.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Kembali:</span>
                    <span>Rp {changeDue.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Footer Message */}
                <div className="mt-3 pt-2.5 border-t border-dashed border-gray-400 text-center space-y-0.5">
                  <p className="font-medium text-[11px]">{storeSettings?.receipt_footer || 'Terima kasih atas kunjungan Anda!'}</p>
                  <p className="text-[9px] text-gray-400">Arunika POS Suite • arunika.coffee</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-white border-t border-pine-100 flex items-center justify-between gap-3 print:hidden">
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={handlePrint}
                className="flex-1 py-3 px-4 rounded-xl border border-forest-800 text-forest-900 font-bold text-xs flex items-center justify-center gap-2 hover:bg-forest-50 transition cursor-pointer shadow-2xs"
              >
                <Printer className="w-4 h-4 text-forest-800" />
                <span>Cetak Struk ({paperSize})</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl bg-forest-900 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-forest-800 transition cursor-pointer shadow-warm-md"
              >
                <span>Selesai</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
