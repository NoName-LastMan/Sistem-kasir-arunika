import React from 'react'

export function MotifDivider({ className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-3 py-6 text-emerald-700 ${className}`} aria-hidden="true">
      <div className="h-0.5 w-16 bg-pine-200" />
      <svg className="w-5 h-5 text-emerald-700" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2 L21 19 L3 19 Z" />
        <circle cx="12" cy="14" r="3" fill="#E8C95A" />
      </svg>
      <div className="h-0.5 w-16 bg-pine-200" />
    </div>
  )
}
