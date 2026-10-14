import React, { useState, useEffect } from 'react'
import { api } from '../../api/client'
import { 
  BarChart3, TrendingUp, DollarSign, Download, Calendar, 
  ShoppingBag, Users, ArrowUpRight, Award, PieChart
} from 'lucide-react'

export function ReportsPage() {
  const [salesSummary, setSalesSummary] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [profitLoss, setProfitLoss] = useState(null)
  const [cashierSales, setCashierSales] = useState([])
  const [loading, setLoading] = useState(true)

  // Date filters
  const today = new Date().toISOString().split('T')[0]
  const [startDate, setStartDate] = useState(today)
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

  const handleExportCsv = () => {
    api.downloadCsv(`/reports/export-csv?start_date=${startDate}&end_date=${endDate}`, `rekap_transaksi_${startDate}_sd_${endDate}.csv`)
  }

  return (
    <div className="p-8 max-w-7xl w-full mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-forest-950">
            Laporan Finansial & Omzet Penjualan
          </h1>
          <p className="text-xs text-ink-500 mt-1">
            Pantau performa penjualan, laba kotor (HPP), dan produk terlaris
          </p>
        </div>

        {/* Date Filter & Export Button */}
        <div className="flex items-center gap-3">
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

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-900 hover:bg-forest-800 text-white text-xs font-semibold shadow-warm-md transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Omzet */}
        <div className="p-5 rounded-2xl bg-white border border-pine-200 shadow-warm-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Total Omzet</span>
            <div className="w-8 h-8 rounded-lg bg-forest-50 text-forest-800 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl font-bold text-forest-950">
            Rp {Number(salesSummary?.total_sales || salesSummary?.total_revenue || 0).toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-ink-500">
            {salesSummary?.total_orders || 0} Transaksi Lunas
          </p>
        </div>

        {/* Laba Kotor (Gross Profit) */}
        <div className="p-5 rounded-2xl bg-white border border-pine-200 shadow-warm-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Laba Kotor (HPP)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl font-bold text-emerald-800">
            Rp {Number(profitLoss?.gross_profit || 0).toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold">
            Margin: {profitLoss?.gross_margin_percentage || 0}% dari Omzet
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
            Rp {Number(profitLoss?.total_cogs || profitLoss?.cogs || 0).toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-ink-500">
            Harga Pokok Penjualan Produk
          </p>
        </div>

        {/* Rata-rata per Transaksi */}
        <div className="p-5 rounded-2xl bg-white border border-pine-200 shadow-warm-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Average Basket</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl font-bold text-ink-900">
            Rp {Number(salesSummary?.average_order_value || 0).toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-ink-500">
            Rata-rata belanja per tamu
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
              <h3 className="font-serif font-bold text-base text-forest-950">Top 5 Menu Terlaris</h3>
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
                      <h4 className="font-semibold text-xs text-forest-950">{p.product_name || p.name}</h4>
                      <span className="text-[10px] text-ink-500">{p.total_quantity || p.quantity_sold || 0} Porsi Terjual</span>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-forest-900">
                    Rp {Number(p.total_sales || p.revenue || 0).toLocaleString('id-ID')}
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
