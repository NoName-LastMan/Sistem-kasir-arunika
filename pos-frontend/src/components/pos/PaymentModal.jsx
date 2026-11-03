import React, { useState, useEffect } from 'react'
import { usePosStore } from '../../stores/posStore'
import { useChime } from '../../hooks/useChime'
import { 
  Banknote, QrCode, CreditCard, ArrowLeftRight, CheckCircle2, 
  AlertCircle, Users, X, Calculator, Percent
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { modalBackdrop, modalContent, springSnappy } from '../../lib/motion'

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
      const paymentData = {
        payment_method: method,
        cash_tendered: method === 'cash' ? tenderedNum : totals.totalAmount,
        change_due: method === 'cash' ? changeDue : 0,
        is_split_bill: isSplitBill,
        split_count: splitCount
      }

      const res = await processCheckout(paymentData)

      if (res && res.success) {
        playSuccessChime()
        onPaymentSuccess(res.order)
        onClose()
      } else {
        playAlertBeep()
        setError(res?.error || 'Gagal memproses pembayaran.')
      }
    } catch (err) {
      playAlertBeep()
      setError(err?.response?.data?.message || err?.message || 'Terjadi kendala saat memproses transaksi.')
    } finally {
      setLoading(false)
    }
  }

  const perPersonAmount = Math.ceil(totals.totalAmount / (splitCount || 1))
  const perPersonCashRounded = Math.ceil(perPersonAmount / 500) * 500

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <motion.div 
            variants={modalBackdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-forest-950/60 backdrop-blur-xs"
          />

          <motion.div 
            variants={modalContent}
            initial="initial"
            animate="animate"
            exit="exit"
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90dvh] flex flex-col overflow-hidden shadow-warm-lg border border-pine-200 relative z-10"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-pine-100 shrink-0">
              <div>
                <h2 className="font-serif text-2xl font-bold text-forest-950">
                  Proses Pembayaran (F8)
                </h2>
                <p className="text-xs text-ink-500 mt-0.5">
                  Pilih metode transaksi dan selesaikan pesanan
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-xl text-ink-500 hover:bg-paper-100 hover:text-ink-900 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 overflow-y-auto flex-1">
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-sm">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleApplyDiscount}
                    className="text-xs bg-forest-800 text-white px-3 py-1.5 rounded-lg hover:bg-forest-900 font-medium transition cursor-pointer"
                  >
                    Terapkan
                  </motion.button>
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                  {[
                    { id: 'cash', label: 'Tunai', icon: Banknote },
                    { id: 'qris', label: 'QRIS Dinamis', icon: QrCode },
                    { id: 'card', label: 'Kartu / EDC', icon: CreditCard },
                    { id: 'transfer', label: 'Transfer', icon: ArrowLeftRight }
                  ].map(item => {
                    const Icon = item.icon
                    const isActive = method === item.id
                    return (
                      <motion.button
                        key={item.id}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.96 }}
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
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* Cash Tendered Input */}
              {method === 'cash' && (
                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 p-5 rounded-2xl bg-paper-50 border border-pine-200"
                >
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
                        value={cashTendered}
                        onChange={(e) => setCashTendered(e.target.value)}
                        placeholder="0"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-pine-200 bg-white font-mono text-xl font-bold text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-700 transition"
                      />
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {quickAmounts.map((btn, i) => (
                      <motion.button
                        key={i}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => setCashTendered(btn.value.toString())}
                        className="py-1.5 px-3 rounded-lg border border-pine-200 bg-white hover:bg-forest-900 hover:text-white hover:border-forest-900 font-mono text-xs font-semibold text-forest-900 transition cursor-pointer"
                      >
                        {btn.label}
                      </motion.button>
                    ))}
                  </div>

                  {/* Kembalian Visual Box */}
                  <div className="p-4 rounded-xl bg-white border border-pine-200 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-ink-700">
                      Uang Kembalian
                    </span>
                    <span className={`font-mono text-xl font-bold ${changeDue > 0 ? 'text-forest-900' : 'text-ink-400'}`}>
                      Rp {changeDue.toLocaleString('id-ID')}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* QRIS View */}
              {method === 'qris' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 rounded-2xl bg-paper-50 border border-pine-200 flex flex-col items-center justify-center text-center space-y-3"
                >
                  <div className="p-4 bg-white rounded-2xl shadow-warm-sm border border-pine-200">
                    <QrCode className="w-36 h-36 text-forest-950" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-forest-950 block">Scan QRIS Dinamis Restoran</span>
                    <span className="text-xs text-ink-500">Mendukung BCA, Mandiri, GoPay, OVO, ShopeePay & Dana</span>
                  </div>
                </motion.div>
              )}

              {/* Split Bill Toggle */}
              <div className="p-4 rounded-2xl bg-paper-50 border border-pine-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-pine-600" />
                  <div>
                    <span className="text-xs font-semibold text-forest-950 block">Pisah Tagihan (Split Bill)</span>
                    <span className="text-[11px] text-ink-500">Bagi rata nominal pembayaran per orang</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSplitBill(!isSplitBill)}
                    className={`w-11 h-6 rounded-full transition-colors p-1 cursor-pointer ${
                      isSplitBill ? 'bg-forest-800' : 'bg-pine-200'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      isSplitBill ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>

              {isSplitBill && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 rounded-xl bg-mint-100/50 border border-mint-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-forest-950 font-medium">Bagi untuk:</span>
                    <select
                      value={splitCount}
                      onChange={(e) => setSplitCount(Number(e.target.value))}
                      className="bg-white border border-pine-200 rounded-lg px-2 py-1 text-xs font-bold text-forest-950"
                    >
                      {[2, 3, 4, 5, 6, 8, 10].map(n => (
                        <option key={n} value={n}>{n} Orang</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="font-mono text-sm font-bold text-forest-900">
                      @ Rp {perPersonAmount.toLocaleString('id-ID')}
                    </span>
                    {method === 'cash' && perPersonCashRounded !== perPersonAmount && (
                      <span className="text-[10px] text-pine-600 font-medium">
                        (Tunai: Rp {perPersonCashRounded.toLocaleString('id-ID')})
                      </span>
                    )}
                  </div>
                </motion.div>
              )}

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
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="button"
                disabled={loading || !isCashSufficient}
                onClick={handleConfirmPay}
                className="px-6 py-3 rounded-xl bg-forest-900 hover:bg-forest-800 text-white font-medium text-sm flex items-center gap-2 shadow-warm-md hover:shadow-warm-lg disabled:opacity-50 transition cursor-pointer"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Memproses Transaksi...</span>
                  </div>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Selesaikan Transaksi</span>
                  </>
                )}
              </motion.button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
