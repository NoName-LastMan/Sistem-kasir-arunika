import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Minus, Check } from 'lucide-react'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { formatCurrency } from '../../api/mappers'

export function ProductDetailModal({ product, isOpen, onClose, onAddToCart }) {
  const [quantity, setQuantity] = useState(1)
  const [selectedModifiers, setSelectedModifiers] = useState({})
  const [notes, setNotes] = useState('')

  // Reset state setiap kali produk berubah
  useEffect(() => {
    if (!product) return

    setQuantity(1)
    setNotes('')

    // Set default untuk modifier yang wajib
    const defaults = {}
    if (product.modifierGroups) {
      product.modifierGroups.forEach(grp => {
        if (grp.isRequired && grp.items.length > 0) {
          defaults[grp.id] = [grp.items[0]]
        } else {
          defaults[grp.id] = []
        }
      })
    }
    setSelectedModifiers(defaults)
  }, [product])

  // Cek apakah semua modifier yang wajib sudah dipilih
  const isRequiredSatisfied = useMemo(() => {
    if (!product?.modifierGroups) return true
    return product.modifierGroups.every(grp => {
      if (!grp.isRequired) return true
      const selected = selectedModifiers[grp.id] || []
      return selected.length >= grp.minSelection
    })
  }, [product, selectedModifiers])

  // Hitung total harga item untuk modal ini
  const allSelectedModsArray = useMemo(() => {
    return Object.values(selectedModifiers).flat()
  }, [selectedModifiers])

  // Jika produk belum dipilih atau modal tidak aktif
  if (!product || !isOpen) return null

  // Handler toggle pilihan modifier
  const handleToggleModifier = (group, item) => {
    setSelectedModifiers(prev => {
      const currentList = prev[group.id] || []
      const isAlreadySelected = currentList.some(m => m.id === item.id)

      if (group.maxSelection === 1) {
        // Pilihan tunggal (radio-style)
        return {
          ...prev,
          [group.id]: [item]
        }
      }

      // Pilihan ganda (checkbox-style)
      if (isAlreadySelected) {
        return {
          ...prev,
          [group.id]: currentList.filter(m => m.id !== item.id)
        }
      } else {
        if (currentList.length >= group.maxSelection) {
          return prev // Batas maksimal tercapai
        }
        return {
          ...prev,
          [group.id]: [...currentList, item]
        }
      }
    })
  }

  const modifierTotal = allSelectedModsArray.reduce((sum, m) => sum + (m.price || 0), 0)
  const itemUnitPrice = (product.price || 0) + modifierTotal
  const itemTotalPrice = itemUnitPrice * quantity

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isRequiredSatisfied) return

    onAddToCart(product, quantity, allSelectedModsArray, notes)
    onClose()
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={product.name}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info Gambar, Deskripsi & Tasting Notes */}
        <div className="pb-4 border-b-2 border-pine-200 space-y-3">
          {product.image && (
            <div className="w-full aspect-[21/9] rounded-xl overflow-hidden bg-paper-100 border-2 border-pine-200">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <p className="text-sm text-pine-700 leading-relaxed font-normal">
            {product.description}
          </p>

          {/* Tasting Notes & Karakter Seduh */}
          {product.tastingNotes && product.tastingNotes.length > 0 && (
            <div className="bg-paper-100 p-3.5 rounded-xl border-2 border-pine-200 space-y-2.5">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-bold text-forest-950">Karakter Rasa:</span>
                {product.tastingNotes.map((note, idx) => (
                  <span key={idx} className="bg-white px-2.5 py-0.5 rounded-md border border-pine-200 text-forest-950 font-semibold shadow-2xs">
                    {note}
                  </span>
                ))}
              </div>

              {(product.acidity > 0 || product.body > 0 || product.sweetness > 0) && (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-pine-200 text-xs text-pine-700">
                  <div>
                    <span className="block text-pine-600 text-[10px] uppercase font-bold tracking-wider">Acidity</span>
                    <span className="font-bold text-emerald-700 text-sm">{'●'.repeat(product.acidity)}{'○'.repeat(5 - product.acidity)}</span>
                  </div>
                  <div>
                    <span className="block text-pine-600 text-[10px] uppercase font-bold tracking-wider">Body</span>
                    <span className="font-bold text-wood-500 text-sm">{'●'.repeat(product.body)}{'○'.repeat(5 - product.body)}</span>
                  </div>
                  <div>
                    <span className="block text-pine-600 text-[10px] uppercase font-bold tracking-wider">Sweetness</span>
                    <span className="font-bold text-amber-600 text-sm">{'●'.repeat(product.sweetness)}{'○'.repeat(5 - product.sweetness)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="text-sm font-semibold text-forest-950">
            Harga dasar: <span className="font-bold text-emerald-700">{product.formattedPrice}</span>
          </div>
        </div>

        {/* Pilihan Modifier & Varian */}
        {product.modifierGroups && product.modifierGroups.length > 0 && (
          <div className="space-y-6">
            {product.modifierGroups.map(group => {
              const selectedInGroup = selectedModifiers[group.id] || []

              return (
                <div key={group.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-forest-950 font-serif">
                      {group.name}
                    </span>
                    <span className="text-xs text-pine-600 font-medium">
                      {group.isRequired ? (
                        <span className="text-forest-950 font-bold bg-sun-400 px-2.5 py-0.5 rounded-md border border-sun-400 shadow-2xs">
                          Wajib (Pilih {group.maxSelection})
                        </span>
                      ) : (
                        <span>Opsional (Maks {group.maxSelection})</span>
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {group.items.map(item => {
                      const isSelected = selectedInGroup.some(m => m.id === item.id)

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleToggleModifier(group, item)}
                          className={`flex items-center justify-between p-3 rounded-xl border-2 text-left transition-all btn-press touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                            isSelected
                              ? 'border-emerald-600 bg-mint-100 text-forest-950 shadow-xs font-semibold'
                              : 'border-pine-200 hover:border-emerald-600 text-forest-950 bg-white font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-4 h-4 rounded-${group.maxSelection === 1 ? 'full' : 'md'} border-2 flex items-center justify-center transition-all ${
                              isSelected ? 'border-emerald-600 bg-emerald-600 text-white scale-105' : 'border-pine-300'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="text-xs sm:text-sm font-medium">{item.name}</span>
                          </div>
                          {item.price > 0 && (
                            <span className="text-xs font-semibold text-emerald-700">
                              +{item.formattedPrice}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Catatan Khusus untuk Dapur/Barista */}
        <div className="space-y-2">
          <label htmlFor="item-notes" className="text-sm font-bold text-forest-900 font-serif block">
            Catatan Khusus (Opsional)
          </label>
          <input
            id="item-notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: Es dipisah, sambal sedikit, dll."
            className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-pine-200 text-sm text-forest-950 placeholder:text-pine-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-colors"
          />
        </div>

        {/* Baris Kuantitas & Tombol Submit */}
        <div className="pt-4 border-t-2 border-pine-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Stepper Jumlah */}
          <div className="flex items-center gap-3 bg-paper-100 p-1.5 rounded-xl border-2 border-pine-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="p-1.5 rounded-lg text-forest-900 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-colors btn-press"
              aria-label="Kurangi jumlah"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-bold text-sm text-forest-900 select-none">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(q => q + 1)}
              className="p-1.5 rounded-lg text-forest-900 hover:bg-white transition-colors btn-press"
              aria-label="Tambah jumlah"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Tombol Tambah ke Pesanan */}
          <Button
            type="submit"
            disabled={!isRequiredSatisfied}
            className="w-full sm:w-auto flex-1 justify-between font-bold btn-press shadow-warm-sm"
          >
            <span>Tambah ke Pesanan</span>
            <span className="font-bold text-sun-300">{formatCurrency(itemTotalPrice)}</span>
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
