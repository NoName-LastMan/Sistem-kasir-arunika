import React, { useState, useEffect } from 'react'
import {
  X, Plus, Save, Trash2, Image as ImageIcon,
  Check, Sparkles, Coffee, AlertTriangle
} from 'lucide-react'
import { Dialog } from '../ui/Dialog'
import { Button } from '../ui/Button'
import { formatCurrency } from '../../api/mappers'
import { useMenuStore } from '../../store/menuStore'

// Preset foto estetika kafe Arunika siap pakai
const PHOTO_PRESETS = [
  {
    name: 'Kopi Susu Gula Aren',
    url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80',
    category: 'Kopi'
  },
  {
    name: 'Espresso & Americano',
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    category: 'Kopi'
  },
  {
    name: 'Latte Art Hangat',
    url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80',
    category: 'Kopi'
  },
  {
    name: 'V60 Pour Over Single Origin',
    url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80',
    category: 'Manual Brew'
  },
  {
    name: 'Cold Brew Segar Jeruk',
    url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=600&q=80',
    category: 'Manual Brew'
  },
  {
    name: 'Matcha Latte Artisan',
    url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80',
    category: 'Non-Kopi'
  },
  {
    name: 'Artisan Fruit & Flower Tea',
    url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
    category: 'Non-Kopi'
  },
  {
    name: 'Nasi Rice Bowl & Katsu',
    url: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=600&q=80',
    category: 'Makanan'
  },
  {
    name: 'Pasta Creamy Carbonara',
    url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=600&q=80',
    category: 'Makanan'
  },
  {
    name: 'Tahu Bakso & Camilan Gurih',
    url: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80',
    category: 'Camilan'
  },
  {
    name: 'Croissant & Roti Panggang',
    url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',
    category: 'Camilan'
  }
]

export function MenuEditModal({ product, isOpen, onClose }) {
  const categories = useMenuStore(state => state.categories)
  const addProduct = useMenuStore(state => state.addProduct)
  const updateProduct = useMenuStore(state => state.updateProduct)
  const deleteProduct = useMenuStore(state => state.deleteProduct)

  const isEditing = Boolean(product && product.id)

  const [formData, setFormData] = useState({
    name: '',
    categoryId: 1,
    price: 20000,
    description: '',
    image: '',
    isAvailable: true,
    isBestSeller: false,
    isNew: true,
    isManualBrew: false
  })

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        categoryId: product.categoryId || 1,
        price: product.price || 0,
        description: product.description || '',
        image: product.image || '',
        isAvailable: product.isAvailable ?? true,
        isBestSeller: Boolean(product.isBestSeller),
        isNew: Boolean(product.isNew),
        isManualBrew: Boolean(product.isManualBrew)
      })
    } else {
      // Default untuk tambah menu baru
      setFormData({
        name: '',
        categoryId: categories[0]?.id || 1,
        price: 24000,
        description: '',
        image: PHOTO_PRESETS[0].url,
        isAvailable: true,
        isBestSeller: false,
        isNew: true,
        isManualBrew: false
      })
    }
    setShowDeleteConfirm(false)
    setErrorMsg('')
  }, [product, categories, isOpen])

  if (!isOpen) return null

  const handleSave = (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setErrorMsg('Nama menu wajib diisi.')
      return
    }
    if (Number(formData.price) <= 0) {
      setErrorMsg('Harga menu harus lebih dari Rp 0.')
      return
    }

    if (isEditing) {
      updateProduct(product.id, {
        ...formData,
        price: Number(formData.price)
      })
    } else {
      addProduct({
        ...formData,
        price: Number(formData.price)
      })
    }

    onClose()
  }

  const handleDelete = () => {
    if (product?.id) {
      deleteProduct(product.id)
      onClose()
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Ubah Menu: ${formData.name || 'Produk'}` : 'Tambah Menu Baru'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-6">
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. Baris Informasi Pokok: Nama & Kategori */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-forest-950 mb-1.5 uppercase tracking-wider">
              Nama Sajian / Menu <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="cth. Kopi Susu Pandan Senja"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-pine-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 text-forest-950 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-forest-950 mb-1.5 uppercase tracking-wider">
              Kategori Menu <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => {
                const catId = Number(e.target.value)
                const isManual = catId === 2
                setFormData({
                  ...formData,
                  categoryId: catId,
                  isManualBrew: isManual || formData.isManualBrew
                })
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-pine-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 text-forest-950 font-medium bg-white"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2. Harga & Ketersediaan Stok */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-paper-100 border border-pine-200">
          <div>
            <label className="block text-xs font-bold text-forest-950 mb-1.5 uppercase tracking-wider">
              Harga Jual (Rp) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-pine-600">
                Rp
              </span>
              <input
                type="number"
                min="0"
                step="500"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full pl-11 pr-3.5 py-2.5 rounded-xl border border-pine-200 text-sm font-bold text-emerald-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <span className="text-[11px] text-pine-600 mt-1 block">
              Tampil di struk & katalog: <strong className="text-forest-950">{formatCurrency(Number(formData.price) || 0)}</strong>
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-forest-950 mb-1.5 uppercase tracking-wider">
              Status Ketersediaan
            </label>
            <div className="flex items-center gap-3 mt-1">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isAvailable: true })}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  formData.isAvailable
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-warm-xs'
                    : 'bg-white text-forest-900 border-pine-200 hover:bg-paper-50'
                }`}
              >
                Tersedia
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isAvailable: false })}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  !formData.isAvailable
                    ? 'bg-rose-700 text-white border-rose-700 shadow-warm-xs'
                    : 'bg-white text-forest-900 border-pine-200 hover:bg-paper-50'
                }`}
              >
                Stok Habis
              </button>
            </div>
            <span className="text-[11px] text-pine-600 mt-1.5 block">
              {!formData.isAvailable
                ? 'Pelanggan tidak bisa memesan item ini.'
                : 'Menu aktif dan dapat langsung dipesan tamu.'}
            </span>
          </div>
        </div>

        {/* 3. Deskripsi Menu */}
        <div>
          <label className="block text-xs font-bold text-forest-950 mb-1.5 uppercase tracking-wider">
            Deskripsi Rasa & Bahan
          </label>
          <textarea
            rows="2"
            placeholder="cth. Perpaduan espresso ganda dengan sirup pandan wangi asli dan susu segar creamy."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-pine-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 text-forest-950 font-normal"
          />
        </div>

        {/* 4. Badges & Karakter */}
        <div>
          <label className="block text-xs font-bold text-forest-950 mb-2 uppercase tracking-wider">
            Label & Sorotan Promosi
          </label>
          <div className="flex flex-wrap gap-2.5">
            <label className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${
              formData.isBestSeller
                ? 'bg-sun-400 text-forest-950 border-sun-500 font-bold'
                : 'bg-white text-pine-700 border-pine-200 hover:bg-paper-50'
            }`}>
              <input
                type="checkbox"
                checked={formData.isBestSeller}
                onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-0"
              />
              <span>Favorit / Best Seller</span>
            </label>

            <label className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${
              formData.isNew
                ? 'bg-mint-100 text-emerald-800 border-emerald-400 font-bold'
                : 'bg-white text-pine-700 border-pine-200 hover:bg-paper-50'
            }`}>
              <input
                type="checkbox"
                checked={formData.isNew}
                onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-0"
              />
              <span>Menu Baru (New)</span>
            </label>

            <label className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${
              formData.isManualBrew
                ? 'bg-forest-900 text-sun-300 border-forest-950 font-bold'
                : 'bg-white text-pine-700 border-pine-200 hover:bg-paper-50'
            }`}>
              <input
                type="checkbox"
                checked={formData.isManualBrew}
                onChange={(e) => setFormData({ ...formData, isManualBrew: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-0"
              />
              <span>Seduh Manual (Slow Bar)</span>
            </label>
          </div>
        </div>

        {/* 5. Foto Menu & Pilihan Cepat Preset */}
        <div>
          <label className="block text-xs font-bold text-forest-950 mb-1.5 uppercase tracking-wider">
            Foto Sajian (URL atau Pilih Preset Cepat)
          </label>
          <div className="flex gap-3 mb-3">
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="flex-1 px-3.5 py-2 rounded-xl border border-pine-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 text-forest-950"
            />
            {formData.image && (
              <button
                type="button"
                onClick={() => setFormData({ ...formData, image: '' })}
                className="px-2.5 py-2 text-xs font-semibold text-pine-600 hover:text-red-600 rounded-xl border border-pine-200"
              >
                Hapus Foto
              </button>
            )}
          </div>

          {/* Galeri Preset Cepat */}
          <div className="p-3 rounded-2xl bg-paper-100 border border-pine-200">
            <span className="text-[11px] font-bold text-pine-700 block mb-2">
              Pilih dari Preset Foto Estetika Arunika:
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {PHOTO_PRESETS.map((preset, idx) => {
                const isSelected = formData.image === preset.url
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFormData({ ...formData, image: preset.url })}
                    className={`relative rounded-xl overflow-hidden aspect-[4/3] border-2 transition-transform hover:scale-105 group text-left ${
                      isSelected
                        ? 'border-emerald-600 ring-2 ring-emerald-500'
                        : 'border-pine-200 hover:border-emerald-500'
                    }`}
                    title={preset.name}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-forest-950/70 p-1">
                      <span className="text-[9px] font-bold text-white block truncate leading-tight">
                        {preset.name}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-emerald-600 text-white rounded-full p-0.5 shadow-2xs">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Konfirmasi Hapus Produk */}
        {showDeleteConfirm && (
          <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-300 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>Konfirmasi Hapus Menu</span>
            </div>
            <p className="text-xs text-red-700 font-normal">
              Apakah Anda yakin ingin menghapus menu <strong>"{formData.name}"</strong>? Menu ini tidak akan ditampilkan lagi di katalog.
            </p>
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-3.5 py-1.5 rounded-xl bg-red-700 text-white font-bold text-xs hover:bg-red-800 transition-colors shadow-2xs"
              >
                Ya, Hapus Sekarang
              </button>
            </div>
          </div>
        )}

        {/* Footer Tombol Aksi */}
        <div className="pt-4 border-t border-pine-200 flex items-center justify-between gap-3">
          {isEditing ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-700 hover:bg-red-50 border border-red-200 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Menu</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="rounded-xl px-5 py-2 text-xs font-bold shadow-warm-xs"
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              <span>{isEditing ? 'Simpan Perubahan' : 'Tambahkan Menu'}</span>
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  )
}
