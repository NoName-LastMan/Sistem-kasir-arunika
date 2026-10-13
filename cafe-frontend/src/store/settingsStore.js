import { create } from 'zustand'
import { api } from '../api/client'

export const useSettingsStore = create((set, get) => ({
  settings: null,
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    if (get().settings) return get().settings
    set({ isLoading: true, error: null })
    try {
      const data = await api.getSettings()
      set({ settings: data, isLoading: false })
      return data
    } catch (err) {
      set({ error: err.friendlyMessage, isLoading: false })
      return null
    }
  }
}))
