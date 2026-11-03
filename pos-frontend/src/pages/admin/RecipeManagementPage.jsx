import React, { useState, useEffect } from 'react'
import { api, unwrapList } from '../../api/client'
import { 
  ChefHat, Coffee, Plus, Trash2, ArrowRight, Check, AlertCircle, 
  HelpCircle, Scale, Package
} from 'lucide-react'

export function RecipeManagementPage() {
  const [products, setProducts] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [recipeItems, setRecipeItems] = useState([])
  const [loadingRecipe, setLoadingRecipe] = useState(false)

  // Form add ingredient to recipe
  const [selectedIngredientId, setSelectedIngredientId] = useState('')
  const [quantityRequired, setQuantityRequired] = useState('')
  const [unitRatio, setUnitRatio] = useState('1')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('/admin/products'),
      api.get('/admin/ingredients?all=1')
    ]).then(([prodRes, ingRes]) => {
      const pList = unwrapList(prodRes)
      const iList = unwrapList(ingRes)
      setProducts(pList)
      setIngredients(iList)
      if (pList.length > 0) {
        handleSelectProduct(pList[0])
      }
    }).catch((err) => {
      console.error('Gagal memuat master resep:', err)
      setProducts([])
      setIngredients([])
    })
  }, [])

  const handleSelectProduct = async (product) => {
    setSelectedProduct(product)
    setLoadingRecipe(true)
    setError(null)
    try {
      const res = await api.get(`/admin/products/${product.id}/recipe`)
      const items = res?.data?.ingredients || unwrapList(res)
      setRecipeItems(Array.isArray(items) ? items : [])
    } catch {
      setRecipeItems([])
    } finally {
      setLoadingRecipe(false)
    }
  }

  const handleAddIngredient = async (e) => {
    e.preventDefault()
    if (!selectedProduct || !selectedIngredientId) return
    setSubmitting(true)
    setError(null)

    const selectedIng = Array.isArray(ingredients) 
      ? ingredients.find(i => i.id === Number(selectedIngredientId)) 
      : null

    try {
      await api.post(`/admin/products/${selectedProduct.id}/recipe`, {
        ingredient_id: Number(selectedIngredientId),
        quantity_needed: Number(quantityRequired),
        recipe_unit: selectedIng?.base_unit || selectedIng?.unit || 'unit',
        conversion_factor: Number(unitRatio) || 1
      })
      
      // Refresh recipe
      handleSelectProduct(selectedProduct)
      setSelectedIngredientId('')
      setQuantityRequired('')
    } catch (err) {
      setError(err.message || 'Gagal menambahkan bahan baku ke resep')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemoveIngredient = async (ingredientId) => {
    if (!window.confirm('Hapus bahan baku ini dari takaran resep?')) return
    try {
      await api.delete(`/admin/products/${selectedProduct.id}/recipe/${ingredientId}`)
      handleSelectProduct(selectedProduct)
    } catch (err) {
      alert(err.message)
    }
  }

  const activeIngredient = Array.isArray(ingredients)
    ? ingredients.find(i => i.id === Number(selectedIngredientId))
    : null

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-forest-950">
          Resep Menu Otomatis (Bill of Materials / BOM)
        </h1>
        <p className="text-xs text-ink-500 mt-1">
          Hubungkan menu jadi dengan takaran bahan mentah untuk pemotongan otomatis (*Auto-Deduct*) saat kasir checkout
        </p>
      </div>

      {/* Explainer Card */}
      <div className="p-4 rounded-2xl bg-forest-900 text-white flex items-start gap-3 shadow-warm-sm">
        <HelpCircle className="w-5 h-5 text-sun-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <span className="font-bold text-mint-200">Cara Kerja Sistem BOM Anti-Bocor:</span>
          <p className="opacity-90 leading-relaxed">
            Ketika kasir menjual 1 porsi menu, sistem secara otomatis menghitung dan memotong gramasi/liter bahan mentah terkait di gudang. Seluruh pengurangan ini dicatat di kartu audit mutasi stok (*Stock Mutations*).
          </p>
        </div>
      </div>

      {/* Main Grid: Products List & Recipe Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Product Selector */}
        <div className="bg-white rounded-3xl border border-pine-200 p-5 shadow-warm-md space-y-3">
          <h3 className="font-serif font-bold text-base text-forest-950 pb-2 border-b border-pine-100 flex items-center gap-2">
            <Coffee className="w-4 h-4 text-forest-800" />
            <span>Pilih Menu Produk</span>
          </h3>

          <div className="space-y-1.5 max-h-[550px] overflow-y-auto">
            {products.map((p) => {
              const isSelected = selectedProduct?.id === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectProduct(p)}
                  className={`w-full p-3 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-forest-800 bg-forest-900 text-white shadow-sm'
                      : 'border-pine-200 bg-paper-50 hover:bg-pine-100 text-forest-950'
                  }`}
                >
                  <div>
                    <span className="font-semibold text-xs block leading-tight">{p.name}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-pine-300' : 'text-ink-500'}`}>{p.category?.name || 'Menu'}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              )
            })}
          </div>
        </div>

        {/* Right: Recipe Editor for Selected Product (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {selectedProduct ? (
            <div className="bg-white rounded-3xl border border-pine-200 p-6 shadow-warm-md space-y-6">
              
              <div className="flex items-center justify-between pb-3 border-b border-pine-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-pine-500">Formulasi Resep Menu</span>
                  <h2 className="font-serif font-bold text-xl text-forest-950">{selectedProduct.name}</h2>
                </div>
                <div className="text-right">
                  <span className="text-xs text-ink-500 block">Harga Jual Menu</span>
                  <span className="font-mono text-sm font-bold text-forest-900">
                    Rp {Number(selectedProduct.price || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Form Add Ingredient */}
              <form onSubmit={handleAddIngredient} className="p-4 rounded-2xl bg-paper-50 border border-pine-200 space-y-3">
                <h4 className="text-xs font-bold text-forest-950 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-forest-800" />
                  <span>Tambahkan Bahan Baku ke Resep Ini</span>
                </h4>

                {error && (
                  <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-ink-700 mb-1">Bahan Baku</label>
                    <select
                      required
                      value={selectedIngredientId}
                      onChange={(e) => setSelectedIngredientId(e.target.value)}
                      className="w-full p-2 rounded-xl border border-pine-200 bg-white"
                    >
                      <option value="">Pilih Bahan Mentah</option>
                      {ingredients.map((ing) => (
                        <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-ink-700 mb-1">
                      Takaran per 1 Porsi {activeIngredient ? `(${activeIngredient.unit})` : ''}
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      required
                      placeholder="Misal: 0.2 (200 gr)"
                      value={quantityRequired}
                      onChange={(e) => setQuantityRequired(e.target.value)}
                      className="w-full p-2 rounded-xl border border-pine-200 bg-white font-mono"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-2.5 px-4 rounded-xl bg-forest-900 hover:bg-forest-800 text-white font-semibold shadow-warm-sm transition cursor-pointer"
                    >
                      {submitting ? 'Menyimpan...' : '+ Tambah ke Resep'}
                    </button>
                  </div>
                </div>
              </form>

              {/* Current Recipe Ingredients List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-forest-950 uppercase tracking-wider">
                  Bahan Baku yang Digunakan ({recipeItems.length})
                </h4>

                {loadingRecipe ? (
                  <p className="text-xs text-ink-400 py-8 text-center">Memuat takaran resep...</p>
                ) : recipeItems.length === 0 ? (
                  <div className="p-8 text-center bg-paper-50 rounded-2xl border border-dashed border-pine-200 text-ink-400 text-xs">
                    Belum ada takaran bahan baku untuk menu ini. Tambahkan bahan mentah di atas agar stok dapat dipotong otomatis saat kasir membuat pesanan.
                  </div>
                ) : (
                  <div className="divide-y divide-pine-100 border border-pine-200 rounded-2xl overflow-hidden bg-white">
                    {recipeItems.map((item, idx) => {
                      const ingName = item.name || item.ingredient?.name || 'Bahan'
                      const ingUnit = item.pivot?.recipe_unit || item.base_unit || item.unit || item.ingredient?.unit || 'unit'
                      const qty = item.pivot?.quantity_needed ?? item.quantity ?? item.amount ?? 0

                      return (
                        <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-paper-50/50 transition text-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-pine-100 text-forest-800 flex items-center justify-center font-bold">
                              <Package className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-bold text-forest-950 block">{ingName}</span>
                              <span className="text-[11px] text-ink-500">Dipotong setiap 1 porsi menu terjual</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="font-mono font-bold text-forest-900 text-sm">
                              {qty} {ingUnit}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveIngredient(item.ingredient_id || item.id)}
                              className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition cursor-pointer"
                              title="Hapus dari resep"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="p-16 text-center text-ink-400 text-xs">
              Pilih produk di sebelah kiri untuk melihat dan mengedit resep takaran.
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
