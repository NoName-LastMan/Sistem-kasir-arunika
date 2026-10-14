import { create } from 'zustand'
import { api } from '../api/client'

export const useShiftStore = create((set, get) => ({
  currentShift: null,
  loading: false,
  error: null,
  lastClosedSummary: null,

  fetchCurrentShift: async () => {
    set({ loading: true, error: null })
    try {
      const res = await api.get('/shift/current')
      set({ currentShift: res.data || null, loading: false })
      return res.data
    } catch (err) {
      set({ error: err.message, loading: false })
      return null
    }
  },

  openShift: async (startingCash) => {
    set({ loading: true, error: null })
    try {
      const res = await api.post('/shift/open', { starting_cash: Number(startingCash) })
      set({ currentShift: res.data, loading: false })
      return { success: true, data: res.data }
    } catch (err) {
      set({ error: err.message, loading: false })
      return { success: false, error: err.message }
    }
  },

  closeShift: async (actualCash, notes = '') => {
    set({ loading: true, error: null })
    try {
      const res = await api.post('/shift/close', { actual_cash: Number(actualCash), notes })
      set({ currentShift: null, lastClosedSummary: res.data, loading: false })
      return { success: true, data: res.data }
    } catch (err) {
      set({ error: err.message, loading: false })
      return { success: false, error: err.message }
    }
  }
}))
