import React, { useState, useEffect } from 'react'
import { api, unwrapList } from '../../api/client'
import { 
  Sparkles, Plus, Trash2, Edit2, X, Check, AlertCircle, 
  Layers, Tag, DollarSign
} from 'lucide-react'

export function ModifiersPage() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  // Form group states
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [isRequired, setIsRequired] = useState(false)
  const [minSelection, setMinSelection] = useState('0')
  const [maxSelection, setMaxSelection] = useState('1')

  // Form item states
  const [activeGroupId, setActiveGroupId] = useState(null)
  const [itemName, setItemName] = useState('')
  const [itemPrice, setItemPrice] = useState('0')
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)

  const fetchGroups = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/modifier-groups')
      setGroups(unwrapList(res))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGroups()
  }, [])

  const handleCreateGroup = async (e) => {
    e.preventDefault()
    try {
      await api.post('/admin/modifier-groups', {
        name: groupName,
        is_required: isRequired,
        min_selection: Number(minSelection) || 0,
        max_selection: Number(maxSelection) || 1
      })
      setIsGroupModalOpen(false)
      setGroupName('')
      fetchGroups()
    } catch (err) {
      alert(err.message || 'Gagal membuat grup modifier')
    }
  }

  const handleDeleteGroup = async (id) => {
    if (!window.confirm('Hapus grup modifier ini beserta seluruh varian pilihannya?')) return
    try {
      await api.delete(`/admin/modifier-groups/${id}`)
      fetchGroups()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleCreateItem = async (e) => {
    e.preventDefault()
    if (!activeGroupId) return
    try {
      await api.post('/admin/modifier-items', {
        modifier_group_id: activeGroupId,
        name: itemName,
        price: Number(itemPrice) || 0
      })
      setIsItemModalOpen(false)
      setItemName('')
      setItemPrice('0')
      fetchGroups()
    } catch (err) {
      alert(err.message || 'Gagal menambahkan opsi varian')
    }
  }

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Hapus opsi varian ini?')) return
    try {
      await api.delete(`/admin/modifier-items/${itemId}`)
      fetchGroups()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="p-8 max-w-7xl w-full mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-forest-950">
            Kelola Varian & Modifier (Topping, Ukuran, Level)
          </h1>
          <p className="text-xs text-ink-500 mt-1">
            Atur opsi kustomisasi menu kafe untuk pilihan kasir maupun pesanan mandiri tamu
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsGroupModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-900 hover:bg-forest-800 text-white text-xs font-semibold shadow-warm-md transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Grup Modifier</span>
        </button>
      </div>

      {/* Grid of Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center text-ink-400 text-xs">Memuat daftar grup modifier...</div>
        ) : groups.length === 0 ? (
          <div className="col-span-full py-16 text-center text-ink-400 text-xs">Belum ada grup modifier terdaftar.</div>
        ) : (
          groups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-3xl border border-pine-200 p-6 shadow-warm-sm flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-pine-100">
                  <div>
                    <h3 className="font-serif font-bold text-base text-forest-950 leading-tight">
                      {group.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        group.is_required ? 'bg-amber-100 text-amber-800' : 'bg-paper-100 text-ink-600'
                      }`}>
                        {group.is_required ? 'Wajib Pilih' : 'Opsional'}
                      </span>
                      <span className="text-[10px] text-ink-400 font-mono">
                        Pilih {group.min_selection} - {group.max_selection}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteGroup(group.id)}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer"
                    title="Hapus Grup"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Items List */}
                <div className="pt-3 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500 block">
                    Pilihan Varian:
                  </span>
                  {(group.items || []).length === 0 ? (
                    <p className="text-xs text-ink-400 italic py-2">Belum ada opsi varian.</p>
                  ) : (
                    (group.items || []).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-paper-50 border border-pine-100 text-xs"
                      >
                        <span className="font-semibold text-forest-950">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-forest-900">
                            {Number(item.price) === 0 ? 'Gratis' : `+Rp ${Number(item.price).toLocaleString('id-ID')}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add item to group button */}
              <button
                type="button"
                onClick={() => {
                  setActiveGroupId(group.id)
                  setIsItemModalOpen(true)
                }}
                className="w-full py-2 px-3 rounded-xl border border-dashed border-forest-700/60 hover:bg-forest-50 text-forest-900 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Opsi Varian</span>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Modal Add Group */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 bg-forest-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-warm-lg border border-pine-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-pine-100">
              <h3 className="font-serif font-bold text-base text-forest-950">Tambah Kelompok Modifier Baru</h3>
              <button onClick={() => setIsGroupModalOpen(false)} className="text-ink-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block font-semibold text-ink-700 mb-1">Nama Kelompok Varian</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Level Gula, Ukuran Cup, Extra Topping"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-pine-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink-700 mb-1">Min Pilihan</label>
                  <input
                    type="number"
                    value={minSelection}
                    onChange={(e) => setMinSelection(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-pine-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-ink-700 mb-1">Max Pilihan</label>
                  <input
                    type="number"
                    value={maxSelection}
                    onChange={(e) => setMaxSelection(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-pine-200 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="req"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="rounded text-forest-800"
                />
                <label htmlFor="req" className="font-semibold text-ink-800">
                  Wajib Dipilih oleh Pelanggan (Required)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-pine-100">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-pine-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-forest-900 text-white font-semibold"
                >
                  Simpan Grup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Item */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-forest-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-warm-lg border border-pine-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-pine-100">
              <h3 className="font-serif font-bold text-base text-forest-950">Tambah Opsi Varian</h3>
              <button onClick={() => setIsItemModalOpen(false)} className="text-ink-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="block font-semibold text-ink-700 mb-1">Nama Pilihan Varian</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Less Sugar (50%), Extra Shot Espresso"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-pine-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink-700 mb-1">Tambahan Harga (Rp)</label>
                <input
                  type="number"
                  required
                  placeholder="0 jika gratis"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-pine-200 font-mono"
                />
                <span className="text-[10px] text-ink-400 mt-0.5 block">Isi 0 jika tidak ada biaya tambahan</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-pine-100">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-pine-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-forest-900 text-white font-semibold"
                >
                  Simpan Varian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
