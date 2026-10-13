import React from 'react'
import { Laptop, Presentation, Wind, Building2 } from 'lucide-react'

export function SpaceHighlights() {
  const spaces = [
    {
      title: 'Ruang AC & Study Hub',
      desc: 'Area berpendingin udara yang sejuk dan hening dengan colokan listrik melimpah. Sangat nyaman untuk nugas, belajar mandiri, maupun kerja laptopan.',
      icon: Laptop,
      tag: 'Indoor AC'
    },
    {
      title: 'Private Meeting Room',
      desc: 'Ruang pertemuan ber-AC privat berkapasitas hingga 15-20 orang, dilengkapi proyektor layar dan sistem audio untuk rapat atau presentasi.',
      icon: Presentation,
      tag: 'Ruang Rapat'
    },
    {
      title: 'Balkon Selasar Kampus',
      desc: 'Area semi-outdoor khusus smoking dengan hembusan angin segar dan pemandangan lingkungan kampus UNIMUS, pas untuk rehat santai.',
      icon: Wind,
      tag: 'Smoking Area'
    },
    {
      title: 'Akses Unimus Mart Lt. 2',
      desc: 'Terletak strategis di lantai 2 gedung Unimus Mart Jl. Kedungmundu Semarang dengan akses parkir luas dan kemudahan kebutuhan harian.',
      icon: Building2,
      tag: 'Lokasi Kampus'
    }
  ]

  return (
    <section id="ruang" className="py-20 border-b border-pine-200 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
          <div className="max-w-xl">
            <h2 className="text-3xl sm:text-4xl font-bold font-serif text-forest-950 mb-4">
              Fasilitas ruang temu & kenyamanan kampus
            </h2>
            <p className="text-base sm:text-lg text-pine-700 font-normal">
              Dirancang untuk mendukung produktivitas mahasiswa, dosen, dan masyarakat umum di lingkungan Universitas Muhammadiyah Semarang.
            </p>
          </div>
          <div className="text-sm font-bold text-forest-950 bg-mint-100 border border-emerald-600 px-4 py-2 rounded-xl self-start md:self-auto shadow-2xs">
            Indoor AC • Meeting Room • Wi-Fi Cepat
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {spaces.map((space) => {
            const Icon = space.icon
            return (
              <div
                key={space.title}
                className="bg-white rounded-2xl p-6 border-2 border-pine-200 shadow-warm-sm card-interactive flex flex-col justify-between hover:border-emerald-600"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="p-2.5 rounded-xl bg-mint-100 text-forest-950 border border-pine-200">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-paper-100 text-forest-950 border border-pine-200">
                      {space.tag}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold font-serif text-forest-950 mb-2.5">
                    {space.title}
                  </h3>
                  <p className="text-pine-700 text-sm leading-relaxed font-normal">
                    {space.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Lokasi & Akses Kampus UNIMUS Banner */}
        <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-white border-2 border-pine-200 shadow-warm-sm flex flex-col lg:flex-row items-center justify-between gap-6 card-interactive">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-mint-100 border border-emerald-600 flex items-center justify-center text-emerald-700 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-serif font-bold text-lg text-forest-950">
                  Lokasi Kampus UNIMUS Semarang
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-paper-100 text-[11px] font-bold text-emerald-800 border border-pine-200">
                  Lantai 2 Unimus Mart
                </span>
              </div>
              <p className="text-sm text-pine-700 max-w-2xl leading-relaxed font-normal">
                Jl. Kedungmundu No. 18, Kec. Tembalang, Kota Semarang, Jawa Tengah 50273. Parkir luas, akses lift dan tangga gedung, terhubung dengan fasilitas kampus.
              </p>
            </div>
          </div>

          <a
            href="https://maps.app.goo.gl/dkbegKuRniHS476t5"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-forest-900 text-white font-bold text-sm hover:bg-emerald-600 transition-colors shrink-0 shadow-warm-sm touch-target btn-press"
          >
            <span>Buka di Google Maps</span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </section>
  )
}
