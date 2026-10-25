import React, { useEffect, useState, useMemo } from 'react'
import { useMenuStore } from '../store/menuStore'
import { useCartStore } from '../store/cartStore'
import { CategoryFilter } from '../components/menu/CategoryFilter'
import { SearchBar } from '../components/menu/SearchBar'
import { ProductCard } from '../components/menu/ProductCard'
import { ProductDetailModal } from '../components/menu/ProductDetailModal'
import { ManualBrewSection } from '../components/menu/ManualBrewSection'
import { ProductCardSkeleton } from '../components/ui/Skeleton'
import { Coffee, SearchX } from 'lucide-react'

export function MenuPage() {
  const categories = useMenuStore(state => state.categories)
  const products = useMenuStore(state => state.products)
  const activeCategory = useMenuStore(state => state.activeCategory)
  const searchQuery = useMenuStore(state => state.searchQuery)
  const isLoading = useMenuStore(state => state.isLoading)
  const fetchMenu = useMenuStore(state => state.fetchMenu)
  const setActiveCategory = useMenuStore(state => state.setActiveCategory)
  const setSearchQuery = useMenuStore(state => state.setSearchQuery)
  const addItemToCart = useCartStore(state => state.addItem)

  const [selectedProduct, setSelectedProduct] = useState(null)

  useEffect(() => {
    fetchMenu()
  }, [fetchMenu])

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return products.filter(product => {
      const matchesCategory =
        activeCategory === 'all' ||
        String(product.categoryId) === String(activeCategory) ||
        (activeCategory === 'manual-brew' && product.isManualBrew)

      if (!matchesCategory) return false
      if (!query) return true
      return (product.name || '').toLowerCase().includes(query) || (product.description || '').toLowerCase().includes(query)
    })
  }, [products, activeCategory, searchQuery])

  const manualBrewProducts = useMemo(() => {
    return products.filter(p => p.isManualBrew)
  }, [products])

  // Pisahkan manual brew jika user sedang di tab 'all' agar muncul di blok khusus yang elegan
  const regularProducts = useMemo(() => {
    if (activeCategory === 'all') {
      return filteredProducts.filter(p => !p.isManualBrew)
    }
    return filteredProducts
  }, [activeCategory, filteredProducts])

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header Halaman Menu Pelanggan */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-forest-950 mb-3">
          Katalog menu fajar
        </h1>
        <p className="text-pine-700 text-base max-w-2xl font-normal">
          Seluruh menu diracik menggunakan bahan segar. Ketersediaan stok menu terhubung langsung ke sistem kasir.
        </p>
      </div>

      {/* Kontrol Pencarian & Filter Kategori (100% Solid & Opaque) */}
      <div className="sticky top-20 z-30 bg-paper-50 py-4 border-b border-pine-200 mb-8 space-y-4 shadow-xs">
        <div className="max-w-md">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
          />
        </div>

        <CategoryFilter
          categories={categories}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
        />
      </div>

      {/* Konten Utama Menu */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
            <ProductCardSkeleton key={n} />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-pine-200 p-8 max-w-lg mx-auto shadow-warm-sm">
          <div className="w-14 h-14 rounded-2xl bg-mint-100 flex items-center justify-center text-forest-950 mx-auto mb-4">
            <SearchX className="w-7 h-7 text-emerald-700" />
          </div>
          <h3 className="font-serif font-bold text-xl text-forest-950 mb-2">
            Menu tidak ditemukan
          </h3>
          <p className="text-sm text-pine-700 mb-6 font-normal">
            Tidak ada produk yang cocok dengan kata kunci "{searchQuery}". Coba kata kunci lain atau bersihkan pencarian.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setActiveCategory('all')
            }}
            className="text-sm font-semibold text-emerald-600 hover:text-forest-900 underline underline-offset-4"
          >
            Lihat semua menu
          </button>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Blok Manual Brew Khusus (jika ada dan sedang filter 'all' atau 'manual-brew') */}
          {(activeCategory === 'all' || activeCategory === 'manual-brew') && manualBrewProducts.length > 0 && (
            <ManualBrewSection
              products={manualBrewProducts}
              onSelectProduct={setSelectedProduct}
            />
          )}

          {/* Grid Produk Reguler */}
          {regularProducts.length > 0 && (
            <div>
              {activeCategory === 'all' && (
                <h3 className="text-2xl font-bold font-serif text-forest-900 mb-6">
                  Espresso, Makanan & Camilan
                </h3>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {regularProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelect={setSelectedProduct}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Detail & Modifier Pesanan Pelanggan */}
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
