import { create } from 'zustand'

const SESSION_STORAGE_KEY = 'arunika_guest_cart_v1'

function loadFromStorage() {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.warn('Gagal membaca keranjang dari sessionStorage:', err)
  }
  return {
    items: [],
    tableCode: '',
    customerName: '',
    notes: ''
  }
}

function saveToStorage(state) {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
      items: state.items,
      tableCode: state.tableCode,
      customerName: state.customerName,
      notes: state.notes
    }))
  } catch (err) {
    console.warn('Gagal menyimpan keranjang ke sessionStorage:', err)
  }
}

const initialData = loadFromStorage()

export const useCartStore = create((set, get) => ({
  items: initialData.items || [],
  tableCode: initialData.tableCode || '',
  customerName: initialData.customerName || '',
  notes: initialData.notes || '',

  setTableCode: (code) => {
    set({ tableCode: code })
    saveToStorage(get())
  },

  setCustomerName: (name) => {
    set({ customerName: name })
    saveToStorage(get())
  },

  setNotes: (notes) => {
    set({ notes })
    saveToStorage(get())
  },

  addItem: (product, quantity = 1, selectedModifiers = [], notes = '') => {
    const currentItems = [...get().items]

    // Buat item key unik berdasarkan productId + modifier selection + notes
    const sortedModIds = selectedModifiers.map(m => m.id).sort().join(',')
    const itemKey = `${product.id}_${sortedModIds}_${notes.trim()}`

    const existingIndex = currentItems.findIndex(i => i.itemKey === itemKey)

    // Hitung unit price (harga dasar produk + total harga modifier terpilih)
    const modifierTotal = selectedModifiers.reduce((sum, m) => sum + (Number(m.price) || 0), 0)
    const unitPrice = Number(product.price) + modifierTotal

    if (existingIndex > -1) {
      currentItems[existingIndex].quantity += quantity
    } else {
      currentItems.push({
        itemKey,
        productId: product.id,
        name: product.name,
        unitPrice,
        basePrice: Number(product.price),
        quantity,
        modifiers: selectedModifiers,
        notes: notes.trim()
      })
    }

    set({ items: currentItems })
    saveToStorage(get())
  },

  updateQuantity: (itemKey, delta) => {
    const currentItems = get().items
      .map(item => {
        if (item.itemKey === itemKey) {
          const newQty = item.quantity + delta
          return newQty > 0 ? { ...item, quantity: newQty } : null
        }
        return item
      })
      .filter(Boolean)

    set({ items: currentItems })
    saveToStorage(get())
  },

  removeItem: (itemKey) => {
    const filtered = get().items.filter(i => i.itemKey !== itemKey)
    set({ items: filtered })
    saveToStorage(get())
  },

  clearCart: () => {
    set({ items: [], notes: '' })
    saveToStorage(get())
  }
}))

// Selectors
export const selectCartSubtotal = (state) => {
  return state.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
}

export const selectCartItemCount = (state) => {
  return state.items.reduce((sum, item) => sum + item.quantity, 0)
}

export const selectCartEstimates = (state, taxRate = 10) => {
  const subtotal = selectCartSubtotal(state)
  const tax = Math.round((subtotal * (Number(taxRate) || 0)) / 100)
  const grandTotal = subtotal + tax
  return {
    subtotal,
    taxRate: Number(taxRate),
    tax,
    grandTotal
  }
}
