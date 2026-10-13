import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { useCartStore } from '../store/cartStore'

/**
 * Validasi dan sinkronisasi kode meja dari QR code
 */
export function useTableCode(initialCode = null) {
  const [tableInfo, setTableInfo] = useState(null)
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState(null)
  const setTableCodeInStore = useCartStore(state => state.setTableCode)

  useEffect(() => {
    if (!initialCode) return

    let isMounted = true
    setIsValidating(true)
    setError(null)

    api.validateTable(initialCode)
      .then(table => {
        if (isMounted) {
          setTableInfo(table)
          setTableCodeInStore(table.code)
          setIsValidating(false)
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err.friendlyMessage || `Meja ${initialCode} tidak ditemukan`)
          setTableInfo(null)
          setIsValidating(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [initialCode, setTableCodeInStore])

  return { tableInfo, isValidating, error }
}
