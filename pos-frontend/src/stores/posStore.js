import { create } from 'zustand'
import { api } from '../api/client'

export const usePosStore = create((set, get) => ({
  cart: [],
  orderType: 'dine_in',
  selectedTable: null,
  discountType: 'none', // 'none' | 'percentage' | 'fixed'
  discountValue: 0,
  taxRate: 10,
  lastCompletedOrder: null,

  addToCart: (product, quantity = 1, modifiers = []) => {
    const currentCart = [...get().cart]
    // Check if same product with same modifiers already exists
    const existingIndex = currentCart.findIndex(
      item => item.product.id === product.id &&
      JSON.stringify(item.modifiers || []) === JSON.stringify(modifiers || [])
    )

    if (existingIndex > -1) {
      currentCart[existingIndex].quantity += quantity
    } else {
      currentCart.push({
        product,
        quantity,
        notes: '',
        modifiers
      })
    }
    set({ cart: currentCart })
  },

  updateQuantity: (index, delta) => {
    const currentCart = [...get().cart]
    if (!currentCart[index]) return
    const newQty = currentCart[index].quantity + delta
    if (newQty <= 0) {
      currentCart.splice(index, 1)
    } else {
      currentCart[index].quantity = newQty
    }
    set({ cart: currentCart })
  },

  updateItemNote: (index, notes) => {
    const currentCart = [...get().cart]
    if (currentCart[index]) {
      currentCart[index].notes = notes
      set({ cart: currentCart })
    }
  },

  removeItem: (index) => {
    const currentCart = [...get().cart]
    currentCart.splice(index, 1)
    set({ cart: currentCart })
  },

  clearCart: () => {
    set({
      cart: [],
      discountType: 'none',
      discountValue: 0,
      selectedTable: null
    })
  },

  setOrderType: (orderType) => set({ orderType }),
  setSelectedTable: (table) => set({ selectedTable: table }),
  setDiscount: (type, value) => set({ discountType: type, discountValue: Number(value) || 0 }),
  setTaxRate: (rate) => set({ taxRate: Number(rate) || 0 }),

  getTotals: () => {
    const { cart, discountType, discountValue, taxRate } = get()
    
    let subtotal = 0
    cart.forEach(item => {
      const modifierSum = (item.modifiers || []).reduce((sum, m) => sum + Number(m.price || 0), 0)
      const itemUnitPrice = Number(item.product.price || 0) + modifierSum
      subtotal += itemUnitPrice * item.quantity
    })

    let discountAmount = 0
    if (discountType === 'percentage' && discountValue > 0) {
      discountAmount = Math.round((subtotal * discountValue) / 100)
    } else if (discountType === 'fixed' && discountValue > 0) {
      discountAmount = Math.min(discountValue, subtotal)
    }

    const taxableAmount = Math.max(0, subtotal - discountAmount)
    const taxAmount = Math.round((taxableAmount * (taxRate || 0)) / 100)
    const totalAmount = taxableAmount + taxAmount

    return {
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount
    }
  },

  holdOrder: async (customerName = '') => {
    const { cart, selectedTable, orderType } = get()
    if (cart.length === 0) throw new Error('Keranjang belanja kosong')

    const items = cart.map(item => ({
      product_id: item.product.id,
      quantity: item.quantity,
      notes: item.notes || null,
      modifiers: (item.modifiers || []).map(m => ({ id: m.id }))
    }))

    const res = await api.post('/orders/hold', {
      customer_name: customerName || (selectedTable ? `Meja ${selectedTable.number || selectedTable.table_number}` : 'Tamu'),
      table_id: selectedTable?.id || null,
      order_type: orderType,
      items
    })

    get().clearCart()
    return res
  },

  resumeHeldOrder: (heldOrder) => {
    const items = (heldOrder.items || []).map(item => ({
      product: item.product,
      quantity: item.quantity,
      notes: item.notes || '',
      modifiers: (item.modifiers || []).map(m => m.modifier_item || m)
    }))

    set({
      cart: items,
      orderType: heldOrder.order_type || 'dine_in',
      selectedTable: heldOrder.table ? { id: heldOrder.table.id, number: heldOrder.table.table_number || heldOrder.table.number } : null
    })
  },

  processCheckout: async (paymentData) => {
    try {
      const { cart, orderType, selectedTable, discountType, discountValue, taxRate } = get()
      if (cart.length === 0) throw new Error('Keranjang belanja kosong')

      const items = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        notes: item.notes || null,
        modifiers: (item.modifiers || []).map(m => ({ id: m.id }))
      }))

      const paymentMethod = paymentData.payment_method || paymentData.paymentMethod || 'cash'
      const cashTendered = paymentData.cash_tendered !== undefined ? paymentData.cash_tendered : paymentData.cashTendered

      const payload = {
        order_type: orderType,
        table_id: selectedTable?.id || null,
        payment_method: paymentMethod, // 'cash', 'qris', 'card', 'transfer'
        cash_tendered: cashTendered ? Number(cashTendered) : null,
        discount_type: discountType,
        discount_value: discountValue,
        tax_rate: taxRate,
        items
      }

      const res = await api.post('/orders', payload)
      const orderData = res.data?.data || res.data || res.order || res
      set({ lastCompletedOrder: orderData })
      get().clearCart()
      return { success: true, order: orderData }
    } catch (err) {
      return {
        success: false,
        error: err?.response?.data?.message || err?.message || 'Gagal memproses transaksi.'
      }
    }
  }
}))
