import React, { useState, useEffect } from 'react'
import { usePosStore } from '../../stores/posStore'
import { useChime } from '../../hooks/useChime'
import { 
  Banknote, QrCode, CreditCard, ArrowLeftRight, CheckCircle2, 
  AlertCircle, Users, X, Calculator, Percent
} from 'lucide-react'

export function PaymentModal({ isOpen, onClose, onPaymentSuccess }) {
  const { getTotals, processCheckout, discountType, discountValue, setDiscount } = usePosStore()
  const { playSuccessChime, playAlertBeep } = useChime()

  const totals = getTotals()
  const [method, setMethod] = useState('cash') // 'cash', 'qris', 'card', 'transfer'
  const [cashTendered, setCashTendered] = useState('')
  const [splitCount, setSplitCount] = useState(1)
  const [isSplitBill, setIsSplitBill] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [discountInput, setDiscountInput] = useState(discountValue || '')
  const [discountMode, setDiscountMode] = useState(discountType === 'none' ? 'fixed' : discountType)

  useEffect(() => {
    if (isOpen) {
      setCashTendered('')
      setError(null)
      setMethod('cash')
      setIsSplitBill(false)
      setSplitCount(1)
    }
  }, [isOpen])

  if (!isOpen) return null

  const tenderedNum = Number(cashTendered) || 0
  const changeDue = Math.max(0, tenderedNum - totals.totalAmount)
  const isCashSufficient = method !== 'cash' || tenderedNum >= totals.totalAmount

  // Quick cash buttons
  const quickAmounts = [
    { label: 'Uang Pas', value: totals.totalAmount },
    { label: '20.000', value: 20000 },
    { label: '50.000', value: 50000 },
    { label: '100.000', value: 100000 },
    { label: '200.000', value: 200000 }
  ].filter(btn => btn.value >= totals.totalAmount || btn.label === 'Uang Pas')

  const handleApplyDiscount = () => {
    const val = Number(discountInput) || 0
    if (val <= 0) {
      setDiscount('none', 0)
    } else {
      setDiscount(discountMode, val)
    }
  }

  const handleConfirmPay = async () => {
    if (method === 'cash' && tenderedNum < totals.totalAmount) {
      playAlertBeep()
      setError('Nominal uang tunai yang diterima kurang!')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const order = await processCheckout({
        paymentMethod: method,
        cashTendered: method === 'cash' ? tenderedNum : null
      })
      playSuccessChime()
      onPaymentSuccess(order)
    } catch (err) {
      playAlertBeep()
      setError(err.message || 'Gagal memproses pembayaran')
    } finally {
      setLoading(false)
    }
  }

  const perPersonAmount = Math.ceil(totals.totalAmount / (splitCount || 1))

  return (
    <div className="fixed inset-0 z-50 bg-forest-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-warm-lg border border-pine-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-pine-100">
          <div>
            <h2 className="font-serif text-2xl font-bold text-forest-950">
              Proses Pembayaran (F8)
            </h2>
            <p className="text-xs text-ink-500 mt-0.5">
              Pilih metode transaksi dan selesaikan pesanan
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-ink-500 hover:bg-paper-100 hover:text-ink-900 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Grand Total Display */}
          <div className="p-6 rounded-2xl bg-forest-900 text-white flex items-center justify-between shadow-warm-md">
            <div>
              <span className="text-xs font-semibold tracking-wider text-mint-200 uppercase">
                Total Tagihan Lunas
              </span>
              <div className="font-mono text-3xl font-bold mt-1">
                Rp {totals.totalAmount.toLocaleString('id-ID')}
              </div>
              <div className="text-xs text-pine-300 mt-1">
                Subtotal: Rp {totals.subtotal.toLocaleString('id-ID')} • PPN ({totals.taxAmount > 0 ? '10%' : '0%'}): Rp {totals.taxAmount.toLocaleString('id-ID')}
              </div>
            </div>
            {totals.discountAmount > 0 && (
              <div className="text-right bg-white/10 px-3 py-1.5 rounded-xl border border-white/20">
                <span className="text-[10px] text-sun-400 font-semibold block uppercase">Diskon Aktif</span>
                <span className="font-mono text-sm font-bold text-sun-400">
                  -Rp {totals.discountAmount.toLocaleString('id-ID')}
                </span>
              </div>
            )}
          </div>

          {/* Discount Bar */}
          <div className="p-3 bg-paper-50 rounded-xl border border-pine-200 flex items-center gap-3">
            <Percent className="w-4 h-4 text-wood-500 shrink-0" />
            <div className="flex-1 flex items-center gap-2">
              <select
                value={discountMode}
                onChange={(e) => setDiscountMode(e.target.value)}
                className="text-xs bg-white border border-pine-200 rounded-lg px-2 py-1.5 text-ink-900 font-medium"
              >
                <option value="fixed">Diskon Tunai (Rp)</option>
                <option value="percentage">Diskon Persen (%)</option>
              </select>
              <input
                type="number"
                placeholder={discountMode === 'percentage' ? '10%' : '5000'}
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                className="w-28 text-xs bg-white border border-pine-200 rounded-lg px-2.5 py-1.5 text-ink-900"
              />
              <button
                type="button"
                onClick={handleApplyDiscount}
                className="text-xs bg-forest-800 text-white px-3 py-1.5 rounded-lg hover:bg-forest-900 font-medium transition cursor-pointer"
              >
                Terapkan
              </button>
            </div>
            {totals.discountAmount > 0 && (
              <button
                type="button"
                onClick={() => { setDiscount('none', 0); setDiscountInput('') }}
                className="text-xs text-red-600 hover:underline cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-700 mb-2">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-4 gap-3">
              {[
                { id: 'cash', label: 'Tunai', icon: Banknote },
                { id: 'qris', label: 'QRIS Dinamis', icon: QrCode },
                { id: 'card', label: 'Kartu / EDC', icon: CreditCard },
                { id: 'transfer', label: 'Transfer', icon: ArrowLeftRight }
              ].map(item => {
                const Icon = item.icon
                const isActive = method === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMethod(item.id)}
                    className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 transition cursor-pointer ${
                      isActive 
                        ? 'border-forest-700 bg-forest-50/50 text-forest-900 font-semibold shadow-warm-sm' 
                        : 'border-pine-200 bg-white text-ink-700 hover:bg-paper-50'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${isActive ? 'text-forest-800' : 'text-pine-500'}`} />
                    <span className="text-xs">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Cash Tendered Input */}
          {method === 'cash' && (
            <div className="space-y-4 p-5 rounded-2xl bg-paper-50 border border-pine-200">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-700 mb-2">
                  Uang Tunai Diterima (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-ink-500">
                    Rp
                  </span>
                  <input
                    type="number"
                    autoFocus
                    placeholder="Masukkan jumlah uang"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-pine-200 rounded-xl font-mono text-xl font-bold text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-700"
                  />
                </div>
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map(btn => (
                  <button
                    key={btn.label}
                    type="button"
                    onClick={() => setCashTendered(btn.value.toString())}
                    className="px-3.5 py-2 rounded-xl bg-white border border-pine-200 hover:border-forest-700 text-xs font-semibold text-forest-900 shadow-sm active:scale-95 transition cursor-pointer"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              {/* Change Calculation */}
              <div className="flex items-center justify-between pt-3 border-t border-pine-200 text-sm">
                <span className="font-medium text-ink-700">Uang Kembalian:</span>
                <span className={`font-mono text-xl font-bold ${changeDue >= 0 && tenderedNum >= totals.totalAmount ? 'text-emerald-700' : 'text-ink-400'}`}>
                  Rp {changeDue.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          )}

          {/* QRIS Dynamic Simulation */}
          {method === 'qris' && (
            <div className="p-6 rounded-2xl bg-paper-50 border border-pine-200 text-center space-y-3">
              <div className="inline-block p-4 bg-white rounded-2xl shadow-warm-md border border-pine-200">
                <QrCode className="w-32 h-32 text-forest-900 mx-auto" />
                <span className="text-[10px] text-ink-500 font-mono mt-1 block">NMID: ID1029384756</span>
              </div>
              <p className="text-xs text-ink-700">
                Arahkan pelanggan memindai QRIS di atas via BCA, Mandiri, GoPay, OVO, atau ShopeePay.
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Simulasi Verifikasi Instan Aktif</span>
              </div>
            </div>
          )}

          {/* Card / Transfer Info */}
          {(method === 'card' || method === 'transfer') && (
            <div className="p-5 rounded-2xl bg-paper-50 border border-pine-200 text-center space-y-2">
              <CreditCard className="w-8 h-8 text-forest-800 mx-auto" />
              <p className="text-sm font-semibold text-forest-950">
                {method === 'card' ? 'Gesek / Tap Kartu pada EDC' : 'Konfirmasi Transfer Rekening Toko'}
              </p>
              <p className="text-xs text-ink-500">
                Pastikan transaksi di mesin EDC atau mutasi bank berhasil sebelum mengonfirmasi pembayaran.
              </p>
            </div>
          )}

          {/* Split Bill Option */}
          <div className="p-4 rounded-xl border border-pine-200 bg-paper-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-pine-600" />
              <div>
                <span className="text-xs font-semibold text-ink-800 block">Hitung Patungan (Split Bill)</span>
                <span className="text-[10px] text-ink-500">Bagi rata tagihan per orang</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSplitCount(Math.max(1, splitCount - 1))}
                className="w-7 h-7 rounded-lg bg-white border border-pine-200 font-bold text-xs flex items-center justify-center cursor-pointer"
              >
                -
              </button>
              <span className="font-mono text-sm font-bold w-6 text-center">{splitCount}</span>
              <button
                type="button"
                onClick={() => setSplitCount(splitCount + 1)}
                className="w-7 h-7 rounded-lg bg-white border border-pine-200 font-bold text-xs flex items-center justify-center cursor-pointer"
              >
                +
              </button>
              {splitCount > 1 && (
                <span className="text-xs font-mono font-semibold text-forest-800 ml-2">
                  @ Rp {perPersonAmount.toLocaleString('id-ID')}
                </span>
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-pine-100 flex items-center justify-end gap-3 bg-paper-50/50 rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 rounded-xl border border-pine-200 text-ink-700 hover:bg-paper-100 font-medium text-sm transition cursor-pointer"
          >
            Batal (ESC)
          </button>
          <button
            type="button"
            disabled={loading || !isCashSufficient}
            onClick={handleConfirmPay}
            className="px-6 py-3 rounded-xl bg-forest-900 hover:bg-forest-800 text-white font-medium text-sm flex items-center gap-2 shadow-warm-md hover:shadow-warm-lg disabled:opacity-50 active:scale-[0.99] transition cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Selesaikan Transaksi</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
