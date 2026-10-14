import React, { useState, useEffect } from 'react'
import { api } from '../../api/client'
import { usePosStore } from '../../stores/posStore'
import { LayoutGrid, X, Check, Users } from 'lucide-react'

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

  if (!isOpen) return null

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
    <div className="fixed inset-0 z-50 bg-forest-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-warm-lg border border-pine-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-pine-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LayoutGrid className="w-5 h-5 text-forest-800" />
            <div>
              <h3 className="font-serif font-bold text-lg text-forest-950">Denah Meja Restoran (F3)</h3>
              <p className="text-xs text-ink-500">Pilih nomor meja untuk pesanan Dine-In</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-paper-100 text-ink-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tables Grid */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-12 text-center text-ink-400 text-xs">Memuat denah meja...</div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {tables.map((table) => {
                const isSelected = selectedTable?.id === table.id
                const isOccupied = table.status === 'occupied'

                return (
                  <button
                    key={table.id}
                    type="button"
                    onClick={() => handleSelect(table)}
                    className={`p-4 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'border-forest-800 bg-forest-900 text-white shadow-warm-md'
                        : isOccupied
                        ? 'border-amber-300 bg-amber-50 text-amber-900 hover:border-amber-400'
                        : 'border-pine-200 bg-paper-50 hover:border-forest-700 text-forest-950'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">
                      Meja
                    </span>
                    <span className="font-mono text-xl font-bold">
                      {table.table_number || table.number || table.name}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] opacity-80 mt-1">
                      <Users className="w-3 h-3" />
                      <span>{table.capacity || 4} Kursi</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-paper-50 border-t border-pine-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleClearTable}
            className="text-xs text-red-600 font-medium hover:underline cursor-pointer"
          >
            Hapus Pilihan Meja (Tanpa Meja / Takeaway)
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-pine-200 text-xs font-semibold rounded-xl text-ink-700 hover:bg-paper-100 cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  )
}
