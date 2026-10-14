import { create } from 'zustand'
import { api } from '../api/client'

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('pos_user') || 'null'),
  token: localStorage.getItem('pos_token') || null,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const response = await api.post('/login', { email, password })
      // API typically returns { token, user } or { access_token, user } or { data: { token, user } }
      const token = response.token || response.access_token || response.data?.token
      const user = response.user || response.data?.user

      if (token && user) {
        localStorage.setItem('pos_token', token)
        localStorage.setItem('pos_user', JSON.stringify(user))
        set({ token, user, loading: false })
        return { success: true, user }
      } else {
        throw new Error('Data otentikasi tidak lengkap dari server')
      }
    } catch (err) {
      set({ error: err.message, loading: false })
      return { success: false, error: err.message }
    }
  },

  logout: async () => {
    try {
      await api.post('/logout').catch(() => {})
    } finally {
      localStorage.removeItem('pos_token')
      localStorage.removeItem('pos_user')
      set({ user: null, token: null, error: null })
      window.location.href = '/login'
    }
  },

  checkAuth: async () => {
    const token = get().token
    if (!token) return false
    try {
      const response = await api.get('/me')
      const user = response.user || response.data || response
      localStorage.setItem('pos_user', JSON.stringify(user))
      set({ user })
      return true
    } catch {
      localStorage.removeItem('pos_token')
      localStorage.removeItem('pos_user')
      set({ user: null, token: null })
      return false
    }
  },

  hasRole: (allowedRoles) => {
    const user = get().user
    if (!user) return false
    if (typeof allowedRoles === 'string') return user.role === allowedRoles
    return allowedRoles.includes(user.role)
  }
}))
