import React, { useState, useEffect, useRef } from 'react'
import { api, unwrapList } from '../../api/client'
import { LayoutGrid, Plus, Edit2, Trash2, X, Users, QrCode, Printer, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react'

export function TablesPage() {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTable, setEditingTable] = useState(null)
  const [qrModalTable, setQrModalTable] = useState(null) // null = closed, 'ALL' = print all, or Table object
  const printAreaRef = useRef(null)

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

  const handleUpdateStatus = async (table, newStatus) => {
    try {
      await api.put(`/admin/tables/${table.id}`, {
        table_number: table.table_number,
        capacity: table.capacity,
        location: table.location,
        status: newStatus
      })
      fetchTables()
    } catch (err) {
      alert(err.message || 'Gagal memperbarui status meja')
    }
  }

  const getCafeBaseUrl = () => {
    if (typeof window !== 'undefined' && window.location) {
      return `${window.location.protocol}//${window.location.hostname}:5174`
    }
    return 'http://localhost:5174'
  }

  const handlePrintQr = () => {
    window.print()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="font-serif text-2xl font-bold text-forest-950">
            Manajemen Denah Meja (Floor Plan)
          </h1>
          <p className="text-xs text-ink-500 mt-1">
            Atur nomor meja, kapasitas kursi, status ketersediaan, dan unduh QR Code pemesanan tamu
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setQrModalTable('ALL')}
            disabled={tables.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-forest-800 text-forest-900 bg-white hover:bg-forest-50 text-xs font-bold shadow-2xs transition cursor-pointer disabled:opacity-50"
          >
            <QrCode className="w-4 h-4 text-forest-800" />
            <span>Cetak Semua QR Meja</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-900 hover:bg-forest-800 text-white text-xs font-bold shadow-warm-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Meja Baru</span>
          </button>
        </div>
      </div>

      {/* Grid Meja */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 print:hidden">
        {loading ? (
          <div className="col-span-full py-16 text-center text-ink-400 text-xs">Memuat daftar meja...</div>
        ) : tables.length === 0 ? (
          <div className="col-span-full py-16 text-center text-ink-400 text-xs">Belum ada meja ditambahkan.</div>
        ) : (
          tables.map((t) => {
            const isOccupied = t.status === 'occupied'
            const isCleaning = t.status === 'cleaning'
            const isAvailable = !isOccupied && !isCleaning

            return (
              <div
                key={t.id}
                className="p-4 rounded-2xl bg-white border border-pine-200 shadow-warm-sm flex flex-col justify-between space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase font-bold text-pine-600 tracking-wider">
                    {t.location || 'Indoor'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      isOccupied ? 'bg-amber-500 animate-pulse' : isCleaning ? 'bg-blue-500' : 'bg-emerald-500'
                    }`} />
                    <span className="text-[10px] font-bold capitalize text-ink-600">
                      {isOccupied ? 'Terisi' : isCleaning ? 'Bersih-bersih' : 'Kosong'}
                    </span>
                  </div>
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

                {/* Quick Status Toggle */}
                <div className="flex items-center justify-center gap-1 pt-2 border-t border-pine-100 text-[10px]">
                  {isOccupied && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(t, 'cleaning')}
                      className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold hover:bg-blue-100"
                      title="Ubah ke Sedang Dibersihkan"
                    >
                      Bersihkan
                    </button>
                  )}
                  {isCleaning && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(t, 'available')}
                      className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100"
                      title="Selesai Bersih -> Siap Pakai"
                    >
                      Siap Pakai
                    </button>
                  )}
                  {isAvailable && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(t, 'occupied')}
                      className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold hover:bg-amber-100"
                      title="Tandai Terisi"
                    >
                      Isi Meja
                    </button>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-pine-100">
                  <button
                    type="button"
                    onClick={() => setQrModalTable(t)}
                    className="p-1 rounded-lg text-emerald-700 hover:bg-mint-100 flex items-center gap-1 text-[11px] font-bold"
                    title="Lihat QR Code Meja"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QR</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(t)}
                      className="p-1 rounded-lg text-forest-800 hover:bg-paper-100"
                      title="Edit Meja"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(t.id)}
                      className="p-1 rounded-lg text-red-600 hover:bg-red-50"
                      title="Hapus Meja"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal Form Tambah/Edit Meja */}
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
                  placeholder="Misal: 01, M04, Bar-1"
                  value={formData.table_number}
                  onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-pine-200 font-mono text-center font-bold text-base"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink-700 mb-1">Kapasitas Kursi</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-pine-200 text-center font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink-700 mb-1">Lokasi / Area</label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-pine-200 font-medium"
                >
                  <option value="indoor">Indoor AC</option>
                  <option value="outdoor">Outdoor / Balkon</option>
                  <option value="vip">VIP Meeting Room</option>
                  <option value="bar">Bar Counter</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-ink-700 mb-1">Status Ketersediaan</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-pine-200 font-medium"
                >
                  <option value="available">Kosong (Available)</option>
                  <option value="occupied">Terisi (Occupied)</option>
                  <option value="cleaning">Sedang Dibersihkan (Cleaning)</option>
                </select>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-pine-200 font-bold text-ink-600 hover:bg-paper-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-forest-900 text-white font-bold hover:bg-forest-800 shadow-warm-sm"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Printable QR Code Meja (Bisa Satuan atau Semua Sekaligus) */}
      {qrModalTable && (
        <div className="fixed inset-0 z-50 bg-forest-950/70 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:m-0 print:bg-white print:static">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92dvh] flex flex-col shadow-warm-lg border border-pine-200 overflow-hidden print:border-none print:shadow-none print:max-w-none print:w-full print:max-h-none">
            {/* Header Modal */}
            <div className="p-4 bg-forest-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-mint-200" />
                <h3 className="font-serif font-bold text-base">
                  {qrModalTable === 'ALL' ? 'Lembar QR Code Semua Meja' : `QR Code Meja ${qrModalTable.table_number}`}
                </h3>
              </div>
              <button onClick={() => setQrModalTable(null)} className="p-1 hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Konten Kartu QR Siap Cetak */}
            <div ref={printAreaRef} className="p-6 overflow-y-auto flex-1 space-y-8 bg-paper-50 print:bg-white print:p-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 print:grid-cols-2">
                {(qrModalTable === 'ALL' ? tables : [qrModalTable]).map((t) => {
                  const targetCode = t.table_number || t.number
                  const qrUrl = `${getCafeBaseUrl()}/meja/${encodeURIComponent(targetCode)}`
                  const qrImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrUrl)}&margin=10`

                  return (
                    <div
                      key={t.id}
                      className="bg-white p-6 rounded-3xl border-2 border-pine-300 shadow-warm-sm text-center flex flex-col items-center justify-between space-y-4 print:break-inside-avoid print:border-2 print:border-black print:rounded-2xl"
                    >
                      {/* Brand Tag */}
                      <div className="border-b border-dashed border-pine-300 pb-2 w-full">
                        <span className="font-serif font-bold text-sm tracking-wider uppercase text-forest-950 block">
                          ARUNIKA COFFEE & SPACE
                        </span>
                        <span className="text-[10px] text-pine-600 block">UNIMUS Semarang • Gedung Unimus Mart Lt. 2</span>
                      </div>

                      {/* Nomor Meja Besar */}
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-wood-500 block">NOMOR MEJA</span>
                        <span className="font-mono text-4xl font-extrabold text-forest-950 block mt-0.5">
                          {targetCode}
                        </span>
                        <span className="text-[10px] text-ink-500 capitalize block mt-0.5">
                          Area {t.location || 'Indoor'} • {t.capacity || 4} Kursi
                        </span>
                      </div>

                      {/* Gambar QR Code */}
                      <div className="p-3 bg-paper-50 rounded-2xl border border-pine-200">
                        <img
                          src={qrImgSrc}
                          alt={`QR Code Meja ${targetCode}`}
                          className="w-40 h-40 object-contain mx-auto"
                        />
                      </div>

                      {/* Panduan Tamu */}
                      <div className="w-full pt-2 border-t border-dashed border-pine-300 text-center">
                        <span className="text-xs font-bold text-forest-950 block">
                          Scan QR untuk Pesan & Bayar
                        </span>
                        <p className="text-[10px] text-pine-700 mt-0.5 leading-relaxed">
                          Buka kamera smartphone Anda dan arahkan ke kode QR di atas untuk membuka menu.
                        </p>
                        <div className="mt-2 text-[9px] text-ink-400 font-mono">
                          WiFi: Arunika_Guest • Pass: arunika2026
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Tombol Cetak / Download */}
            <div className="p-4 bg-white border-t border-pine-100 flex items-center justify-end gap-3 print:hidden">
              <button
                type="button"
                onClick={() => setQrModalTable(null)}
                className="px-4 py-2.5 rounded-xl border border-pine-200 text-ink-700 font-bold text-xs hover:bg-paper-100"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handlePrintQr}
                className="px-5 py-2.5 rounded-xl bg-forest-900 text-white font-bold text-xs flex items-center gap-2 hover:bg-forest-800 shadow-warm-md"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Lembar Meja (Print)</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
