import React from 'react'

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  ...props
}) {
  const base = "inline-flex items-center justify-center font-medium transition-all btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none touch-target"

  const variants = {
    primary: "bg-emerald-600 text-white hover:bg-forest-900 active:bg-forest-900 shadow-warm-sm",
    secondary: "bg-mint-100 text-forest-900 hover:bg-mint-100/80 active:bg-mint-100/70",
    outline: "border border-forest-900/20 text-forest-900 hover:bg-mint-100/40 active:bg-mint-100/60",
    ghost: "text-forest-900 hover:bg-mint-100/30 active:bg-mint-100/50",
    danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800"
  }

  const sizes = {
    sm: "text-sm px-3.5 py-1.5 rounded-lg gap-1.5",
    md: "text-base px-5 py-2.5 rounded-xl gap-2",
    lg: "text-lg px-7 py-3.5 rounded-xl gap-2.5 font-semibold"
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span>Memproses...</span>
        </>
      ) : children}
    </button>
  )
}
