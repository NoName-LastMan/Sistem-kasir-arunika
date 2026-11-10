import React from 'react'
import { motion } from 'framer-motion'

export function CategoryFilter({ categories, activeCategory, onSelectCategory }) {
  const allTabs = [
    { id: 'all', name: 'Semua Menu' },
    ...categories,
    { id: 'manual-brew', name: 'Seduh Manual' }
  ]

  return (
    <nav className="flex items-center gap-2 w-full max-w-full min-w-0 overflow-x-auto pb-2" aria-label="Filter kategori menu">
      {allTabs.map((tab) => {
        const isActive = String(activeCategory) === String(tab.id)
        return (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.96 }}
            onClick={() => onSelectCategory(tab.id)}
            type="button"
            className={`shrink-0 whitespace-nowrap px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 cursor-pointer ${
              isActive
                ? 'bg-forest-900 text-white shadow-warm-sm font-bold border-2 border-forest-900'
                : 'bg-white text-forest-950 font-semibold hover:bg-mint-100 border-2 border-pine-200 shadow-2xs'
            }`}
          >
            {tab.name}
          </motion.button>
        )
      })}
    </nav>
  )
}
