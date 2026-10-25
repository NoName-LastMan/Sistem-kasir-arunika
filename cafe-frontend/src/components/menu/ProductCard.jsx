import React, { useState } from 'react'
import { Plus, Coffee } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { useCartStore } from '../../store/cartStore'

export function ProductCard({ product, onSelect }) {
  const {
    id, name, description, formattedPrice, image,
    isAvailable, isBestSeller, isNew, tastingNotes
  } = product

  const [imageError, setImageError] = useState(false)

  // Cek apakah item sudah ada di keranjang
  const cartItems = useCartStore(state => state.items)
  const itemInCartCount = cartItems
    .filter(item => item.productId === id)
    .reduce((sum, item) => sum + item.quantity, 0)

  return (
    <article
      onClick={() => isAvailable && onSelect(product)}
      className={`group relative rounded-2xl border-2 card-interactive flex flex-col justify-between h-full bg-white overflow-hidden shadow-warm-sm transition-all ${
        isAvailable
          ? 'border-pine-200 hover:border-emerald-600 hover:shadow-warm-md cursor-pointer'
          : 'border-pine-100 bg-paper-100 opacity-75 cursor-not-allowed'
      }`}
    >
      <div>
        {/* Gambar Sajian Estetika / Ilustrasi F&B */}
        <div className="relative w-full aspect-[16/10] bg-paper-100 overflow-hidden border-b-2 border-pine-200">
          {image && !imageError ? (
            <img
              src={image}
              alt={name}
              onError={() => setImageError(true)}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-pine-600">
              <Coffee className="w-10 h-10 mb-1" />
              <span className="text-[10px] font-bold tracking-widest uppercase">Arunika</span>
            </div>
          )}

          {/* Badges di Atas Foto */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 pointer-events-none">
            <div className="flex gap-1.5 flex-wrap">
              {!isAvailable && (
                <Badge variant="soldOut">Habis</Badge>
              )}
              {isAvailable && isBestSeller && (
                <Badge variant="bestSeller">Favorit</Badge>
              )}
              {isAvailable && isNew && (
                <Badge variant="new">Baru</Badge>
              )}
            </div>

            {itemInCartCount > 0 && (
              <span className="bg-forest-900 text-sun-400 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm animate-in fade-in zoom-in-90 duration-200">
                {itemInCartCount} di keranjang
              </span>
            )}
          </div>
        </div>

        {/* Info Konten: Nama & Deskripsi */}
        <div className="p-4 sm:p-5">
          <h3 className="font-serif font-bold text-lg text-forest-950 leading-snug group-hover:text-emerald-700 transition-colors mb-1.5">
            {name}
          </h3>

          <p className="text-pine-700 text-xs sm:text-sm line-clamp-2 leading-relaxed mb-3 font-normal">
            {description}
          </p>

          {/* Tasting Notes Pills (Karakter Rasa) */}
          {tastingNotes && tastingNotes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2" aria-label="Catatan rasa">
              {tastingNotes.slice(0, 3).map((note, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-paper-100 text-forest-900 border border-pine-200 shadow-2xs hover:bg-mint-100 transition-colors"
                >
                  {note}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer: Harga & Aksi Pesan */}
      <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-3 border-t-2 border-pine-200 flex items-center justify-between mt-auto bg-white">
        <div>
          <span className="text-[10px] text-pine-600 font-bold uppercase tracking-wider block">Harga</span>
          <span className="font-bold text-base sm:text-lg text-emerald-800">
            {formattedPrice}
          </span>
        </div>

        {isAvailable ? (
          <Button
            size="sm"
            variant={itemInCartCount > 0 ? "primary" : "secondary"}
            onClick={(e) => {
              e.stopPropagation()
              onSelect(product)
            }}
            className="rounded-xl px-3.5 py-1.5 font-bold shadow-2xs btn-press"
            aria-label={`Pilih ${name}`}
          >
            <Plus className="w-4 h-4" />
            <span className="text-xs font-bold">
              {itemInCartCount > 0 ? 'Ubah' : 'Pilih'}
            </span>
          </Button>
        ) : (
          <span className="text-xs font-semibold text-rose-800 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-lg">
            Stok Kosong
          </span>
        )}
      </div>
    </article>
  )
}
