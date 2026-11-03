import React, { useState, useEffect } from 'react'
import { api } from '../../api/client'
import { usePosStore } from '../../stores/posStore'
import { Bookmark, Clock, Trash2, ArrowRight, X, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { modalBackdrop, modalContent, springSnappy } from '../../lib/motion'

export function HeldOrdersModal({ isOpen, onClose }) {
  const [heldOrders, setHeldOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { resumeHeldOrder } = usePosStore()

  const fetchHeldOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/orders/held')
      setHeldOrders(res.data || res || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchHeldOrders()
    }
  }, [isOpen])

  const handleResume = async (order) => {
    resumeHeldOrder(order)
    try {
      await api.delete(`/orders/held/${order.id}`)
    } catch {
      // ignore
    }
    onClose()
  }

  const handleDelete = async (orderId) => {
    if (!window.confirm('Hapus transaksi tertunda ini?')) return
    try {
      await api.delete(`/orders/held/${orderId}`)
      setHeldOrders(heldOrders.filter(o => o.id !== orderId))
    } catch (err) {
      alert(err.message)
    }
  }

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
            className="bg-white rounded-3xl max-w-lg w-full max-h-[88dvh] flex flex-col shadow-warm-lg border border-pine-200 overflow-hidden relative z-10"
          >
            {/* Header */}
            <div className="p-5 border-b border-pine-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Bookmark className="w-5 h-5 text-wood-500" />
                <div>
                  <h3 className="font-serif font-bold text-lg text-forest-950">Pesanan Tertunda (F7)</h3>
                  <p className="text-xs text-ink-500">Daftar transaksi yang disimpan sementara (Hold Order)</p>
                </div>
              </div>
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={onClose} 
                className="p-1.5 rounded-lg hover:bg-paper-100 text-ink-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="p-3.5 sm:p-5 overflow-y-auto flex-1 space-y-3">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {loading ? (
                <div className="py-12 text-center text-ink-400 text-xs">Memuat data pesanan tertunda...</div>
              ) : heldOrders.length === 0 ? (
                <div className="py-12 text-center text-ink-400 text-xs space-y-2">
                  <Bookmark className="w-8 h-8 text-pine-300 mx-auto" />
                  <p>Tidak ada transaksi tertunda saat ini.</p>
                </div>
              ) : (
                heldOrders.map((order) => {
                  const itemCount = (order.items || []).reduce((acc, item) => acc + (item.quantity || 1), 0)
                  return (
                    <motion.div
                      key={order.id}
                      whileHover={{ y: -2 }}
                      transition={springSnappy}
                      className="p-4 rounded-2xl border border-pine-200 bg-paper-50 hover:border-forest-700 transition space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-forest-950">
                          {order.customer_name || 'Pelanggan'}
                        </span>
                        <span className="text-xs font-mono text-ink-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-pine-500" />
                          {new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="text-xs text-ink-600 flex items-center justify-between">
                        <span>{itemCount} Menu dipesan</span>
                        <span className="font-mono font-bold text-forest-900">
                          Rp {Number(order.total_amount || 0).toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="pt-2 flex items-center justify-end gap-2 border-t border-pine-200/60">
                        <button
                          type="button"
                          onClick={() => handleDelete(order.id)}
                          className="p-2 rounded-xl text-red-600 hover:bg-red-50 transition cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          type="button"
                          onClick={() => handleResume(order)}
                          className="py-1.5 px-3.5 rounded-xl bg-forest-900 text-white text-xs font-medium flex items-center gap-1.5 hover:bg-forest-800 transition cursor-pointer"
                        >
                          <span>Lanjutkan Pesanan</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
