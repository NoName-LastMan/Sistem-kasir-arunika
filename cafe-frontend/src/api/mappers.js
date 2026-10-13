/**
 * Semua pemetaan field dari backend Laravel ke model UI di satu tempat.
 * Menjamin frontend decoupled dari perubahan nama kolom backend.
 */

export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function mapSettings(raw) {
  if (!raw) return null
  return {
    storeName: raw.store_name || 'Arunika Coffee and Space',
    address: raw.store_address || 'Lt. 2 Gedung Unimus Mart, Jl. Kedungmundu No. 18, Semarang',
    phone: raw.store_phone || '+62 889-8572-2088',
    instagram: raw.store_instagram || '@arunika.coffee',
    googleMapsUrl: raw.google_maps_url || 'https://maps.app.goo.gl/dkbegKuRniHS476t5',
    openingHours: {
      weekdays: raw.opening_hours?.weekdays || '08:00 - 22:00',
      weekends: raw.opening_hours?.weekends || '08:00 - 22:00',
      openHour: raw.opening_hours?.open_time_hour ?? 8,
      closeHour: raw.opening_hours?.close_time_hour ?? 22
    },
    weather: raw.weather || {
      temperature: '28°C',
      condition: 'Cerah Berawan',
      location: 'UNIMUS Kedungmundu, Semarang',
      recommendation: 'Sangat pas untuk Kopi Susu Arunika dingin atau santap siang di ruang ber-AC'
    },
    taxRate: Number(raw.tax_rate ?? 10),
    serviceCharge: Number(raw.service_charge ?? 0),
    receiptFooter: raw.receipt_footer || 'Terima kasih telah berkunjung ke Arunika Coffee and Space UNIMUS Semarang.'
  }
}

export function mapCategory(raw) {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug || String(raw.id),
    description: raw.description || ''
  }
}

export function mapModifierItem(raw) {
  return {
    id: raw.id,
    name: raw.name,
    price: Number(raw.price || 0),
    formattedPrice: formatCurrency(Number(raw.price || 0))
  }
}

export function mapModifierGroup(raw) {
  return {
    id: raw.id,
    name: raw.name,
    isRequired: Boolean(raw.is_required),
    minSelection: Number(raw.min_selection ?? (raw.is_required ? 1 : 0)),
    maxSelection: Number(raw.max_selection ?? 1),
    items: (raw.items || []).map(mapModifierItem)
  }
}

export function mapProduct(raw, allModifierGroups = []) {
  const modGroupIds = raw.modifier_group_ids || (raw.modifier_groups ? raw.modifier_groups.map(g => g.id) : [])
  const modifierGroups = allModifierGroups.filter(g => modGroupIds.includes(g.id))

  return {
    id: raw.id,
    categoryId: raw.category_id,
    name: raw.name,
    description: raw.description || '',
    price: Number(raw.price || 0),
    formattedPrice: formatCurrency(Number(raw.price || 0)),
    image: raw.image || null,
    isAvailable: Boolean(raw.is_available ?? true),
    isBestSeller: Boolean(raw.is_best_seller),
    isNew: Boolean(raw.is_new),
    isManualBrew: Boolean(raw.is_manual_brew),
    tastingNotes: raw.tasting_notes || [],
    acidity: Number(raw.acidity || 0),
    body: Number(raw.body || 0),
    sweetness: Number(raw.sweetness || 0),
    roastLevel: raw.roast_level || null,
    estimatedTime: raw.estimated_time || '5-10 menit',
    modifierGroups
  }
}

export function mapTable(raw) {
  return {
    code: String(raw.code),
    name: raw.name || `Meja ${raw.code}`,
    capacity: raw.capacity || 4,
    area: raw.area || 'Utama'
  }
}

export function mapOrderStatus(status) {
  const normalized = (status || '').toLowerCase()
  switch (normalized) {
    case 'pending':
      return {
        key: 'pending',
        step: 1,
        label: 'Menunggu di Kasir',
        description: 'Pesanan telah diterima. Silakan selesaikan pembayaran di kasir untuk mulai dimasak.',
        isTerminal: false,
        badgeClass: 'bg-sun-400/20 text-wood-500 border-sun-400/30'
      }
    case 'processing':
    case 'cooking':
      return {
        key: 'processing',
        step: 2,
        label: 'Sedang Disiapkan Dapur',
        description: 'Barista dan koki sedang meracik pesanan Anda dengan saksama.',
        isTerminal: false,
        badgeClass: 'bg-emerald-600/15 text-emerald-600 border-emerald-600/30'
      }
    case 'ready':
      return {
        key: 'ready',
        step: 3,
        label: 'Pesanan Siap',
        description: 'Pesanan telah selesai disiapkan dan akan segera diantar ke meja Anda.',
        isTerminal: false,
        badgeClass: 'bg-leaf-500/20 text-leaf-500 border-leaf-500/30'
      }
    case 'completed':
      return {
        key: 'completed',
        step: 4,
        label: 'Selesai',
        description: 'Pesanan telah disajikan. Selamat menikmati waktu Anda di Arunika.',
        isTerminal: true,
        badgeClass: 'bg-forest-900/10 text-forest-900 border-forest-900/20'
      }
    case 'cancelled':
    case 'void':
      return {
        key: 'cancelled',
        step: 0,
        label: 'Dibatalkan',
        description: 'Pesanan ini telah dibatalkan.',
        isTerminal: true,
        badgeClass: 'bg-red-500/15 text-red-700 border-red-500/30'
      }
    default:
      return {
        key: 'unknown',
        step: 1,
        label: 'Status Tidak Dikenal',
        description: 'Menunggu pembaruan dari sistem dapur.',
        isTerminal: false,
        badgeClass: 'bg-slate-200 text-slate-700 border-slate-300'
      }
  }
}

export function mapOrder(raw) {
  if (!raw) return null
  const statusInfo = mapOrderStatus(raw.status)
  return {
    id: raw.id,
    invoiceNumber: raw.invoice_number || raw.id,
    tableCode: raw.table_code || 'Counter',
    customerName: raw.customer_name || 'Tamu',
    notes: raw.notes || '',
    items: (raw.items || []).map(item => ({
      productId: item.product_id,
      name: item.product_name || item.name,
      quantity: Number(item.quantity || 1),
      unitPrice: Number(item.unit_price || item.price || 0),
      formattedUnitPrice: formatCurrency(Number(item.unit_price || item.price || 0)),
      subtotal: Number(item.subtotal || 0),
      formattedSubtotal: formatCurrency(Number(item.subtotal || 0)),
      notes: item.notes || '',
      modifiers: (item.modifiers || []).map(m => m.name || m).join(', ')
    })),
    subtotal: Number(raw.subtotal || 0),
    formattedSubtotal: formatCurrency(Number(raw.subtotal || 0)),
    taxRate: Number(raw.tax_rate ?? 10),
    taxAmount: Number(raw.tax_amount || 0),
    formattedTaxAmount: formatCurrency(Number(raw.tax_amount || 0)),
    totalAmount: Number(raw.total_amount || 0),
    formattedTotalAmount: formatCurrency(Number(raw.total_amount || 0)),
    paymentMethod: raw.payment_method || 'pay_at_cashier',
    paymentStatus: raw.payment_status || 'unpaid',
    status: raw.status || 'pending',
    statusInfo,
    createdAt: raw.created_at || new Date().toISOString()
  }
}
