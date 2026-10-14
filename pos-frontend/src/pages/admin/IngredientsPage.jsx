import React, { useState, useEffect } from 'react'
import { api, unwrapList } from '../../api/client'
import { 
  Package, Plus, Search, Edit2, AlertTriangle, History, 
  X, Check, AlertCircle, ArrowDownUp
} from 'lucide-react'

export function IngredientsPage() {
  const [ingredients, setIngredients] = useState([])
  const [lowStockList, setLowStockList] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMutationModalOpen, setIsMutationModalOpen] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState(null)
  const [mutations, setMutations] = useState([])
  const [mutationsLoading, setMutationsLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    unit: 'kg',
    stock: '',
    minimum_stock: '5',
    cost_per_unit: ''
  })
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [ingRes, lowRes] = await Promise.all([
        api.get('/admin/ingredients?all=1'),
        api.get('/admin/ingredients/low-stock').catch(() => ({ data: [] }))
      ])
      setIngredients(unwrapList(ingRes))
      setLowStockList(unwrapList(lowRes))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openCreateModal = () => {
    setSelectedIngredient(null)
    setFormData({
      name: '',
      unit: 'kg',
      stock: '10',
      minimum_stock: '2',
      cost_per_unit: '15000'
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (ing) => {
    setSelectedIngredient(ing)
    setFormData({
      name: ing.name || '',
      unit: ing.unit || 'kg',
      stock: ing.stock ?? '',
      minimum_stock: ing.minimum_stock ?? '2',
      cost_per_unit: ing.cost_per_unit ?? ''
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  const openMutations = async (ing) => {
    setSelectedIngredient(ing)
    setIsMutationModalOpen(true)
    setMutationsLoading(true)
    try {
      const res = await api.get(`/admin/ingredients/${ing.id}/mutations`)
      setMutations(unwrapList(res))
    } catch {
      setMutations([])
    } finally {
      setMutationsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)
    try {
      const payload = {
        name: formData.name,
        unit: formData.unit,
        stock: Number(formData.stock) || 0,
        minimum_stock: Number(formData.minimum_stock) || 0,
        cost_per_unit: Number(formData.cost_per_unit) || 0
      }

      if (selectedIngredient) {
        await api.put(`/admin/ingredients/${selectedIngredient.id}`, payload)
      } else {
        await api.post('/admin/ingredients', payload)
      }

      setIsModalOpen(false)
      fetchData()
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan bahan baku')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = (Array.isArray(ingredients) ? ingredients : []).filter(i =>
    i.name?.toLowerCase().includes(search.toLowerCase()) ||
    (i.unit || i.base_unit)?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8 max-w-7xl w-full mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-forest-950">
            Inventaris Bahan Baku Mentah (Gudang)
          </h1>
          <p className="text-xs text-ink-500 mt-1">
            Pantau stok bahan mentah, takaran unit, dan kartu audit mutasi stok
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-900 hover:bg-forest-800 text-white text-xs font-semibold shadow-warm-md transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Bahan Mentah</span>
        </button>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockList.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-3 text-amber-900 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Peringatan: {lowStockList.length} Bahan Baku di Bawah Batas Minimum!</span>
            <p className="mt-0.5 opacity-90">
              Segera jadwalkan belanja pasar/supplier untuk: {lowStockList.map(i => `${i.name} (Sisa ${i.stock} ${i.unit})`).join(', ')}.
            </p>
          </div>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-pine-200 shadow-warm-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-pine-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari bahan baku..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-pine-200 text-xs bg-paper-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-700"
          />
        </div>
        <span className="text-xs font-mono text-ink-500">
          Total: {filtered.length} Bahan
        </span>
      </div>

      {/* Ingredients Table */}
      <div className="bg-white rounded-3xl border border-pine-200 shadow-warm-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-paper-100 text-ink-700 font-semibold uppercase text-[10px] tracking-wider border-b border-pine-200">
              <tr>
                <th className="py-3.5 px-5">Nama Bahan</th>
                <th className="py-3.5 px-4 text-center">Satuan</th>
                <th className="py-3.5 px-4 text-right">Stok Riil</th>
                <th className="py-3.5 px-4 text-right">Batas Min</th>
                <th className="py-3.5 px-4 text-right">Biaya / Unit</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pine-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-ink-400">
                    Memuat daftar bahan mentah...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-ink-400">
                    Belum ada bahan mentah terdaftar.
                  </td>
                </tr>
              ) : (
                filtered.map((ing) => {
                  const isLow = Number(ing.stock || 0) <= Number(ing.minimum_stock || 0)
                  return (
                    <tr key={ing.id} className="hover:bg-paper-50/60 transition">
                      <td className="py-3.5 px-5 font-bold text-forest-950">
                        {ing.name}
                      </td>
                      <td className="py-3.5 px-4 text-center uppercase font-mono font-semibold text-pine-700">
                        {ing.unit}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-forest-900">
                        {ing.stock}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-ink-500">
                        {ing.minimum_stock}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-ink-600">
                        Rp {Number(ing.cost_per_unit || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isLow ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isLow ? 'Menipis' : 'Aman'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openMutations(ing)}
                            className="p-1.5 rounded-lg border border-pine-200 hover:bg-paper-100 text-ink-700"
                            title="Kartu Mutasi Stok"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(ing)}
                            className="p-1.5 rounded-lg border border-pine-200 hover:bg-paper-100 text-forest-800"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-forest-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-warm-lg border border-pine-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-pine-100">
              <h3 className="font-serif font-bold text-lg text-forest-950">
                {selectedIngredient ? 'Edit Bahan Mentah' : 'Tambah Bahan Mentah'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-ink-400 hover:text-ink-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-ink-700 mb-1">Nama Bahan Mentah</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Biji Kopi Arabika, Susu Segar, Beras"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-pine-200 focus:outline-none focus:ring-2 focus:ring-forest-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink-700 mb-1">Satuan Takaran</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-pine-200 focus:outline-none focus:ring-2 focus:ring-forest-700 bg-white"
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="gr">Gram (gr)</option>
                    <option value="liter">Liter (L)</option>
                    <option value="ml">Mililiter (ml)</option>
                    <option value="pcs">Pcs / Butir</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-ink-700 mb-1">Batas Minimum Alert</label>
                  <input
                    type="number"
                    required
                    value={formData.minimum_stock}
                    onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-pine-200 focus:outline-none focus:ring-2 focus:ring-forest-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink-700 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-pine-200 focus:outline-none focus:ring-2 focus:ring-forest-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-ink-700 mb-1">Biaya Beli / Unit (Rp)</label>
                  <input
                    type="number"
                    value={formData.cost_per_unit}
                    onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-pine-200 focus:outline-none focus:ring-2 focus:ring-forest-700 font-mono"
                  />
                </div>
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
                  {submitting ? 'Menyimpan...' : 'Simpan Bahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Kartu Mutasi */}
      {isMutationModalOpen && selectedIngredient && (
        <div className="fixed inset-0 z-50 bg-forest-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-warm-lg border border-pine-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-pine-100">
              <div>
                <h3 className="font-serif font-bold text-lg text-forest-950">Kartu Mutasi Stok</h3>
                <span className="text-xs text-ink-500 font-mono">{selectedIngredient.name} ({selectedIngredient.unit})</span>
              </div>
              <button onClick={() => setIsMutationModalOpen(false)} className="text-ink-400 hover:text-ink-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 text-xs">
              {mutationsLoading ? (
                <div className="py-12 text-center text-ink-400">Memuat kartu audit mutasi...</div>
              ) : mutations.length === 0 ? (
                <div className="py-12 text-center text-ink-400">Belum ada riwayat mutasi untuk bahan ini.</div>
              ) : (
                mutations.map((m, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-paper-50 border border-pine-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          m.type === 'sales' ? 'bg-amber-100 text-amber-800' :
                          m.type === 'waste' ? 'bg-red-100 text-red-700' :
                          m.type === 'in' ? 'bg-emerald-100 text-emerald-800' : 'bg-paper-100 text-ink-800'
                        }`}>
                          {m.type}
                        </span>
                        <span className="font-mono text-ink-500 text-[11px]">
                          {new Date(m.created_at).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <span className="text-[11px] text-ink-600 block mt-1">
                        {m.description || m.reason || 'Mutasi sistem'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className={`font-mono font-bold block ${Number(m.quantity || 0) < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                        {Number(m.quantity || 0) > 0 ? `+${m.quantity}` : m.quantity} {selectedIngredient.unit}
                      </span>
                      <span className="text-[10px] text-ink-400 font-mono">
                        Sisa: {m.stock_after} {selectedIngredient.unit}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
