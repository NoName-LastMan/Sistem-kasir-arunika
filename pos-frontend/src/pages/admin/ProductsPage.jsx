import React, { useState, useEffect } from 'react'
import { api, unwrapList } from '../../api/client'
import { 
  Coffee, Plus, Search, Edit2, Trash2, X, Check, AlertCircle, 
  Tag, DollarSign, Package
} from 'lucide-react'

export function ProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category_id: '',
    price: '',
    cost_price: '',
    stock: '',
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
      sku: 'SKU-' + Math.floor(1000 + Math.random() * 9000),
      barcode: '',
      category_id: categories[0]?.id || '',
      price: '',
      cost_price: '',
      stock: '100',
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
        name: formData.name,
        sku: formData.sku,
        barcode: formData.barcode || null,
        category_id: Number(formData.category_id),
        price: Number(formData.price),
        cost_price: Number(formData.cost_price) || 0,
        stock: formData.stock !== '' ? Number(formData.stock) : null,
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

  return (
    <div className="p-8 max-w-7xl w-full mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-forest-950">
            Master Menu & Produk
          </h1>
          <p className="text-xs text-ink-500 mt-1">
            Kelola katalog menu, harga jual, HPP (modal), dan barcode kasir
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-900 hover:bg-forest-800 text-white text-xs font-semibold shadow-warm-md transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
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
                <th className="py-3.5 px-5">Nama Menu</th>
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
                    <td className="py-3.5 px-5 font-bold text-forest-950">
                      {p.name}
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
                      Rp {Number(p.price || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-ink-600">
                      Rp {Number(p.cost_price || 0).toLocaleString('id-ID')}
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
                          className="p-1.5 rounded-lg border border-pine-200 hover:bg-paper-100 text-forest-800"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
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
        <div className="fixed inset-0 z-50 bg-forest-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-warm-lg border border-pine-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-pine-100">
              <h3 className="font-serif font-bold text-lg text-forest-950">
                {editingProduct ? 'Edit Master Menu' : 'Tambah Menu Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-ink-400 hover:text-ink-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
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
                  <label className="block font-semibold text-ink-700 mb-1">SKU</label>
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
                    className="w-full p-2.5 rounded-xl border border-pine-200 focus:outline-none focus:ring-2 focus:ring-forest-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-ink-700 mb-1">HPP / Modal (Rp)</label>
                  <input
                    type="number"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-pine-200 focus:outline-none focus:ring-2 focus:ring-forest-700 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-pine-300 text-forest-800 focus:ring-forest-700"
                />
                <label htmlFor="is_active" className="text-xs font-semibold text-ink-800">
                  Menu Tersedia & Aktif Dijual
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-pine-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-pine-200 hover:bg-paper-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-forest-900 hover:bg-forest-800 text-white font-semibold shadow-warm-md"
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
