import React from 'react'
import { Sparkles, Compass, HeartHandshake, Flame, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export function CraftStory() {
  const pillars = [
    {
      icon: Compass,
      title: 'Filosofi Sang Fajar',
      subtitle: 'Makna Arunika',
      desc: 'Berasal dari bahasa Sanskerta yang bermakna cahaya jingga saat fajar merekah. Arunika hadir membawa energi positif, kesegaran ide, dan ketenangan bagi setiap pengunjung.'
    },
    {
      icon: HeartHandshake,
      title: 'Kebanggaan Kampus UNIMUS',
      subtitle: 'PT Surya Ultima Nasional',
      desc: 'Diresmikan oleh Rektor UNIMUS pada Februari 2022 dan dikelola di bawah unit bisnis PT Surya Ultima Nasional sebagai wujud nyata ruang kolaborasi kampus yang terbuka untuk umum.'
    },
    {
      icon: Flame,
      title: 'Cita Rasa & Sajian Lengkap',
      subtitle: 'Kopi, Pasta & Camilan',
      desc: 'Dari racikan Kopi Susu Arunika, manual brew nusantara, mocktail segar, pasta, hingga camilan tahu bakso khas Semarang, semua disajikan dengan standar cita rasa terbaik.'
    }
  ]

  return (
    <section className="py-20 border-b border-pine-200 relative overflow-hidden bg-paper-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Seksi */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-mint-100 px-3.5 py-1.5 rounded-full mb-3.5 border border-emerald-600">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cerita & Identitas Kampus</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-forest-950 leading-tight">
              Dari semangat fajar hingga ruang temu dan karya civitas kampus.
            </h2>
          </div>
          <p className="text-base sm:text-lg text-pine-700 max-w-md leading-relaxed font-normal">
            Bukan sekadar kafe biasa. Arunika adalah simpul silaturahmi, kolaborasi kreatif, tempat nugas nyaman, dan santap nikmat di Universitas Muhammadiyah Semarang.
          </p>
        </div>

        {/* Kartu 3 Pilar Keahlian */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon
            return (
              <div
                key={pillar.title}
                className="bg-white rounded-3xl p-8 border-2 border-pine-200 shadow-warm-sm hover:border-emerald-600 card-interactive flex flex-col justify-between group"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-forest-900 text-sun-400 flex items-center justify-center mb-6 group-hover:bg-emerald-600 transition-colors shadow-sm">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest block mb-1">
                    {pillar.subtitle}
                  </span>
                  <h3 className="text-xl font-bold font-serif text-forest-950 mb-3 group-hover:text-emerald-700 transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="text-pine-700 text-sm leading-relaxed font-normal">
                    {pillar.desc}
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t-2 border-pine-200 flex items-center justify-between text-xs font-bold text-pine-600">
                  <span>Pilar 0{idx + 1}</span>
                  <span className="w-2 h-2 rounded-full bg-sun-400" />
                </div>
              </div>
            )
          })}
        </div>

        {/* Banner Kutipan Artisan */}
        <div className="mt-14 p-8 sm:p-10 rounded-3xl bg-forest-950 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-warm-md border-2 border-sun-400">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs text-sun-400 font-bold uppercase tracking-wider">
              Slow Bar Experience
            </span>
            <p className="font-serif text-xl sm:text-2xl font-bold text-white max-w-xl">
              Ingin mencicipi seduhan khusus hari ini? Barista kami siap berbagi cerita di meja Slow Bar.
            </p>
          </div>
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-sun-400 text-forest-950 font-bold text-sm hover:bg-amber-400 btn-press transition-all shrink-0 shadow-sm"
          >
            <span>Eksplorasi Single Origin</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
