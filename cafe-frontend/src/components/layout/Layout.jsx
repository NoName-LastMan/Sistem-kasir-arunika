import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { SkipLink } from './SkipLink'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { TableBanner } from './TableBanner'
import { CartDrawer } from '../cart/CartDrawer'
import { FloatingCartBar } from '../cart/FloatingCartBar'
import { useSettingsStore } from '../../store/settingsStore'

export function Layout({ children }) {
  const location = useLocation()
  const [isCartOpen, setIsCartOpen] = useState(false)
  const settings = useSettingsStore(state => state.settings)
  const fetchSettings = useSettingsStore(state => state.fetchSettings)

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // Aksesibilitas perpindahan rute: scroll ke atas dan fokus ke heading utama
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })

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
    <div className="min-h-screen flex flex-col bg-paper-50 text-ink-900">
      <SkipLink />
      <TableBanner />
      <Navbar onOpenCart={() => setIsCartOpen(true)} />

      <main id="main-content" className="flex-1 focus:outline-none">
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
