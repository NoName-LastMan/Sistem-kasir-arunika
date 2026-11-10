import React from 'react'
import { Coffee, Flame, Droplets } from 'lucide-react'
import { ProductCard } from './ProductCard'

export function ManualBrewSection({ products, onSelectProduct, onEditProduct }) {
  if (!products || products.length === 0) return null

  return (
    <section className="my-8 sm:my-14 rounded-3xl bg-forest-950 text-white p-5 sm:p-8 lg:p-10 border-2 border-sun-400 shadow-warm-lg relative overflow-hidden w-full min-w-0">
      {/* Header Bagian Seduh Manual */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-6 sm:mb-10 pb-5 sm:pb-6 border-b-2 border-pine-700">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-900 text-sun-400 text-xs font-bold mb-3 border border-sun-400 shadow-2xs">
            <Coffee className="w-3.5 h-3.5 shrink-0" />
            <span>Slow Bar & Single Origin</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-white mb-2">
            Seduh manual biji pilihan
          </h2>
          <p className="text-mint-100 text-sm max-w-xl leading-relaxed font-normal">
            Biji kopi arabika musiman dari petani lokal Nusantara, disangrai profil filter dan diseduh satu per satu dengan ketelitian temperatur air.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-mint-100 shrink-0">
          <div className="flex items-center gap-1.5">
            <Droplets className="w-4 h-4 text-emerald-400" />
            <span>V60 Dripper</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-sun-400" />
            <span>Aeropress</span>
          </div>
        </div>
      </div>

      {/* Grid Produk Seduh Manual */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id} className="text-ink-900">
            <ProductCard
              product={product}
              onSelect={onSelectProduct}
              onEdit={onEditProduct}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
