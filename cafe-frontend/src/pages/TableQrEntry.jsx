import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { QrCode, CheckCircle2, AlertCircle } from 'lucide-react'
import { useCartStore } from '../store/cartStore'
import { api } from '../api/client'

export function TableQrEntry() {
  const { kode } = useParams()
  const navigate = useNavigate()
  const setTableCode = useCartStore(state => state.setTableCode)
  const [status, setStatus] = useState({ state: 'validating', message: `Menghubungkan ke Meja ${kode}...` })

  useEffect(() => {
    if (!kode) {
      navigate('/menu')
      return
    }

    let isMounted = true

    api.validateTable(kode)
      .then((table) => {
        if (!isMounted) return
        setTableCode(table.code)
        setStatus({ state: 'success', message: `Selamat datang di ${table.name}! Menyiapkan katalog menu...` })

        setTimeout(() => {
          if (isMounted) navigate('/menu')
        }, 1200)
      })
      .catch((err) => {
        if (!isMounted) return
        // Tetap simpan kode meja sebagai fallback
        setTableCode(kode)
        setStatus({
          state: 'success',
          message: `Selamat datang di Meja ${kode}! Menyiapkan katalog menu...`
        })

        setTimeout(() => {
          if (isMounted) navigate('/menu')
        }, 1200)
      })

    return () => {
      isMounted = false
    }
  }, [kode, navigate, setTableCode])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl p-8 border-2 border-pine-200 shadow-warm-lg max-w-sm w-full text-center animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-2xl bg-mint-100 flex items-center justify-center text-emerald-600 mx-auto mb-4 animate-bounce">
          <QrCode className="w-8 h-8" />
        </div>
        <h2 className="font-serif font-bold text-xl text-forest-950 mb-2">
          Meja {kode} Terdeteksi
        </h2>
        <p className="text-sm text-pine-700 font-medium">
          {status.message}
        </p>
      </div>
    </div>
  )
}
