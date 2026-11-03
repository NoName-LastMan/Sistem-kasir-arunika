import React, { useState, useEffect } from 'react'
import { api } from '../../api/client'
import { 
  BarChart3, TrendingUp, DollarSign, Download, Calendar, 
  ShoppingBag, Users, ArrowUpRight, Award, PieChart,
  FileSpreadsheet, CheckCircle2, Layers, ShieldCheck,
  BrainCircuit, Trash2, ClipboardCheck, ReceiptText, Loader2
} from 'lucide-react'

export function ReportsPage() {
  const [salesSummary, setSalesSummary] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [profitLoss, setProfitLoss] = useState(null)
  const [cashierSales, setCashierSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [exportingExcel, setExportingExcel] = useState(false)
  const [exportingCsv, setExportingCsv] = useState(false)

  // Date filters (default awal bulan s/d hari ini)
  const today = new Date().toISOString().split('T')[0]
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const [startDate, setStartDate] = useState(firstDayOfMonth)
  const [endDate, setEndDate] = useState(today)

  const fetchReports = async () => {
    setLoading(true)
    try {
      const params = `start_date=${startDate}&end_date=${endDate}`
      
      const [summaryRes, topRes, plRes, cashierRes] = await Promise.all([
        api.get(`/reports/sales-summary?${params}`).catch(() => null),
        api.get(`/reports/top-products?${params}&limit=5`).catch(() => null),
        api.get(`/reports/profit-loss?${params}`).catch(() => null),
        api.get(`/reports/cashier-sales?${params}`).catch(() => null)
      ])

      setSalesSummary(summaryRes?.data || summaryRes)
      setTopProducts(topRes?.data || topRes || [])
      setProfitLoss(plRes?.data || plRes)
      setCashierSales(cashierRes?.data || cashierRes || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [startDate, endDate])

  const handleExportExcel = async () => {
    setExportingExcel(true)
    try {
      await api.downloadFile(
        `/reports/export-excel?start_date=${startDate}&end_date=${endDate}`,
        `Master_Laporan_Arunika_${startDate}_sd_${endDate}.xls`
      )
    } catch (err) {
      alert('Gagal mengekspor Master Excel: ' + (err.message || 'Error'))
    } finally {
      setExportingExcel(false)
    }
  }

  const handleExportCsv = async () => {
    setExportingCsv(true)
    try {
      await api.downloadCsv(
        `/reports/export-csv?start_date=${startDate}&end_date=${endDate}`,
        `rekap_transaksi_${startDate}_sd_${endDate}.csv`
      )
    } finally {
      setExportingCsv(false)
    }
  }

  const REPORT_MODULES = [
    { title: 'Ringkasan Eksekutif', desc: 'KPI omzet, laba kotor, HPP, diskon, dan rata-rata basket', icon: TrendingUp, color: 'text-emerald-700 bg-emerald-50' },
    { title: 'Laba Rugi & HPP Produk', desc: 'Margin produk, HPP resep, dan kontribusi laba per kategori', icon: DollarSign, color: 'text-blue-700 bg-blue-50' },
    { title: 'Tren Omzet Harian', desc: 'Arus kas harian, fluktuasi pesanan, dan tren pendapatan', icon: BarChart3, color: 'text-amber-700 bg-amber-50' },
    { title: 'Peringkat Menu Terlaris', desc: 'Analisis menu terfavorit, volume porsi, dan revenue', icon: Award, color: 'text-purple-700 bg-purple-50' },
    { title: 'Performa & Audit Kasir', desc: 'Akuntabilitas staf kasir, omzet tunai vs non-tunai (QRIS)', icon: Users, color: 'text-indigo-700 bg-indigo-50' },
    { title: 'Audit Limbah Dapur (Waste)', desc: 'Kerugian bahan baku rusak, kadaluwarsa, atau salah olah', icon: Trash2, color: 'text-rose-700 bg-rose-50' },
    { title: 'Rekonsiliasi & Anomali Opname', desc: 'Deteksi kecurangan stok opname dan selisih >5%', icon: ClipboardCheck, color: 'text-amber-800 bg-amber-100' },
    { title: 'Prediksi Stok AI & Belanja', desc: 'Estimasi burn rate, safety stock P90, dan saran kuantitas beli', icon: BrainCircuit, color: 'text-teal-700 bg-teal-50' },
    { title: 'Buku Besar Rincian Transaksi', desc: 'Ledger rinci invoice, metode bayar, meja, pajak, dan diskon', icon: ReceiptText, color: 'text-slate-700 bg-slate-100' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-forest-950 flex items-center gap-2.5">
            <span>Laporan Finansial &amp; Konsolidasi Owner</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              Executive Suite
            </span>
          </h1>
          <p className="text-xs text-ink-500 mt-1">
            Pantau seluruh metrik keuangan, laba kotor, HPP, performa kasir, dan ekspor konsolidasi ke Excel
          </p>
        </div>

        {/* Date Filter & Export Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-pine-200 text-xs shadow-warm-sm">
            <Calendar className="w-4 h-4 text-pine-600" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs text-ink-800 focus:outline-none"
            />
            <span className="text-ink-400">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs text-ink-800 focus:outline-none"
            />
          </div>

          {/* Master Excel Button (Konsolidasi Semua Laporan) */}
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exportingExcel}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold shadow-warm-md transition cursor-pointer disabled:opacity-50"
            title="Download seluruh 9 modul laporan dalam 1 file Excel multi-sheet terpadu"
          >
            {exportingExcel ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            <span>{exportingExcel ? 'Menyusun Excel...' : 'Export Master Excel (9 Sheet)'}</span>
          </button>

          {/* CSV Transaksi Button */}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={exportingCsv}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white hover:bg-paper-100 text-forest-900 border border-pine-200 text-xs font-medium shadow-warm-sm transition cursor-pointer disabled:opacity-50"
            title="Download data transaksi mentah format CSV"
          >
            <Download className="w-4 h-4 text-ink-500" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Banner Khusus Owner: Master Excel Consolidation Feature */}
      <div className="bg-gradient-to-r from-forest-950 via-forest-900 to-forest-800 rounded-3xl p-6 text-white shadow-warm-lg relative overflow-hidden border border-forest-800">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <FileSpreadsheet className="w-4 h-4" />
              <span>All-In-One Workbook — Solusi Pelaporan Terpadu Owner</span>
            </div>
            <h2 className="text-xl font-bold font-serif text-white">
              Satu File Excel untuk Seluruh 9 Modul Laporan Restoran
            </h2>
            <p className="text-xs text-pine-100 leading-relaxed">
              Kini Owner tidak perlu mengekspor laporan secara terpisah. Tombol <strong>"Export Master Excel"</strong> menggabungkan seluruh modul (Omzet, HPP, Margin, Menu Terlaris, Performa Kasir, Limbah Dapur, Audit Opname Anomali, Prediksi Stok AI, dan Detail Transaksi) ke dalam <strong>satu file spreadsheet multi-tab</strong> yang rapi, berformat mata uang, dan siap dianalisis di Microsoft Excel.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exportingExcel}
            className="px-5 py-3 rounded-2xl bg-white hover:bg-emerald-50 active:scale-95 text-forest-950 font-bold text-xs flex items-center gap-2.5 shadow-warm-md hover:shadow-warm-lg transition shrink-0 cursor-pointer disabled:opacity-50"
          >
            {exportingExcel ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            )}
            <span>{exportingExcel ? 'Menyusun Excel...' : 'Download Master Excel (.xls)'}</span>
          </button>
        </div>

        {/* Decorative Grid of 9 Included Sheets */}
        <div className="mt-6 pt-5 border-t border-forest-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2">
          {REPORT_MODULES.map((m, idx) => (
            <div key={idx} className="bg-forest-950/60 hover:bg-forest-950/80 border border-forest-700/60 rounded-xl p-2.5 text-center flex flex-col items-center justify-center gap-1 transition shadow-sm">
              <span className="text-[10px] font-mono font-bold text-emerald-400">Tab #{idx + 1}</span>
              <span className="text-[11px] font-medium text-white/90 leading-tight line-clamp-1">{m.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Omzet */}
        <div className="p-5 rounded-2xl bg-white border border-pine-200 shadow-warm-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Total Omzet Bersih</span>
            <div className="w-8 h-8 rounded-lg bg-forest-50 text-forest-800 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl font-bold text-forest-950">
            Rp {Number(salesSummary?.kpi?.net_sales || salesSummary?.total_sales || salesSummary?.total_revenue || 0).toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-ink-500">
            {salesSummary?.kpi?.total_orders || salesSummary?.total_orders || 0} Transaksi Selesai
          </p>
        </div>

        {/* Laba Kotor (Gross Profit) */}
        <div className="p-5 rounded-2xl bg-white border border-pine-200 shadow-warm-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Laba Kotor (Gross Profit)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl font-bold text-emerald-800">
            Rp {Number(profitLoss?.gross_profit || 0).toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold">
            Margin Laba: {profitLoss?.profit_margin_percent || profitLoss?.gross_margin_percentage || 0}%
          </p>
        </div>

        {/* HPP (Cost of Goods Sold) */}
        <div className="p-5 rounded-2xl bg-white border border-pine-200 shadow-warm-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Total Modal (HPP)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl font-bold text-ink-900">
            Rp {Number(profitLoss?.cost_of_goods_sold || profitLoss?.total_cogs || profitLoss?.cogs || 0).toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-ink-500">
            Biaya Pokok Bahan Baku Menu
          </p>
        </div>

        {/* Rata-rata per Transaksi */}
        <div className="p-5 rounded-2xl bg-white border border-pine-200 shadow-warm-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Rata-rata Keranjang (AOV)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl font-bold text-ink-900">
            Rp {Number(salesSummary?.kpi?.average_order_value || salesSummary?.average_order_value || 0).toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-ink-500">
            Rata-rata nominal per transaksi
          </p>
        </div>

      </div>

      {/* Grid: Top Menu & Cashier Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top 5 Products */}
        <div className="bg-white rounded-3xl border border-pine-200 p-6 shadow-warm-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-pine-100">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-wood-500" />
              <h3 className="font-serif font-bold text-base text-forest-950">Top Menu Terlaris</h3>
            </div>
            <span className="text-xs font-mono text-ink-400">Periode Terpilih</span>
          </div>

          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-xs text-ink-400 py-6 text-center">Belum ada data penjualan.</p>
            ) : (
              topProducts.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-paper-50 border border-pine-100">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-xl bg-forest-900 text-white font-mono text-xs font-bold flex items-center justify-center">
                      #{idx + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-forest-950">{p.product?.name || p.product_name || p.name}</h4>
                      <span className="text-[10px] text-ink-500">{p.total_sold || p.total_quantity || p.quantity_sold || 0} Porsi Terjual</span>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-forest-900">
                    Rp {Number(p.total_sales_amount || p.total_sales || p.revenue || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cashier Performance */}
        <div className="bg-white rounded-3xl border border-pine-200 p-6 shadow-warm-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-pine-100">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-forest-800" />
              <h3 className="font-serif font-bold text-base text-forest-950">Omzet per Kasir</h3>
            </div>
            <span className="text-xs font-mono text-ink-400">Akuntabilitas Staf</span>
          </div>

          <div className="space-y-3">
            {cashierSales.length === 0 ? (
              <p className="text-xs text-ink-400 py-6 text-center">Belum ada data kasir.</p>
            ) : (
              cashierSales.map((c, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-paper-50 border border-pine-100">
                  <div>
                    <h4 className="font-semibold text-xs text-forest-950">{c.cashier_name || c.name || 'Kasir'}</h4>
                    <span className="text-[10px] text-ink-500">{c.total_orders || 0} Nota Transaksi</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-forest-900">
                    Rp {Number(c.total_revenue || c.total_sales || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  )
}
