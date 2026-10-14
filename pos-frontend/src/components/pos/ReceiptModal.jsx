import React, { useRef } from 'react'
import { Printer, CheckCircle, ArrowRight, X } from 'lucide-react'

export function ReceiptModal({ isOpen, onClose, order, storeSettings }) {
  const receiptRef = useRef(null)

  if (!isOpen || !order) return null

  const handlePrint = () => {
    window.print()
  }

  const items = order.items || []
  const subtotal = Number(order.subtotal || 0)
  const discountAmount = Number(order.discount_amount || 0)
  const taxAmount = Number(order.tax_amount || 0)
  const totalAmount = Number(order.total_amount || 0)
  const cashTendered = Number(order.cash_tendered || 0)
  const changeDue = Number(order.change_due || 0)

  return (
    <div className="fixed inset-0 z-50 bg-forest-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-warm-lg border border-pine-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 bg-forest-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-mint-200" />
            <h3 className="font-serif font-bold text-lg">Transaksi Berhasil</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-pine-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt View Container */}
        <div className="p-6 bg-paper-50 max-h-[60vh] overflow-y-auto">
          <div 
            id="thermal-receipt" 
            ref={receiptRef}
            className="bg-white p-6 rounded-xl border border-pine-200 shadow-sm font-mono text-xs text-black leading-relaxed"
          >
            {/* Store Header */}
            <div className="text-center pb-3 border-b border-dashed border-gray-400">
              <h2 className="font-bold text-sm tracking-wide uppercase">
                {storeSettings?.store_name || 'ARUNIKA COFFEE & SPACE'}
              </h2>
              <p className="text-[11px] text-gray-600 mt-0.5">
                {storeSettings?.address || 'Jl. Sambiroto Raya No. 45, Semarang'}
              </p>
              <p className="text-[10px] text-gray-500">
                Telp: {storeSettings?.phone || '0812-3456-7890'}
              </p>
            </div>

            {/* Order Info */}
            <div className="py-2.5 border-b border-dashed border-gray-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>No. Nota:</span>
                <span className="font-bold">{order.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>{new Date(order.created_at || Date.now()).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{order.user?.name || 'Kasir Arunika'}</span>
              </div>
              <div className="flex justify-between">
                <span>Tipe:</span>
                <span className="uppercase">{order.order_type || 'Dine-In'} {order.table?.table_number ? `(Meja ${order.table.table_number})` : ''}</span>
              </div>
            </div>

            {/* Item List */}
            <div className="py-3 border-b border-dashed border-gray-400 space-y-2 text-[11px]">
              {items.map((item, idx) => {
                const productName = item.product?.name || item.name || 'Menu'
                const qty = item.quantity || 1
                const unitPrice = Number(item.unit_price || item.product?.price || 0)
                const lineTotal = Number(item.subtotal || (unitPrice * qty))

                return (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between font-semibold">
                      <span>{productName}</span>
                      <span>Rp {lineTotal.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="text-[10px] text-gray-600">
                      {qty} x Rp {unitPrice.toLocaleString('id-ID')}
                    </div>
                    {item.notes && (
                      <div className="text-[9px] text-gray-500 italic pl-2">
                        * {item.notes}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Calculations */}
            <div className="py-2.5 border-b border-dashed border-gray-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Diskon:</span>
                  <span>-Rp {discountAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between">
                  <span>PPN:</span>
                  <span>Rp {taxAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-gray-200">
                <span>TOTAL:</span>
                <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="py-2.5 border-b border-dashed border-gray-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Metode:</span>
                <span className="uppercase font-semibold">{order.payment_method || 'CASH'}</span>
              </div>
              {cashTendered > 0 && (
                <>
                  <div className="flex justify-between">
                    <span>Uang Diterima:</span>
                    <span>Rp {cashTendered.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Kembalian:</span>
                    <span>Rp {changeDue.toLocaleString('id-ID')}</span>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="text-center pt-3 text-[10px] text-gray-600 space-y-0.5">
              <p className="font-medium">{storeSettings?.receipt_footer || 'Terima kasih atas kunjungan Anda!'}</p>
              <p className="text-[9px] text-gray-400">Kasir Arunika POS Suite</p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-white border-t border-pine-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-3 px-4 rounded-xl border border-forest-800 text-forest-900 font-medium text-xs flex items-center justify-center gap-2 hover:bg-forest-50 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk (Print)</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-forest-900 text-white font-medium text-xs flex items-center justify-center gap-2 hover:bg-forest-800 transition cursor-pointer shadow-warm-md"
          >
            <span>Transaksi Baru</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  )
}
