import React from 'react'

export function CategoryFilter({ categories, activeCategory, onSelectCategory }) {
  const allTabs = [
    { id: 'all', name: 'Semua Menu' },
    ...categories,
    { id: 'manual-brew', name: 'Seduh Manual' }
  ]

  return (
    <nav className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none" aria-label="Filter kategori menu">
      {allTabs.map((tab) => {
        const isActive = String(activeCategory) === String(tab.id)
        return (
          <button
            key={tab.id}
            onClick={() => onSelectCategory(tab.id)}
            type="button"
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 touch-target ${
              isActive
                ? 'bg-forest-900 text-white shadow-warm-sm font-bold'
                : 'bg-white text-forest-950 font-semibold hover:bg-mint-100 border-2 border-pine-200 shadow-2xs'
            }`}
          >
            {tab.name}
          </button>
        )
      })}
    </nav>
  )
}
