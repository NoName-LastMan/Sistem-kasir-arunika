# 📋 Rencana Pengembangan: Smart Inventory Forecasting (Hybrid Event-Driven Engine) & AI Executive Briefing

Dokumen ini memuat cetak biru (*blueprint*) arsitektur enterprise untuk **Smart Inventory Forecasting**, **AI Business Intelligence (Groq/Gemini)**, dan **Automated Daily Morning Executive Digest** via email dengan pendekatan **Decoupled Pre-Computed Materialized Snapshot**.

---

## 1. Ringkasan Eksekutif & Tujuan

Fitur ini bertujuan untuk mentransformasi sistem POS Kasir Arunika dari sekadar pencatat transaksi menjadi platform **ERP F&B Cerdas, Akurat, & Anti-Kebocoran**:
1. **Admin / Gudang:** Memperoleh visibilitas operasional harian mengenai stok bahan baku kritis, estimasi hari habis (*Days until Stockout*), dan saran kuantitas belanja (*Reorder Quantity*) agar operasional dapur tidak mengalami *stockout*.
2. **Owner / Superadmin:** Memperoleh analisis finansial menyeluruh (estimasi modal belanja rupiah, audit selisih opname > 5%, tren inefisiensi/waste, proyeksi omzet vs belanja), serta menerima **Morning Executive Briefing Email** otomatis setiap pukul 06:00 pagi.
3. **Hybrid Engine & Fast Dashboard:** Mengeliminasi beban kalkulasi sinkron (*synchronous bottleneck*) dengan memindahkan peramalan statistik/ML dan panggilan LLM ke latar belakang (*Background Job*). Dashboard terbuka seketika (< 25 ms) membaca *snapshot* matang dari database/Redis.

---

## 2. Matriks Hak Akses: Admin vs Owner

| Fitur / Metrik | Admin (Staf / Gudang) | Owner / Superadmin |
| :--- | :---: | :---: |
| **Akses Antarmuka** | Tab Menu "Prediksi Stok Belanja" di Admin Panel | Tab "Executive Intelligence & Forecasting" + Email Digest |
| **Data Stok & Sisa Hari (Days Until Stockout)** | ✅ Ya (Kuantitas fisik: kg, liter, pcs) | ✅ Ya |
| **Rekomendasi Kuantitas Belanja (Reorder Qty)** | ✅ Ya (Panduan belanja ke pasar/supplier) | ✅ Ya |
| **Estimasi Kebutuhan Finansial / Rupiah Belanja** | ❌ Tidak (Disembunyikan demi kerahasiaan kas) | ✅ Ya (Total modal cashflow yang harus disiapkan) |
| **AI Operational Advice (Instruksi Dapur)** | ✅ Ya (Saran penanganan batch bahan) | ✅ Ya |
| **AI Strategic Financial & Leakage Insight** | ❌ Tidak | ✅ Ya (Analisis inefisiensi, margin, kebocoran) |
| **Audit Opname & Anomali Selisih Tim** | ❌ Hanya input fisik miliknya | ✅ Ya (Daftar anomali selisih staf > 5%) |
| **Evaluasi Akurasi Prediksi (Score 100 - WAPE)** | ❌ Tidak | ✅ Ya (Transparansi akurasi mesin forecasting) |
| **Laporan Pagi Otomatis (Morning Email Digest)** | ❌ Tidak | ✅ Ya (Terkirim otomatis setiap 06:00 pagi) |

---

## 3. Evaluasi Kritis: 3 Kelemahan Utama pada Arsitektur Sinkron Awal

1. **Synchronous API Bottleneck (Latensi & Pemborosan Token LLM):**
   Pada arsitektur awal, endpoint `GET /api/admin/inventory/forecasting` dan `GET /api/superadmin/forecasting` langsung memicu `StockForecastingService` dan `AiInsightService` secara sinkron (*on-the-fly*).
   - *Dampak:* Setiap kali halaman dibuka atau direfresh, server menghitung ulang ribuan baris mutasi dan memanggil LLM eksternal (Groq/Gemini). Waktu muat melambat drastis (3–8 detik), kuota token LLM cepat habis, dan rentan terkena *rate limit*.

2. **Keterbatasan Metode WMA pada Pola Bahan F&B:**
   Bahan F&B memiliki variasi: *Fast-Moving* (beras, telur, minyak, kopi) vs *Slow/Intermittent-Moving* (sirup varian tertentu, bumbu spesifik, kemasan khusus). WMA statis tidak menangani *intermittent demand* (banyak nilai 0) dan tidak memiliki *Prediction Interval* statistik untuk menghitung *Safety Stock* dinamis.

3. **Ketiadaan Forecast Snapshot & Audit Evaluasi (WAPE/MAPE):**
   Kalkulasi *on-the-fly* di memori tanpa tabel histori menyebabkan hilangnya *audit trail*. Angka di Morning Digest pukul 06:00 pagi dapat tidak sinkron dengan data dashboard pukul 09:00 pagi, serta pemilik tidak dapat mengukur seberapa akurat prediksi sistem dibanding pemakaian aktual.

---

## 4. Cetak Biru Arsitektur Baru: Decoupled Event-Driven Hybrid Engine

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                     LAYER 1: DATA & TRANSAKSI (MariaDB)                      │
│  - stock_mutations ('sales', 'in', 'opname', 'waste')                        │
│  - ingredients, products, product_ingredients (BOM)                          │
│  - forecast_snapshots (Tabel Baru: menyimpan hasil prediksi & akurasi WAPE)  │
│  - ai_briefing_logs (Tabel Baru: menyimpan narasi JSON Admin & Owner)        │
└──────────────────┬────────────────────────────────────────▲──────────────────┘
                   │ (1. Tarik Histori Mutasi 28-90 Hari)   │ (4. Simpan Snapshot
                   ▼                                        │     & Narasi JSON)
┌───────────────────────────────────────────────────────────┴──────────────────┐
│             LAYER 2: ASYNC ORCHESTRATOR (Laravel Queue & Scheduler)          │
│  Trigger: Cron 01:00 WIB / Event: 'StockOpnameCompleted'                     │
│  Job: GenerateDailyInventoryForecastJob                                      │
└───────┬───────────────────────────────────────────────────┬──────────────────┘
        │ (2. Kirim Time-Series Payload via Internal HTTP)  │ (3. Kirim Metrik +
        ▼                                                   ▼     Anomali Opname)
┌────────────────────────────────────────┐ ┌───────────────────────────────────┐
│ LAYER 3A: PYTHON FORECASTING SERVICE   │ │ LAYER 3B: AI INSIGHT ENGINE       │
│ Framework: FastAPI + Nixtla            │ │ Provider: Groq (Llama-3.3) /      │
│ - Fast-Moving : AutoETS / LightGBM     │ │           Gemini 2.5 Flash        │
│ - Slow-Moving : Croston / SeasonalNaive│ │ - Structured JSON Output          │
│ - Cold-Start  : WMA + BOM Heuristic    │ │ - Pisahkan Prompt Operasional     │
│ - Output: Burn Rate, P90 Safety Stock, │ │   (Admin) vs Finansial & Audit    │
│           Days to Stockout, WAPE Score │ │   Kecurangan (Owner)              │
└────────────────────────────────────────┘ └───────────────────────────────────┘
                                    │
                                    ▼ (5. Cache Hasil Matang ke Redis & DB)
┌──────────────────────────────────────────────────────────────────────────────┐
│                  LAYER 4: DELIVERY & PRESENTATION LAYER                      │
├───────────────────────────────────┬──────────────────────────────────────────┤
│ A. Endpoint Admin (RBAC Filtered) │ B. Endpoint & Digest Owner / Superadmin  │
│ GET /api/admin/inventory/forecast │ 1. GET /api/superadmin/forecasting       │
│ - Baca dari Redis/Snapshot (<20ms)│    (Lengkap: Rupiah, Margin, Audit >5%)  │
│ - Hanya Kuantitas Fisik & Instruksi│ 2. Cron 06:00 WIB 'report:owner-digest'  │
│   Persiapan Dapur (Tanpa Rupiah)  │    Render Blade dari Snapshot -> Email   │
└───────────────────────────────────┴──────────────────────────────────────────┘
```

---

## 5. Spesifikasi Mesin Forecasting: Multi-Tier Model Routing

| Kategori Bahan Baku | Kriteria Data Historis | Algoritma yang Digunakan (FastAPI / Nixtla / Fallback) | Keunggulan dibanding WMA Biasa |
| :--- | :--- | :--- | :--- |
| **Tier 1: Utama / Fast-Moving** (Beras, Telur, Kopi, Ayam, Minyak, Mie) | Data $\ge 28$ hari, keluar rutin setiap hari | **AutoETS** atau **LightGBM** (dengan fitur hari kerja/akhir pekan & tren gajian) | Menangkap pola musiman mingguan dan tren kenaikan/penurunan presisi beserta batas atas (*90% Prediction Interval*) untuk *Safety Stock*. |
| **Tier 2: Jarang / Intermittent** (Bumbu khusus, Sirup varian jarang, Kemasan) | Banyak hari bernilai $0$ (tidak keluar tiap hari) | **CrostonOptimized** atau **ADIDA** | Menghindari bias pembagian nol dan memprediksi waktu kedaluwarsa/kehabisan *batch* berikutnya secara akurat. |
| **Tier 3: Bahan / Menu Baru (Cold-Start)** | Data kurang dari 14 hari | **WMA 7 Hari + Day-of-Week Multiplier** (Deterministik Fallback) | Menjaga sistem tetap berjalan stabil dan instan tanpa error saat kafe baru menambahkan varian menu atau bahan baru. |

---

## 6. Desain Skema Database Baru

```php
Schema::create('forecast_snapshots', function (Blueprint $table) {
    $table->id();
    $table->date('forecast_date')->index(); // Tanggal pembuatan snapshot
    $table->foreignId('ingredient_id')->constrained('ingredients')->cascadeOnDelete();
    $table->string('model_used', 50); // 'AutoETS', 'LightGBM', 'Croston', 'WMA_Fallback'
    
    // Metrik Kuantitas Fisik (Admin & Owner)
    $table->decimal('current_stock', 12, 2);
    $table->decimal('predicted_daily_burn', 12, 2);
    $table->decimal('safety_stock_qty', 12, 2); // Diambil dari P90 Prediction Interval
    $table->decimal('days_until_stockout', 8, 1);
    $table->decimal('recommended_reorder_qty', 12, 2);
    $table->enum('urgency_status', ['CRITICAL', 'WARNING', 'SAFE']);
    
    // Metrik Finansial & Akurasi (Owner Only)
    $table->decimal('unit_cost_rp', 15, 2);
    $table->decimal('estimated_reorder_cost_rp', 15, 2);
    $table->decimal('actual_usage_yesterday', 12, 2)->nullable();
    $table->decimal('accuracy_percentage', 5, 2)->nullable(); // 100 - WAPE
    $table->timestamps();

    $table->unique(['forecast_date', 'ingredient_id']);
});

Schema::create('ai_briefing_logs', function (Blueprint $table) {
    $table->id();
    $table->date('briefing_date')->unique();
    $table->json('admin_operational_payload'); // Saran dapur & belanja fisik staf
    $table->json('owner_executive_payload');   // Analisis cashflow modal, waste, & anomali opname
    $table->string('llm_provider', 30);        // 'groq-llama-3.3' atau 'gemini-2.5-flash'
    $table->timestamp('email_sent_at')->nullable();
    $table->timestamps();
});
```

---

## 7. Perbandingan Arsitektur Lama vs Arsitektur Rekomendasi

| Aspek Evaluasi | Arsitektur Awal (Synchronous Monolith) | Arsitektur Baru (Decoupled Snapshot + FastAPI) |
| :--- | :--- | :--- |
| **Kecepatan Buka Dashboard** | Lambat (3.000 – 8.000 ms) karena kalkulasi & panggilan LLM dilakukan saat *request* | **Sangat Cepat (< 25 ms)** karena langsung membaca *snapshot* dari Database/Redis |
| **Biaya & Efisiensi API LLM** | Boros (terpanggil berulang kali setiap halaman dibuka/di-*refresh*) | **Sangat Hemat** (hanya dipanggil 1–2 kali sehari melalui *Background Job*) |
| **Akurasi Forecasting** | Standar (WMA rentan meleset pada barang *slow-moving* dan hari libur) | **Tinggi (State-of-the-Art)** dengan *Multi-Model Routing* (`AutoETS`, `Croston`, `LightGBM`) |
| **Keandalan Morning Email (06:00)** | Berisiko gagal kirim jika API LLM sedang *down* pada pukul 06:00 | **100% Andal** karena data sudah tersimpan rapi sejak pukul 01:00 dini hari dan memiliki *fallback* |
| **Kemampuan Audit & Evaluasi** | Tidak ada histori prediksi (tidak tahu apakah prediksi kemarin meleset) | **Tersedia skor akurasi (WAPE)** yang membandingkan prediksi kemarin vs pemakaian aktual |

---

## 8. Rencana Implementasi Bertahap (Implementation Roadmap)

1. **Fase 1 (Database Migration & Snapshot Models di Laravel):**
   - Buat migrasi tabel `forecast_snapshots` dan `ai_briefing_logs`.
   - Buat model Eloquent `ForecastSnapshot` dan `AiBriefingLog`.
   - Modifikasi `ForecastingController` agar membaca data snapshot terkini (`whereDate('forecast_date', today())`), dengan fallback otomatis jika snapshot hari ini belum ada.

2. **Fase 2 (Deterministic Standalone Snapshot Seeder/Job):**
   - Bangun Artisan command `forecast:generate-daily` dan job `GenerateDailyInventoryForecastJob`.
   - Hitung metrik awal di backend, simpan snapshot ke database, dan buat narasi AI satu kali per hari.
   - Perbaiki konsumsi response pada `ForecastingPage.jsx` agar membaca `res.data`, `res.insight`, dan `res.financial_summary` secara presisi.

3. **Fase 3 (Python Microservice FastAPI Integration):**
   - Buat direktori `forecasting-engine/` (FastAPI) berisi endpoint `/forecast` yang menerima deret waktu dan mengembalikan estimasi AutoETS/Croston.
   - Tambahkan HTTP Client di Laravel dengan fallback otomatis ke *internal statistical calculation* bila microservice belum aktif.

4. **Fase 4 (Penyempurnaan Pengadaan & Integritas Operasional):**
   - **Isolasi Kerusakan (Waste Isolation):** Konsumsi untuk peramalan otomatis mengecualikan `reference_type='waste'` agar tumpahan/kerusakan tidak mendistorsi proyeksi permintaan riil pelanggan.
   - **Dynamic Lead Time:** Setiap bahan dapat memiliki waktu tunggu pengiriman spesifik (`lead_time_days`, default 7 hari) untuk kalkulasi Safety Stock ($Z \cdot \sigma \sqrt{L}$).
   - **Konversi Satuan Kemasan Beli:** Mendukung konversi dari resep (`base_unit`) ke kemasan grosir (`purchase_unit` & `purchase_unit_ratio`, contoh: 1 karung = 25 kg beras, 1 karton = 12 liter susu) dengan rekomendasi jumlah kemasan bulat (`recommended_purchase_packs`).
   - **WhatsApp PO Multi-Supplier:** Generator WhatsApp PO mengelompokkan pesanan per vendor/supplier (`supplier_info`) dan memuat konversi kemasan serta estimasi anggaran.
   - **Auto-Pruning Scheduler:** Artisan command `forecast:prune --days=90` terjadwal setiap Minggu jam 02:00 WIB untuk menjaga ukuran database tetap ringkas dan responsif.
