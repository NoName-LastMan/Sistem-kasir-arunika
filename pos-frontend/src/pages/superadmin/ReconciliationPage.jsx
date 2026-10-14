import React, { useState, useEffect } from 'react'
import { api, unwrapList } from '../../api/client'
import { 
  ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, 
  HelpCircle, History, Sparkles, Scale
} from 'lucide-react'

export function ReconciliationPage() {
  const [expectedStockList, setExpectedStockList] = useState([])
  const [physicalCounts, setPhysicalCounts] = useState({})
  const [notes, setNotes] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [pastReports, setPastReports] = useState([])
  const [activeTab, setActiveTab] = useState('opname') // 'opname' | 'history'

  const fetchData = async () => {
    setLoading(true)
    try {
      const [expectedRes, reportRes] = await Promise.all([
        api.get('/superadmin/reconciliation/expected-stock'),
        api.get('/superadmin/reconciliation/report').catch(() => ({ data: [] }))
      ])
      const list = unwrapList(expectedRes)
      setExpectedStockList(list)
      setPastReports(unwrapList(reportRes))

      // Initial physical counts default to expected
      const initialCounts = {}
      if (Array.isArray(list)) {
        list.forEach(item => {
          initialCounts[item.id] = item.expected_stock?.toString() || item.stock?.toString() || '0'
        })
      }
      setPhysicalCounts(initialCounts)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCountChange = (id, val) => {
    setPhysicalCounts(prev => ({ ...prev, [id]: val }))
  }

  const handleNoteChange = (id, val) => {
    setNotes(prev => ({ ...prev, [id]: val }))
  }

  const handleSubmitReconciliation = async (item) => {
    const actual = Number(physicalCounts[item.id])
    if (isNaN(actual)) {
      alert('Masukkan angka hitungan fisik yang valid')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/superadmin/reconciliation', {
        ingredient_id: item.id,
        actual_stock: actual,
        notes: notes[item.id] || null
      })
      alert(`Rekonsiliasi stok untuk ${item.name} berhasil disimpan.`)
      fetchData()
    } catch (err) {
      alert(err.message || 'Gagal menyimpan rekonsiliasi')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-8 max-w-7xl w-full mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold text-forest-950">
              Stock Opname & Deteksi Anomali
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-forest-900 text-mint-100 text-[10px] font-bold uppercase tracking-wider">
              Khusus Owner (Superadmin)
            </span>
          </div>
          <p className="text-xs text-ink-500 mt-1">
            Bandingkan kalkulasi matematis mutasi sistem dengan hitungan fisik riil di gudang
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('opname')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'opname'
                ? 'bg-forest-900 text-white shadow-warm-sm'
                : 'bg-white border border-pine-200 text-ink-700 hover:bg-paper-50'
            }`}
          >
            Form Input Opname
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'history'
                ? 'bg-forest-900 text-white shadow-warm-sm'
                : 'bg-white border border-pine-200 text-ink-700 hover:bg-paper-50'
            }`}
          >
            Riwayat & Log Anomali
          </button>
        </div>
      </div>

      {/* Explainer Card */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-3 text-amber-900 text-xs">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Algoritma Deteksi Kebocoran Bisnis (&gt; 5% Threshold):</span>
          <p className="opacity-90 leading-relaxed">
            Sistem secara otomatis menghitung stok teoritis: <strong>Stok Awal + Masuk - Terpakai Penjualan - Waste</strong>. Jika selisih hitungan fisik Anda dengan sistem melebihi <strong>5%</strong>, sistem akan otomatis menandai transaksi sebagai <strong>ANOMALI KECURANGAN</strong>.
          </p>
        </div>
      </div>

      {activeTab === 'opname' ? (
        /* Opname Table */
        <div className="bg-white rounded-3xl border border-pine-200 shadow-warm-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-paper-100 text-ink-700 font-semibold uppercase text-[10px] tracking-wider border-b border-pine-200">
                <tr>
                  <th className="py-3.5 px-5">Bahan Mentah</th>
                  <th className="py-3.5 px-4 text-center">Satuan</th>
                  <th className="py-3.5 px-4 text-right">Ekspektasi Sistem</th>
                  <th className="py-3.5 px-4 text-center">Hitungan Fisik Riil</th>
                  <th className="py-3.5 px-4 text-center">Deviasi / Selisih</th>
                  <th className="py-3.5 px-4">Catatan Opname</th>
                  <th className="py-3.5 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pine-100 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-ink-400">
                      Menghitung stok ekspektasi sistem...
                    </td>
                  </tr>
                ) : expectedStockList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-ink-400">
                      Belum ada data bahan baku untuk opname.
                    </td>
                  </tr>
                ) : (
                  expectedStockList.map((item) => {
                    const expected = Number(item.expected_stock ?? item.stock ?? 0)
                    const actual = Number(physicalCounts[item.id] ?? expected)
                    const diff = actual - expected
                    const diffPct = expected > 0 ? Math.abs((diff / expected) * 100) : 0
                    const isAnomaly = diffPct > 5

                    return (
                      <tr key={item.id} className="hover:bg-paper-50/60 transition">
                        <td className="py-3.5 px-5 font-bold text-forest-950">
                          {item.name}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono uppercase text-pine-700">
                          {item.unit}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-forest-900">
                          {expected}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="number"
                            step="0.01"
                            value={physicalCounts[item.id] || ''}
                            onChange={(e) => handleCountChange(item.id, e.target.value)}
                            className="w-24 px-2.5 py-1.5 rounded-lg border border-pine-200 font-mono text-center font-bold text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-700"
                          />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className={`font-mono font-bold text-xs ${
                              diff === 0 ? 'text-ink-500' : diff < 0 ? 'text-red-600' : 'text-emerald-700'
                            }`}>
                              {diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)} ({diffPct.toFixed(1)}%)
                            </span>
                            {isAnomaly && (
                              <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-bold uppercase tracking-wider mt-0.5 animate-pulse">
                                ANOMALI &gt; 5%
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <input
                            type="text"
                            placeholder="Alasan selisih..."
                            value={notes[item.id] || ''}
                            onChange={(e) => handleNoteChange(item.id, e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-pine-200 text-xs text-ink-800 placeholder:text-ink-400"
                          />
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleSubmitReconciliation(item)}
                            className="px-3.5 py-1.5 rounded-xl bg-forest-900 hover:bg-forest-800 text-white font-semibold text-xs shadow-warm-sm transition cursor-pointer"
                          >
                            Rekonsiliasi
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* History & Anomalies Table */
        <div className="bg-white rounded-3xl border border-pine-200 shadow-warm-md overflow-hidden">
          <div className="p-5 border-b border-pine-100 flex items-center justify-between">
            <h3 className="font-serif font-bold text-base text-forest-950">
              Riwayat Rekonsiliasi & Daftar Anomali
            </h3>
            <span className="text-xs font-mono text-ink-400">Total: {pastReports.length} Laporan</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-paper-100 text-ink-700 font-semibold uppercase text-[10px] tracking-wider border-b border-pine-200">
                <tr>
                  <th className="py-3.5 px-5">Waktu Opname</th>
                  <th className="py-3.5 px-4">Bahan Baku</th>
                  <th className="py-3.5 px-4 text-right">Sistem</th>
                  <th className="py-3.5 px-4 text-right">Fisik Riil</th>
                  <th className="py-3.5 px-4 text-center">Selisih</th>
                  <th className="py-3.5 px-4 text-center">Status Flag</th>
                  <th className="py-3.5 px-5">Catatan Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pine-100 font-medium">
                {pastReports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-ink-400">
                      Belum ada riwayat rekonsiliasi opname.
                    </td>
                  </tr>
                ) : (
                  pastReports.map((r, idx) => (
                    <tr key={idx} className="hover:bg-paper-50/60 transition">
                      <td className="py-3.5 px-5 font-mono text-ink-500 text-[11px]">
                        {new Date(r.created_at).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-forest-950">
                        {r.ingredient?.name || r.ingredient_name}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-ink-700">
                        {r.expected_stock}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-forest-900">
                        {r.actual_stock}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-red-600">
                        {r.difference}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          r.is_anomaly || Math.abs(Number(r.difference_percentage || 0)) > 5
                            ? 'bg-red-600 text-white'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {r.is_anomaly ? 'ANOMALI' : 'NORMAL'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-ink-600">
                        {r.notes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}
