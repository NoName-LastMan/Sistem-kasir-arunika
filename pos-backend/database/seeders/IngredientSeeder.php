<?php

namespace Database\Seeders;

use App\Models\Ingredient;
use App\Models\Product;
use App\Models\StockMutation;
use App\Models\User;
use App\Models\WasteRecord;
use Illuminate\Database\Seeder;

class IngredientSeeder extends Seeder
{
    public function run(): void
    {
        // ========================================
        // USERS: Superadmin (Owner) & Admin biasa
        // ========================================
        $superadmin = User::updateOrCreate(
            ['email' => 'owner@pos.com'],
            ['name' => 'Pak Budi (Owner)', 'password' => bcrypt('password'), 'role' => 'superadmin', 'is_active' => true]
        );

        $admin = User::updateOrCreate(
            ['email' => 'admin@pos.com'],
            ['name' => 'Andi (Admin)', 'password' => bcrypt('password'), 'role' => 'admin', 'is_active' => true]
        );

        $cashier = User::where('role', 'cashier')->first();

        // ========================================
        // BAHAN BAKU (INGREDIENTS)
        // ========================================
        $ingredients = [
            ['name' => 'Beras', 'base_unit' => 'kg', 'stock_quantity' => 25, 'min_stock_alert' => 5, 'cost_per_unit' => 14000],
            ['name' => 'Minyak Goreng', 'base_unit' => 'liter', 'stock_quantity' => 10, 'min_stock_alert' => 2, 'cost_per_unit' => 18000],
            ['name' => 'Telur Ayam', 'base_unit' => 'butir', 'stock_quantity' => 200, 'min_stock_alert' => 30, 'cost_per_unit' => 2500],
            ['name' => 'Gula Pasir', 'base_unit' => 'kg', 'stock_quantity' => 15, 'min_stock_alert' => 3, 'cost_per_unit' => 16000],
            ['name' => 'Tepung Terigu', 'base_unit' => 'kg', 'stock_quantity' => 20, 'min_stock_alert' => 5, 'cost_per_unit' => 12000],
            ['name' => 'Kopi Bubuk', 'base_unit' => 'kg', 'stock_quantity' => 5, 'min_stock_alert' => 1, 'cost_per_unit' => 85000],
            ['name' => 'Susu Segar', 'base_unit' => 'liter', 'stock_quantity' => 8, 'min_stock_alert' => 2, 'cost_per_unit' => 22000],
            ['name' => 'Gula Aren', 'base_unit' => 'kg', 'stock_quantity' => 4, 'min_stock_alert' => 1, 'cost_per_unit' => 28000],
            ['name' => 'Teh Celup', 'base_unit' => 'pcs', 'stock_quantity' => 150, 'min_stock_alert' => 30, 'cost_per_unit' => 500],
            ['name' => 'Jeruk Segar', 'base_unit' => 'kg', 'stock_quantity' => 12, 'min_stock_alert' => 3, 'cost_per_unit' => 18000],
            ['name' => 'Es Batu', 'base_unit' => 'kg', 'stock_quantity' => 30, 'min_stock_alert' => 10, 'cost_per_unit' => 3000],
            ['name' => 'Indomie Goreng', 'base_unit' => 'pcs', 'stock_quantity' => 80, 'min_stock_alert' => 20, 'cost_per_unit' => 3500],
            ['name' => 'Indomie Rebus', 'base_unit' => 'pcs', 'stock_quantity' => 60, 'min_stock_alert' => 20, 'cost_per_unit' => 3500],
            ['name' => 'Mie Basah', 'base_unit' => 'kg', 'stock_quantity' => 10, 'min_stock_alert' => 3, 'cost_per_unit' => 15000],
            ['name' => 'Kornet Sapi', 'base_unit' => 'kaleng', 'stock_quantity' => 12, 'min_stock_alert' => 3, 'cost_per_unit' => 25000],
            ['name' => 'Sosis Ayam', 'base_unit' => 'pcs', 'stock_quantity' => 50, 'min_stock_alert' => 10, 'cost_per_unit' => 3000],
            ['name' => 'Keju Slice', 'base_unit' => 'pcs', 'stock_quantity' => 40, 'min_stock_alert' => 10, 'cost_per_unit' => 2500],
            ['name' => 'Kentang Beku', 'base_unit' => 'kg', 'stock_quantity' => 8, 'min_stock_alert' => 2, 'cost_per_unit' => 22000],
            ['name' => 'Roti Tawar', 'base_unit' => 'pcs', 'stock_quantity' => 20, 'min_stock_alert' => 5, 'cost_per_unit' => 12000],
            ['name' => 'Bawang Merah', 'base_unit' => 'kg', 'stock_quantity' => 3, 'min_stock_alert' => 1, 'cost_per_unit' => 35000],
        ];

        $ingredientModels = collect();
        foreach ($ingredients as $ing) {
            $ingredientModels->push(Ingredient::updateOrCreate(
                ['name' => $ing['name']],
                $ing
            ));
        }

        // ========================================
        // RESEP PRODUK (BOM)
        // ========================================
        $recipes = [
            // Nasi Goreng Kampung
            'NAS-GORENG-01' => [
                ['Beras', 200, 'gr', 0.001],
                ['Telur Ayam', 2, 'butir', 1],
                ['Minyak Goreng', 30, 'ml', 0.001],
                ['Bawang Merah', 15, 'gr', 0.001],
            ],
            // Indomie Goreng Spesial
            'IND-GRG-01' => [
                ['Indomie Goreng', 1, 'pcs', 1],
                ['Telur Ayam', 1, 'butir', 1],
                ['Minyak Goreng', 20, 'ml', 0.001],
            ],
            // Indomie Rebus Spesial
            'IND-REBUS-01' => [
                ['Indomie Rebus', 1, 'pcs', 1],
                ['Telur Ayam', 1, 'butir', 1],
            ],
            // Mie Ayam Jamur
            'MIE-AYAM-01' => [
                ['Mie Basah', 150, 'gr', 0.001],
                ['Telur Ayam', 1, 'butir', 1],
                ['Minyak Goreng', 15, 'ml', 0.001],
            ],
            // Kopi Susu Gula Aren
            'KPS-AREN-01' => [
                ['Kopi Bubuk', 15, 'gr', 0.001],
                ['Susu Segar', 150, 'ml', 0.001],
                ['Gula Aren', 20, 'gr', 0.001],
                ['Es Batu', 100, 'gr', 0.001],
            ],
            // Americano
            'AMERICANO-01' => [
                ['Kopi Bubuk', 18, 'gr', 0.001],
                ['Es Batu', 80, 'gr', 0.001],
            ],
            // Es Teh Manis Jumbo
            'ES-TEH-01' => [
                ['Teh Celup', 1, 'pcs', 1],
                ['Gula Pasir', 15, 'gr', 0.001],
                ['Es Batu', 150, 'gr', 0.001],
            ],
            // Es Jeruk Segar
            'ES-JERUK-01' => [
                ['Jeruk Segar', 100, 'gr', 0.001],
                ['Gula Pasir', 10, 'gr', 0.001],
                ['Es Batu', 120, 'gr', 0.001],
            ],
            // Kentang Goreng
            'KENTANG-01' => [
                ['Kentang Beku', 150, 'gr', 0.001],
                ['Minyak Goreng', 50, 'ml', 0.001],
            ],
        ];

        foreach ($recipes as $sku => $items) {
            $product = Product::where('sku', $sku)->first();
            if (!$product) continue;

            $syncData = [];
            foreach ($items as [$ingName, $qty, $unit, $conv]) {
                $ingredient = collect($ingredientModels)->first(fn($i) => $i->name === $ingName);
                if ($ingredient) {
                    $syncData[$ingredient->id] = [
                        'quantity_needed' => $qty,
                        'recipe_unit' => $unit,
                        'conversion_factor' => $conv,
                    ];
                }
            }
            $product->ingredients()->sync($syncData);
        }

        // ========================================
        // STOCK MUTATIONS (Simulasi 14 hari aktivitas)
        // ========================================
        $users = collect([$admin, $superadmin, $cashier])->filter();

        for ($day = 13; $day >= 0; $day--) {
            $date = now()->subDays($day);

            // Restock bahan baku (setiap 3 hari oleh admin)
            if ($day % 3 === 0) {
                foreach ($ingredientModels as $ing) {
                    $restockQty = match($ing->base_unit) {
                        'kg' => rand(3, 10),
                        'liter' => rand(2, 5),
                        'butir', 'pcs' => rand(20, 50),
                        'kaleng' => rand(2, 5),
                        default => rand(1, 5),
                    };

                    $stockBefore = (float) $ing->stock_quantity;
                    $stockAfter = $stockBefore + $restockQty;
                    $ing->update(['stock_quantity' => $stockAfter]);

                    StockMutation::create([
                        'ingredient_id' => $ing->id,
                        'user_id' => $admin->id,
                        'type' => 'in',
                        'quantity' => $restockQty,
                        'stock_before' => $stockBefore,
                        'stock_after' => $stockAfter,
                        'reference_type' => 'supplier',
                        'reference_note' => "Restock dari supplier - {$date->format('d/m/Y')}",
                        'created_at' => $date->setHours(8)->setMinutes(rand(0, 30)),
                        'updated_at' => $date->setHours(8)->setMinutes(rand(0, 30)),
                    ]);
                }
            }

            // Simulasi penjualan - deduct bahan (setiap hari, beberapa kali)
            $dailySales = rand(3, 8);
            for ($s = 0; $s < $dailySales; $s++) {
                $saleTime = $date->copy()->setHours(rand(9, 21))->setMinutes(rand(0, 59));
                $randomUser = $users->random();

                // Pick random product with recipe and deduct
                $productSkus = array_keys($recipes);
                $randomSku = $productSkus[array_rand($productSkus)];
                $product = Product::where('sku', $randomSku)->first();

                if ($product) {
                    $qty = rand(1, 3);
                    foreach ($product->ingredients as $ingredient) {
                        $totalNeeded = (float) $ingredient->pivot->quantity_needed
                            * (float) $ingredient->pivot->conversion_factor
                            * $qty;

                        $stockBefore = (float) $ingredient->stock_quantity;
                        $stockAfter = round(max(0, $stockBefore - $totalNeeded), 3);
                        $ingredient->update(['stock_quantity' => $stockAfter]);

                        StockMutation::create([
                            'ingredient_id' => $ingredient->id,
                            'user_id' => $randomUser->id,
                            'type' => 'out',
                            'quantity' => -$totalNeeded,
                            'stock_before' => $stockBefore,
                            'stock_after' => $stockAfter,
                            'reference_type' => 'order',
                            'reference_note' => "Penjualan {$product->name} x{$qty}",
                            'created_at' => $saleTime,
                            'updated_at' => $saleTime,
                        ]);
                    }
                }
            }

            // Waste/spoilage (random, 30% chance per hari)
            if (rand(1, 10) <= 3) {
                $wasteIngredient = $ingredientModels->random();
                $wasteQty = match($wasteIngredient->base_unit) {
                    'kg' => round(rand(1, 5) * 0.1, 2),
                    'liter' => round(rand(1, 3) * 0.1, 2),
                    'butir', 'pcs' => rand(1, 5),
                    'kaleng' => 1,
                    default => rand(1, 3),
                };

                $reasons = ['expired', 'damaged', 'spoilage', 'cooking_error', 'other'];
                $reason = $reasons[array_rand($reasons)];
                $notes = match($reason) {
                    'expired' => 'Melewati tanggal kadaluarsa',
                    'damaged' => 'Kemasan rusak saat pengiriman',
                    'spoilage' => 'Tercium bau tidak sedap, sudah busuk',
                    'cooking_error' => 'Gosong saat proses memasak',
                    'other' => 'Tumpah saat pemindahan',
                };

                $wasteTime = $date->copy()->setHours(rand(10, 18))->setMinutes(rand(0, 59));

                $waste = WasteRecord::create([
                    'ingredient_id' => $wasteIngredient->id,
                    'quantity' => $wasteQty,
                    'reason' => $reason,
                    'notes' => $notes,
                    'user_id' => $admin->id,
                    'created_at' => $wasteTime,
                    'updated_at' => $wasteTime,
                ]);

                $stockBefore = (float) $wasteIngredient->stock_quantity;
                $stockAfter = round(max(0, $stockBefore - $wasteQty), 3);
                $wasteIngredient->update(['stock_quantity' => $stockAfter]);

                StockMutation::create([
                    'ingredient_id' => $wasteIngredient->id,
                    'user_id' => $admin->id,
                    'type' => 'out',
                    'quantity' => -$wasteQty,
                    'stock_before' => $stockBefore,
                    'stock_after' => $stockAfter,
                    'reference_type' => 'waste',
                    'reference_id' => $waste->id,
                    'reference_note' => "Waste: {$reason} - {$notes}",
                    'created_at' => $wasteTime,
                    'updated_at' => $wasteTime,
                ]);
            }
        }

        // ========================================
        // SIMULASI ANOMALI STOK (untuk testing)
        // ========================================
        // Buat beberapa bahan dengan stok yang "aneh" (lebih rendah dari seharusnya)
        $beras = Ingredient::where('name', 'Beras')->first();
        if ($beras) {
            $beras->update(['stock_quantity' => max(0, (float) $beras->stock_quantity - 3)]);
        }

        $minyak = Ingredient::where('name', 'Minyak Goreng')->first();
        if ($minyak) {
            $minyak->update(['stock_quantity' => max(0, (float) $minyak->stock_quantity - 1.5)]);
        }
    }
}
