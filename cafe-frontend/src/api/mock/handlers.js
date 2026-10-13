import { mockSettings, mockCategories, mockProducts, mockModifierGroups, mockTables } from './data'

// Simulasi penyimpanan order tamu in-memory
const guestOrders = new Map()

// Helper simpan order baru
export function mockCreateOrder(payload) {
  const { table_code, customer_name, items, notes } = payload

  // Validasi dasar
  if (!items || items.length === 0) {
    throw new Error('Keranjang belanja kosong.')
  }

  // Hitung subtotal dan rincian item di mock server (server is source of truth)
  let subtotal = 0
  const orderItems = []

  for (const item of items) {
    const product = mockProducts.find(p => p.id === Number(item.product_id))
    if (!product) {
      throw new Error(`Produk dengan ID #${item.product_id} tidak ditemukan.`)
    }
    if (!product.is_available) {
      throw new Error(`Maaf, ${product.name} baru saja habis. Silakan perbarui pesanan Anda.`)
    }

    let itemUnitPrice = product.price
    const selectedMods = []

    if (item.modifier_ids && Array.isArray(item.modifier_ids)) {
      for (const modId of item.modifier_ids) {
        for (const grp of mockModifierGroups) {
          const found = grp.items.find(m => m.id === Number(modId))
          if (found) {
            itemUnitPrice += found.price
            selectedMods.push({ id: found.id, name: found.name, price: found.price })
          }
        }
      }
    }

    const itemSubtotal = itemUnitPrice * item.quantity
    subtotal += itemSubtotal

    orderItems.push({
      product_id: product.id,
      product_name: product.name,
      quantity: item.quantity,
      unit_price: itemUnitPrice,
      subtotal: itemSubtotal,
      notes: item.notes || '',
      modifiers: selectedMods
    })
  }

  const taxRate = mockSettings.tax_rate || 10
  const taxAmount = Math.round((subtotal * taxRate) / 100)
  const totalAmount = subtotal + taxAmount

  const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000)
  const now = new Date()

  const orderRecord = {
    id: orderId,
    invoice_number: `INV/${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${orderId.replace('ORD-', '')}`,
    table_code: table_code || 'Counter',
    customer_name: customer_name || 'Tamu Arunika',
    notes: notes || '',
    items: orderItems,
    subtotal,
    tax_rate: taxRate,
    tax_amount: taxAmount,
    total_amount: totalAmount,
    payment_method: 'pay_at_cashier',
    payment_status: 'unpaid',
    // Status alur dapur: 'pending' (Menunggu) -> 'processing' (Diproses) -> 'ready' (Siap)
    status: 'pending',
    created_at: now.toISOString(),
    status_updated_at: now.toISOString()
  }

  guestOrders.set(orderId, orderRecord)

  // Simulasikan alur dapur otomatis setelah beberapa detik untuk demo polling
  setTimeout(() => {
    const o = guestOrders.get(orderId)
    if (o && o.status === 'pending') {
      o.status = 'processing'
      o.status_updated_at = new Date().toISOString()
    }
  }, 12000)

  setTimeout(() => {
    const o = guestOrders.get(orderId)
    if (o && o.status === 'processing') {
      o.status = 'ready'
      o.status_updated_at = new Date().toISOString()
    }
  }, 35000)

  return {
    success: true,
    message: 'Pesanan berhasil dibuat. Silakan menuju kasir untuk konfirmasi dan pembayaran.',
    data: orderRecord
  }
}

export function mockGetOrderStatus(orderId) {
  const order = guestOrders.get(orderId)
  if (!order) {
    // Jika tidak ditemukan di memory (misal setelah refresh), buat fallback mock yang masuk akal
    return {
      id: orderId,
      invoice_number: `INV/2026/10/${orderId.replace('ORD-', '')}`,
      table_code: '07',
      customer_name: 'Tamu Arunika',
      status: 'processing',
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      items: [
        { product_name: 'Kopi Susu Arunika', quantity: 2, subtotal: 48000 },
        { product_name: 'Nasi Goreng Kampung Arunika', quantity: 1, subtotal: 32000 }
      ],
      subtotal: 80000,
      tax_amount: 8000,
      total_amount: 88000
    }
  }
  return order
}

export function mockValidateTable(code) {
  const table = mockTables.find(t => t.code === code || t.code === code.padStart(2, '0'))
  if (!table) {
    return {
      is_valid: false,
      message: `Kode meja "${code}" tidak terdaftar dalam sistem.`
    }
  }
  return {
    is_valid: true,
    data: table
  }
}
