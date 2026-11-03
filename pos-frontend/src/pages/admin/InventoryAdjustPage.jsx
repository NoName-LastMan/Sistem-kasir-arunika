import React, { useState, useEffect } from 'react'
import { api } from '../../api/client'
import { 
  ArrowDownUp, AlertTriangle, Package, Plus, Search, CheckCircle2, 
  AlertCircle, History, ArrowDown, ArrowUp, RefreshCw
} from 'lucide-react'

export function InventoryAdjustPage() {
  const [products, setProducts] = useState([])
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [mutationLogs, setMutationLogs] = useState([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [selectedProductId, setSelectedProductId] = useState('')
  const [adjustType, setAdjustType] = useState('in') // 'in' | 'out' | 'opname'
  const [quantity, setQuantity] = useState('')
  const [referenceNote, setReferenceNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  const [formSuccess, setFormSuccess] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [prodRes, lowRes, logRes] = await Promise.all([
        api.get('/admin/products'),
        api.get('/admin/inventory/low-stock').catch(() => ({ data: [] })),
        api.get('/admin/inventory/logs').catch(() => ({ data: [] }))
      ])
      setProducts(prodRes?.data || prodRes || [])
      setLowStockProducts(lowRes?.data || lowRes || [])
      setMutationLogs(logRes?.data?.data || logRes?.data || logRes || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAdjustSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)
    setFormSuccess(false)

    try {
      await api.post('/admin/inventory/adjust', {
        product_id: Number(selectedProductId),
        type: adjustType,
        quantity: Number(quantity),
        reference_note: referenceNote || null
      })
      setFormSuccess(true)
      setSelectedProductId('')
      setQuantity('')
      setReferenceNote('')
      fetchData()
      setTimeout(() => setFormSuccess(false), 4000)
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan penyesuaian stok')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedProduct = products.find(p => p.id === Number(selectedProductId))

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-forest-950">
          Penyesuaian Stok Gudang & Alert Inventaris (ERP)
        </h1>
        <p className="text-xs text-ink-500 mt-1">
          Modul ERP gudang untuk input barang masuk (*Stock In*), barang keluar/rusak (*Stock Out*), dan opname stok
        </p>
      </div>

      {/* Low Stock Banner Alert */}
      {lowStockProducts.length > 0 && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-300 flex items-start gap-3 text-red-900 text-xs shadow-warm-sm">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Peringatan: {lowStockProducts.length} Produk Mencapai Batas Kritis (&le; 10)!</span>
            <p className="mt-0.5 opacity-90">
              Produk menipis: {lowStockProducts.map(p => `${p.name} (Sisa ${p.stock})`).join(', ')}. Segera lakukan penambahan stok gudang.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Form Adjust & Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Form Adjust Stock */}
        <div className="bg-white rounded-3xl border border-pine-200 p-6 shadow-warm-md space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-pine-100">
            <ArrowDownUp className="w-5 h-5 text-forest-800" />
            <h3 className="font-serif font-bold text-base text-forest-950">Form Penyesuaian Stok</h3>
          </div>

          {formSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs border border-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Penyesuaian stok berhasil dicatat ke kartu audit!</span>
            </div>
          )}

          {formError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-ink-700 mb-1">Pilih Produk Menu</label>
              <select
                required
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-pine-200 bg-white"
              >
                <option value="">Pilih Produk</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stok Saat Ini: {p.stock ?? 'Unlimited'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-ink-700 mb-1">Jenis Penyesuaian</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'in', label: 'Stok Masuk (In)', color: 'border-emerald-600 bg-emerald-50 text-emerald-800' },
                  { id: 'out', label: 'Stok Keluar (Out)', color: 'border-red-600 bg-red-50 text-red-800' },
                  { id: 'opname', label: 'Opname Fisik', color: 'border-blue-600 bg-blue-50 text-blue-800' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAdjustType(item.id)}
                    className={`py-2 px-1 text-[11px] rounded-xl border font-bold text-center transition cursor-pointer ${
                      adjustType === item.id ? item.color : 'border-pine-200 bg-white text-ink-600'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-ink-700 mb-1">
                Jumlah {adjustType === 'opname' ? 'Hasil Hitung Fisik' : 'Perubahan'}
              </label>
              <input
                type="number"
                required
                placeholder="Misal: 50"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-pine-200 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-ink-700 mb-1">
                Nomor Referensi / Catatan Alasan
              </label>
              <input
                type="text"
                placeholder="Misal: Surat Jalan Supplier #PO-2026-08"
                value={referenceNote}
                onChange={(e) => setReferenceNote(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-pine-200"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-forest-900 hover:bg-forest-800 text-white font-semibold text-xs shadow-warm-md transition cursor-pointer"
            >
              {submitting ? 'Menyimpan...' : 'Eksekusi Penyesuaian Stok'}
            </button>
          </form>
        </div>

        {/* Right Columns: Mutation Logs Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-pine-200 p-6 shadow-warm-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-pine-100">
            <h3 className="font-serif font-bold text-base text-forest-950 flex items-center gap-2">
              <History className="w-4 h-4 text-forest-800" />
              <span>Kartu Audit Mutasi Produk Gudang</span>
            </h3>
            <span className="text-xs font-mono text-ink-400">Total: {mutationLogs.length} Entri</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-paper-100 text-ink-700 font-semibold uppercase text-[10px] tracking-wider border-b border-pine-200">
                <tr>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Produk</th>
                  <th className="py-3 px-4 text-center">Tipe</th>
                  <th className="py-3 px-4 text-right">Jumlah</th>
                  <th className="py-3 px-4">Staf</th>
                  <th className="py-3 px-4">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pine-100 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-ink-400">Memuat log audit...</td>
                  </tr>
                ) : mutationLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-ink-400">Belum ada catatan mutasi inventaris.</td>
                  </tr>
                ) : (
                  mutationLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-paper-50/60 transition">
                      <td className="py-3 px-4 font-mono text-ink-500 text-[11px]">
                        {new Date(log.created_at).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 font-bold text-forest-950">
                        {log.product?.name || 'Produk'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          log.type === 'in' ? 'bg-emerald-100 text-emerald-800' :
                          log.type === 'out' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-forest-900">
                        {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                      </td>
                      <td className="py-3 px-4 text-ink-700">
                        {log.user?.name || '-'}
                      </td>
                      <td className="py-3 px-4 text-ink-500 truncate max-w-xs">
                        {log.description || log.reference_number || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  )
}
