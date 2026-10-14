import { useEffect } from 'react'

export function useKeyboardShortcuts(handlers = {}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'F2':
          e.preventDefault()
          handlers.onSearch?.()
          break
        case 'F3':
          e.preventDefault()
          handlers.onTable?.()
          break
        case 'F4':
          e.preventDefault()
          handlers.onHold?.()
          break
        case 'F7':
          e.preventDefault()
          handlers.onHeldOrders?.()
          break
        case 'F8':
          e.preventDefault()
          handlers.onPay?.()
          break
        case 'Escape':
          handlers.onEscape?.()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlers])
}
