import React, { useState, useEffect } from 'react'
import { api, unwrapList } from '../../api/client'
import { 
  Trash2, Plus, AlertCircle, Calendar, Package, AlertTriangle, 
  HelpCircle, DollarSign
} from 'lucide-react'

export function WasteManagementPage() {
  const [wasteLogs, setWasteLogs] = useState([])
  const [wasteSummary, setWasteSummary] = useState(null)
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [ingredientId, setIngredientId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('expired')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [logsRes, sumRes, ingRes] = await Promise.all([
        api.get('/admin/waste'),
        api.get('/admin/waste/summary').catch(() => null),
        api.get('/admin/ingredients?all=1')
      ])
      setWasteLogs(unwrapList(logsRes))
      setWasteSummary(sumRes?.data || sumRes)
      setIngredients(unwrapList(ingRes))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await api.post('/admin/waste', {
        ingredient_id: Number(ingredientId),
        quantity: Number(quantity),
        reason,
        notes
      })
      alert('Pencatatan waste berhasil disimpan. Stok bahan baku telah disesuaikan.')
      setIngredientId('')
      setQuantity('')
      setNotes('')
      fetchData()
    } catch (err) {
      setError(err.message || 'Gagal menyimpan pencatatan waste')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedIng = Array.isArray(ingredients) 
    ? ingredients.find(i => i.id === Number(ingredientId)) 
    : null

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-forest-950">
          Pencatatan Bahan Terbuang & Rusak (Waste & Spoilage)
        </h1>
        <p className="text-xs text-ink-500 mt-1">
          Catat bahan basi, kedaluwarsa, atau tumpah agar stok riil gudang tetap akurat dan audit terjaga
        </p>
      </div>

      {/* Grid: Form & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Log Waste */}
        <div className="bg-white rounded-3xl border border-pine-200 p-6 shadow-warm-md space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-pine-100">
            <Trash2 className="w-5 h-5 text-red-600" />
            <h3 className="font-serif font-bold text-base text-forest-950">Catat Bahan Terbuang</h3>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-ink-700 mb-1">Pilih Bahan Mentah</label>
              <select
                required
                value={ingredientId}
                onChange={(e) => setIngredientId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-pine-200 bg-white"
              >
                <option value="">Pilih Bahan Baku</option>
                {ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-ink-700 mb-1">
                Jumlah Terbuang {selectedIng ? `(${selectedIng.unit})` : ''}
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="Misal: 1.5"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-pine-200 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-ink-700 mb-1">Alasan Terbuang</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-pine-200 bg-white"
              >
                <option value="expired">Expired (Kedaluwarsa)</option>
                <option value="damaged">Damaged (Rusak / Tumpah)</option>
                <option value="spoilage">Spoilage (Basi / Membusuk)</option>
                <option value="cooking_error">Cooking Error (Salah Masak / Gosong)</option>
                <option value="other">Lain-lain</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-ink-700 mb-1">Catatan Staf (Wajib Diisi)</label>
              <textarea
                required
                rows={2}
                placeholder="Jelaskan detail kejadian..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-pine-200 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-warm-md transition cursor-pointer"
            >
              {submitting ? 'Menyimpan...' : 'Simpan & Potong Stok Gudang'}
            </button>
          </form>
        </div>

        {/* Right 2 cols: History Logs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border border-pine-200 p-6 shadow-warm-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-pine-100">
              <h3 className="font-serif font-bold text-base text-forest-950">Riwayat Pencatatan Waste</h3>
              <span className="text-xs font-mono text-ink-400">Total: {wasteLogs.length} Catatan</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-paper-100 text-ink-700 font-semibold uppercase text-[10px] tracking-wider border-b border-pine-200">
                  <tr>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Bahan Baku</th>
                    <th className="py-3 px-4 text-right">Jumlah</th>
                    <th className="py-3 px-4 text-center">Alasan</th>
                    <th className="py-3 px-4">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pine-100 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-ink-400">Memuat log waste...</td>
                    </tr>
                  ) : wasteLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-ink-400">Belum ada pencatatan bahan terbuang.</td>
                    </tr>
                  ) : (
                    wasteLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-paper-50/60 transition">
                        <td className="py-3 px-4 font-mono text-ink-500 text-[11px]">
                          {new Date(log.created_at).toLocaleDateString('id-ID')}
                        </td>
                        <td className="py-3 px-4 font-bold text-forest-950">
                          {log.ingredient?.name || log.ingredient_name || 'Bahan'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-red-600">
                          {log.quantity} {log.ingredient?.unit || ''}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 capitalize">
                            {log.reason?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-ink-600 max-w-xs truncate">
                          {log.notes || '-'}
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

    </div>
  )
}
