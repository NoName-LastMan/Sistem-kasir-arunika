import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { modalBackdrop, modalContent } from '../../lib/motion'

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

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    if (dialogRef.current) {
      dialogRef.current.focus()
    }

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
        >
          {/* Backdrop with Subtle Blur */}
          <motion.div
            variants={modalBackdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 bg-forest-950/80 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Dialog Container with Spring Physics */}
          <motion.div
            ref={dialogRef}
            tabIndex={-1}
            variants={modalContent}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`w-full ${maxWidth} bg-white rounded-2xl shadow-warm-lg border-2 border-pine-200 overflow-hidden flex flex-col max-h-[90dvh] focus:outline-none relative z-10 ${className}`}
          >
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-pine-200 bg-mint-100">
              <h3 id="dialog-title" className="text-xl font-bold font-serif text-forest-950">
                {title}
              </h3>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                type="button"
                className="p-1.5 rounded-lg text-forest-950 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 transition-colors cursor-pointer"
                aria-label="Tutup dialog"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
