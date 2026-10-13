import React from 'react'
import { Search, X } from 'lucide-react'

export function SearchBar({ value, onChange, onClear, placeholder = 'Cari kopi, makanan, atau camilan...' }) {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-pine-600">
        <Search className="w-5 h-5" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-11 pr-10 py-2.5 rounded-xl bg-white border-2 border-pine-200 text-forest-950 text-sm placeholder:text-pine-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-all shadow-warm-sm"
        aria-label="Cari menu"
      />
      {value && (
        <button
          onClick={onClear}
          type="button"
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-pine-600 hover:text-forest-950 transition-colors"
          aria-label="Bersihkan pencarian"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
