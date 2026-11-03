import React, { useState, useEffect } from 'react'
import { api } from '../../api/client'
import { Settings, Save, CheckCircle2, AlertCircle, Store, Printer, Percent } from 'lucide-react'

export function SettingsPage() {
  const [formData, setFormData] = useState({
    store_name: '',
    address: '',
    phone: '',
    tax_percentage: '10',
    receipt_header: '',
    receipt_footer: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/admin/settings')
      .then(res => {
        const data = res.data || res || {}
        setFormData({
          store_name: data.store_name || 'Arunika Coffee & Space',
          address: data.address || 'Jl. Sambiroto Raya No. 45, Semarang',
          phone: data.phone || '0812-3456-7890',
          tax_percentage: data.tax_percentage?.toString() || '10',
          receipt_header: data.receipt_header || 'Selamat Datang di Arunika Coffee & Space',
          receipt_footer: data.receipt_footer || 'Terima kasih atas kunjungan Anda! Sampai jumpa kembali.'
        })
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSavedSuccess(false)
    try {
      await api.put('/admin/settings', {
        ...formData,
        tax_percentage: Number(formData.tax_percentage) || 0
      })
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 4000)
    } catch (err) {
      setError(err.message || 'Gagal menyimpan pengaturan toko')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl w-full mx-auto space-y-6">
      
      <div>
        <h1 className="font-serif text-2xl font-bold text-forest-950">
          Pengaturan Toko & Format Struk Kasir
        </h1>
        <p className="text-xs text-ink-500 mt-1">
          Konfigurasi identitas restoran, pajak default, dan header/footer struk thermal
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center gap-3 text-emerald-800 text-xs">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Pengaturan toko dan template struk berhasil diperbarui!</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-pine-200 p-8 shadow-warm-md space-y-6 text-xs">
        
        {/* Section 1: Profil Toko */}
        <div className="space-y-4">
          <h3 className="font-serif font-bold text-base text-forest-950 flex items-center gap-2 pb-2 border-b border-pine-100">
            <Store className="w-4 h-4 text-forest-800" />
            <span>Identitas Gerai / Toko</span>
          </h3>

          <div>
            <label className="block font-semibold text-ink-700 mb-1">Nama Toko / Kafe</label>
            <input
              type="text"
              required
              value={formData.store_name}
              onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
              className="w-full p-3 rounded-xl border border-pine-200 focus:outline-none focus:ring-2 focus:ring-forest-700 font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-ink-700 mb-1">Nomor Telepon / WhatsApp</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-3 rounded-xl border border-pine-200 focus:outline-none focus:ring-2 focus:ring-forest-700 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-700 mb-1">Tarif Pajak PPN Default (%)</label>
              <input
                type="number"
                value={formData.tax_percentage}
                onChange={(e) => setFormData({ ...formData, tax_percentage: e.target.value })}
                className="w-full p-3 rounded-xl border border-pine-200 focus:outline-none focus:ring-2 focus:ring-forest-700 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ink-700 mb-1">Alamat Lengkap</label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full p-3 rounded-xl border border-pine-200 focus:outline-none focus:ring-2 focus:ring-forest-700 resize-none"
            />
          </div>
        </div>

        {/* Section 2: Struk Format */}
        <div className="space-y-4 pt-4 border-t border-pine-100">
          <h3 className="font-serif font-bold text-base text-forest-950 flex items-center gap-2 pb-2 border-b border-pine-100">
            <Printer className="w-4 h-4 text-forest-800" />
            <span>Format Struk Thermal (58mm / 80mm)</span>
          </h3>

          <div>
            <label className="block font-semibold text-ink-700 mb-1">Pesan Sambutan Header Struk</label>
            <input
              type="text"
              value={formData.receipt_header}
              onChange={(e) => setFormData({ ...formData, receipt_header: e.target.value })}
              className="w-full p-3 rounded-xl border border-pine-200 focus:outline-none focus:ring-2 focus:ring-forest-700"
            />
          </div>

          <div>
            <label className="block font-semibold text-ink-700 mb-1">Pesan Penutup Footer Struk</label>
            <input
              type="text"
              value={formData.receipt_footer}
              onChange={(e) => setFormData({ ...formData, receipt_footer: e.target.value })}
              className="w-full p-3 rounded-xl border border-pine-200 focus:outline-none focus:ring-2 focus:ring-forest-700"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-pine-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-forest-900 hover:bg-forest-800 text-white font-semibold text-xs shadow-warm-md transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
          </button>
        </div>

      </form>

    </div>
  )
}
