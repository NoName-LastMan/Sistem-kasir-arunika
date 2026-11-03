import React, { useState, useEffect } from 'react'
import { api, unwrapList } from '../../api/client'
import { 
  ShieldCheck, Search, Filter, History, UserCheck, Calendar, 
  ArrowDownUp, AlertTriangle, CheckCircle2
} from 'lucide-react'

export function AuditLogPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await api.get('/superadmin/monitoring/all-mutations')
      setLogs(unwrapList(res))
    } catch (err) {
      console.error(err)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const filteredLogs = (Array.isArray(logs) ? logs : []).filter(l => {
    const q = search.toLowerCase()
    const matchesSearch = 
      (l.user?.name?.toLowerCase().includes(q)) ||
      (l.product?.name?.toLowerCase().includes(q)) ||
      (l.ingredient?.name?.toLowerCase().includes(q)) ||
      (l.description?.toLowerCase().includes(q)) ||
      (l.reference_number?.toLowerCase().includes(q))
    
    const matchesType = !filterType || l.type === filterType
    return matchesSearch && matchesType
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-serif text-2xl font-bold text-forest-950">
            Audit Trail & Monitoring Mutasi Stok Anti-Fraud
          </h1>
          <span className="px-2.5 py-0.5 rounded-full bg-forest-900 text-mint-100 text-[10px] font-bold uppercase tracking-wider">
            Owner Only
          </span>
        </div>
        <p className="text-xs text-ink-500 mt-1">
          Pantau seluruh aktivitas pergerakan stok, pelaku perubahan (user), jumlah delta, dan alasan mutasi
        </p>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-pine-200 shadow-warm-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-pine-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari user, barang, nota invoice..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-pine-200 text-xs bg-paper-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-700"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-white border border-pine-200 text-ink-800 font-medium"
          >
            <option value="">Semua Tipe Mutasi</option>
            <option value="sales">Penjualan (Sales)</option>
            <option value="waste">Bahan Terbuang (Waste)</option>
            <option value="void">Pengembalian (Void)</option>
            <option value="in">Barang Masuk (In)</option>
            <option value="opname">Stock Opname (Opname)</option>
          </select>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          className="px-4 py-2 rounded-xl bg-paper-100 hover:bg-pine-100 text-ink-800 text-xs font-semibold transition"
        >
          Muat Ulang
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl border border-pine-200 shadow-warm-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-paper-100 text-ink-700 font-semibold uppercase text-[10px] tracking-wider border-b border-pine-200">
              <tr>
                <th className="py-3.5 px-5">Waktu & Tanggal</th>
                <th className="py-3.5 px-4">Staf Pelaku</th>
                <th className="py-3.5 px-4">Barang / Bahan</th>
                <th className="py-3.5 px-4 text-center">Tipe Event</th>
                <th className="py-3.5 px-4 text-right">Delta Mutasi</th>
                <th className="py-3.5 px-4 text-right">Stok Sebelum</th>
                <th className="py-3.5 px-4 text-right">Stok Sesudah</th>
                <th className="py-3.5 px-5">Keterangan / Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pine-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-ink-400">
                    Memuat audit log mutasi stok...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-ink-400">
                    Tidak ada log mutasi stok ditemukan.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isNegative = Number(log.quantity || 0) < 0
                  const itemName = log.product?.name || log.ingredient?.name || log.item_name || 'Bahan'

                  return (
                    <tr key={log.id} className="hover:bg-paper-50/60 transition">
                      <td className="py-3.5 px-5 font-mono text-ink-500 text-[11px]">
                        {new Date(log.created_at).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-forest-950">
                        {log.user?.name || 'Sistem'}
                      </td>
                      <td className="py-3.5 px-4 text-ink-900 font-semibold">
                        {itemName}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          log.type === 'sales' ? 'bg-amber-100 text-amber-800' :
                          log.type === 'waste' ? 'bg-red-100 text-red-700' :
                          log.type === 'void' ? 'bg-blue-100 text-blue-800' :
                          log.type === 'in' ? 'bg-emerald-100 text-emerald-800' : 'bg-paper-100 text-ink-800'
                        }`}>
                          {log.type}
                        </span>
                      </td>
                      <td className={`py-3.5 px-4 text-right font-mono font-bold ${
                        isNegative ? 'text-red-600' : 'text-emerald-700'
                      }`}>
                        {Number(log.quantity || 0) > 0 ? `+${log.quantity}` : log.quantity}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-ink-500">
                        {log.stock_before ?? '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-forest-900">
                        {log.stock_after ?? '-'}
                      </td>
                      <td className="py-3.5 px-5 text-ink-600 max-w-xs truncate">
                        {log.description || log.reference_number || '-'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
