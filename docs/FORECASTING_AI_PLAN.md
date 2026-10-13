# 📋 Rencana Pengembangan: Sistem Prediksi Stok (Forecasting), Asisten AI (LLM), & Morning Digest Email

Dokumen ini memuat cetak biru (*blueprint*) dan implementasi fitur **Smart Inventory Forecasting**, **AI Business Intelligence (Groq/Gemini)**, dan **Automated Daily Morning Executive Digest** via email.

---

## 1. Ringkasan Eksekutif & Tujuan

Fitur ini bertujuan untuk mengubah sistem POS dari sekadar pencatat transaksi menjadi platform **ERP F&B cerdas & pencegah kecurangan**:
1. **Admin / Gudang:** Memperoleh visibilitas operasional harian mengenai stok yang menipis, estimasi hari habis (*Days until Stockout*), dan saran kuantitas belanja (*Reorder Quantity*) agar tidak terjadi kehabisan stok (*stockout*).
2. **Owner / Superadmin:** Memperoleh analisis menyeluruh yang jauh lebih dalam (estimasi modal belanja rupiah, audit selisih opname, tren inefisiensi/waste, proyeksi omzet vs belanja), serta menerima **Morning Executive Briefing Email** otomatis setiap pagi.
3. **Hybrid AI Engine:** Kombinasi kalkulasi statistik deterministik cepat di backend Laravel (WMA + Seasonality) dengan narasi analisis cerdas dari LLM (Groq / Gemini).

---

## 2. Matriks Hak Akses: Admin vs Owner

| Fitur / Metrik | Admin (Staf / Gudang) | Owner / Superadmin |
| :--- | :---: | :---: |
| **Akses Antarmuka** | Tab Menu "Perkiraan Stok & Belanja" di Admin Panel | Tab "Executive Intelligence & Forecasting" + Email Digest |
| **Data Stok & Sisa Hari (Days Until Stockout)** | ✅ Ya (Kuantitas fisik: kg, liter, pcs) | ✅ Ya |
| **Rekomendasi Kuantitas Belanja (Reorder Qty)** | ✅ Ya (Panduan belanja ke pasar/supplier) | ✅ Ya |
| **Estimasi Kebutuhan Finansial / Rupiah Belanja** | ❌ Tidak (Disembunyikan) | ✅ Ya (Total modal cashflow yang harus disiapkan) |
| **AI Operational Advice (Instruksi Dapur)** | ✅ Ya (Saran penanganan batch bahan) | ✅ Ya |
| **AI Strategic Financial & Leakage Insight** | ❌ Tidak | ✅ Ya (Analisis inefisiensi, margin, kebocoran) |
| **Audit Opname & Anomali Selisih Tim** | ❌ Hanya input fisik miliknya | ✅ Ya (Daftar anomali selisih staf > 5%) |
| **Laporan Pagi Otomatis (Morning Email Digest)** | ❌ Tidak | ✅ Ya (Terkirim otomatis setiap 06:00 pagi) |

---

## 3. Arsitektur Teknis Sistem

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Database (MariaDB/MySQL)                      │
│   - stock_mutations (tipe 'sales', 'in', 'opname', 'waste')            │
│   - ingredients, products, product_ingredients (BOM)                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│              Deterministic Engine: StockForecastingService             │
│   - Analisis data historis 14-28 hari terakhir                         │
│   - Weighted Moving Average (WMA) untuk tren terkini                   │
│   - Day-of-Week Seasonality Factor (Weekend Multiplier)                │
│   - Hitung: Daily Burn Rate, Days to Stockout, Reorder Quantity        │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
    (Payload Admin: │                                │ (Payload Eksekutif:
     Kuantitas Fisik)│                                │  Kuantitas + Nilai Rp + Audit)
                    ▼                                ▼
┌───────────────────────────┐    ┌───────────────────────────────────────┐
│ Endpoint API Admin        │    │ Intelligence Service: AiInsightService│
│ GET /api/admin/inventory/ │    │ - Integrasi Adapter Groq / Gemini     │
│     forecasting           │    │ - Input: Metrik terstruktur (JSON)    │
│                           │    │ - Output: Narasi ringkasan & saran    │
└───────────────────────────┘    └───────────────────┬───────────────────┘
                                                     │
                                                     ▼
                                 ┌───────────────────────────────────────┐
                                 │ Endpoint API Superadmin & Task        │
                                 │ 1. GET /api/superadmin/forecasting    │
                                 │ 2. Command 'report:owner-digest'      │
                                 │    -> Render Blade Email              │
                                 │    -> Kirim ke Email Owner (06:00 AM) │
                                 └───────────────────────────────────────┘
```
