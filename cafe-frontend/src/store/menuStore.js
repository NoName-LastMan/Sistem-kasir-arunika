import { create } from 'zustand'
import { api } from '../api/client'
import { formatCurrency } from '../api/mappers'

const LOCAL_CUSTOM_PRODUCTS_KEY = 'arunika_custom_menu_products_v1'
const LOCAL_DELETED_PRODUCTS_KEY = 'arunika_deleted_menu_products_v1'

const DEFAULT_CATEGORIES = [
  { id: 1, name: 'Kopi & Espresso', slug: 'kopi', description: 'Kopi susu gula aren andalan dan olahan espresso aromatik' },
  { id: 2, name: 'Manual Brew & Mocktail', slug: 'manual-brew', description: 'Single origin pilihan dan racikan mocktail segar' },
  { id: 3, name: 'Non-Kopi & Artisan Tea', slug: 'non-kopi', description: 'Matcha, cokelat pekat, taro, dan seduhan teh segar' },
  { id: 4, name: 'Makanan & Pasta', slug: 'makanan', description: 'Nasi katsu, pasta ala kafe, dan burger mengenyangkan' },
  { id: 5, name: 'Camilan Semarang & Roti', slug: 'camilan', description: 'Tahu bakso khas, kentang goreng, dan kudapan santai' }
]

function getSavedCustomProducts() {
  try {
    const raw = localStorage.getItem(LOCAL_CUSTOM_PRODUCTS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

function saveCustomProductsToStorage(customs) {
  try {
    localStorage.setItem(LOCAL_CUSTOM_PRODUCTS_KEY, JSON.stringify(customs))
  } catch {}
}

function getSavedDeletedProductIds() {
  try {
    const raw = localStorage.getItem(LOCAL_DELETED_PRODUCTS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

function saveDeletedProductIdsToStorage(ids) {
  try {
    localStorage.setItem(LOCAL_DELETED_PRODUCTS_KEY, JSON.stringify(ids))
  } catch {}
}

export const useMenuStore = create((set, get) => ({
  categories: DEFAULT_CATEGORIES,
  products: [],
  modifierGroups: [],
  activeCategory: 'all', // 'all' atau categoryId / slug
  searchQuery: '',
  isLoading: false,
  error: null,
  isEditMode: false, // Mode kelola/ubah menu aktif

  toggleEditMode: () => set(state => ({ isEditMode: !state.isEditMode })),
  setEditMode: (val) => set({ isEditMode: Boolean(val) }),

  fetchMenu: async () => {
    // Hindari re-fetching berulang jika data sudah ada
    if (get().products.length > 0) return
    set({ isLoading: true, error: null })
    try {
      const data = await api.getMenu()
      
      const customProducts = getSavedCustomProducts()
      const deletedIds = getSavedDeletedProductIds()

      // Filter produk backend yang telah dihapus user
      let mergedProducts = (data.products || []).filter(p => !deletedIds.includes(p.id))

      // Gabungkan atau timpa produk yang diubah / ditambah user
      customProducts.forEach(cp => {
        const idx = mergedProducts.findIndex(p => p.id === cp.id)
        if (idx > -1) {
          mergedProducts[idx] = { ...mergedProducts[idx], ...cp }
        } else {
          mergedProducts.unshift(cp)
        }
      })

      set({
        categories: (data.categories && data.categories.length > 0) ? data.categories : DEFAULT_CATEGORIES,
        products: mergedProducts,
        modifierGroups: data.modifierGroups || [],
        isLoading: false
      })
    } catch (err) {
      set({ error: err.friendlyMessage, isLoading: false })
    }
  },

  setActiveCategory: (catId) => set({ activeCategory: catId }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Tambah Menu Baru
  addProduct: (productData) => {
    const newId = productData.id || `custom-${Date.now()}`
    const priceNum = Number(productData.price) || 0
    const newProduct = {
      ...productData,
      id: newId,
      price: priceNum,
      formattedPrice: formatCurrency(priceNum),
      isAvailable: productData.isAvailable ?? true,
      isBestSeller: Boolean(productData.isBestSeller),
      isNew: Boolean(productData.isNew ?? true),
      isManualBrew: Boolean(productData.isManualBrew),
      modifierGroups: productData.modifierGroups || []
    }

    const updated = [newProduct, ...get().products]
    set({ products: updated })

    // Simpan ke storage custom
    const customs = getSavedCustomProducts()
    saveCustomProductsToStorage([newProduct, ...customs.filter(c => c.id !== newId)])

    return newProduct
  },

  // Ubah Menu yang Sudah Ada
  updateProduct: (id, productData) => {
    const currentProducts = get().products
    const updated = currentProducts.map(p => {
      if (p.id === id) {
        const priceNum = productData.price !== undefined ? Number(productData.price) : p.price
        return {
          ...p,
          ...productData,
          price: priceNum,
          formattedPrice: formatCurrency(priceNum),
          isAvailable: productData.isAvailable !== undefined ? Boolean(productData.isAvailable) : p.isAvailable
        }
      }
      return p
    })

    set({ products: updated })

    // Simpan modifikasi ke storage custom
    const customs = getSavedCustomProducts()
    const foundCustomIdx = customs.findIndex(c => c.id === id)
    const updatedItem = updated.find(p => p.id === id)
    if (updatedItem) {
      if (foundCustomIdx > -1) {
        customs[foundCustomIdx] = updatedItem
      } else {
        customs.push(updatedItem)
      }
      saveCustomProductsToStorage(customs)
    }

    return updatedItem
  },

  // Hapus Menu
  deleteProduct: (id) => {
    const filtered = get().products.filter(p => p.id !== id)
    set({ products: filtered })

    // Hapus dari custom products jika ada
    const customs = getSavedCustomProducts().filter(c => c.id !== id)
    saveCustomProductsToStorage(customs)

    // Catat ID ke daftar deleted agar tidak di-fetch ulang dari backend
    const deletedIds = getSavedDeletedProductIds()
    if (!deletedIds.includes(id)) {
      saveDeletedProductIdsToStorage([...deletedIds, id])
    }
  }
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
    const nameMatch = (product.name || '').toLowerCase().includes(query)
    const descMatch = (product.description || '').toLowerCase().includes(query)
    return nameMatch || descMatch
  })
}

export const selectManualBrewProducts = (state) => {
  return state.products.filter(p => p.isManualBrew)
}

export const selectFeaturedProducts = (state) => {
  return state.products.filter(p => p.isBestSeller || p.isNew)
}
