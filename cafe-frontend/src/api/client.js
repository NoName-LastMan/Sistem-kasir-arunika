import { mockSettings, mockCategories, mockProducts, mockModifierGroups } from './mock/data'
import { mockCreateOrder, mockGetOrderStatus, mockValidateTable } from './mock/handlers'
import { mapSettings, mapCategory, mapProduct, mapModifierGroup, mapTable, mapOrder } from './mappers'

export function getApiBaseUrl() {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL
  return '/api'
}



const API_BASE_URL = getApiBaseUrl()
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_USE_MOCK === true

export class ApiError extends Error {
  constructor(status, message, details = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.friendlyMessage = message
    this.details = details
  }
}

/**
 * Helper request dengan fetch dan error handler terpusat
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  const defaultHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    })

    const contentType = response.headers.get('content-type')
    const isJson = contentType && contentType.includes('application/json')
    const data = isJson ? await response.json() : await response.text()

    if (!response.ok) {
      const errorMsg = data?.message || data?.error || `Terjadi kendala pada server (Kode: ${response.status})`
      throw new ApiError(response.status, errorMsg, data)
    }

    return data
  } catch (err) {
    if (err instanceof ApiError) {
      throw err
    }
    // Network error atau CORS
    throw new ApiError(0, 'Koneksi ke server terputus. Pastikan koneksi internet Anda stabil.', err)
  }
}

export const api = {
  /**
   * Mengambil informasi toko & pengaturan publik
   * GET /api/public/settings
   */
  async getSettings() {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 200))
      return mapSettings(mockSettings)
    }
    try {
      const res = await request('/public/settings')
      return mapSettings(res.data || res)
    } catch (err) {
      console.warn('[API fallback] Memakai mock settings:', err.friendlyMessage)
      return mapSettings(mockSettings)
    }
  },

  /**
   * Mengambil katalog menu publik (Kategori, Produk, Modifier)
   * GET /api/public/menu
   */
  async getMenu() {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300))
      const modifierGroups = mockModifierGroups.map(mapModifierGroup)
      const categories = mockCategories.map(mapCategory)
      const products = mockProducts.map(p => mapProduct(p, modifierGroups))
      return { categories, products, modifierGroups }
    }

    try {
      const res = await request('/public/menu')
      const rawData = res.data || res
      const modifierGroups = (rawData.modifier_groups || []).map(mapModifierGroup)
      const categories = (rawData.categories || []).map(mapCategory)
      const products = (rawData.products || []).map(p => mapProduct(p, modifierGroups))
      return { categories, products, modifierGroups }
    } catch (err) {
      console.warn('[API fallback] Memakai mock menu:', err.friendlyMessage)
      const modifierGroups = mockModifierGroups.map(mapModifierGroup)
      const categories = mockCategories.map(mapCategory)
      const products = mockProducts.map(p => mapProduct(p, modifierGroups))
      return { categories, products, modifierGroups }
    }
  },

  /**
   * Memvalidasi kode meja dari scan QR
   * GET /api/public/tables/:code
   */
  async validateTable(code) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 250))
      const result = mockValidateTable(code)
      if (!result.is_valid) {
        throw new ApiError(404, result.message)
      }
      return mapTable(result.data)
    }

    try {
      const res = await request(`/public/tables/${encodeURIComponent(code)}`)
      const raw = res.data || res
      return mapTable(raw)
    } catch (err) {
      // Fallback ke mock jika backend belum mengimplementasikan endpoint
      const result = mockValidateTable(code)
      if (result.is_valid) return mapTable(result.data)
      throw err
    }
  },

  /**
   * Membuat pesanan tamu
   * POST /api/public/orders
   */
  async createOrder(payload) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 600))
      try {
        const result = mockCreateOrder(payload)
        return mapOrder(result.data)
      } catch (e) {
        throw new ApiError(400, e.message)
      }
    }

    const res = await request('/public/orders', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    return mapOrder(res.data || res)
  },

  /**
   * Mengambil status pelacakan pesanan
   * GET /api/public/orders/:id/status
   */
  async getOrderStatus(orderId) {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 200))
      const raw = mockGetOrderStatus(orderId)
      return mapOrder(raw)
    }

    const res = await request(`/public/orders/${encodeURIComponent(orderId)}/status`)
    return mapOrder(res.data || res)
  },

  /**
   * Membatalkan pesanan mandiri tamu (hanya jika status masih pending)
   * POST /api/public/orders/:id/cancel
   */
  async cancelOrder(orderId, reason = 'Dibatalkan oleh pelanggan') {
    const res = await request(`/public/orders/${encodeURIComponent(orderId)}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    })
    return res
  }
  }
