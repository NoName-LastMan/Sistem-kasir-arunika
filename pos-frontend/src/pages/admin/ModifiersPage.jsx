import React, { useState, useEffect } from 'react'
import { api, unwrapList } from '../../api/client'
import { 
  Sparkles, Plus, Trash2, Edit2, X, Check, AlertCircle, 
  Layers, Tag, DollarSign, Package
} from 'lucide-react'

export function ModifiersPage() {
  const [groups, setGroups] = useState([])
  const [ingredients, setIngredients] = useState([])
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
  const [ingredientId, setIngredientId] = useState('')
  const [quantityNeeded, setQuantityNeeded] = useState('0')
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)

  const fetchGroups = async () => {
    setLoading(true)
    try {
      const [resGroups, resIngredients] = await Promise.all([
        api.get('/admin/modifier-groups'),
        api.get('/admin/ingredients')
      ])
      setGroups(unwrapList(resGroups))
      setIngredients(unwrapList(resIngredients))
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

  const openAddItemModal = (groupId) => {
    setActiveGroupId(groupId)
    setItemName('')
    setItemPrice('0')
    setIngredientId('')
    setQuantityNeeded('0')
    setIsItemModalOpen(true)
  }

  const handleCreateItem = async (e) => {
    e.preventDefault()
    if (!activeGroupId) return
    try {
      await api.post('/admin/modifier-items', {
        modifier_group_id: activeGroupId,
        name: itemName,
        price: Number(itemPrice) || 0,
        ingredient_id: ingredientId ? Number(ingredientId) : null,
        quantity_needed: Number(quantityNeeded) || 0
      })
      setIsItemModalOpen(false)
      setItemName('')
      setItemPrice('0')
      setIngredientId('')
      setQuantityNeeded('0')
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-forest-950">
            Kelola Modifier, Topping & Varian
          </h1>
          <p className="text-xs text-ink-500 mt-1">
            Atur pilihan suhu (Hot/Ice), level gula, topping, serta sambungkan ke pemotongan stok bahan baku gudang
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

      {/* Grid Modifier Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center text-ink-400 text-xs">Memuat daftar modifier...</div>
        ) : groups.length === 0 ? (
          <div className="col-span-full py-16 text-center text-ink-400 text-xs">Belum ada grup modifier ditambahkan.</div>
        ) : (
          groups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-3xl p-5 border border-pine-200 shadow-warm-sm flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-pine-100">
                  <div>
                    <h3 className="font-serif font-bold text-base text-forest-950">
                      {group.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-ink-500">
                      <span>{group.is_required ? 'Wajib Pilih' : 'Opsional'}</span>
                      <span>•</span>
                      <span>Pilih: {group.min_selection} - {group.max_selection}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteGroup(group.id)}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                    title="Hapus Grup"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* List Items */}
                <div className="mt-3 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-pine-600 block">
                    Pilihan Varian ({group.items?.length || 0})
                  </span>
                  
                  {(!group.items || group.items.length === 0) ? (
                    <p className="text-xs text-ink-400 italic py-2">Belum ada pilihan varian.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {group.items.map((it) => (
                        <div
                          key={it.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-paper-50 border border-pine-100 text-xs"
                        >
                          <div>
                            <span className="font-semibold text-forest-950 block">{it.name}</span>
                            {it.ingredient && Number(it.quantity_needed) > 0 && (
                              <span className="text-[10px] text-emerald-800 font-medium flex items-center gap-1 mt-0.5">
                                <Package className="w-3 h-3 text-emerald-600" />
                                <span>Potong: {Number(it.quantity_needed)} {it.ingredient.base_unit} ({it.ingredient.name})</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-forest-900">
                              {Number(it.price) > 0 ? `+Rp ${Number(it.price).toLocaleString('id-ID')}` : 'Gratis'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(it.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Add Item Button */}
              <button
                type="button"
                onClick={() => openAddItemModal(group.id)}
                className="w-full py-2 px-3 rounded-xl border border-dashed border-pine-300 hover:border-forest-800 text-forest-800 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
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
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-warm-lg border border-pine-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-pine-100">
              <h3 className="font-serif font-bold text-base text-forest-950">Tambah Grup Modifier</h3>
              <button onClick={() => setIsGroupModalOpen(false)} className="text-ink-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block font-semibold text-ink-700 mb-1">Nama Grup</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Pilihan Suhu, Level Gula, Topping"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-pine-200 font-semibold"
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

      {/* Modal Add Item dengan Sambungan Bahan Baku Gudang */}
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
                  placeholder="Misal: Extra Shot Espresso, Tambah Keju Parut"
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

              {/* Sambungan Bahan Baku Gudang (BOM Resep Varian) */}
              <div className="p-3 rounded-2xl bg-paper-100 border border-pine-200 space-y-3">
                <div>
                  <label className="block font-bold text-forest-950 mb-1">
                    Bahan Baku Terkait (Opsional):
                  </label>
                  <select
                    value={ingredientId}
                    onChange={(e) => setIngredientId(e.target.value)}
                    className="w-full p-2 rounded-xl border border-pine-200 bg-white text-xs font-medium"
                  >
                    <option value="">-- Tidak Memotong Bahan Baku --</option>
                    {ingredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} ({ing.base_unit})
                      </option>
                    ))}
                  </select>
                </div>

                {ingredientId && (
                  <div>
                    <label className="block font-bold text-forest-950 mb-1">
                      Takaran per Porsi ({ingredients.find(i => String(i.id) === String(ingredientId))?.base_unit || 'unit'}):
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={quantityNeeded}
                      onChange={(e) => setQuantityNeeded(e.target.value)}
                      placeholder="Misal: 10 atau 0.05"
                      className="w-full p-2 rounded-xl border border-pine-200 bg-white font-mono font-bold"
                    />
                    <span className="text-[10px] text-emerald-800 font-medium mt-1 block">
                      Stok bahan di gudang akan otomatis terpotong setiap varian ini dipilih!
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-pine-100">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-pine-200 font-bold text-ink-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-forest-900 text-white font-bold hover:bg-forest-800 shadow-warm-sm"
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
