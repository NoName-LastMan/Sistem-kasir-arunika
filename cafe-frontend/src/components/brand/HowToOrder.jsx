import React from 'react'
import { QrCode, CreditCard, UtensilsCrossed } from 'lucide-react'

export function HowToOrder() {
  const steps = [
    {
      num: '01',
      title: 'Pilih Meja & Scan QR',
      desc: 'Pilih tempat duduk ternyaman Anda di ruang ber-AC atau area balkon, lalu pindai QR code yang terpasang di atas meja.',
      icon: QrCode
    },
    {
      num: '02',
      title: 'Pesan & Bayar di Kasir',
      desc: 'Pilih menu favorit Anda lewat ponsel, lalu sebutkan nomor meja saat menyelesaikan pembayaran di counter kasir.',
      icon: CreditCard
    },
    {
      num: '03',
      title: 'Pesanan Diantar',
      desc: 'Duduk santai menikmati suasana. Barista dan koki kami akan mengantarkan pesanan hangat langsung ke meja Anda.',
      icon: UtensilsCrossed
    }
  ]

  return (
    <section id="cara-pesan" className="py-20 bg-white border-b border-pine-200 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-forest-950 mb-4">
            Cara pesan di meja
          </h2>
          <p className="text-base sm:text-lg text-pine-700 font-normal">
            Tanpa perlu mengantre lama. Cukup tiga langkah sederhana dari tempat duduk Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <div
                key={step.num}
                className="relative bg-paper-50 rounded-2xl p-8 border-2 border-pine-200 shadow-warm-sm card-interactive hover:border-emerald-600 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-3xl font-serif font-bold text-emerald-700">
                      {step.num}
                    </span>
                    <div className="p-3 rounded-xl bg-mint-100 text-forest-950 border border-pine-200">
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold font-serif text-forest-950 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-pine-700 leading-relaxed text-sm sm:text-base font-normal">
                    {step.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
