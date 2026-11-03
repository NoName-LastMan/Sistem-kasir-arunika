import { create } from 'zustand'
import { api } from '../api/client'

const STORAGE_KEY = 'arunika_customer_orders_v1'

function loadHistoryFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        // Bersihkan dummy mock order lama agar tidak memicu 404 di server
        return parsed.filter(o => o && o.id !== 'ord-unimus-01' && !String(o.id).startsWith('ord-unimus'))
      }
    }
    return []
  } catch (err) {
    console.warn('Gagal membaca history dari localStorage:', err)
    return []
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
      const currentHistory = (get().orderHistory || []).filter(o => o.id !== 'ord-unimus-01')
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
    if (!orderId || String(orderId).startsWith('ord-unimus')) return null
    try {
      const updated = await api.getOrderStatus(orderId)
      if (updated) {
        // Sinkronisasi status di dalam riwayat pelanggan (cocokkan id numerik maupun invoice_number)
        const currentHistory = get().orderHistory || []
        const isMatch = (item) => (
          String(item.id) === String(orderId) ||
          String(item.invoiceNumber) === String(orderId) ||
          String(item.id) === String(updated.id) ||
          String(item.invoiceNumber) === String(updated.invoiceNumber)
        )
        const exists = currentHistory.some(isMatch)
        if (exists) {
          const updatedHistory = currentHistory.map(o => 
            isMatch(o) ? { ...o, ...updated, status: updated.status, statusInfo: updated.statusInfo } : o
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

  cancelOrder: async (orderId, reason = 'Dibatalkan oleh pelanggan dari smartphone') => {
    try {
      const res = await api.cancelOrder(orderId, reason)
      await get().fetchOrderStatus(orderId)
      return res
    } catch (err) {
      console.warn('Gagal membatalkan pesanan:', err.friendlyMessage || err.message)
      throw err
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
