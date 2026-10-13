import React from 'react'

export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-mint-100 text-forest-950 font-bold border border-pine-200 shadow-2xs',
    bestSeller: 'bg-sun-400 text-forest-950 font-bold border border-amber-500 shadow-2xs',
    new: 'bg-emerald-600 text-white font-bold shadow-2xs',
    soldOut: 'bg-zinc-200 text-zinc-700 border border-zinc-400 font-bold',
    open: 'bg-mint-100 text-forest-950 border border-emerald-600 font-bold shadow-2xs',
    closed: 'bg-red-100 text-red-800 border border-red-300 font-bold shadow-2xs'
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs transition-colors ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  )
}
