import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Phone, Clock, Instagram } from 'lucide-react'

export function Footer({ settings }) {
  return (
    <footer className="bg-forest-950 text-white pt-16 pb-12 border-t-2 border-sun-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-pine-700">
          {/* Kolom Brand */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-white shadow-sm border-2 border-sun-400 p-0.5 shrink-0 flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="Arunika Coffee & Space"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-serif font-bold text-2xl tracking-tight text-white">
                ARUNIKA
              </span>
            </div>
            <p className="text-mint-100 text-sm max-w-sm leading-relaxed mb-6 font-normal">
              Kafe dan ruang kreatif di Lantai 2 Gedung Unimus Mart, Universitas Muhammadiyah Semarang. Menghadirkan kopi andalan, hidangan lezat, dan ruang ber-AC yang nyaman untuk nugas maupun pertemuan.
            </p>
            <div className="text-xs text-mint-200 font-medium">
              {settings?.receiptFooter || 'Terima kasih telah berkunjung ke Arunika Coffee and Space UNIMUS Semarang.'}
            </div>
          </div>

          {/* Kolom Navigasi Cepat */}
          <div className="lg:col-span-3">
            <h4 className="font-serif text-lg font-bold text-white mb-4">
              Jelajahi
            </h4>
            <ul className="space-y-2.5 text-sm font-medium text-mint-100">
              <li>
                <Link to="/" className="hover:text-sun-400 transition-colors">Beranda</Link>
              </li>
              <li>
                <Link to="/menu" className="hover:text-sun-400 transition-colors">Katalog Menu & Pesan</Link>
              </li>
              <li>
                <a href="#ruang" className="hover:text-sun-400 transition-colors">Ruang & Fasilitas</a>
              </li>
              <li>
                <a href="#cara-pesan" className="hover:text-sun-400 transition-colors">Cara Pesan di Meja</a>
              </li>
              <li>
                <Link to="/reservasi" className="hover:text-sun-400 transition-colors">Reservasi Meja & Rapat</Link>
              </li>
              <li>
                <Link to="/riwayat" className="hover:text-sun-400 transition-colors">Riwayat Pesanan Saya</Link>
              </li>
            </ul>
          </div>

          {/* Kolom Kontak & Lokasi */}
          <div className="lg:col-span-4">
            <h4 className="font-serif text-lg font-bold text-white mb-4">
              Lokasi & Jam Temu
            </h4>
            <div className="space-y-3.5 text-sm font-medium text-mint-100">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-sun-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-white block leading-snug">
                    {settings?.address || 'Lt. 2 Gedung Unimus Mart, Jl. Kedungmundu No. 18, Semarang'}
                  </span>
                  <a
                    href={settings?.googleMapsUrl || 'https://maps.app.goo.gl/dkbegKuRniHS476t5'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-1 text-xs text-sun-400 hover:text-mint-100 underline underline-offset-2 font-bold"
                  >
                    Buka Petunjuk Arah di Google Maps ↗
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-sun-400 shrink-0" />
                <span>
                  Buka Setiap Hari: 08:00 - 22:00 WIB
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-sun-400 shrink-0" />
                <a
                  href={`https://wa.me/${(settings?.phone || '6288985722088').replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sun-400 transition-colors"
                >
                  {settings?.phone || '+62 889-8572-2088'}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Baris Bawah Hak Cipta */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-mint-200 font-medium gap-4">
          <div>
            © {new Date().getFullYear()} Arunika Coffee & Space. Hak cipta dilindungi.
          </div>
          <div className="flex items-center gap-6">
            <span>Terhubung langsung ke Sistem Kasir Arunika</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
