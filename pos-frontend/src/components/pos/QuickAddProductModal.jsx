import React, { useState, useEffect } from 'react'
import { api } from '../../api/client'
import { useAuthStore } from '../../stores/authStore'
import { ImageInput, PHOTO_PRESETS } from '../common/ImageInput'
import { 
  X, Plus, Coffee, AlertCircle, Check, Sparkles, 
  DollarSign, Package, RefreshCw
} from 'lucide-react'

export function QuickAddProductModal({ isOpen, onClose, onSuccess, categories = [] }) {
  const { hasRole } = useAuthStore()

  const generateSku = () => 'ARU-' + Math.floor(1000 + Math.random() * 9000)

  const [formData, setFormData] = useState({
    name: '',
    sku: generateSku(),
    barcode: '',
    category_id: '',
    price: 24000,
    cost_price: 12000,
    stock: 50,
    track_stock: true,
    description: '',
    image: PHOTO_PRESETS[0].url,
    is_active: true
  })

  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        sku: generateSku(),
        barcode: '',
        category_id: categories[0]?.id || '',
        price: 24000,
        cost_price: 12000,
        stock: 50,
        track_stock: true,
        description: '',
        image: PHOTO_PRESETS[0].url,
        is_active: true
      })
      setFormError(null)
    }
  }, [isOpen, categories])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setFormError('Nama menu wajib diisi.')
      return
    }
    if (!formData.category_id) {
      setFormError('Pilih kategori untuk menu ini.')
      return
    }
    if (Number(formData.price) <= 0) {
      setFormError('Harga jual menu harus lebih dari Rp 0.')
      return
    }

    setSubmitting(true)
    setFormError(null)

    try {
      const payload = {
        name: formData.name.trim(),
        sku: formData.sku || generateSku(),
        barcode: formData.barcode || null,
        category_id: Number(formData.category_id),
        price: Number(formData.price),
        cost_price: Number(formData.cost_price) || 0,
        stock: formData.track_stock ? Number(formData.stock || 0) : 0,
        track_stock: Boolean(formData.track_stock),
        description: formData.description || null,
        image: formData.image || null,
        is_active: true
      }

      // Endpoint: gunakan /admin/products jika admin/superadmin, atau /products jika kasir
      const endpoint = hasRole(['admin', 'superadmin']) ? '/admin/products' : '/products'
      const res = await api.post(endpoint, payload)
      const createdItem = res.data || res

      if (onSuccess) {
        onSuccess(createdItem)
      }
      onClose()
    } catch (err) {
      setFormError(err.message || 'Gagal menambahkan menu baru.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatRupiah = (val) => {
    return 'Rp ' + Number(val || 0).toLocaleString('id-ID')
  }

  return (
    <div className="fixed inset-0 z-50 bg-forest-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-warm-lg border border-pine-200 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3.5 border-b border-pine-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-forest-900 text-sun-400 flex items-center justify-center font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-forest-950 leading-tight">
                Tambah Menu Baru di Kasir
              </h3>
              <p className="text-[11px] text-pine-600 font-normal">
                Menu baru akan langsung tersedia di grid transaksi kasir & POS
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-ink-400 hover:text-ink-900 hover:bg-paper-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs pr-1">
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{formError}</span>
            </div>
          )}

          <form id="quick-add-form" onSubmit={handleSubmit} className="space-y-4">
            
            {/* 1. Baris Nama Menu & Kategori */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-forest-950 uppercase tracking-wider text-[11px] mb-1">
                  Nama Menu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="cth. Es Kopi Susu Arunika"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-pine-200 text-xs text-forest-950 font-medium focus:outline-none focus:ring-2 focus:ring-forest-700 bg-paper-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-forest-950 uppercase tracking-wider text-[11px] mb-1">
                  Kategori Menu <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-pine-200 text-xs text-forest-950 font-medium focus:outline-none focus:ring-2 focus:ring-forest-700 bg-white"
                >
                  <option value="">Pilih Kategori...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Harga Jual & HPP Modal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 rounded-2xl bg-paper-100 border border-pine-200">
              <div>
                <label className="block font-bold text-forest-950 uppercase tracking-wider text-[11px] mb-1">
                  Harga Jual (Rp) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-pine-600">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-pine-200 bg-white font-mono font-bold text-forest-900 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
                  />
                </div>
                <span className="text-[10px] text-pine-600 mt-0.5 block font-mono">
                  Preview: <strong className="text-forest-950">{formatRupiah(formData.price)}</strong>
                </span>
              </div>

              <div>
                <label className="block font-bold text-forest-950 uppercase tracking-wider text-[11px] mb-1">
                  HPP / Modal Satuan (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-pine-600">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-pine-200 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-forest-700"
                  />
                </div>
                <span className="text-[10px] text-pine-600 mt-0.5 block font-mono">
                  Estimasi Margin: <strong className="text-emerald-700">{formatRupiah(Math.max(0, formData.price - formData.cost_price))}</strong>
                </span>
              </div>
            </div>

            {/* 3. SKU & Barcode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-forest-950 uppercase tracking-wider text-[11px]">
                    SKU Produk
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, sku: generateSku() })}
                    className="text-[10px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Acak SKU</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-pine-200 bg-paper-50 font-mono text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-forest-700"
                />
              </div>

              <div>
                <label className="block font-bold text-forest-950 uppercase tracking-wider text-[11px] mb-1">
                  Barcode Scanner (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Ketik atau tembak barcode..."
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-pine-200 bg-paper-50 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-forest-700"
                />
              </div>
            </div>

            {/* 4. Pengaturan Stok Awal */}
            <div className="p-3 rounded-2xl bg-paper-50 border border-pine-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="pos_track_stock"
                    checked={formData.track_stock}
                    onChange={(e) => setFormData({ ...formData, track_stock: e.target.checked })}
                    className="rounded text-forest-800 focus:ring-0"
                  />
                  <label htmlFor="pos_track_stock" className="font-semibold text-forest-950 text-xs cursor-pointer">
                    Lacak Pengurangan Stok Otomatis Saat Transaksi
                  </label>
                </div>
              </div>

              {formData.track_stock && (
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[11px] text-pine-700 font-medium">Stok Awal di Kasir:</span>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-24 px-2.5 py-1 rounded-lg border border-pine-200 bg-white font-mono font-bold text-center text-xs focus:ring-2 focus:ring-forest-700"
                  />
                  <span className="text-[11px] text-pine-500">Porsi / Cup</span>
                </div>
              )}
            </div>

            {/* 5. Deskripsi Menu */}
            <div>
              <label className="block font-bold text-forest-950 uppercase tracking-wider text-[11px] mb-1">
                Catatan Rasa / Deskripsi Singkat
              </label>
              <textarea
                rows="2"
                placeholder="cth. Espresso ganda racikan kopi arabika lokal dengan susu creamy dan sirup aren organik."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-pine-200 text-xs text-forest-950 font-normal focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
            </div>

            {/* 6. Masukan Foto Menu (Upload / Preset / URL) */}
            <ImageInput
              value={formData.image}
              onChange={(img) => setFormData({ ...formData, image: img })}
            />

          </form>
        </div>

        {/* Footer Tombol Aksi */}
        <div className="pt-3.5 border-t border-pine-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-pine-200 hover:bg-paper-100 font-semibold text-xs text-pine-800 transition"
          >
            Batal
          </button>

          <button
            type="submit"
            form="quick-add-form"
            disabled={submitting}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-forest-900 hover:bg-forest-800 text-white font-bold text-xs shadow-warm-md transition cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>{submitting ? 'Menyimpan...' : 'Tambahkan ke Menu Kasir'}</span>
          </button>
        </div>

      </div>
    </div>
  )
}
