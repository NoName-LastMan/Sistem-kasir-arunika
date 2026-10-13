import React from 'react'
import { Plus, Minus, Trash2 } from 'lucide-react'
import { formatCurrency } from '../../api/mappers'

export function CartItemRow({ item, onUpdateQuantity, onRemove }) {
  const { itemKey, name, unitPrice, quantity, modifiers, notes } = item
  const itemSubtotal = unitPrice * quantity

  return (
    <div className="py-4 border-b border-forest-900/10 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h4 className="font-bold text-sm text-forest-950 leading-snug">
            {name}
          </h4>

          {/* Modifier yang dipilih */}
          {modifiers && modifiers.length > 0 && (
            <p className="text-xs text-pine-600 font-medium mt-0.5">
              {modifiers.map(m => m.name).join(', ')}
            </p>
          )}

          {/* Catatan khusus */}
          {notes && (
            <p className="text-xs italic text-wood-500 font-medium mt-0.5">
              "{notes}"
            </p>
          )}
        </div>

        {/* Harga Subtotal Baris */}
        <span className="font-bold text-sm text-forest-950 shrink-0">
          {formatCurrency(itemSubtotal)}
        </span>
      </div>

      <div className="flex items-center justify-between mt-1">
        <button
          type="button"
          onClick={() => onRemove(itemKey)}
          className="text-xs text-rose-700 hover:text-rose-900 font-medium flex items-center gap-1 p-1 rounded-md hover:bg-rose-50 transition-colors"
          aria-label={`Hapus ${name} dari keranjang`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Hapus</span>
        </button>

        {/* Stepper Kuantitas */}
        <div className="flex items-center gap-2 bg-paper-100 p-1 rounded-lg border border-pine-200">
          <button
            type="button"
            onClick={() => onUpdateQuantity(itemKey, -1)}
            className="p-1 rounded text-forest-900 hover:bg-white transition-colors touch-target"
            aria-label="Kurangi jumlah item"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="w-6 text-center text-xs font-bold text-forest-900">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => onUpdateQuantity(itemKey, 1)}
            className="p-1 rounded text-forest-900 hover:bg-white transition-colors touch-target"
            aria-label="Tambah jumlah item"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
