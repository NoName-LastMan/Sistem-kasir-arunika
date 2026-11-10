import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { SkipLink } from './SkipLink'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { TableBanner } from './TableBanner'
import { CartDrawer } from '../cart/CartDrawer'
import { FloatingCartBar } from '../cart/FloatingCartBar'
import { useSettingsStore } from '../../store/settingsStore'
import { useCartStore } from '../../store/cartStore'

export function Layout({ children }) {
  const location = useLocation()
  const [isCartOpen, setIsCartOpen] = useState(false)
  const settings = useSettingsStore(state => state.settings)
  const fetchSettings = useSettingsStore(state => state.fetchSettings)
  const setTableCode = useCartStore(state => state.setTableCode)

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // Auto-detect kode meja jika datang lewat query parameter (?table=M01)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tableParam = params.get('table')
    if (tableParam && tableParam.trim()) {
      setTableCode(tableParam.trim())
    }
  }, [location.search, setTableCode])

  // Aksesibilitas perpindahan rute: scroll ke atas dan fokus ke heading utama (universal Safari/Firefox/Chrome)
  useEffect(() => {
    window.scrollTo(0, 0)

    const timer = setTimeout(() => {
      const heading = document.querySelector('h1')
      if (heading) {
        heading.setAttribute('tabindex', '-1')
        heading.focus({ preventScroll: true })
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [location.pathname])

  return (
    <div className="min-h-screen flex flex-col bg-paper-50 text-ink-900 w-full min-w-0">
      <SkipLink />
      <TableBanner />
      <Navbar onOpenCart={() => setIsCartOpen(true)} />

      <main id="main-content" className="flex-1 w-full min-w-0 focus:outline-none">
        {children}
      </main>

      <Footer settings={settings} />

      <FloatingCartBar onOpenCart={() => setIsCartOpen(true)} />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </div>
  )
}
