import React, { useState, useEffect } from 'react'
import { api, unwrapList } from '../../api/client'
import { ImageInput, PHOTO_PRESETS } from '../../components/common/ImageInput'
import { 
  Coffee, Plus, Search, Edit2, Trash2, X, Check, AlertCircle, 
  Tag, DollarSign, Package, RefreshCw
} from 'lucide-react'

export function ProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  
  const generateSku = () => 'ARU-' + Math.floor(1000 + Math.random() * 9000)

  const [formData, setFormData] = useState({
    name: '',
    sku: generateSku(),
    barcode: '',
    category_id: '',
    price: '',
    cost_price: '',
    stock: '',
    track_stock: true,
    description: '',
    image: '',
    is_active: true
  })
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/admin/products'),
        api.get('/admin/categories')
      ])
      setProducts(unwrapList(prodRes))
      setCategories(unwrapList(catRes))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openCreateModal = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      sku: generateSku(),
      barcode: '',
      category_id: categories[0]?.id || '',
      price: '',
      cost_price: '',
      stock: '100',
      track_stock: true,
      description: '',
      image: PHOTO_PRESETS[0].url,
      is_active: true
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (p) => {
    setEditingProduct(p)
    setFormData({
      name: p.name || '',
      sku: p.sku || '',
      barcode: p.barcode || '',
      category_id: p.category_id || '',
      price: p.price || '',
      cost_price: p.cost_price || '',
      stock: p.stock ?? '',
      track_stock: p.track_stock ?? true,
      description: p.description || '',
      image: p.image || '',
      is_active: p.is_active ?? true
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
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
        stock: formData.stock !== '' ? Number(formData.stock) : null,
        track_stock: Boolean(formData.track_stock),
        description: formData.description || null,
        image: formData.image || null,
        is_active: Boolean(formData.is_active)
      }

      if (editingProduct) {
        await api.put(`/admin/products/${editingProduct.id}`, payload)
      } else {
        await api.post('/admin/products', payload)
      }

      setIsModalOpen(false)
      fetchData()
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan produk')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus master menu produk ini?')) return
    try {
      await api.delete(`/admin/products/${id}`)
      fetchData()
    } catch (err) {
      alert(err.message || 'Gagal menghapus produk')
    }
  }

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(search.toLowerCase())
  )

  const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID')

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-forest-950">
            Master Menu & Produk
          </h1>
          <p className="text-xs text-ink-500 mt-1">
            Kelola katalog menu kasir, harga jual, HPP (modal), foto sajian, dan barcode
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-900 hover:bg-forest-800 text-white text-xs font-semibold shadow-warm-md transition cursor-pointer"
        >
          <Plus className="w-4 h-4 text-sun-400" />
          <span>Tambah Menu Baru</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-pine-200 shadow-warm-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-pine-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari menu, SKU, atau barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-pine-200 text-xs bg-paper-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-700"
          />
        </div>
        <span className="text-xs font-mono text-ink-500">
          Total: {filteredProducts.length} Produk
        </span>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-pine-200 shadow-warm-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-paper-100 text-ink-700 font-semibold uppercase text-[10px] tracking-wider border-b border-pine-200">
              <tr>
                <th className="py-3.5 px-5">Foto & Nama Menu</th>
                <th className="py-3.5 px-4">SKU / Barcode</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4 text-right">Harga Jual</th>
                <th className="py-3.5 px-4 text-right">HPP (Modal)</th>
                <th className="py-3.5 px-4 text-center">Stok</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pine-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-ink-400">
                    Memuat daftar master produk...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-ink-400">
                    Belum ada menu produk terdaftar.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-paper-50/60 transition">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-10 h-10 rounded-xl object-cover border border-pine-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-paper-100 border border-pine-200 flex items-center justify-center shrink-0 text-pine-400">
                            <Coffee className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-forest-950 leading-tight">
                            {p.name}
                          </div>
                          {p.description && (
                            <div className="text-[10px] text-ink-500 font-normal line-clamp-1 mt-0.5 max-w-xs">
                              {p.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-ink-600">
                      <div>{p.sku}</div>
                      {p.barcode && <div className="text-[10px] text-pine-600">{p.barcode}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-ink-700">
                      <span className="px-2 py-0.5 rounded-md bg-paper-100 text-forest-900 text-[10px] font-semibold">
                        {p.category?.name || '-'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-forest-900">
                      {formatRupiah(p.price)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-ink-600">
                      {formatRupiah(p.cost_price)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">
                      {p.stock !== null ? (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.stock <= 5 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {p.stock}
                        </span>
                      ) : (
                        <span className="text-ink-400">Unlimited</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        p.is_active !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {p.is_active !== false ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg border border-pine-200 hover:bg-paper-100 text-forest-800 cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-forest-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-warm-lg border border-pine-200 space-y-4 max-h-[92vh] flex flex-col overflow-hidden">
            
            <div className="flex items-center justify-between pb-3 border-b border-pine-100 shrink-0">
              <h3 className="font-serif font-bold text-lg text-forest-950">
                {editingProduct ? `Edit Menu: ${formData.name || 'Produk'}` : 'Tambah Menu Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-ink-400 hover:text-ink-900 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200 shrink-0">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
              <div>
                <label className="block font-semibold text-ink-700 mb-1">Nama Menu</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Es Kopi Susu Aren"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-pine-200 focus:outline-none focus:ring-2 focus:ring-forest-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-ink-700">SKU</label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, sku: generateSku() })}
                      className="text-[10px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
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
                    className="w-full p-2.5 rounded-xl border border-pine-200 focus:outline-none focus:ring-2 focus:ring-forest-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-ink-700 mb-1">Kode Barcode (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Scan atau ketik kode"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-pine-200 focus:outline-none focus:ring-2 focus:ring-forest-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink-700 mb-1">Kategori</label>
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-pine-200 focus:outline-none focus:ring-2 focus:ring-forest-700 bg-white"
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-ink-700 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    placeholder="Kosongkan jika unlimited"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-pine-200 focus:outline-none focus:ring-2 focus:ring-forest-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink-700 mb-1">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-pine-200 focus:outline-none focus:ring-2 focus:ring-forest-700 font-mono font-bold text-forest-900"
                  />
                  <span className="text-[10px] text-pine-600 block mt-0.5">
                    {formatRupiah(formData.price)}
                  </span>
                </div>
                <div>
                  <label className="block font-semibold text-ink-700 mb-1">HPP / Modal (Rp)</label>
                  <input
                    type="number"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-pine-200 focus:outline-none focus:ring-2 focus:ring-forest-700 font-mono"
                  />
                  <span className="text-[10px] text-pine-600 block mt-0.5">
                    Margin: {formatRupiah(Math.max(0, formData.price - formData.cost_price))}
                  </span>
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block font-semibold text-ink-700 mb-1">Deskripsi / Catatan Rasa</label>
                <textarea
                  rows="2"
                  placeholder="Karakteristik rasa, racikan, atau porsi sajian..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-pine-200 focus:outline-none focus:ring-2 focus:ring-forest-700 font-normal"
                />
              </div>

              {/* Masukan Foto Menu (Upload / Preset / URL) */}
              <ImageInput
                value={formData.image}
                onChange={(img) => setFormData({ ...formData, image: img })}
              />

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-pine-300 text-forest-800 focus:ring-forest-700"
                />
                <label htmlFor="is_active" className="text-xs font-semibold text-ink-800 cursor-pointer">
                  Menu Tersedia & Aktif Dijual
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-pine-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-pine-200 hover:bg-paper-100 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-forest-900 hover:bg-forest-800 text-white font-semibold shadow-warm-md cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
