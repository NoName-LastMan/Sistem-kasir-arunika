import { create } from 'zustand'
import { api } from '../api/client'

export const useMenuStore = create((set, get) => ({
  categories: [],
  products: [],
  modifierGroups: [],
  activeCategory: 'all', // 'all' atau categoryId / slug
  searchQuery: '',
  isLoading: false,
  error: null,

  fetchMenu: async () => {
    // Hindari re-fetching berulang jika data sudah ada
    if (get().products.length > 0) return
    set({ isLoading: true, error: null })
    try {
      const data = await api.getMenu()
      set({
        categories: data.categories,
        products: data.products,
        modifierGroups: data.modifierGroups,
        isLoading: false
      })
    } catch (err) {
      set({ error: err.friendlyMessage, isLoading: false })
    }
  },

  setActiveCategory: (catId) => set({ activeCategory: catId }),
  setSearchQuery: (query) => set({ searchQuery: query })
}))

// Selectors terpisah untuk mencegah re-render berlebihan
export const selectFilteredProducts = (state) => {
  const { products, activeCategory, searchQuery } = state
  const query = searchQuery.trim().toLowerCase()

  return products.filter(product => {
    // Filter Kategori
    const matchesCategory =
      activeCategory === 'all' ||
      String(product.categoryId) === String(activeCategory) ||
      (activeCategory === 'manual-brew' && product.isManualBrew)

    if (!matchesCategory) return false

    // Filter Pencarian
    if (!query) return true
    const nameMatch = product.name.toLowerCase().includes(query)
    const descMatch = product.description.toLowerCase().includes(query)
    return nameMatch || descMatch
  })
}

export const selectManualBrewProducts = (state) => {
  return state.products.filter(p => p.isManualBrew)
}

export const selectFeaturedProducts = (state) => {
  return state.products.filter(p => p.isBestSeller || p.isNew)
}
