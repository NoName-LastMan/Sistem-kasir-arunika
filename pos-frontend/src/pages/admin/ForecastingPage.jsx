import React, { useState, useEffect } from 'react'
import { api } from '../../api/client'
import { useAuthStore } from '../../stores/authStore'
import { 
  TrendingUp, Sparkles, AlertTriangle, Calendar, Mail, CheckCircle2, 
  DollarSign, Package, ArrowRight, ShieldCheck, HelpCircle
} from 'lucide-react'

export function ForecastingPage() {
  const { user } = useAuthStore()
  const isSuperadmin = user?.role === 'superadmin'

  const [forecastData, setForecastData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sendingDigest, setSendingDigest] = useState(false)
  const [digestSuccess, setDigestSuccess] = useState(false)

  const fetchForecasting = async () => {
    setLoading(true)
    try {
      const endpoint = isSuperadmin 
        ? '/superadmin/inventory/forecasting' 
        : '/admin/inventory/forecasting'
      const res = await api.get(endpoint)
      setForecastData(res?.data || res)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchForecasting()
  }, [isSuperadmin])

  const handleTestDigest = async () => {
    setSendingDigest(true)
    setDigestSuccess(false)
    try {
      await api.post('/superadmin/inventory/test-morning-digest', {})
      setDigestSuccess(true)
      setTimeout(() => setDigestSuccess(false), 5000)
    } catch (err) {
      alert(err.message || 'Gagal mengirim email digest')
    } finally {
      setSendingDigest(false)
    }
  }

  const items = forecastData?.items || forecastData?.data || forecastData?.forecast || []
  const aiNarrative = forecastData?.insight || forecastData?.ai_analysis || forecastData?.executive_insight || forecastData?.operational_advice

  return (
    <div className="p-8 max-w-7xl w-full mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold text-forest-950">
              Smart Inventory Forecasting & AI Intelligence
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-sun-400 text-forest-950 text-[10px] font-bold uppercase tracking-wider">
              {isSuperadmin ? 'Executive Suite' : 'Staf Gudang'}
            </span>
          </div>
          <p className="text-xs text-ink-500 mt-1">
            Prediksi sisa hari habis (*Days to Stockout*), rekomendasi belanja 7 hari, dan analisis asisten AI
          </p>
        </div>

        {isSuperadmin && (
          <button
            type="button"
            disabled={sendingDigest}
            onClick={handleTestDigest}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-900 hover:bg-forest-800 text-white text-xs font-semibold shadow-warm-md transition cursor-pointer disabled:opacity-50"
          >
            <Mail className="w-4 h-4 text-sun-400" />
            <span>{sendingDigest ? 'Mengirim Email...' : 'Uji Kirim Morning Digest'}</span>
          </button>
        )}
      </div>

      {digestSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center gap-3 text-emerald-800 text-xs">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Email Morning Executive Digest berhasil dikirimkan ke kotak masuk Owner!</span>
        </div>
      )}

      {/* AI Narrative Intelligence Banner */}
      {aiNarrative && (
        <div className="p-6 rounded-3xl bg-linear-to-r from-forest-950 via-forest-900 to-pine-900 text-white shadow-warm-lg border border-forest-800 relative overflow-hidden">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="p-1.5 rounded-xl bg-sun-400/20 text-sun-400 border border-sun-400/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-serif font-bold text-base text-mint-100">
              {isSuperadmin ? 'AI Executive Strategic Briefing' : 'AI Operational Kitchen Advice'}
            </h3>
          </div>
          <p className="text-xs text-pine-100 leading-relaxed max-w-4xl font-normal opacity-95 whitespace-pre-line">
            {aiNarrative}
          </p>
        </div>
      )}

      {/* Owner Financial Budget Card (If Superadmin) */}
      {isSuperadmin && (forecastData?.financial_summary?.total_reorder_budget != null || forecastData?.estimated_total_reorder_cost != null) && (
        <div className="p-5 rounded-2xl bg-white border border-pine-200 shadow-warm-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
              Estimasi Modal Belanja Belanja 7 Hari Ke Depan
            </span>
            <div className="font-mono text-2xl font-bold text-forest-950 mt-1">
              Rp {Number(forecastData?.financial_summary?.total_reorder_budget ?? forecastData?.estimated_total_reorder_cost ?? 0).toLocaleString('id-ID')}
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-ink-500 block">Kesiapan Cashflow</span>
            <span className="text-xs font-semibold text-emerald-700">Dihitung otomatis via WMA</span>
          </div>
        </div>
      )}

      {/* Forecast Table */}
      <div className="bg-white rounded-3xl border border-pine-200 shadow-warm-md overflow-hidden">
        <div className="p-5 border-b border-pine-100 flex items-center justify-between">
          <h3 className="font-serif font-bold text-base text-forest-950">
            Estimasi Habis Stok & Saran Belanja
          </h3>
          <span className="text-xs font-mono text-ink-400">Model Moving Average 14 Hari</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-paper-100 text-ink-700 font-semibold uppercase text-[10px] tracking-wider border-b border-pine-200">
              <tr>
                <th className="py-3.5 px-5">Nama Bahan</th>
                <th className="py-3.5 px-4 text-right">Sisa Stok Riil</th>
                <th className="py-3.5 px-4 text-right">Laju Konsumsi/Hari</th>
                <th className="py-3.5 px-4 text-center">Estimasi Habis</th>
                <th className="py-3.5 px-4 text-right">Saran Belanja (7 Hari)</th>
                {isSuperadmin && <th className="py-3.5 px-5 text-right">Estimasi Biaya (Rp)</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-pine-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={isSuperadmin ? 6 : 5} className="py-16 text-center text-ink-400">
                    Menghitung proyeksi stok & burn rate...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={isSuperadmin ? 6 : 5} className="py-16 text-center text-ink-400">
                    Belum cukup data transaksi untuk kalkulasi forecasting.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => {
                  const days = item.days_until_stockout ?? item.days_left ?? 99
                  const isCritical = days <= 2
                  const isWarning = days > 2 && days <= 5

                  return (
                    <tr key={idx} className="hover:bg-paper-50/60 transition">
                      <td className="py-3.5 px-5 font-bold text-forest-950">
                        {item.ingredient_name || item.name}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-ink-800">
                        {item.current_stock} {item.unit}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-ink-600">
                        {item.daily_burn_rate ?? item.burn_rate} {item.unit}/hari
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isCritical ? 'bg-red-100 text-red-700 animate-pulse' :
                          isWarning ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {days <= 0 ? 'Habis Hari Ini' : `${days} Hari Lagi`}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-forest-900">
                        {item.recommended_reorder_qty ?? item.reorder_qty} {item.unit}
                      </td>
                      {isSuperadmin && (
                        <td className="py-3.5 px-5 text-right font-mono font-bold text-forest-950">
                          Rp {Number(item.estimated_cost || 0).toLocaleString('id-ID')}
                        </td>
                      )}
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
