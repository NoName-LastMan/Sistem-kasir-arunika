<?php

namespace Database\Seeders;

use App\Models\Ingredient;
use App\Models\Product;
use App\Models\StockMutation;
use App\Models\User;
use App\Models\WasteRecord;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class IngredientSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Ambil atau Buat Staf & Pengguna
        $superadmin = User::updateOrCreate(
            ['email' => 'owner@pos.com'],
            [
                'name'      => 'Pak Budi Santoso',
                'password'  => Hash::make('password'),
                'role'      => 'superadmin',
                'is_active' => true,
            ]
        );

        $admin = User::updateOrCreate(
            ['email' => 'admin@pos.com'],
            [
                'name'      => 'Andi Prasetyo',
                'password'  => Hash::make('password'),
                'role'      => 'admin',
                'is_active' => true,
            ]
        );

        $cashiers = User::where('role', 'cashier')->get();
        if ($cashiers->isEmpty()) {
            $cashiers = collect([$admin]);
        }

        // 2. Data Bahan Baku (29 Bahan Baku Realistis Kafe & Warmindo Arunika)
        $ingredientsData = [
            // Kopi & Minuman
            ['name' => 'Biji Kopi Arabica',       'base_unit' => 'kg',    'stock_quantity' => 8.0,   'min_stock_alert' => 2.0,  'cost_per_unit' => 120000.00],
            ['name' => 'Biji Kopi Robusta',       'base_unit' => 'kg',    'stock_quantity' => 5.0,   'min_stock_alert' => 1.0,  'cost_per_unit' => 80000.00],
            ['name' => 'Susu Segar Full Cream',   'base_unit' => 'liter', 'stock_quantity' => 15.0,  'min_stock_alert' => 3.0,  'cost_per_unit' => 18000.00],
            ['name' => 'Gula Aren Cair',          'base_unit' => 'liter', 'stock_quantity' => 5.0,   'min_stock_alert' => 1.0,  'cost_per_unit' => 35000.00],
            ['name' => 'Gula Pasir',              'base_unit' => 'kg',    'stock_quantity' => 10.0,  'min_stock_alert' => 2.0,  'cost_per_unit' => 16000.00],
            ['name' => 'Bubuk Matcha',            'base_unit' => 'kg',    'stock_quantity' => 1.5,   'min_stock_alert' => 0.3,  'cost_per_unit' => 280000.00],
            ['name' => 'Bubuk Coklat',            'base_unit' => 'kg',    'stock_quantity' => 3.0,   'min_stock_alert' => 0.5,  'cost_per_unit' => 85000.00],
            ['name' => 'Bubuk Taro',              'base_unit' => 'kg',    'stock_quantity' => 2.0,   'min_stock_alert' => 0.4,  'cost_per_unit' => 75000.00],
            ['name' => 'Sirup Vanilla',           'base_unit' => 'liter', 'stock_quantity' => 3.0,   'min_stock_alert' => 0.5,  'cost_per_unit' => 45000.00],
            ['name' => 'Sirup Hazelnut',          'base_unit' => 'liter', 'stock_quantity' => 2.5,   'min_stock_alert' => 0.5,  'cost_per_unit' => 50000.00],
            ['name' => 'Es Batu',                 'base_unit' => 'kg',    'stock_quantity' => 40.0,  'min_stock_alert' => 10.0, 'cost_per_unit' => 3000.00],
            ['name' => 'Teh Celup',               'base_unit' => 'pcs',   'stock_quantity' => 200.0, 'min_stock_alert' => 40.0, 'cost_per_unit' => 450.00],
            ['name' => 'Jeruk Segar',             'base_unit' => 'kg',    'stock_quantity' => 10.0,  'min_stock_alert' => 2.0,  'cost_per_unit' => 20000.00],
            ['name' => 'Lemon',                   'base_unit' => 'kg',    'stock_quantity' => 5.0,   'min_stock_alert' => 1.0,  'cost_per_unit' => 25000.00],

            // Warmindo & Makanan
            ['name' => 'Indomie Goreng',          'base_unit' => 'pcs',   'stock_quantity' => 120.0, 'min_stock_alert' => 24.0, 'cost_per_unit' => 3200.00],
            ['name' => 'Indomie Kuah',            'base_unit' => 'pcs',   'stock_quantity' => 80.0,  'min_stock_alert' => 24.0, 'cost_per_unit' => 3200.00],
            ['name' => 'Telur Ayam',              'base_unit' => 'butir', 'stock_quantity' => 180.0, 'min_stock_alert' => 30.0, 'cost_per_unit' => 2400.00],
            ['name' => 'Beras',                   'base_unit' => 'kg',    'stock_quantity' => 25.0,  'min_stock_alert' => 5.0,  'cost_per_unit' => 14000.00],
            ['name' => 'Minyak Goreng',           'base_unit' => 'liter', 'stock_quantity' => 10.0,  'min_stock_alert' => 2.0,  'cost_per_unit' => 18000.00],
            ['name' => 'Bawang Merah',            'base_unit' => 'kg',    'stock_quantity' => 3.0,   'min_stock_alert' => 0.5,  'cost_per_unit' => 38000.00],
            ['name' => 'Bawang Putih',            'base_unit' => 'kg',    'stock_quantity' => 2.0,   'min_stock_alert' => 0.5,  'cost_per_unit' => 32000.00],
            ['name' => 'Mie Telor Basah',         'base_unit' => 'kg',    'stock_quantity' => 8.0,   'min_stock_alert' => 2.0,  'cost_per_unit' => 16000.00],
            ['name' => 'Kornet Sapi',             'base_unit' => 'kaleng','stock_quantity' => 12.0,  'min_stock_alert' => 3.0,  'cost_per_unit' => 24000.00],
            ['name' => 'Sosis Ayam',              'base_unit' => 'pcs',   'stock_quantity' => 60.0,  'min_stock_alert' => 12.0, 'cost_per_unit' => 2800.00],
            ['name' => 'Bakso Sapi',              'base_unit' => 'pcs',   'stock_quantity' => 60.0,  'min_stock_alert' => 12.0, 'cost_per_unit' => 1500.00],
            ['name' => 'Keju Slice',              'base_unit' => 'pcs',   'stock_quantity' => 50.0,  'min_stock_alert' => 10.0, 'cost_per_unit' => 2200.00],

            // Snack & Roti
            ['name' => 'Kentang Beku',            'base_unit' => 'kg',    'stock_quantity' => 8.0,   'min_stock_alert' => 2.0,  'cost_per_unit' => 22000.00],
            ['name' => 'Roti Tawar',              'base_unit' => 'loaf',  'stock_quantity' => 8.0,   'min_stock_alert' => 2.0,  'cost_per_unit' => 14000.00],
            ['name' => 'Coklat Batang',           'base_unit' => 'kg',    'stock_quantity' => 2.0,   'min_stock_alert' => 0.5,  'cost_per_unit' => 65000.00],
        ];

        $ingredientMap = [];
        foreach ($ingredientsData as $ing) {
            $model = Ingredient::updateOrCreate(
                ['name' => $ing['name']],
                [
                    'base_unit'       => $ing['base_unit'],
                    'stock_quantity'  => $ing['stock_quantity'],
                    'min_stock_alert' => $ing['min_stock_alert'],
                    'cost_per_unit'   => $ing['cost_per_unit'],
                    'track_stock'     => true,
                ]
            );
            $ingredientMap[$ing['name']] = $model;
        }

        // 3. Resep Produk (Bill of Materials - BOM)
        // Format: [Nama Bahan, Jumlah Dibutuhkan, Satuan Resep, Faktor Konversi ke Base Unit]
        $recipes = [
            // Kopi
            'KOP-SUSU-ARN' => [
                ['Biji Kopi Arabica',     18,  'gr', 0.001],
                ['Susu Segar Full Cream', 150, 'ml', 0.001],
                ['Gula Aren Cair',        25,  'ml', 0.001],
                ['Es Batu',               100, 'gr', 0.001],
            ],
            'KOP-SUSU-VAN' => [
                ['Biji Kopi Arabica',     18,  'gr', 0.001],
                ['Susu Segar Full Cream', 150, 'ml', 0.001],
                ['Sirup Vanilla',         20,  'ml', 0.001],
                ['Es Batu',               100, 'gr', 0.001],
            ],
            'KOP-SUSU-HZL' => [
                ['Biji Kopi Arabica',     18,  'gr', 0.001],
                ['Susu Segar Full Cream', 150, 'ml', 0.001],
                ['Sirup Hazelnut',        20,  'ml', 0.001],
                ['Es Batu',               100, 'gr', 0.001],
            ],
            'KOP-AMERICANO' => [
                ['Biji Kopi Arabica',     18,  'gr', 0.001],
                ['Es Batu',               80,  'gr', 0.001],
            ],
            'KOP-CAPPUCCINO' => [
                ['Biji Kopi Arabica',     18,  'gr', 0.001],
                ['Susu Segar Full Cream', 120, 'ml', 0.001],
            ],
            'KOP-V60-BREW' => [
                ['Biji Kopi Arabica',     15,  'gr', 0.001],
            ],
            'KOP-ESPRESSO' => [
                ['Biji Kopi Arabica',     18,  'gr', 0.001],
            ],

            // Non-Coffee
            'NCF-MATCHA' => [
                ['Bubuk Matcha',          5,   'gr', 0.001],
                ['Susu Segar Full Cream', 200, 'ml', 0.001],
                ['Gula Pasir',            10,  'gr', 0.001],
                ['Es Batu',               100, 'gr', 0.001],
            ],
            'NCF-COKLAT' => [
                ['Bubuk Coklat',          25,  'gr', 0.001],
                ['Susu Segar Full Cream', 200, 'ml', 0.001],
                ['Gula Pasir',            10,  'gr', 0.001],
                ['Es Batu',               100, 'gr', 0.001],
            ],
            'NCF-TARO' => [
                ['Bubuk Taro',            30,  'gr', 0.001],
                ['Susu Segar Full Cream', 200, 'ml', 0.001],
                ['Gula Pasir',            10,  'gr', 0.001],
                ['Es Batu',               100, 'gr', 0.001],
            ],
            'NCF-ES-TEH' => [
                ['Teh Celup',             1,   'pcs', 1],
                ['Gula Pasir',            15,  'gr', 0.001],
                ['Es Batu',               150, 'gr', 0.001],
            ],
            'NCF-ES-JERUK' => [
                ['Jeruk Segar',           100, 'gr', 0.001],
                ['Gula Pasir',            10,  'gr', 0.001],
                ['Es Batu',               120, 'gr', 0.001],
            ],
            'NCF-LEMON-TEA' => [
                ['Teh Celup',             1,   'pcs', 1],
                ['Lemon',                 30,  'gr', 0.001],
                ['Gula Pasir',            15,  'gr', 0.001],
                ['Es Batu',               100, 'gr', 0.001],
            ],

            // Warmindo & Mie
            'WMD-IND-GRG' => [
                ['Indomie Goreng',        1,   'pcs', 1],
                ['Minyak Goreng',         20,  'ml', 0.001],
            ],
            'WMD-IND-RBS' => [
                ['Indomie Kuah',          1,   'pcs', 1],
            ],
            'WMD-IND-DBL' => [
                ['Indomie Goreng',        2,   'pcs', 1],
                ['Minyak Goreng',         30,  'ml', 0.001],
            ],
            'WMD-MIE-JAWA' => [
                ['Mie Telor Basah',       200, 'gr', 0.001],
                ['Telur Ayam',            1,   'butir', 1],
                ['Minyak Goreng',         25,  'ml', 0.001],
                ['Bawang Merah',          10,  'gr', 0.001],
                ['Bawang Putih',          5,   'gr', 0.001],
            ],
            'WMD-NAS-GRG' => [
                ['Beras',                 200, 'gr', 0.001],
                ['Telur Ayam',            2,   'butir', 1],
                ['Minyak Goreng',         30,  'ml', 0.001],
                ['Bawang Merah',          15,  'gr', 0.001],
                ['Bawang Putih',          10,  'gr', 0.001],
            ],
            'WMD-NAS-TLR' => [
                ['Beras',                 200, 'gr', 0.001],
                ['Telur Ayam',            1,   'butir', 1],
                ['Minyak Goreng',         15,  'ml', 0.001],
            ],

            // Snack & Cemilan
            'SNK-KENTANG' => [
                ['Kentang Beku',          200, 'gr', 0.001],
                ['Minyak Goreng',         50,  'ml', 0.001],
            ],
            'SNK-RISOL-MAYO' => [
                ['Kentang Beku',          150, 'gr', 0.001],
                ['Minyak Goreng',         40,  'ml', 0.001],
            ],
            'SNK-ROTI-BAKAR' => [
                ['Roti Tawar',            0.15,'loaf', 1],
                ['Coklat Batang',         20,  'gr', 0.001],
                ['Keju Slice',            2,   'pcs', 1],
            ],
        ];

        foreach ($recipes as $sku => $items) {
            $product = Product::where('sku', $sku)->first();
            if (! $product) {
                continue;
            }

            $syncData = [];
            foreach ($items as [$ingName, $qty, $unit, $conv]) {
                if (isset($ingredientMap[$ingName])) {
                    $ingModel = $ingredientMap[$ingName];
                    $syncData[$ingModel->id] = [
                        'quantity_needed'   => $qty,
                        'recipe_unit'       => $unit,
                        'conversion_factor' => $conv,
                    ];
                }
            }
            $product->ingredients()->sync($syncData);
        }

        // 4. Mutasi Stok Bahan Baku (Simulasi 30 Hari Lengkap untuk Kebutuhan WMA Forecasting)
        $activeUsers = collect([$admin, $superadmin])->merge($cashiers);
        $recipeSkus  = array_keys($recipes);

        // Simulasi 30 hari transaksi (Day 29 mundur ke Day 0)
        for ($day = 29; $day >= 0; $day--) {
            $date = Carbon::today()->subDays($day);
            $dayOfWeek = $date->dayOfWeek; // 0 = Minggu, 5 = Jumat, 6 = Sabtu
            $isWeekend = in_array($dayOfWeek, [Carbon::FRIDAY, Carbon::SATURDAY, Carbon::SUNDAY]);

            // A. Restock Bahan Baku Setiap 4 Hari oleh Admin Gudang (Andi Prasetyo)
            if ($day % 4 === 0 && $day > 0) {
                $restockItems = [
                    'Biji Kopi Arabica'     => 10.0,
                    'Biji Kopi Robusta'     => 5.0,
                    'Susu Segar Full Cream' => 30.0,
                    'Gula Aren Cair'        => 8.0,
                    'Gula Pasir'            => 15.0,
                    'Bubuk Matcha'          => 2.0,
                    'Bubuk Coklat'          => 4.0,
                    'Bubuk Taro'            => 3.0,
                    'Sirup Vanilla'         => 4.0,
                    'Sirup Hazelnut'        => 3.0,
                    'Indomie Goreng'        => 80.0,
                    'Indomie Kuah'          => 50.0,
                    'Telur Ayam'            => 120.0,
                    'Beras'                 => 25.0,
                    'Minyak Goreng'         => 15.0,
                    'Es Batu'               => 50.0,
                    'Teh Celup'             => 100.0,
                    'Kentang Beku'          => 12.0,
                    'Keju Slice'            => 40.0,
                    'Sosis Ayam'            => 50.0,
                    'Bakso Sapi'            => 50.0,
                    'Roti Tawar'            => 10.0,
                    'Coklat Batang'         => 2.0,
                    'Mie Telor Basah'       => 10.0,
                    'Jeruk Segar'           => 12.0,
                    'Lemon'                 => 6.0,
                    'Bawang Merah'          => 4.0,
                    'Bawang Putih'          => 3.0,
                ];

                foreach ($restockItems as $ingName => $restockQty) {
                    if (isset($ingredientMap[$ingName])) {
                        $ing = $ingredientMap[$ingName];
                        $stockBefore = (float) $ing->stock_quantity;
                        $stockAfter  = round($stockBefore + $restockQty, 3);
                        $ing->update(['stock_quantity' => $stockAfter]);

                        $restockTime = $date->copy()->setTime(8, rand(10, 45), 0);
                        StockMutation::create([
                            'product_id'     => null,
                            'ingredient_id'  => $ing->id,
                            'user_id'        => $admin->id,
                            'type'           => StockMutation::TYPE_IN,
                            'quantity'       => $restockQty,
                            'stock_before'   => $stockBefore,
                            'stock_after'    => $stockAfter,
                            'reference_type' => 'supplier',
                            'reference_note' => "Restock rutin supplier bahan baku - {$date->format('d/m/Y')}",
                            'created_at'     => $restockTime,
                            'updated_at'     => $restockTime,
                        ]);
                    }
                }
            }

            // B. Konsumsi Harian Bahan Baku via Penjualan (Weekend lebih ramai: Weekend Multiplier ~ 1.4x)
            $eventsCount = $isWeekend ? rand(24, 38) : rand(14, 22);

            for ($e = 0; $e < $eventsCount; $e++) {
                $chosenSku = $recipeSkus[array_rand($recipeSkus)];
                $product   = Product::with('ingredients')->where('sku', $chosenSku)->first();

                if (! $product || $product->ingredients->isEmpty()) {
                    continue;
                }

                $qtySold      = rand(1, 3);
                $mutationTime = $date->copy()->setTime(rand(9, 21), rand(0, 59), rand(0, 59));
                $recordedBy   = $activeUsers->random();

                foreach ($product->ingredients as $ingPivot) {
                    $qtyNeeded   = (float) $ingPivot->pivot->quantity_needed;
                    $convFactor  = (float) $ingPivot->pivot->conversion_factor;
                    $totalNeeded = round($qtyNeeded * $convFactor * $qtySold, 3);

                    if ($totalNeeded <= 0) {
                        continue;
                    }

                    $stockBefore = (float) $ingPivot->stock_quantity;
                    $stockAfter  = round(max(0, $stockBefore - $totalNeeded), 3);
                    $ingPivot->update(['stock_quantity' => $stockAfter]);

                    StockMutation::create([
                        'product_id'     => null,
                        'ingredient_id'  => $ingPivot->id,
                        'user_id'        => $recordedBy->id,
                        'type'           => StockMutation::TYPE_OUT,
                        'quantity'       => -$totalNeeded,
                        'stock_before'   => $stockBefore,
                        'stock_after'    => $stockAfter,
                        'reference_type' => 'order',
                        'reference_note' => "Penjualan menu {$product->name} x{$qtySold}",
                        'created_at'     => $mutationTime,
                        'updated_at'     => $mutationTime,
                    ]);
                }
            }

            // C. Stock Opname Mingguan pada Hari ke-21, 14, dan 7 oleh Superadmin (Pak Budi Santoso)
            if (in_array($day, [21, 14, 7])) {
                $opnameIngredients = [
                    'Biji Kopi Arabica',
                    'Susu Segar Full Cream',
                    'Gula Aren Cair',
                    'Indomie Goreng',
                    'Telur Ayam',
                    'Beras',
                    'Es Batu',
                    'Kentang Beku',
                ];

                $opnameTime = $date->copy()->setTime(21, 30, 0);

                foreach ($opnameIngredients as $name) {
                    if (isset($ingredientMap[$name])) {
                        $ing = $ingredientMap[$name];
                        $stockBefore = (float) $ing->stock_quantity;
                        $diff = match ($ing->base_unit) {
                            'kg', 'liter'  => (float) (rand(-2, 1) * 0.1),
                            'pcs', 'butir' => (float) rand(-2, 1),
                            default        => 0.0,
                        };
                        $actualStock = round(max(0, $stockBefore + $diff), 3);
                        $ing->update(['stock_quantity' => $actualStock]);

                        StockMutation::create([
                            'product_id'     => null,
                            'ingredient_id'  => $ing->id,
                            'user_id'        => $superadmin->id,
                            'type'           => StockMutation::TYPE_OPNAME,
                            'quantity'       => $diff,
                            'stock_before'   => $stockBefore,
                            'stock_after'    => $actualStock,
                            'reference_type' => 'opname',
                            'reference_note' => "Stock opname berkala Superadmin (Pak Budi) - Hari {$day}",
                            'created_at'     => $opnameTime,
                            'updated_at'     => $opnameTime,
                        ]);
                    }
                }
            }
        }

        // D. Kalibrasi Stok Akhir (Hari Ini) agar Uji Coba Forecasting Menampilkan Seluruh Status
        // Status CRITICAL: Sisa hari habis <= 1.5 hari (Susu Segar & Telur Ayam)
        $susu = Ingredient::where('name', 'Susu Segar Full Cream')->first();
        if ($susu) {
            $susu->update(['stock_quantity' => 2.8]); // Kritis (habis dlm ~1.1 hari)
        }

        $telur = Ingredient::where('name', 'Telur Ayam')->first();
        if ($telur) {
            $telur->update(['stock_quantity' => 18.0]); // Kritis (habis dlm ~1.2 hari)
        }

        // Status WARNING: Sisa hari habis 1.6 - 3.0 hari (Bubuk Matcha, Kentang Beku, Biji Robusta)
        $matcha = Ingredient::where('name', 'Bubuk Matcha')->first();
        if ($matcha) {
            $matcha->update(['stock_quantity' => 0.28]); // Warning (~2.2 hari)
        }

        $kentang = Ingredient::where('name', 'Kentang Beku')->first();
        if ($kentang) {
            $kentang->update(['stock_quantity' => 3.2]); // Warning (~2.1 hari)
        }

        $robusta = Ingredient::where('name', 'Biji Kopi Robusta')->first();
        if ($robusta) {
            $robusta->update(['stock_quantity' => 1.2]); // Warning (~2.4 hari)
        }

        // 5. Catatan Waste / Spoilage Natural (5 Peristiwa dalam 14 Hari)
        $wasteEvents = [
            [
                'day'         => 12,
                'ingredient'  => 'Telur Ayam',
                'quantity'    => 3.0,
                'reason'      => 'damaged',
                'notes'       => '3 butir telur ayam pecah saat pembongkaran pengiriman dari supplier',
                'hour'        => 9,
            ],
            [
                'day'         => 9,
                'ingredient'  => 'Susu Segar Full Cream',
                'quantity'    => 0.5,
                'reason'      => 'spoilage',
                'notes'       => '0.5L susu segar basi akibat suhu chiller penyimpanan drop semalaman',
                'hour'        => 10,
            ],
            [
                'day'         => 6,
                'ingredient'  => 'Indomie Goreng',
                'quantity'    => 2.0,
                'reason'      => 'damaged',
                'notes'       => '2 pcs indomie kemasan rusak digigit tikus di rak gudang belakang',
                'hour'        => 14,
            ],
            [
                'day'         => 3,
                'ingredient'  => 'Kentang Beku',
                'quantity'    => 0.3,
                'reason'      => 'spoilage',
                'notes'       => '0.3kg kentang beku mencair dan lembek karena pemadaman listrik 2 jam',
                'hour'        => 16,
            ],
            [
                'day'         => 1,
                'ingredient'  => 'Roti Tawar',
                'quantity'    => 0.15,
                'reason'      => 'expired',
                'notes'       => '2 slice roti tawar berjamur melewati batas tanggal kadaluarsa',
                'hour'        => 11,
            ],
        ];

        foreach ($wasteEvents as $event) {
            if (isset($ingredientMap[$event['ingredient']])) {
                $ing = $ingredientMap[$event['ingredient']];
                $wasteDate = Carbon::today()->subDays($event['day'])->setTime($event['hour'], rand(15, 45), 0);

                $wasteRecord = WasteRecord::create([
                    'ingredient_id' => $ing->id,
                    'quantity'      => $event['quantity'],
                    'reason'        => $event['reason'],
                    'notes'         => $event['notes'],
                    'user_id'       => $admin->id,
                    'created_at'    => $wasteDate,
                    'updated_at'    => $wasteDate,
                ]);

                $stockBefore = (float) $ing->stock_quantity;
                $stockAfter  = round(max(0, $stockBefore - $event['quantity']), 3);
                $ing->update(['stock_quantity' => $stockAfter]);

                StockMutation::create([
                    'product_id'     => null,
                    'ingredient_id'  => $ing->id,
                    'user_id'        => $admin->id,
                    'type'           => StockMutation::TYPE_OUT,
                    'quantity'       => -$event['quantity'],
                    'stock_before'   => $stockBefore,
                    'stock_after'    => $stockAfter,
                    'reference_type' => 'waste',
                    'reference_id'   => $wasteRecord->id,
                    'reference_note' => "Waste: {$event['reason']} - {$event['notes']}",
                    'created_at'     => $wasteDate,
                    'updated_at'     => $wasteDate,
                ]);
            }
        }

        // 6. Simulasi Anomali Stok untuk Pengujian Rekonsiliasi Superadmin
        // Beras: 2.5 kg lebih sedikit dari yang seharusnya (indikasi kehilangan/pemakaian tidak tercatat)
        $beras = Ingredient::where('name', 'Beras')->first();
        if ($beras) {
            $beras->update([
                'stock_quantity' => max(0, round((float) $beras->stock_quantity - 2.5, 3)),
            ]);
        }

        // Biji Kopi Arabica: 0.3 kg lebih sedikit dari yang seharusnya
        $kopiArabica = Ingredient::where('name', 'Biji Kopi Arabica')->first();
        if ($kopiArabica) {
            $kopiArabica->update([
                'stock_quantity' => max(0, round((float) $kopiArabica->stock_quantity - 0.3, 3)),
            ]);
        }

        // 7. Kalibrasi Stok Terkini untuk Pengujian Forecasting Lengkap (Critical, Warning, Safe)
        // CRITICAL (Days left <= 1.5):
        // Susu Segar: burn rate ~1.3 L/hari -> sisa 1.5 L (~1.1 hari habis)
        Ingredient::where('name', 'Susu Segar Full Cream')->update(['stock_quantity' => 1.5]);

        // Telur Ayam: burn rate ~13.4 butir/hari -> sisa 15.0 butir (~1.1 hari habis)
        Ingredient::where('name', 'Telur Ayam')->update(['stock_quantity' => 15.0]);

        // WARNING (Days left 1.6 - 3.0):
        // Kentang Beku: burn rate ~0.66 kg/hari -> sisa 1.5 kg (~2.2 hari habis)
        Ingredient::where('name', 'Kentang Beku')->update(['stock_quantity' => 1.5]);

        // Indomie Kuah: burn rate ~3.28 pcs/hari -> sisa 7.0 pcs (~2.1 hari habis)
        Ingredient::where('name', 'Indomie Kuah')->update(['stock_quantity' => 7.0]);
    }
}
