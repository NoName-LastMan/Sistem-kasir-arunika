import React from 'react'
import { Link } from 'react-router-dom'
import { Coffee, ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-3xl p-8 sm:p-12 border-2 border-pine-200 shadow-warm-lg max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-mint-100 flex items-center justify-center text-emerald-600 mx-auto mb-5">
          <Coffee className="w-8 h-8 opacity-60" />
        </div>
        <span className="text-4xl font-serif font-bold text-forest-950 block mb-2">
          404
        </span>
        <h1 className="font-serif font-bold text-xl text-forest-950 mb-3">
          Halaman tidak ditemukan
        </h1>
        <p className="text-sm text-pine-700 mb-8 leading-relaxed font-normal">
          Alamat yang Anda tuju mungkin salah ketik atau telah dipindahkan.
        </p>
        <Link to="/">
          <Button size="md" className="w-full justify-center">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Kembali ke Beranda</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}
