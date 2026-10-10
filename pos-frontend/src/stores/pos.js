import { defineStore } from 'pinia'
import api from '../api'

export const usePosStore = defineStore('pos', {
  state: () => ({
    categories: [],
    products: [],
    cart: [],
    activeCategory: '',

    // Diskon & Pajak
    discountType: 'none',
    discountValue: 0,
    taxRate: 10,

    // Hold Orders
    heldOrders: [],

    // Meja Restoran
    tables: [],
    activeTable: null,

    // Pelanggan / Member
    customerName: '',
    customerPhone: '',

    // Riwayat Order & Shift Kasir
    cashierShiftOrders: [],
    cashierShiftLoading: false,
    recentOrders: null,
    recentOrdersLoading: false,
  }),
  getters: {
    subtotal: (state) => state.cart.reduce((total, item) => total + (item.price * item.quantity), 0),

    discountAmount: (state) => {
      const subtotal = state.cart.reduce((total, item) => total + (item.price * item.quantity), 0)
      if (state.discountType === 'percentage') {
        return (subtotal * Math.min(100, Math.max(0, state.discountValue))) / 100
      }
      if (state.discountType === 'fixed') {
        return Math.min(subtotal, Math.max(0, state.discountValue))
      }
      return 0
    },

    taxableAmount(state) {
      return Math.max(0, this.subtotal - this.discountAmount)
    },

    tax(state) {
      return (this.taxableAmount * (state.taxRate || 0)) / 100
    },

    grandTotal(state) {
      return this.taxableAmount + this.tax
    },

    totalItemCount: (state) => state.cart.reduce((total, item) => total + item.quantity, 0),
  },
  actions: {
    async fetchCategories() {
      const { data } = await api.get('/categories')
      this.categories = data.data
    },

    async fetchProducts(categoryId = '') {
      this.activeCategory = categoryId
      const url = categoryId ? `/products?category_id=${categoryId}` : '/products'
      const { data } = await api.get(url)
      this.products = data.data
    },

    async fetchProductByBarcode(barcode) {
      const { data } = await api.get(`/products/by-barcode/${encodeURIComponent(barcode)}`)
      return data.data
    },

    addToCart(product, selectedModifiers = [], notes = '') {
      const modifierPrice = selectedModifiers.reduce((sum, mod) => sum + Number(mod.price), 0)
      const finalPrice = Number(product.price) + modifierPrice

      const existingItem = this.cart.find(item =>
        item.product_id === product.id &&
        item.notes === notes &&
        JSON.stringify(item.modifiers) === JSON.stringify(selectedModifiers)
      )

      if (existingItem) {
        existingItem.quantity++
      } else {
        this.cart.push({
          product_id: product.id,
          name: product.name,
          price: finalPrice,
          unit_price: Number(product.price),
          quantity: 1,
          notes: notes,
          modifiers: selectedModifiers,
          modifierText: selectedModifiers.map(m => m.name).join(', ')
        })
      }
    },

    updateQuantity(index, delta) {
      if (this.cart[index]) {
        this.cart[index].quantity += delta
        if (this.cart[index].quantity <= 0) {
          this.removeFromCart(index)
        }
      }
    },

    removeFromCart(index) {
      this.cart.splice(index, 1)
    },

    clearCart() {
      this.cart = []
      this.discountType = 'none'
      this.discountValue = 0
    },

    setDiscount(type, value) {
      this.discountType = type
      this.discountValue = Number(value) || 0
    },

    setTaxRate(rate) {
      this.taxRate = Number(rate) || 0
    },

    // Pengaturan Toko
    async fetchStoreSettings() {
      if (this.storeSettings) return this.storeSettings
      try {
        const { data } = await api.get('/settings/store')
        this.storeSettings = data.data
        return data.data
      } catch (err) {
        console.error('Gagal mengambil pengaturan toko:', err)
        return null
      }
    },

    // Riwayat Order
    async fetchRecentOrders(page = 1) {
      this.recentOrdersLoading = true
      try {
        const { data } = await api.get(`/orders?per_page=15&page=${page}&today_only=1`)
        this.recentOrders = data.data
      } catch (err) {
        console.error('Gagal mengambil riwayat order:', err)
      } finally {
        this.recentOrdersLoading = false
      }
    },

    async voidOrder(orderId, voidReason) {
      const { data } = await api.post(`/orders/${orderId}/void`, { void_reason: voidReason })
      return data.data
    },

    // Hold Orders
    async fetchHeldOrders() {
      try {
        const { data } = await api.get('/orders/held')
        this.heldOrders = data.data
      } catch (err) {
        console.error('Gagal mengambil held orders:', err)
      }
    },

    async holdOrder({ customerName, referenceNote, orderType, tableId }) {
      if (this.cart.length === 0) return false

      const payload = {
        customer_name: customerName || null,
        reference_note: referenceNote || null,
        table_id: tableId || null,
        order_type: orderType || 'dine_in',
        subtotal: this.subtotal,
        cart_data: {
          cart: this.cart,
          discountType: this.discountType,
          discountValue: this.discountValue,
          taxRate: this.taxRate
        }
      }

      const { data } = await api.post('/orders/hold', payload)
      this.clearCart()
      await this.fetchHeldOrders()
      return data.data
    },

    async resumeHeldOrder(heldOrder) {
      if (heldOrder.cart_data) {
        this.cart = heldOrder.cart_data.cart || []
        this.discountType = heldOrder.cart_data.discountType || 'none'
        this.discountValue = heldOrder.cart_data.discountValue || 0
        this.taxRate = heldOrder.cart_data.taxRate ?? 10
      }

      await api.delete(`/orders/held/${heldOrder.id}`)
      await this.fetchHeldOrders()
    },

    async deleteHeldOrder(id) {
      await api.delete(`/orders/held/${id}`)
      await this.fetchHeldOrders()
    },

    // Shift Kasir
    async fetchCurrentShift() {
      try {
        const { data } = await api.get('/shift/current')
        this.activeShift = data.data
        return data.data
      } catch (err) {
        this.activeShift = null
        return null
      }
    },

    // Meja Restoran
    async fetchTables() {
      try {
        const { data } = await api.get('/tables')
        this.tables = data.data || []
      } catch (err) {
        console.error('Gagal mengambil daftar meja:', err)
      }
    },

    setActiveTable(table) {
      this.activeTable = table
    },

    // Transaksi Kasir Aktif (Shift Berjalan)
    async fetchCashierShiftOrders() {
      this.cashierShiftLoading = true
      try {
        const userStr = localStorage.getItem('pos_user')
        let userId = null
        if (userStr) {
          try { userId = JSON.parse(userStr)?.id } catch (e) {}
        }
        const params = { today_only: 1, per_page: 50 }
        if (userId) params.user_id = userId

        const { data } = await api.get('/orders', { params })
        this.cashierShiftOrders = data.data?.data || []
      } catch (err) {
        console.error('Gagal mengambil transaksi shift kasir:', err)
      } finally {
        this.cashierShiftLoading = false
      }
    },

    async openShift(startingCash) {
      const { data } = await api.post('/shift/open', { starting_cash: startingCash })
      this.activeShift = data.data
      return data.data
    },

    async closeShift(actualCash, notes = '') {
      const { data } = await api.post('/shift/close', { actual_cash: actualCash, notes })
      this.activeShift = null
      return data.data
    }
  }
})
