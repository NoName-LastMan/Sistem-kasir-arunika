<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../../api'
import { BookOpen, Plus, Search, Trash2, X, DollarSign, ChefHat } from 'lucide-vue-next'

const products = ref([])
const allIngredients = ref([])
const selectedProduct = ref(null)
const recipe = ref([])
const isLoading = ref(true)
const searchQuery = ref('')

const showRecipeModal = ref(false)
const editingRecipe = ref([])
const estimatedCost = ref(0)

const fetchProducts = async () => {
  isLoading.value = true
  try {
    const [prodRes, ingRes] = await Promise.all([
      api.get('/admin/products'),
      api.get('/admin/ingredients')
    ])
    products.value = prodRes.data.data || []
    allIngredients.value = ingRes.data.data.data || []
  } catch (err) {
    console.error('Gagal mengambil data:', err)
  } finally {
    isLoading.value = false
  }
}

const openRecipeModal = async (product) => {
  selectedProduct.value = product
  try {
    const { data } = await api.get(`/admin/products/${product.id}/recipe`)
    editingRecipe.value = data.data.ingredients.map(i => ({
      ingredient_id: i.id,
      name: i.name,
      base_unit: i.base_unit,
      quantity_needed: parseFloat(i.pivot.quantity_needed),
      recipe_unit: i.pivot.recipe_unit,
      conversion_factor: parseFloat(i.pivot.conversion_factor)
    }))
    estimatedCost.value = data.data.estimated_cost || 0
  } catch (err) {
    editingRecipe.value = []
    estimatedCost.value = 0
  }
  showRecipeModal.value = true
}

const addRecipeItem = () => {
  editingRecipe.value.push({
    ingredient_id: '',
    name: '',
    base_unit: '',
    quantity_needed: 0,
    recipe_unit: 'gr',
    conversion_factor: 0.001
  })
}

const removeRecipeItem = (index) => {
  editingRecipe.value.splice(index, 1)
}

const onIngredientSelect = (item, index) => {
  const ing = allIngredients.value.find(i => i.id == item.ingredient_id)
  if (ing) {
    editingRecipe.value[index].name = ing.name
    editingRecipe.value[index].base_unit = ing.base_unit
    // Auto-set conversion factor based on unit
    if (ing.base_unit === 'kg' && item.recipe_unit === 'gr') {
      editingRecipe.value[index].conversion_factor = 0.001
    } else if (ing.base_unit === 'liter' && item.recipe_unit === 'ml') {
      editingRecipe.value[index].conversion_factor = 0.001
    } else {
      editingRecipe.value[index].conversion_factor = 1
    }
  }
}

const saveRecipe = async () => {
  if (editingRecipe.value.length === 0) {
    alert('Tambahkan minimal 1 bahan ke resep!')
    return
  }

  try {
    await api.post(`/admin/products/${selectedProduct.value.id}/recipe`, {
      ingredients: editingRecipe.value.map(i => ({
        ingredient_id: i.ingredient_id,
        quantity_needed: i.quantity_needed,
        recipe_unit: i.recipe_unit,
        conversion_factor: i.conversion_factor
      }))
    })
    alert('Resep berhasil disimpan!')
    showRecipeModal.value = false
    await fetchProducts()
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menyimpan resep')
  }
}

const deleteRecipeItem = async (product, ingredient) => {
  if (!confirm(`Hapus ${ingredient.name} dari resep ${product.name}?`)) return
  try {
    await api.delete(`/admin/products/${product.id}/recipe/${ingredient.id}`)
    await openRecipeModal(product)
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menghapus')
  }
}

const filteredProducts = computed(() => {
  if (!searchQuery.value) return products.value
  return products.value.filter(p =>
    p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0)

onMounted(() => fetchProducts())
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-xl font-extrabold text-white flex items-center gap-2">
          <BookOpen class="w-5 h-5 text-purple-400" /> Resep Produk (BOM)
        </h1>
        <p class="text-xs text-slate-400">Atur komposisi bahan baku per porsi produk. Sistem akan otomatis mengurangi stok bahan saat penjualan.</p>
      </div>
    </div>

    <!-- Search -->
    <div class="relative">
      <Search class="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Cari produk..."
        class="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white outline-none focus:border-purple-500 transition-colors"
      />
    </div>

    <!-- Products Grid -->
    <div v-if="isLoading" class="p-12 text-center text-slate-500 text-xs font-semibold">Memuat data...</div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-if="filteredProducts.length === 0" class="col-span-full p-8 text-center text-slate-500 text-xs">
        Tidak ada produk ditemukan.
      </div>

      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="bg-slate-950 rounded-2xl border border-slate-800 p-4 shadow-xl hover:border-purple-500/30 transition-all cursor-pointer"
        @click="openRecipeModal(product)"
      >
        <div class="flex items-start justify-between mb-3">
          <div>
            <h3 class="font-extrabold text-white text-sm">{{ product.name }}</h3>
            <p class="text-[11px] text-slate-500">{{ product.category?.name || 'Tanpa Kategori' }}</p>
          </div>
          <span class="text-xs font-mono bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-lg border border-purple-500/20">
            {{ formatRupiah(product.price) }}
          </span>
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-slate-800/60">
          <div class="flex items-center gap-2 text-xs text-slate-400">
            <ChefHat class="w-4 h-4" />
            <span>Klik untuk atur resep</span>
          </div>
          <span class="text-[10px] text-slate-500">HPP: {{ formatRupiah(product.cost_price) }}</span>
        </div>
      </div>
    </div>

    <!-- MODAL RESEP -->
    <div v-if="showRecipeModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden max-h-[85vh] flex flex-col">
        <div class="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 shrink-0">
          <div>
            <h3 class="text-base font-extrabold text-white">Resep: {{ selectedProduct?.name }}</h3>
            <p class="text-[11px] text-slate-400 mt-0.5">Atur bahan baku per 1 porsi produk</p>
          </div>
          <button @click="showRecipeModal = false" class="text-slate-400 hover:text-white"><X class="w-5 h-5"/></button>
        </div>

        <div class="overflow-y-auto flex-1 p-6 space-y-4">
          <!-- Recipe Items -->
          <div v-for="(item, index) in editingRecipe" :key="index" class="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-400">Bahan #{{ index + 1 }}</span>
              <button @click="removeRecipeItem(index)" class="text-slate-500 hover:text-rose-400 transition-colors">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[10px] font-bold text-slate-400 mb-1">Pilih Bahan</label>
                <select
                  v-model="item.ingredient_id"
                  @change="onIngredientSelect(item, index)"
                  class="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-purple-500"
                >
                  <option value="">-- Pilih --</option>
                  <option v-for="ing in allIngredients" :key="ing.id" :value="ing.id">
                    {{ ing.name }} ({{ ing.base_unit }})
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-400 mb-1">Jumlah per Porsi</label>
                <input v-model="item.quantity_needed" type="number" step="0.001" class="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-amber-400 font-bold outline-none focus:border-purple-500" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[10px] font-bold text-slate-400 mb-1">Unit Resep</label>
                <select v-model="item.recipe_unit" class="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-purple-500">
                  <option value="gr">Gram (gr)</option>
                  <option value="ml">Mililiter (ml)</option>
                  <option value="butir">Butir</option>
                  <option value="pcs">Pieces</option>
                  <option value="sendok">Sendok</option>
                </select>
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-400 mb-1">Konversi ke Unit Stok</label>
                <input v-model="item.conversion_factor" type="number" step="0.000001" class="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white outline-none focus:border-purple-500" />
              </div>
            </div>
          </div>

          <!-- Add Button -->
          <button
            @click="addRecipeItem"
            class="w-full py-3 border-2 border-dashed border-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:border-purple-500/50 hover:text-purple-400 transition-all flex items-center justify-center gap-2"
          >
            <Plus class="w-4 h-4" /> Tambah Bahan
          </button>

          <!-- Estimated Cost -->
          <div class="bg-slate-900/60 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
            <div class="flex items-center gap-2 text-xs text-slate-400">
              <DollarSign class="w-4 h-4 text-emerald-400" />
              <span>Estimasi Biaya Bahan per Porsi</span>
            </div>
            <span class="text-sm font-bold font-mono text-emerald-400">{{ formatRupiah(estimatedCost) }}</span>
          </div>
        </div>

        <div class="p-4 border-t border-slate-800 bg-slate-900/50 flex gap-2 shrink-0">
          <button @click="showRecipeModal = false" class="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs">Batal</button>
          <button @click="saveRecipe" class="flex-1 py-2.5 bg-purple-600 text-white font-bold rounded-xl text-xs">Simpan Resep</button>
        </div>
      </div>
    </div>
  </div>
</template>
