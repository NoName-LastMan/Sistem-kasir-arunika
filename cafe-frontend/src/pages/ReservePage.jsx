import React, { useState } from 'react'
import { Calendar, Clock, Users, MapPin, Send, MessageSquareQuote, CheckCircle2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useSettingsStore } from '../store/settingsStore'

export function ReservePage() {
  const settings = useSettingsStore(state => state.settings)

  const todayStr = new Date().toISOString().split('T')[0]

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: todayStr,
    time: '14:00',
    guests: 4,
    area: 'Area Indoor AC (Study & Coworking Hub)',
    notes: ''
  })

  const [errorMsg, setErrorMsg] = useState('')

  const areaOptions = [
    'Area Indoor AC (Study & Coworking Hub)',
    'Private Meeting Room (AC, Proyektor & Sound System)',
    'Balkon Semi-Outdoor (Smoking Area)',
    'Meja Komunal Santai'
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!formData.name.trim() || !formData.phone.trim()) {
      setErrorMsg('Harap lengkapi nama dan nomor WhatsApp Anda.')
      return
    }

    // Validasi jam operasional
    const openHour = settings?.openingHours?.openHour ?? 8
    const closeHour = settings?.openingHours?.closeHour ?? 22
    const chosenHour = parseInt(formData.time.split(':')[0], 10)

    if (chosenHour < openHour || chosenHour >= closeHour) {
      setErrorMsg(`Jam reservasi harus berada di dalam jam operasional toko (${openHour}:00 - ${closeHour}:00 WIB).`)
      return
    }

    // Susun pesan WhatsApp terformat rapi
    const waMessage = `Halo Arunika Coffee and Space (UNIMUS Semarang), saya ingin melakukan reservasi meja / meeting room:
- Nama: ${formData.name.trim()}
- No. Kontak: ${formData.phone.trim()}
- Tanggal: ${formData.date}
- Jam: ${formData.time} WIB
- Jumlah Tamu: ${formData.guests} orang
- Area Pilihan: ${formData.area}
${formData.notes ? `- Catatan Khusus: ${formData.notes.trim()}` : ''}

Mohon konfirmasi ketersediaan meja / ruang. Terima kasih!`

    const phoneClean = (settings?.phone || '6288985722088').replace(/[^0-9]/g, '')
    const waUrl = `https://wa.me/${phoneClean}?text=${encodeURIComponent(waMessage)}`

    // Buka WhatsApp di tab baru
    window.open(waUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="py-12 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-forest-950 mb-2">
          Reservasi meja & ruang temu
        </h1>
        <p className="text-pine-700 text-sm max-w-xl font-normal">
          Rencanakan pertemuan santai, rapat kerja, atau perayaan hangat bersama rekan dan keluarga di Arunika.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-pine-200 shadow-warm-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Baris Nama & Nomor Kontak */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="reserve-name" className="block text-xs font-bold text-forest-950 mb-1.5">
                Nama Lengkap <span className="text-red-600">*</span>
              </label>
              <input
                id="reserve-name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nama pemesan"
                className="w-full px-4 py-2.5 rounded-xl bg-paper-50 border-2 border-pine-200 text-sm text-forest-950 placeholder:text-pine-500 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label htmlFor="reserve-phone" className="block text-xs font-bold text-forest-950 mb-1.5">
                Nomor WhatsApp <span className="text-red-600">*</span>
              </label>
              <input
                id="reserve-phone"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="08xxxxxxxxxx"
                className="w-full px-4 py-2.5 rounded-xl bg-paper-50 border-2 border-pine-200 text-sm text-forest-950 placeholder:text-pine-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
              />
            </div>
          </div>

          {/* Baris Tanggal & Jam */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="reserve-date" className="block text-xs font-semibold text-forest-900 mb-1.5">
                Tanggal Kunjungan <span className="text-red-600">*</span>
              </label>
              <input
                id="reserve-date"
                type="date"
                required
                min={todayStr}
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-paper-50 border-2 border-pine-200 text-sm text-forest-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label htmlFor="reserve-time" className="block text-xs font-semibold text-forest-900 mb-1.5">
                Waktu Kedatangan <span className="text-red-600">*</span>
              </label>
              <input
                id="reserve-time"
                type="time"
                required
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-paper-50 border-2 border-pine-200 text-sm text-forest-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Jumlah Tamu Stepper */}
          <div>
            <label className="block text-xs font-semibold text-forest-900 mb-2">
              Jumlah Tamu
            </label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-paper-100 p-1.5 rounded-xl border-2 border-pine-200">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, guests: Math.max(1, prev.guests - 1) }))}
                  className="px-3 py-1 rounded-lg text-forest-900 hover:bg-white font-bold transition-all btn-press"
                >
                  -
                </button>
                <span className="w-10 text-center font-bold text-sm text-forest-900">
                  {formData.guests}
                </span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, guests: prev.guests + 1 }))}
                  className="px-3 py-1 rounded-lg text-forest-900 hover:bg-white font-bold transition-all btn-press"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-pine-600 font-medium">
                Untuk rombongan di atas 15 orang, silakan hubungi kami langsung.
              </span>
            </div>
          </div>

          {/* Pilihan Area */}
          <div>
            <label className="block text-xs font-bold text-forest-950 mb-2">
              Pilihan Area
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {areaOptions.map(opt => (
                <label
                  key={opt}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer text-sm transition-all btn-press ${
                    formData.area === opt
                      ? 'border-emerald-600 bg-mint-100 text-forest-950 font-bold shadow-2xs'
                      : 'border-pine-200 text-forest-950 hover:bg-paper-100 font-medium'
                  }`}
                >
                  <input
                    type="radio"
                    name="area"
                    value={opt}
                    checked={formData.area === opt}
                    onChange={() => setFormData(prev => ({ ...prev, area: opt }))}
                    className="text-emerald-600 focus:ring-emerald-600"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Catatan Khusus */}
          <div>
            <label htmlFor="reserve-notes" className="block text-xs font-bold text-forest-950 mb-1.5">
              Kebutuhan Tambahan (Opsional)
            </label>
            <textarea
              id="reserve-notes"
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Contoh: Butuh meja dekat colokan, area tenang untuk meeting, dll."
              className="w-full px-4 py-2 rounded-xl bg-paper-50 border-2 border-pine-200 text-sm text-forest-950 placeholder:text-pine-500 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border-2 border-red-300 text-red-900 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Tombol Submit WhatsApp */}
          <div className="pt-4 border-t-2 border-pine-200">
            <Button type="submit" size="lg" className="w-full justify-center gap-2 font-bold shadow-warm-sm">
              <Send className="w-4 h-4" />
              <span>Kirim Permintaan Reservasi via WhatsApp</span>
            </Button>
            <p className="text-[11px] text-center text-pine-600 mt-2.5 font-medium">
              *Reservasi langsung dikonfirmasi oleh tim reservasi Arunika melalui WhatsApp resmi toko.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
