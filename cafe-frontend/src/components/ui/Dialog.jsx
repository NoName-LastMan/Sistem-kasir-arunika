import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export function Dialog({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
  className = ''
}) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    // Kunci scroll body saat dialog terbuka
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    // Focus pertama kali pada dialog
    if (dialogRef.current) {
      dialogRef.current.focus()
    }

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/80 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`w-full ${maxWidth} bg-white rounded-2xl shadow-warm-lg border-2 border-pine-200 overflow-hidden flex flex-col max-h-[90vh] focus:outline-none animate-modal-pop ${className}`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-pine-200 bg-mint-100">
          <h3 id="dialog-title" className="text-xl font-bold font-serif text-forest-950">
            {title}
          </h3>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-forest-950 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 transition-colors"
            aria-label="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}
