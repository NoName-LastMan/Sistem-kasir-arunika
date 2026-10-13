<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Morning Executive Digest</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
        .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { background: #0f172a; padding: 28px 24px; text-align: left; color: #ffffff; }
        .header h1 { margin: 0 0 6px 0; font-size: 20px; font-weight: 700; color: #f8fafc; }
        .header p { margin: 0; font-size: 13px; color: #94a3b8; }
        .content { padding: 24px; }
        .ai-card { background: #f8fafc; border-left: 4px solid #6366f1; padding: 16px; border-radius: 6px; margin-bottom: 24px; }
        .ai-title { font-size: 13px; font-weight: 700; color: #4338ca; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; }
        .ai-text { font-size: 14px; line-height: 1.6; color: #334155; margin: 0; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
        .stat-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; }
        .stat-label { font-size: 12px; color: #64748b; margin-bottom: 4px; font-weight: 500; }
        .stat-value { font-size: 18px; font-weight: 700; color: #0f172a; }
        .section-title { font-size: 15px; font-weight: 700; color: #0f172a; margin: 24px 0 12px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
        .table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px; }
        .table th { background: #f8fafc; text-align: left; padding: 8px; color: #475569; font-weight: 600; border-bottom: 1px solid #cbd5e1; }
        .table td { padding: 8px; border-bottom: 1px solid #f1f5f9; color: #334155; }
        .badge-danger { background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
        .badge-warning { background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
        .footer { background: #f8fafc; padding: 18px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>☕ Executive Morning Digest</h1>
            <p>Rekapitulasi Operasional Kemarin ({{ $summaryData['date'] }}) & Prakiraan Hari Ini</p>
        </div>

        <div class="content">
            <!-- AI Intelligence Summary -->
            <div class="ai-card">
                <div class="ai-title">🤖 AI Executive Briefing</div>
                <p class="ai-text">{{ $aiExecutiveNarrative }}</p>
            </div>

            <!-- Financial Highlights -->
            <div class="section-title">💰 Ringkasan Finansial Kemarin</div>
            <div class="grid">
                <div class="stat-box">
                    <div class="stat-label">Total Omzet Bersih</div>
                    <div class="stat-value">Rp {{ number_format($summaryData['sales']['net_sales'] ?? 0, 0, ',', '.') }}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Transaksi Selesai</div>
                    <div class="stat-value">{{ $summaryData['sales']['total_orders'] ?? 0 }} Pesanan</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Estimasi Gross Profit</div>
                    <div class="stat-value" style="color: #16a34a;">Rp {{ number_format($summaryData['sales']['gross_profit'] ?? 0, 0, ',', '.') }}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Selisih Kas Laci Kasir</div>
                    <div class="stat-value" style="color: {{ ($summaryData['cash_discrepancy'] ?? 0) < 0 ? '#dc2626' : '#0f172a' }};">
                        Rp {{ number_format($summaryData['cash_discrepancy'] ?? 0, 0, ',', '.') }}
                    </div>
                </div>
            </div>

            <!-- Audit Trail & Keamanan -->
            <div class="section-title">🛡️ Audit Pengawasan Toko</div>
            <p style="font-size: 13px; color: #475569; margin-top: 0;">
                • Barang Masuk (Restock): <strong>{{ $summaryData['stock_in_count'] ?? 0 }} transaksi</strong><br>
                • Pencatatan Waste (Tumpah/Basi): <strong>{{ $summaryData['waste_count'] ?? 0 }} insiden</strong><br>
                • Temuan Anomali Opname (>5%): 
                @if(($summaryData['anomaly_count'] ?? 0) > 0)
                    <span class="badge-danger">{{ $summaryData['anomaly_count'] }} Anomali Terdeteksi</span>
                @else
                    <span style="color: #16a34a; font-weight: 600;">Nihil (Stok Sinkron)</span>
                @endif
            </p>

            <!-- Bahan Baku Kritis Hari Ini -->
            @if(!empty($summaryData['critical_ingredients']))
            <div class="section-title">🚨 Perhatian Stok: Bahan Kritis (< 2 Hari)</div>
            <table class="table">
                <thead>
                    <tr>
                        <th>Bahan Baku</th>
                        <th>Sisa Stok</th>
                        <th>Sisa Hari</th>
                        <th>Rekomendasi Belanja</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($summaryData['critical_ingredients'] as $item)
                    <tr>
                        <td><strong>{{ $item['name'] }}</strong></td>
                        <td>{{ $item['current_stock'] }} {{ $item['unit'] }}</td>
                        <td><span class="badge-danger">{{ $item['days_until_stockout'] ?? 'Segera' }} Hari</span></td>
                        <td>{{ $item['recommended_reorder_qty'] }} {{ $item['unit'] }} (± Rp {{ number_format($item['estimated_cost'] ?? 0, 0, ',', '.') }})</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
            @endif
        </div>

        <div class="footer">
            Dikirim secara otomatis oleh Sistem Arunika POS & ERP Suite pada pukul 06:00 WIB.<br>
            Hanya untuk konsumsi Pemilik Toko (Superadmin).
        </div>
    </div>
</body>
</html>
