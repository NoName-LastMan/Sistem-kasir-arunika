# 🎨 Catatan Komprehensif Perubahan UI/UX Sistem Kasir Arunika (Dari Awal - Terkini)

Dokumen ini mendokumentasikan secara lengkap seluruh perombakan, optimasi, animasi, dan standarisasi antarmuka pengguna (UI) serta pengalaman pengguna (UX) yang telah diterapkan pada **Sistem Kasir Arunika** (mencakup `cafe-frontend` untuk tamu dan `pos-frontend` untuk operasional kasir, koki dapur, gudang, dan superadmin).

---

## 🌟 1. Desain Visual & Identitas Kafe (Branding)
* **Palet Warna "Warm Morning Coffee"**:
  - Hijau Hutan (*Forest Green* `#12231B`, `#1F6B4A`) sebagai pondasi kenyamanan dan wibawa operasional.
  - Emas Fajar (*Sunrise Gold* `#E8C95A`, `#B8803F`) untuk highlight aksen transaksi, total tagihan, dan notifikasi pesanan.
  - Kertas Krim Hangat (*Soft Paper Cream* `#FBF7EE`) untuk background layar HP tamu dan preview struk termal.
* **Tipografi & Ikon**: Font serif elegan untuk headline dan sans-serif geometris untuk teks antarmuka, dipadukan dengan icon set *Lucide React*.
* **Branding Resmi**: Penggantian template lama menjadi identitas resmi **"Arunika Coffee & Space"** (Gedung Unimus Mart Lt. 2, Semarang) dan nomor faktur dinamis berprefix `ARN-XXXXXXXX`.

---

## ⚡ 2. Standarisasi Motion Design Engine (`src/lib/motion.js`)
* **Framer Motion Physics Engine**: Menghilangkan transisi CSS manual yang patah-patah dengan fisika pegas (*spring physics*):
  - `springGentle`: Transisi lembut elemen halaman.
  - `springSnappy`: Respons cepat tombol dan interaksi input.
  - `springBouncy`: Efek membal pada counter badge keranjang dan toast alert.
  - `springModal`: Efek kemunculan kartu modal yang natural.
* **Transisi Halaman Mulus (`AnimatedOutlet.jsx`)**: Menggantikan lompatan layar (*hard cut*) dengan animasi pergantian rute berbasis `AnimatePresence`.

---

## 📱 3. Evolusi UI/UX Portal Tamu Mandiri (`cafe-frontend`)

1. **`SunriseHero.jsx` (Layar Masuk Tamu)**:
   - Titik hijau berdenyut (*pulsing dot*) yang menunjukkan status kafe buka secara real-time.
   - Widget cuaca lokal Semarang di area kampus Unimus.
   - Deteksi nomor meja otomatis dari URL QR Code (`?table=X`).
   - Animasi kemunculan bertingkat (*staggered entrance*).
2. **`CategoryFilter.jsx` & `ProductCard.jsx` (Katalog Menu)**:
   - Tab kategori horizontal yang responsif dan mudah digeser dengan jempol.
   - Efek kartu naik (*lift hover*) dan zoom foto produk halus.
   - Penanda badge produk (*Best Seller*, *Promo*, *Habis*).
   - Tombol cepat "Tambah +" dengan rasa sentuhan taktil (*tactile micro-interaction*).
3. **`ProductDetailModal.jsx` (Modal Kustomisasi Topping & Resep)**:
   - Pilihan varian: Level Gula (Normal, Less Sugar, No Sugar), Level Es (Normal Ice, Less Ice, No Ice).
   - Checkbox pilihan topping tambahan (Extra Shot, Keju, Oatmilk, Karamel) dengan subtotal harga yang naik secara otomatis.
   - Kolom catatan barista untuk preferensi racikan khusus.
4. **`FloatingCartBar.jsx` & `CartDrawer.jsx` (Keranjang Belanja)**:
   - Bilah ringkasan mengambang di bawah layar (*floating bottom bar*) dengan animasi badge angka melompat (*badgePop*).
   - Laci geser samping kanan (*right slide drawer*) dengan rincian item, modifier, kalkulasi pajak PB1 10%, dan grand total instan.
   - Animasi hapus item geser kiri (*swipe-out left*).
5. **`TrackPage.jsx` (Pelacakan Pesanan Real-Time)**:
   - Stepper status visual 4-tahap (Menunggu Konfirmasi $\rightarrow$ Sedang Disiapkan $\rightarrow$ Siap Disajikan $\rightarrow$ Selesai).
   - Pemutaran audio lonceng (*Web Audio Chime*) otomatis saat pesanan siap diambil.
   - Perbaikan tampilan nilai pajak dan total tagihan yang sebelumnya bernilai Rp 0.
   - **Fitur Pembatalan Mandiri Tamu (*Guest Self-Cancel*)**: Tombol pembatalan oranye jika pesanan masih pending, sehingga tamu tidak perlu berjalan ke kasir jika salah menu.
   - Tampilan Struk Digital (e-Receipt) yang rapi.
6. **`HistoryPage.jsx` (Riwayat Transaksi)**:
   - Pembersihan data mock dummy `ord-unimus-01`.
   - Riwayat pesanan lokal pengguna dengan tombol *"Pesan Lagi"* (*1-click reorder*).

---

## 💻 4. Evolusi UI/UX Kasir POS (`pos-frontend`)

1. **`POSPage.jsx` (Layar Kasir Utama)**:
   - Tata letak *split-screen* modern (65% katalog produk, 35% struk kasir berjalan).
   - **Notifikasi Emas Pesanan Tamu**: Banner kartu emas berdenyut di laci kasir:  
     `🔔 X Pesanan Tamu Masuk! [ Buka & Konfirmasi ]` yang menyala begitu ada pesanan QR meja masuk.
   - Dukungan pintasan keyboard lengkap (*Keyboard Shortcut HUD*): `F1` (Cari), `F2` (Pilih Meja), `F3` (Hold), `F4` (Recall), `F8` (Bayar), `F9` (Quick Item), `Esc` (Tutup).
   - **Shift Guard Terintegrasi**: Peringatan otomatis jika kasir belum membuka shift sebelum memproses pembayaran (F8).
2. **`PaymentModal.jsx` (Modal Pembayaran & Kembalian)**:
   - Chip nominal uang cepat (`Uang Pas`, `+Rp 20.000`, `+Rp 50.000`, `+Rp 100.000`, `+Rp 200.000`).
   - Kalkulator kembalian otomatis dengan highlight hijau kontras tinggi.
   - Fitur perhitungan patungan (*Split Bill*).
   - Proteksi tombol bayar anti macet (*try / finally loading state*).
3. **`ReceiptModal.jsx` (Cetak Struk Termal)**:
   - Switcher ukuran kertas termal: **58mm (Mini Printer Bluetooth)** vs **80mm (Printer Desktop Standar)**.
   - Format cetak ESC/POS tanpa margin terpotong, lengkap dengan logo Arunika, data kasir, rincian menu, dan kata sandi Wi-Fi.
4. **`GuestOrdersModal.jsx` (Verifikasi Pesanan QR)**:
   - Panel verifikasi detail pesanan tamu meja lengkap dengan topping, pilihan metode bayar, dan tombol 1-klik kirim ke dapur KDS.
5. **`HeldOrdersModal.jsx` (Parkir & Lanjutkan Transaksi)**:
   - Antarmuka penahanan transaksi untuk pelanggan yang menambah pesanan di tengah jalan.

---

## 🍳 5. Evolusi UI/UX Dapur (Kitchen Display System - KDS)

1. **Pemisahan Zona Pesanan (`KitchenDisplayPage.jsx`)**:
   - Bilah peringatan kuning atas untuk pesanan yang masih `pending` (menunggu bayar di kasir).
   - Kolom tiket aktif khusus pesanan yang sudah berstatus `processing` (sudah dibayar/diverifikasi), mencegah koki memasak sebelum transaksi lunas.
2. **Timer Urgensi Berubah Warna**:
   - Hijau (< 10 menit): Normal
   - Kuning (10 - 20 menit): Perhatian
   - Merah Berkedip (> 20 menit): Kritis / Prioritas Tinggi
3. **Interaksi Ceklis Menu & Lonceng Audio**:
   - Koki dapat mencoret menu satu per satu dan memicu lonceng saat pesanan selesai.

---

## 📊 6. Evolusi UI/UX Backoffice Admin & Superadmin

1. **`OrdersPage.jsx` (Riwayat & Audit Transaksi)**:
   - Kartu metrik KPI di atas layar (Total Transaksi Hari Ini, Omzet Bersih, Pesanan Selesai, Pesanan Void).
   - Paginasi tinggi (`per_page=100`) agar data transaksi lama tidak lenyap terpotong.
   - Sinkronisasi badge merah VOID lengkap dengan alasan pembatalan dan timestamp.
   - Filter kalender tanggal, filter status, dan pencarian faktur instan.
2. **`TablesPage.jsx` (Denah Meja & Generator Cetak Stand QR)**:
   - Grid denah meja interaktif dengan status: `Available`, `Occupied`, dan `Cleaning`.
   - **Generator Lembar Cetak QR Stand Meja**: Pilihan cetak per meja atau seluruh meja sekaligus berukuran kartu meja standar kafe, berlogo Arunika, nomor meja besar, dan info Wi-Fi kafe.
3. **`ModifiersPage.jsx` (Koneksi Resep Topping Gudang)**:
   - Tampilan penautan topping menu dengan master bahan baku gudang dan takaran porsi.
4. **`LoginPage.jsx` & `AdminLayout.jsx`**:
   - Kartu login dengan tombol kartu instan *demo accounts* untuk 4 peran (*Owner, Admin Gudang, Kasir Utama, Koki Dapur*).
   - Sidebar navigasi modern dengan indikator item aktif dan badge proteksi hak akses `Owner`.

