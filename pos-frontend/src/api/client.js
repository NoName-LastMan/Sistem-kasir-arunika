export function getApiBaseUrl() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  return '/api'
}

export const BASE_URL = getApiBaseUrl()

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('pos_token')
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData

  const headers = {
    'Accept': 'application/json',
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers
  })

  // Handle 401 Unauthorized
  if (response.status === 401) {
    localStorage.removeItem('pos_token')
    localStorage.removeItem('pos_user')
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }

  // Handle CSV / Blob downloads
  if (options.responseType === 'blob') {
    if (!response.ok) {
      throw new Error(`Download gagal: HTTP ${response.status}`)
    }
    return await response.blob()
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Permintaan gagal (${response.status})`
    const error = new Error(errorMsg)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

export const api = {
  get: (url, options) => apiRequest(url, { ...options, method: 'GET' }),
  post: (url, body, options) => apiRequest(url, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (url, body, options) => apiRequest(url, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  patch: (url, body, options) => apiRequest(url, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (url, options) => apiRequest(url, { ...options, method: 'DELETE' }),
  upload: (url, formData, options) => apiRequest(url, { ...options, method: 'POST', body: formData }),
  downloadCsv: async (url, filename = 'laporan.csv') => {
    const blob = await apiRequest(url, { responseType: 'blob' })
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = filename
    link.click()
    window.URL.revokeObjectURL(link.href)
  },
  downloadFile: async (url, filename = 'laporan.xlsx') => {
    const blob = await apiRequest(url, { responseType: 'blob' })
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = filename
    link.click()
    window.URL.revokeObjectURL(link.href)
  }
}

export function unwrapList(response) {
  if (!response) return []
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response?.data?.data)) return response.data.data
  if (Array.isArray(response?.data?.ingredients)) return response.data.ingredients
  if (Array.isArray(response?.items)) return response.items
  return []
}
