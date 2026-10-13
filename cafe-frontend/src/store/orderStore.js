import { create } from 'zustand'
import { api } from '../api/client'

const STORAGE_KEY = 'arunika_customer_orders_v1'

const SAMPLE_INITIAL_HISTORY = [
  {
    id: 'ord-unimus-01',
    invoiceNumber: 'INV-20261010-001',
    tableCode: '04',
    customerName: 'Pelanggan UNIMUS',
    notes: 'Kopi jangan terlalu manis, tahu bakso disajikan hangat',
    items: [
      {
        productId: 1,
        name: 'Kopi Susu Arunika (Gula Aren)',
        quantity: 1,
        unitPrice: 22000,
        formattedUnitPrice: 'Rp 22.000',
        subtotal: 22000,
        formattedSubtotal: 'Rp 22.000',
        modifiers: 'Normal (100%), Susu Sapi Segar'
      },
      {
        productId: 11,
        name: 'Tahu Bakso Goreng Khas Semarang',
        quantity: 1,
        unitPrice: 18000,
        formattedUnitPrice: 'Rp 18.000',
        subtotal: 18000,
        formattedSubtotal: 'Rp 18.000',
        modifiers: ''
      }
    ],
    subtotal: 40000,
    formattedSubtotal: 'Rp 40.000',
    taxRate: 10,
    taxAmount: 4000,
    formattedTaxAmount: 'Rp 4.000',
    totalAmount: 44000,
    formattedTotalAmount: 'Rp 44.000',
    paymentMethod: 'pay_at_cashier',
    paymentStatus: 'paid',
    status: 'completed',
    statusInfo: {
      step: 4,
      label: 'Selesai',
      description: 'Pesanan telah selesai dinikmati.',
      isTerminal: true,
      badgeClass: 'bg-mint-100 text-forest-950 border-emerald-600'
    },
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  }
]

function loadHistoryFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
    // Jika baru pertama kali buka, isi dengan 1 contoh riwayat nyata
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_INITIAL_HISTORY))
    return SAMPLE_INITIAL_HISTORY
  } catch (err) {
    console.warn('Gagal membaca history dari localStorage:', err)
    return SAMPLE_INITIAL_HISTORY
  }
}

function saveHistoryToStorage(history) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch (err) {
    console.warn('Gagal menyimpan history ke localStorage:', err)
  }
}

export const useOrderStore = create((set, get) => ({
  activeOrder: null,
  orderHistory: loadHistoryFromStorage(),
  isSubmitting: false,
  error: null,

  submitOrder: async ({ tableCode, customerName, items, notes }) => {
    // Cegah submit ganda jika sedang dalam proses request
    if (get().isSubmitting) return null

    set({ isSubmitting: true, error: null })

    try {
      const payload = {
        table_code: tableCode,
        customer_name: customerName,
        notes: notes,
        items: items.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
          modifier_ids: (item.modifiers || []).map(m => m.id),
          notes: item.notes
        }))
      }

      const createdOrder = await api.createOrder(payload)
      
      // Simpan pesanan baru ke riwayat pelanggan
      const currentHistory = get().orderHistory || []
      const updatedHistory = [createdOrder, ...currentHistory.filter(o => o.id !== createdOrder.id)].slice(0, 50)
      
      set({
        activeOrder: createdOrder,
        orderHistory: updatedHistory,
        isSubmitting: false
      })
      saveHistoryToStorage(updatedHistory)

      return createdOrder
    } catch (err) {
      set({ error: err.friendlyMessage, isSubmitting: false })
      throw err
    }
  },

  fetchOrderStatus: async (orderId) => {
    try {
      const updated = await api.getOrderStatus(orderId)
      if (updated) {
        // Sinkronisasi status di dalam riwayat pelanggan
        const currentHistory = get().orderHistory || []
        const exists = currentHistory.some(o => o.id === orderId)
        if (exists) {
          const updatedHistory = currentHistory.map(o => 
            o.id === orderId ? { ...o, status: updated.status, statusInfo: updated.statusInfo } : o
          )
          set({ activeOrder: updated, orderHistory: updatedHistory })
          saveHistoryToStorage(updatedHistory)
        } else {
          set({ activeOrder: updated })
        }
      }
      return updated
    } catch (err) {
      console.warn('Gagal memuat status pesanan:', err.friendlyMessage)
      return null
    }
  },

  deleteOrderFromHistory: (orderId) => {
    const current = get().orderHistory || []
    const updated = current.filter(o => o.id !== orderId)
    set({ orderHistory: updated })
    saveHistoryToStorage(updated)
  },

  clearHistory: () => {
    set({ orderHistory: [] })
    saveHistoryToStorage([])
  },

  clearActiveOrder: () => set({ activeOrder: null, error: null })
}))
