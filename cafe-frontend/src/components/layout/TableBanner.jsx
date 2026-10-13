import React, { useState } from 'react'
import { QrCode, X, Edit3, Check } from 'lucide-react'
import { useCartStore } from '../../store/cartStore'

export function TableBanner() {
  const tableCode = useCartStore(state => state.tableCode)
  const setTableCode = useCartStore(state => state.setTableCode)
  const [isEditing, setIsEditing] = useState(false)
  const [newCode, setNewCode] = useState(tableCode || '')

  if (!tableCode && !isEditing) return null

  const handleSave = (e) => {
    e.preventDefault()
    setTableCode(newCode.trim())
    setIsEditing(false)
  }

  return (
    <div className="bg-forest-950 text-white px-4 py-2 border-b-2 border-sun-400 text-xs transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-leaf-500 animate-pulse shrink-0" />
          <QrCode className="w-4 h-4 text-sun-400 shrink-0" />
          {isEditing ? (
            <form onSubmit={handleSave} className="flex items-center gap-2">
              <span>Nomor Meja:</span>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="Contoh: 07"
                className="w-16 px-2 py-0.5 rounded bg-white text-forest-900 font-bold text-xs"
                autoFocus
              />
              <button
                type="submit"
                className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                aria-label="Simpan nomor meja"
              >
                <Check className="w-3 h-3" />
              </button>
            </form>
          ) : (
            <span className="font-medium text-white">
              Anda terhubung ke <span className="bg-sun-400 text-forest-950 px-2 py-0.5 rounded font-bold mx-1">Meja {tableCode}</span> — Pesanan diantar langsung ke meja Anda.
            </span>
          )}
        </div>

        {!isEditing && (
          <button
            onClick={() => {
              setNewCode(tableCode || '')
              setIsEditing(true)
            }}
            type="button"
            className="text-sun-400 hover:text-white underline underline-offset-2 flex items-center gap-1 font-medium shrink-0"
          >
            <Edit3 className="w-3 h-3" />
            <span>Ganti</span>
          </button>
        )}
      </div>
    </div>
  )
}
