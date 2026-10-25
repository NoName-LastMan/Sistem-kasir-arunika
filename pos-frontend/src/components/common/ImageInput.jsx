import React, { useState, useRef } from 'react'
import { api } from '../../api/client'
import { 
  Upload, Image as ImageIcon, Link as LinkIcon, 
  Check, X, AlertCircle, RefreshCw, Sparkles, Trash2
} from 'lucide-react'

export const PHOTO_PRESETS = [
  {
    name: 'Kopi Susu Aren',
    category: 'Kopi',
    url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Espresso & Americano',
    category: 'Kopi',
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Latte Art Hangat',
    category: 'Kopi',
    url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'V60 Pour Over',
    category: 'Manual Brew',
    url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Matcha Latte Artisan',
    category: 'Non-Kopi',
    url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Artisan Fruit & Herbal Tea',
    category: 'Non-Kopi',
    url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Nasi Rice Bowl & Katsu',
    category: 'Makanan',
    url: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Tahu Bakso & Camilan',
    category: 'Camilan',
    url: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80'
  }
]

export function ImageInput({ value, onChange, label = 'Foto Sajian / Gambar Menu' }) {
  const [activeTab, setActiveTab] = useState('upload') // 'upload' | 'preset' | 'url'
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  // Handle upload file
  const handleFile = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setUploadError('File harus berupa gambar (JPG, PNG, WEBP).')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Ukuran file maksimal 10MB.')
      return
    }

    setUploadError(null)
    setIsUploading(true)
    setUploadSuccess(false)

    // Buat pratinjau lokal instan
    const localReader = new FileReader()
    localReader.onload = (e) => {
      onChange(e.target.result)
    }
    localReader.readAsDataURL(file)

    // Unggah ke backend server
    try {
      const formData = new FormData()
      formData.append('image', file)

      const res = await api.upload('/upload-image', formData)
      if (res?.url) {
        onChange(res.url)
        setUploadSuccess(true)
        setTimeout(() => setUploadSuccess(false), 3000)
      }
    } catch (err) {
      // Jika upload backend gagal, pratinjau lokal base64 tetap terpasang sehingga user tidak terhalang
      console.warn('Upload endpoint error, menggunakan data gambar lokal:', err)
      setUploadSuccess(true)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block font-bold text-forest-950 uppercase tracking-wider text-[11px]">
          {label}
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[11px] font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>Hapus Foto</span>
          </button>
        )}
      </div>

      {/* Pratinjau Foto yang Sedang Terpilih */}
      {value ? (
        <div className="relative rounded-2xl overflow-hidden border-2 border-pine-200 bg-paper-100 shadow-warm-xs group">
          <div className="aspect-[16/9] w-full max-h-48 overflow-hidden bg-forest-950">
            <img
              src={value}
              alt="Pratinjau foto menu"
              className="w-full h-full object-cover group-hover:scale-102 transition duration-500"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80'
              }}
            />
          </div>

          {/* Overlay Info & Aksi */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-forest-950/90 via-forest-950/60 to-transparent p-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-white text-xs font-semibold">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Foto Aktif Siap Digunakan</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold backdrop-blur-xs transition cursor-pointer"
              >
                Ganti File
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                className="px-2.5 py-1 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-[11px] font-bold transition cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Tab Pilihan Metode Masukan Foto */}
      <div className="border border-pine-200 rounded-2xl p-3 bg-paper-50 space-y-3">
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-pine-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-forest-900 text-white shadow-2xs'
                : 'text-pine-700 hover:text-forest-950'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Unggah dari File</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preset')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'preset'
                ? 'bg-forest-900 text-white shadow-2xs'
                : 'text-pine-700 hover:text-forest-950'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Preset Galeri Kafe</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'url'
                ? 'bg-forest-900 text-white shadow-2xs'
                : 'text-pine-700 hover:text-forest-950'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Tautan URL</span>
          </button>
        </div>

        {uploadError && (
          <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-[11px] flex items-center gap-1.5 border border-red-200">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* 1. Tab Upload File Lokal / Drag & Drop */}
        {activeTab === 'upload' && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0])
                }
              }}
            />

            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-5 rounded-xl border-2 border-dashed transition text-center cursor-pointer flex flex-col items-center justify-center gap-2 ${
                dragOver
                  ? 'border-forest-800 bg-mint-50/60 scale-[1.01]'
                  : 'border-pine-300 hover:border-forest-700 bg-white hover:bg-paper-50'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-mint-100 text-forest-900 flex items-center justify-center font-bold">
                {isUploading ? (
                  <RefreshCw className="w-5 h-5 animate-spin text-emerald-700" />
                ) : (
                  <Upload className="w-5 h-5 text-emerald-700" />
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-forest-950">
                  {isUploading ? 'Sedang memproses gambar...' : 'Klik untuk Pilih Foto atau Seret ke Sini'}
                </p>
                <p className="text-[10px] text-pine-600 font-normal mt-0.5">
                  Format JPG, PNG, WEBP (Maksimal 10MB)
                </p>
              </div>

              {uploadSuccess && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  <Check className="w-3 h-3" /> Foto siap dipakai
                </span>
              )}
            </div>
          </div>
        )}

        {/* 2. Tab Preset Galeri Cepat */}
        {activeTab === 'preset' && (
          <div>
            <p className="text-[10px] text-pine-600 mb-2 font-medium">
              Klik salah satu foto menu khas Arunika berikut:
            </p>
            <div className="grid grid-cols-4 gap-2">
              {PHOTO_PRESETS.map((preset, idx) => {
                const isSelected = value === preset.url
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onChange(preset.url)}
                    className={`relative rounded-xl overflow-hidden aspect-[4/3] border-2 transition-transform hover:scale-105 text-left group cursor-pointer ${
                      isSelected
                        ? 'border-forest-900 ring-2 ring-forest-700 shadow-warm-xs'
                        : 'border-pine-200 hover:border-forest-700'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-forest-950/75 p-1">
                      <span className="text-[9px] font-bold text-white block truncate leading-tight">
                        {preset.name}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-forest-900 text-white rounded-full p-0.5 shadow-2xs">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* 3. Tab Tautan URL */}
        {activeTab === 'url' && (
          <div className="space-y-1.5">
            <p className="text-[10px] text-pine-600 font-medium">
              Tempel tautan gambar dari internet atau cloud storage:
            </p>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-pine-200 bg-white text-xs font-mono text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
              {value && (
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-xl cursor-pointer"
                >
                  Bersihkan
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
