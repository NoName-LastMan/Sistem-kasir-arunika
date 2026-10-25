import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { QrCode, CheckCircle2, AlertCircle, ArrowRight, Utensils } from 'lucide-react'
import { useCartStore } from '../store/cartStore'
import { api } from '../api/client'
import { Button } from '../components/ui/Button'

export function TableQrEntry() {
  const { kode } = useParams()
  const navigate = useNavigate()
  const setTableCode = useCartStore(state => state.setTableCode)
  const [status, setStatus] = useState({
    state: 'validating', // 'validating' | 'success' | 'invalid'
    message: `Menghubungkan ke Meja ${kode}...`,
    tableName: `Meja ${kode}`
  })

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
        setStatus({
          state: 'success',
          message: `Selamat datang di ${table.name}! Menyiapkan katalog menu...`,
          tableName: table.name
        })

        setTimeout(() => {
          if (isMounted) navigate('/menu')
        }, 1200)
      })
      .catch((err) => {
        if (!isMounted) return
        // Tampilkan status meja tidak terdaftar dengan opsi ramah pengguna
        setStatus({
          state: 'invalid',
          message: `Kode meja "${kode}" belum terdaftar pada master meja kasir.`,
          tableName: `Meja ${kode}`
        })
      })

    return () => {
      isMounted = false
    }
  }, [kode, navigate, setTableCode])

  const handleContinueWithCode = () => {
    setTableCode(kode)
    navigate('/menu')
  }

  const handleContinueAsCounter = () => {
    setTableCode('Counter')
    navigate('/menu')
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl p-8 border-2 border-pine-200 shadow-warm-lg max-w-md w-full text-center animate-in fade-in duration-300">
        
        {status.state === 'validating' && (
          <div>
            <div className="w-16 h-16 rounded-2xl bg-mint-100 flex items-center justify-center text-emerald-700 mx-auto mb-4 animate-bounce">
              <QrCode className="w-8 h-8" />
            </div>
            <h2 className="font-serif font-bold text-xl text-forest-950 mb-2">
              Memverifikasi Meja {kode}
            </h2>
            <p className="text-sm text-pine-700 font-medium animate-pulse">
              {status.message}
            </p>
          </div>
        )}

        {status.state === 'success' && (
          <div>
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 mx-auto mb-4 animate-in zoom-in duration-300">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="font-serif font-bold text-xl text-forest-950 mb-2">
              {status.tableName} Terhubung
            </h2>
            <p className="text-sm text-pine-700 font-medium">
              {status.message}
            </p>
          </div>
        )}

        {status.state === 'invalid' && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 mx-auto mb-2">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="font-serif font-bold text-xl text-forest-950">
              Meja Tidak Ditemukan
            </h2>
            <p className="text-xs text-pine-700 font-normal leading-relaxed">
              {status.message} Anda tetap dapat melanjutkan pemesanan dengan memilih salah satu opsi di bawah ini:
            </p>

            <div className="pt-2 space-y-2.5">
              <Button
                variant="primary"
                size="md"
                className="w-full justify-center text-xs font-bold"
                onClick={handleContinueWithCode}
              >
                <span>Tetap Lanjut sebagai Meja {kode}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>

              <Button
                variant="outline"
                size="md"
                className="w-full justify-center text-xs font-semibold"
                onClick={handleContinueAsCounter}
              >
                <Utensils className="w-4 h-4 mr-1 text-forest-800" />
                <span>Pesan di Meja Kasir (Counter / Takeaway)</span>
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
