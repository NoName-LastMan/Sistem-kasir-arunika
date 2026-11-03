import React, { useState, useEffect } from 'react'
import { api } from '../../api/client'
import { usePosStore } from '../../stores/posStore'
import { LayoutGrid, X, Check, Users } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { modalBackdrop, modalContent, springSnappy } from '../../lib/motion'

export function TablePickerModal({ isOpen, onClose }) {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(false)
  const { selectedTable, setSelectedTable, setOrderType } = usePosStore()

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      api.get('/tables')
        .then(res => setTables(res.data || res || []))
        .catch(() => setTables([]))
        .finally(() => setLoading(false))
    }
  }, [isOpen])

  const handleSelect = (table) => {
    setSelectedTable(table)
    setOrderType('dine_in')
    onClose()
  }

  const handleClearTable = () => {
    setSelectedTable(null)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop with Blur */}
          <motion.div 
            variants={modalBackdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-forest-950/60 backdrop-blur-xs"
          />

          {/* Modal Card with Spring Pop */}
          <motion.div 
            variants={modalContent}
            initial="initial"
            animate="animate"
            exit="exit"
            className="bg-white rounded-3xl max-w-xl w-full max-h-[88dvh] flex flex-col shadow-warm-lg border border-pine-200 overflow-hidden relative z-10"
          >
            {/* Header */}
            <div className="p-5 border-b border-pine-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <LayoutGrid className="w-5 h-5 text-forest-800" />
                <div>
                  <h3 className="font-serif font-bold text-lg text-forest-950">Denah Meja Restoran (F3)</h3>
                  <p className="text-xs text-ink-500">Pilih nomor meja untuk pesanan Dine-In</p>
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

            {/* Tables Grid */}
            <div className="p-3.5 sm:p-6 overflow-y-auto flex-1">
              {loading ? (
                <div className="py-12 text-center text-ink-400 text-xs">Memuat denah meja...</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
                  {tables.map((table) => {
                    const isSelected = selectedTable?.id === table.id
                    const isOccupied = table.status === 'occupied'

                    return (
                      <motion.button
                        key={table.id}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        onClick={() => handleSelect(table)}
                        className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-center transition cursor-pointer relative ${
                          isSelected
                            ? 'bg-forest-900 border-forest-900 text-white shadow-warm-sm'
                            : isOccupied
                            ? 'bg-amber-50 border-amber-300 text-amber-900'
                            : 'bg-paper-50 border-pine-200 text-forest-950 hover:bg-white hover:border-forest-700'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-sun-400 text-forest-950 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                        <span className="font-mono text-2xl font-bold block mb-1">
                          {table.table_number}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] opacity-75 font-medium">
                          <Users className="w-3 h-3" />
                          <span>{table.capacity || 4} Kursi</span>
                        </div>
                        <span className={`mt-2 text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-forest-800 text-mint-100'
                            : isOccupied
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-pine-100 text-pine-700'
                        }`}>
                          {isOccupied ? 'Terisi' : 'Kosong'}
                        </span>
                      </motion.button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-pine-100 bg-paper-50 flex items-center justify-between">
              <button
                type="button"
                onClick={handleClearTable}
                className="text-xs font-semibold text-red-600 hover:text-red-700 cursor-pointer"
              >
                Hapus Pilihan Meja (Bungkus)
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-forest-900 text-white text-xs font-semibold hover:bg-forest-800 transition cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
