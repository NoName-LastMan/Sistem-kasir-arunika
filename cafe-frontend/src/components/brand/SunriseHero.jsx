import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Clock, MapPin, Sparkles, CloudSun } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { useOpenStatus } from '../../hooks/useOpenStatus'
import { motion } from 'framer-motion'
import { fadeUp, staggerContainer, springGentle } from '../../lib/motion'

export function SunriseHero({ settings }) {
  const { isOpen, statusLabel, scheduleText } = useOpenStatus(settings)

  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 border-b border-pine-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Kolom Teks Utama dengan Staggered Entrance */}
          <motion.div 
            variants={staggerContainer(0.07, 0.03)}
            initial="initial"
            animate="animate"
            className="lg:col-span-7 flex flex-col items-start"
          >
            {/* Status Operasional Dinamis & Cuaca Fajar */}
            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-2.5 mb-6">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white border-2 border-pine-200 shadow-warm-sm">
                <span
                  className={`w-2 h-2 rounded-full ${isOpen ? 'bg-leaf-500 animate-ping' : 'bg-red-500'}`}
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-forest-900">
                  {statusLabel} • {scheduleText}
                </span>
              </div>

              {settings?.weather && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-mint-100 border border-emerald-600 text-xs text-forest-950 font-medium shadow-2xs">
                  <CloudSun className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span className="font-bold">{settings.weather.location}</span>
                  <span className="text-pine-500 font-bold">•</span>
                  <span>{settings.weather.temperature}, {settings.weather.condition}</span>
                </div>
              )}
            </motion.div>

            {/* Headline Bersih & Tegas */}
            <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl font-bold font-serif text-forest-950 leading-[1.08] tracking-tight mb-6">
              Ruang temu teduh, kopi andalan, & kerja kreatif di kampus UNIMUS.
            </motion.h1>

            {/* Paragraf Pendek & Jernih Tanpa Transparan */}
            <motion.p variants={fadeUp} className="text-lg sm:text-xl text-forest-900 max-w-xl leading-relaxed mb-8 font-normal">
              Terletak di Lantai 2 Gedung Unimus Mart Semarang. Suasana ber-AC yang nyaman untuk nugas, diskusi kolaboratif, meeting privat, serta santap nikmat.
            </motion.p>

            {/* Aksi Utama */}
            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
              <Link to="/menu" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto font-bold shadow-warm-sm btn-press">
                  <span>Lihat Menu & Mulai Pesan</span>
                </Button>
              </Link>

              <a
                href={settings?.googleMapsUrl || 'https://maps.app.goo.gl/dkbegKuRniHS476t5'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-forest-900 hover:text-emerald-700 font-bold px-5 py-3 transition-colors text-center rounded-xl bg-white border-2 border-pine-200 hover:border-emerald-600 shadow-2xs btn-press"
              >
                <MapPin className="w-4 h-4 text-emerald-700" />
                <span>Buka di Google Maps</span>
              </a>
            </motion.div>

            {/* Info Lokasi Singkat */}
            <motion.div variants={fadeUp} className="mt-10 pt-6 border-t-2 border-pine-200 flex flex-wrap items-center gap-6 text-sm text-forest-900 font-medium">
              <a
                href={settings?.googleMapsUrl || 'https://maps.app.goo.gl/dkbegKuRniHS476t5'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-emerald-700 transition-colors"
              >
                <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-semibold">{settings?.address || 'Lt. 2 Gedung Unimus Mart, Jl. Kedungmundu No. 18, Semarang'}</span>
              </a>
              <div className="inline-flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Buka setiap hari: 08.00 - 22.00 WIB</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Kolom Momen Visual Signature: Medali Resmi Arunika */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={springGentle}
            className="lg:col-span-5 flex justify-center"
          >
            <div className="relative w-full max-w-md rounded-3xl bg-white border-2 border-pine-200 shadow-warm-lg p-7 sm:p-8 flex flex-col items-center justify-between overflow-hidden card-interactive">
              {/* Header Kartu */}
              <div className="w-full flex items-center justify-between text-xs font-bold text-pine-700 uppercase tracking-widest pb-4 border-b border-pine-200">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block animate-pulse" />
                  Arunika Coffee & Space
                </span>
                <span className="bg-mint-100 border border-emerald-600 px-2.5 py-0.5 rounded-full text-forest-950 font-bold text-[11px] shadow-2xs">
                  UNIMUS SEMARANG
                </span>
              </div>

              {/* Logo Resmi Medallion Arunika dengan Ambient Float & Rotating Ring */}
              <div className="my-6 relative flex flex-col items-center">
                <div className="relative w-48 h-48 sm:w-52 sm:h-52 rounded-full p-2 bg-gradient-to-tr from-sun-400 via-mint-100 to-emerald-600 shadow-warm-md flex items-center justify-center group animate-float-slow">
                  {/* Decorative rotating dashed ring */}
                  <div className="absolute -inset-1.5 rounded-full border-2 border-dashed border-sun-400/50 animate-spin-slow pointer-events-none" />
                  
                  <div className="w-full h-full rounded-full bg-white p-2.5 overflow-hidden flex items-center justify-center shadow-inner relative z-10">
                    <img
                      src="/logo.png"
                      alt="Logo Resmi Arunika Coffee & Space UNIMUS"
                      className="w-full h-full object-contain filter drop-shadow-sm group-hover:scale-108 transition-transform duration-500"
                    />
                  </div>
                </div>

                <div className="text-center mt-4">
                  <span className="inline-block px-3 py-1 rounded-full bg-mint-100 border border-pine-200 text-forest-900 text-xs font-bold uppercase tracking-wider mb-1">
                    Campus Space & Coworking
                  </span>
                  <div className="font-serif text-2xl font-bold text-forest-950 tracking-tight">
                    ARUNIKA UNIMUS
                  </div>
                </div>
              </div>

              {/* Catatan Cita Rasa & Kualitas */}
              <div className="w-full pt-4 border-t border-pine-200 grid grid-cols-2 gap-3 text-xs">
                <div className="bg-paper-50 p-2.5 rounded-xl border border-pine-200">
                  <span className="block text-pine-600 text-[10px] uppercase font-bold tracking-wider">Lokasi Strategis</span>
                  <span className="font-bold text-forest-900">Lt. 2 Unimus Mart</span>
                </div>
                <div className="bg-paper-50 p-2.5 rounded-xl border border-pine-200">
                  <span className="block text-pine-600 text-[10px] uppercase font-bold tracking-wider">Fasilitas Lengkap</span>
                  <span className="font-bold text-forest-900">AC, Wi-Fi & Meeting</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
