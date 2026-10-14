import React, { useState, useEffect } from 'react'
import { api, unwrapList } from '../../api/client'
import { LayoutGrid, Plus, Edit2, Trash2, X, Users } from 'lucide-react'

export function TablesPage() {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTable, setEditingTable] = useState(null)
  const [formData, setFormData] = useState({
    table_number: '',
    capacity: '4',
    location: 'indoor',
    status: 'available'
  })

  const fetchTables = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/tables')
      setTables(unwrapList(res))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTables()
  }, [])

  const openCreateModal = () => {
    setEditingTable(null)
    setFormData({
      table_number: (tables.length + 1).toString().padStart(2, '0'),
      capacity: '4',
      location: 'indoor',
      status: 'available'
    })
    setIsModalOpen(true)
  }

  const openEditModal = (t) => {
    setEditingTable(t)
    setFormData({
      table_number: t.table_number || t.number || '',
      capacity: (t.capacity || 4).toString(),
      location: t.location || 'indoor',
      status: t.status || 'available'
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        table_number: formData.table_number,
        capacity: Number(formData.capacity) || 4,
        location: formData.location,
        status: formData.status
      }

      if (editingTable) {
        await api.put(`/admin/tables/${editingTable.id}`, payload)
      } else {
        await api.post('/admin/tables', payload)
      }

      setIsModalOpen(false)
      fetchTables()
    } catch (err) {
      alert(err.message || 'Gagal menyimpan meja')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus meja ini?')) return
    try {
      await api.delete(`/admin/tables/${id}`)
      fetchTables()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="p-8 max-w-7xl w-full mx-auto space-y-6">
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-forest-950">
            Manajemen Denah Meja (Floor Plan)
          </h1>
          <p className="text-xs text-ink-500 mt-1">
            Atur nomor meja, kapasitas tempat duduk, dan area dine-in
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-900 hover:bg-forest-800 text-white text-xs font-semibold shadow-warm-md transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Meja Baru</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-ink-400 text-xs">Memuat daftar meja...</div>
        ) : tables.length === 0 ? (
          <div className="col-span-full py-16 text-center text-ink-400 text-xs">Belum ada meja ditambahkan.</div>
        ) : (
          tables.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-2xl bg-white border border-pine-200 shadow-warm-sm flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold text-pine-600 tracking-wider">
                  {t.location || 'Indoor'}
                </span>
                <span className={`w-2 h-2 rounded-full ${t.status === 'occupied' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              </div>

              <div className="text-center py-2">
                <span className="font-mono text-3xl font-bold text-forest-950">
                  {t.table_number || t.number}
                </span>
                <div className="flex items-center justify-center gap-1 text-[11px] text-ink-500 mt-1">
                  <Users className="w-3 h-3" />
                  <span>{t.capacity || 4} Kursi</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1 pt-2 border-t border-pine-100">
                <button
                  type="button"
                  onClick={() => openEditModal(t)}
                  className="p-1.5 rounded-lg text-forest-800 hover:bg-paper-100"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(t.id)}
                  className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-forest-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-warm-lg border border-pine-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-pine-100">
              <h3 className="font-serif font-bold text-base text-forest-950">
                {editingTable ? 'Edit Meja' : 'Tambah Meja'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-ink-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-ink-700 mb-1">Nomor / Label Meja</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: 01, VIP-1"
                  value={formData.table_number}
                  onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-pine-200 font-mono text-center font-bold text-base"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink-700 mb-1">Kapasitas (Kursi)</label>
                <input
                  type="number"
                  required
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-pine-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink-700 mb-1">Lokasi / Area</label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-pine-200 bg-white"
                >
                  <option value="indoor">Indoor (AC)</option>
                  <option value="outdoor">Outdoor (Taman)</option>
                  <option value="smoking">Smoking Area</option>
                  <option value="vip">Ruang VIP / Meeting</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-pine-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-pine-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-forest-900 text-white font-semibold"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
