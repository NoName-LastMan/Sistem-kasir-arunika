import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Coffee } from 'lucide-react'
import { SunriseHero } from '../components/brand/SunriseHero'
import { CraftStory } from '../components/brand/CraftStory'
import { SpaceHighlights } from '../components/brand/SpaceHighlights'
import { HowToOrder } from '../components/brand/HowToOrder'
import { MotifDivider } from '../components/brand/MotifDivider'
import { ProductCard } from '../components/menu/ProductCard'
import { ProductDetailModal } from '../components/menu/ProductDetailModal'
import { ProductCardSkeleton } from '../components/ui/Skeleton'
import { Button } from '../components/ui/Button'
import { useSettingsStore } from '../store/settingsStore'
import { useMenuStore } from '../store/menuStore'
import { useCartStore } from '../store/cartStore'

export function HomePage() {
  const settings = useSettingsStore(state => state.settings)
  const products = useMenuStore(state => state.products)
  const isLoading = useMenuStore(state => state.isLoading)
  const fetchMenu = useMenuStore(state => state.fetchMenu)
  const addItemToCart = useCartStore(state => state.addItem)

  const featuredProducts = useMemo(() => {
    const featured = products.filter(p => (p.isBestSeller || p.isNew) && p.isAvailable)
    if (featured.length > 0) return featured.slice(0, 4)
    const available = products.filter(p => p.isAvailable)
    return available.length > 0 ? available.slice(0, 4) : products.slice(0, 4)
  }, [products])

  const [selectedProduct, setSelectedProduct] = useState(null)

  useEffect(() => {
    fetchMenu(true)
  }, [fetchMenu])

  return (
    <div>
      {/* 1. Momen Berani: Sunrise Hero */}
      <SunriseHero settings={settings} />

      {/* 2. Sorotan Menu Pilihan (Data Nyata dari API) */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-mint-100 px-3 py-1 rounded-full mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pilihan Favorit Pelanggan</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-serif text-forest-900">
              Menu andalan fajar
            </h2>
          </div>

          <Link to="/menu">
            <Button variant="outline" size="sm">
              <span>Buka Menu Lengkap</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(n => (
              <ProductCardSkeleton key={n} />
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.slice(0, 4).map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={setSelectedProduct}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-pine-600 bg-paper-100 rounded-2xl border border-pine-200">
            <Coffee className="w-10 h-10 mx-auto mb-2 text-pine-400" />
            <p className="text-sm font-medium">Menu favorit sedang disiapkan oleh barista.</p>
          </div>
        )}
      </section>

      <MotifDivider />

      {/* 3. Cerita Keahlian & Kemitraan Petani */}
      <CraftStory />

      {/* 4. Ruang & Fasilitas Arunika */}
      <SpaceHighlights />

      {/* 5. Cara Pesan 3 Langkah */}
      <HowToOrder />

      {/* Modal Detail & Modifier */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isOpen={Boolean(selectedProduct)}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addItemToCart}
        />
      )}
    </div>
  )
}
