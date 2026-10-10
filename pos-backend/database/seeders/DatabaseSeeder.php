<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\ModifierGroup;
use App\Models\ModifierItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderItemModifier;
use App\Models\Product;
use App\Models\Setting;
use App\Models\Shift;
use App\Models\StockMutation;
use App\Models\Table;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Master Data
        $this->seedUsers();
        $this->seedSettings();
        $categories = $this->seedCategories();
        $modifierGroups = $this->seedModifiers();
        $products = $this->seedProducts($categories, $modifierGroups);
        $this->seedTables();

        // 2. Data Transaksi 30 Hari
        $cashiers = User::where('role', 'cashier')->get();
        $this->seedOrdersAndShifts($products, $cashiers, $modifierGroups);

        // 3. Bahan Baku, Resep, Waste & Stock Mutations
        $this->call(IngredientSeeder::class);
    }

    private function seedUsers(): void
    {
        User::updateOrCreate(
            ['email' => 'owner@pos.com'],
            ['name' => 'Pak Budi (Owner/Superadmin)', 'password' => Hash::make('password'), 'role' => 'superadmin', 'is_active' => true]
        );
        User::updateOrCreate(
            ['email' => 'admin@pos.com'],
            ['name' => 'Andi (Admin Gudang)', 'password' => Hash::make('password'), 'role' => 'admin', 'is_active' => true]
        );
        User::updateOrCreate(
            ['email' => 'kasir@pos.com'],
            ['name' => 'Rina (Kasir Utama)', 'password' => Hash::make('password'), 'role' => 'cashier', 'is_active' => true]
        );
        User::updateOrCreate(
            ['email' => 'kasir2@pos.com'],
            ['name' => 'Dedi (Kasir Siang)', 'password' => Hash::make('password'), 'role' => 'cashier', 'is_active' => true]
        );
        User::updateOrCreate(
            ['email' => 'kitchen@pos.com'],
            ['name' => 'Chef Budi (Koki Dapur)', 'password' => Hash::make('password'), 'role' => 'kitchen', 'is_active' => true]
        );
    }

    private function seedSettings(): void
    {
        Setting::firstOrCreate([], [
            'store_name'          => 'Warmindo & Cafe "Mie Nusantara"',
            'store_address'       => 'Jl. Pahlawan No. 45, Bandung',
            'store_phone'         => '0812-3456-7890',
            'receipt_header'      => 'WARMINDO MIE NUSANTARA',
            'receipt_footer'      => 'Terima kasih sudah makan di tempat kami!',
            'default_tax_rate'    => 10.00,
            'service_charge_rate' => 0.00,
            'invoice_prefix'      => 'INV-',
        ]);
    }

    private function seedCategories(): array
    {
        return [
            'warmindo' => Category::updateOrCreate(['slug' => 'warmindo-indomie'], ['name' => 'Warmindo & Mie', 'is_active' => true]),
            'coffee'   => Category::updateOrCreate(['slug' => 'coffee-specialty'], ['name' => 'Kopi & Latte', 'is_active' => true]),
            'cold'     => Category::updateOrCreate(['slug' => 'non-coffee'], ['name' => 'Minuman Dingin', 'is_active' => true]),
            'snack'    => Category::updateOrCreate(['slug' => 'snack'], ['name' => 'Snack & Gorengan', 'is_active' => true]),
        ];
    }

    private function seedModifiers(): array
    {
        $toppingGroup = ModifierGroup::firstOrCreate(
            ['name' => 'Pilihan Topping'],
            ['is_required' => false, 'min_selection' => 0, 'max_selection' => 5]
        );
        $toppings = [
            ['name' => 'Telur Ceplok', 'price' => 4000],
            ['name' => 'Telur Dadar', 'price' => 4000],
            ['name' => 'Kornet Sapi', 'price' => 5000],
            ['name' => 'Keju Parut', 'price' => 3000],
            ['name' => 'Sosis Ayam', 'price' => 5000],
        ];
        foreach ($toppings as $t) {
            ModifierItem::firstOrCreate(['modifier_group_id' => $toppingGroup->id, 'name' => $t['name']], ['price' => $t['price']]);
        }

        $sugarGroup = ModifierGroup::firstOrCreate(
            ['name' => 'Level Gula'],
            ['is_required' => true, 'min_selection' => 1, 'max_selection' => 1]
        );
        foreach (['Normal Sugar', 'Less Sugar', 'No Sugar'] as $s) {
            ModifierItem::firstOrCreate(['modifier_group_id' => $sugarGroup->id, 'name' => $s], ['price' => 0]);
        }

        $sizeGroup = ModifierGroup::firstOrCreate(
            ['name' => 'Ukuran'],
            ['is_required' => true, 'min_selection' => 1, 'max_selection' => 1]
        );
        ModifierItem::firstOrCreate(['modifier_group_id' => $sizeGroup->id, 'name' => 'Regular'], ['price' => 0]);
        ModifierItem::firstOrCreate(['modifier_group_id' => $sizeGroup->id, 'name' => 'Large (+Rp3.000)'], ['price' => 3000]);
        ModifierItem::firstOrCreate(['modifier_group_id' => $sizeGroup->id, 'name' => 'Jumbo (+Rp5.000)'], ['price' => 5000]);

        return [
            'topping' => $toppingGroup,
            'sugar'   => $sugarGroup,
            'size'    => $sizeGroup,
        ];
    }

    private function seedProducts(array $cats, array $mods): array
    {
        $products = [];

        // Warmindo
        $warmindoItems = [
            ['sku' => 'IND-GRG-01', 'name' => 'Indomie Goreng Spesial', 'price' => 10000, 'cost' => 5500, 'stock' => 150, 'mod' => 'topping'],
            ['sku' => 'IND-REBUS-01', 'name' => 'Indomie Rebus Spesial', 'price' => 10000, 'cost' => 5500, 'stock' => 150, 'mod' => 'topping'],
            ['sku' => 'MIE-AYAM-01', 'name' => 'Mie Ayam Jamur', 'price' => 15000, 'cost' => 7000, 'stock' => 100, 'mod' => 'topping'],
            ['sku' => 'MIE-GODOK-01', 'name' => 'Mie Godog Jawa', 'price' => 12000, 'cost' => 6000, 'stock' => 100, 'mod' => 'topping'],
            ['sku' => 'NAS-GORENG-01', 'name' => 'Nasi Goreng Kampung', 'price' => 13000, 'cost' => 6500, 'stock' => 100, 'mod' => 'topping'],
        ];
        foreach ($warmindoItems as $item) {
            $products[$item['sku']] = Product::firstOrCreate(
                ['sku' => $item['sku']],
                [
                    'category_id' => $cats['warmindo']->id,
                    'name'        => $item['name'],
                    'price'       => $item['price'],
                    'cost_price'  => $item['cost'],
                    'stock'       => $item['stock'],
                    'track_stock' => true,
                    'is_active'   => true,
                ]
            );
            $products[$item['sku']]->modifierGroups()->syncWithoutDetaching([$mods['topping']->id]);
        }

        // Coffee
        $coffeeItems = [
            ['sku' => 'KPS-AREN-01', 'name' => 'Kopi Susu Gula Aren', 'price' => 18000, 'cost' => 7000, 'stock' => 80, 'mod' => 'sugar'],
            ['sku' => 'KPS-VAN-01', 'name' => 'Kopi Susu Vanilla', 'price' => 19000, 'cost' => 7500, 'stock' => 80, 'mod' => 'sugar'],
            ['sku' => 'AMERICANO-01', 'name' => 'Americano', 'price' => 15000, 'cost' => 4000, 'stock' => 100, 'mod' => 'size'],
            ['sku' => 'CAPPUCINO-01', 'name' => 'Cappuccino', 'price' => 17000, 'cost' => 5500, 'stock' => 80, 'mod' => 'size'],
            ['sku' => 'MATCHA-01', 'name' => 'Matcha Latte', 'price' => 20000, 'cost' => 8000, 'stock' => 60, 'mod' => 'size'],
        ];
        foreach ($coffeeItems as $item) {
            $products[$item['sku']] = Product::firstOrCreate(
                ['sku' => $item['sku']],
                [
                    'category_id' => $cats['coffee']->id,
                    'name'        => $item['name'],
                    'price'       => $item['price'],
                    'cost_price'  => $item['cost'],
                    'stock'       => $item['stock'],
                    'track_stock' => true,
                    'is_active'   => true,
                ]
            );
            $products[$item['sku']]->modifierGroups()->syncWithoutDetaching([$mods[$item['mod']]->id]);
        }

        // Cold Drinks
        $coldItems = [
            ['sku' => 'ES-TEH-01', 'name' => 'Es Teh Manis Jumbo', 'price' => 5000, 'cost' => 1200, 'stock' => 200],
            ['sku' => 'ES-JERUK-01', 'name' => 'Es Jeruk Segar', 'price' => 8000, 'cost' => 3000, 'stock' => 100],
            ['sku' => 'ES-LEMON-01', 'name' => 'Es Lemon Tea', 'price' => 7000, 'cost' => 2500, 'stock' => 100],
            ['sku' => 'ES-KELAPA-01', 'name' => 'Es Kelapa Muda', 'price' => 10000, 'cost' => 4000, 'stock' => 50],
        ];
        foreach ($coldItems as $item) {
            $products[$item['sku']] = Product::firstOrCreate(
                ['sku' => $item['sku']],
                [
                    'category_id' => $cats['cold']->id,
                    'name'        => $item['name'],
                    'price'       => $item['price'],
                    'cost_price'  => $item['cost'],
                    'stock'       => $item['stock'],
                    'track_stock' => true,
                    'is_active'   => true,
                ]
            );
        }

        // Snacks
        $snackItems = [
            ['sku' => 'GORENGAN-01', 'name' => 'Gorengan Campur (4pc)', 'price' => 5000, 'cost' => 2500, 'stock' => 100],
            ['sku' => 'KENTANG-01', 'name' => 'Kentang Goreng', 'price' => 12000, 'cost' => 5000, 'stock' => 50],
            ['sku' => 'RISOL-01', 'name' => 'Risol Mayo (3pc)', 'price' => 10000, 'cost' => 4500, 'stock' => 40],
        ];
        foreach ($snackItems as $item) {
            $products[$item['sku']] = Product::firstOrCreate(
                ['sku' => $item['sku']],
                [
                    'category_id' => $cats['snack']->id,
                    'name'        => $item['name'],
                    'price'       => $item['price'],
                    'cost_price'  => $item['cost'],
                    'stock'       => $item['stock'],
                    'track_stock' => true,
                    'is_active'   => true,
                ]
            );
        }

        return $products;
    }

    private function seedTables(): void
    {
        for ($i = 1; $i <= 10; $i++) {
            Table::firstOrCreate(
                ['table_number' => sprintf('M%02d', $i)],
                ['capacity' => ($i <= 4) ? 2 : (($i <= 8) ? 4 : 6), 'status' => 'available']
            );
        }
    }

    private function seedOrdersAndShifts(array $products, $cashiers, array $mods): void
    {
        $productList = array_values($products);
        $paymentMethods = ['cash', 'cash', 'cash', 'qris', 'transfer', 'card'];
        $orderTypes = ['dine_in', 'dine_in', 'dine_in', 'takeaway', 'takeaway'];
        $tables = Table::pluck('id')->toArray();
        $toppingItems = ModifierItem::where('modifier_group_id', $mods['topping']->id)->get();
        $sugarItems = ModifierItem::where('modifier_group_id', $mods['sugar']->id)->get();
        $sizeItems = ModifierItem::where('modifier_group_id', $mods['size']->id)->get();

        // Seed 30 hari terakhir
        for ($day = 29; $day >= 0; $day--) {
            $date = now()->subDays($day);
            $isWeekend = in_array(now()->subDays($day)->dayOfWeek, [0, 6]);
            $dailyOrderCount = $isWeekend ? random_int(35, 55) : random_int(20, 40);

            // Buka 2 shift per hari
            foreach ($cashiers as $cashier) {
                $shiftOpen = now()->subDays($day)->setHours(8)->setMinutes(random_int(0, 5));
                $shiftClose = now()->subDays($day)->setHours(20)->setMinutes(random_int(0, 5));
                $startingCash = 200000;
                $isOpenToday = ($day === 0 && $cashier->email === 'kasir@pos.com');

                $shift = Shift::create([
                    'user_id'       => $cashier->id,
                    'opened_at'     => $shiftOpen,
                    'starting_cash' => $startingCash,
                    'status'        => $isOpenToday ? 'open' : 'closed',
                    'closed_at'     => $isOpenToday ? null : $shiftClose,
                ]);

                $ordersPerCashier = intdiv($dailyOrderCount, $cashiers->count());

                for ($o = 0; $o < $ordersPerCashier; $o++) {
                    $orderHour = random_int(8, 19);
                    $orderMinute = random_int(0, 59);
                    $orderTime = now()->subDays($day)->setHours($orderHour)->setMinutes($orderMinute);

                    $numItems = random_int(1, 4);
                    $selectedProducts = [];
                    for ($n = 0; $n < $numItems; $n++) {
                        $selectedProducts[] = $productList[array_rand($productList)];
                    }

                    $subtotal = 0;
                    $orderItemsData = [];

                    foreach ($selectedProducts as $prod) {
                        $qty = random_int(1, 3);
                        $itemPrice = (float) $prod->price;

                        // Random modifier
                        $modifiers = [];
                        $modifierData = [];
                        if ($prod->modifierGroups->contains($mods['topping']->id) && rand(1, 3) > 1) {
                            $randomTopping = $toppingItems->random(rand(1, 2));
                            foreach ($randomTopping as $top) {
                                $modifiers[] = ['modifier_item_id' => $top->id, 'unit_price' => $top->price, 'subtotal' => $top->price * $qty];
                                $modifierData[] = $top;
                                $itemPrice += (float) $top->price;
                            }
                        }
                        if ($prod->modifierGroups->contains($mods['sugar']->id)) {
                            $sugar = $sugarItems->random();
                            $modifiers[] = ['modifier_item_id' => $sugar->id, 'unit_price' => 0, 'subtotal' => 0];
                        }
                        if ($prod->modifierGroups->contains($mods['size']->id) && rand(1, 3) > 1) {
                            $size = $sizeItems->random();
                            $modifiers[] = ['modifier_item_id' => $size->id, 'unit_price' => $size->price, 'subtotal' => $size->price * $qty];
                            $itemPrice += (float) $size->price;
                        }

                        $rowSubtotal = round($itemPrice * $qty, 2);
                        $subtotal += $rowSubtotal;

                        $orderItemsData[] = [
                            'product'    => $prod,
                            'quantity'   => $qty,
                            'unit_price' => (float) $prod->price,
                            'subtotal'   => $rowSubtotal,
                            'modifiers'  => $modifiers,
                        ];
                    }

                    // Discount (30% chance)
                    $discountType = 'none';
                    $discountValue = 0;
                    $discountAmount = 0;
                    if (rand(1, 10) <= 3) {
                        $discountType = (rand(1, 2) === 1) ? 'percentage' : 'fixed';
                        $discountValue = ($discountType === 'percentage') ? random_int(5, 15) : random_int(2000, 5000);
                        $discountAmount = ($discountType === 'percentage')
                            ? round($subtotal * $discountValue / 100, 2)
                            : min($subtotal, $discountValue);
                    }

                    $taxable = max(0, $subtotal - $discountAmount);
                    $taxAmount = round($taxable * 10 / 100, 2);
                    $totalAmount = round($taxable + $taxAmount, 2);

                    $paymentMethod = $paymentMethods[array_rand($paymentMethods)];
                    $cashTendered = null;
                    $changeDue = null;
                    if ($paymentMethod === 'cash') {
                        $cashTendered = $totalAmount + random_int(0, 5) * 1000;
                        $changeDue = round($cashTendered - $totalAmount, 2);
                    }

                    $useTable = (in_array($orderTypes[array_rand($orderTypes)], ['dine_in'])) ? $tables[array_rand($tables)] : null;

                    $order = Order::create([
                        'invoice_number'  => 'INV-' . strtoupper(Str::random(8)),
                        'user_id'         => $cashier->id,
                        'shift_id'        => $shift->id,
                        'table_id'        => $useTable,
                        'order_type'      => $orderTypes[array_rand($orderTypes)],
                        'subtotal'        => $subtotal,
                        'discount_amount' => $discountAmount,
                        'tax_amount'      => $taxAmount,
                        'service_charge'  => 0,
                        'total_amount'    => $totalAmount,
                        'payment_method'  => $paymentMethod,
                        'cash_tendered'   => $cashTendered,
                        'change_due'      => $changeDue,
                        'payment_status'  => 'paid',
                        'status'          => 'completed',
                        'created_at'      => $orderTime,
                        'updated_at'      => $orderTime,
                    ]);

                    foreach ($orderItemsData as $itemData) {
                        $orderItem = $order->items()->create([
                            'product_id' => $itemData['product']->id,
                            'quantity'   => $itemData['quantity'],
                            'unit_price' => $itemData['unit_price'],
                            'subtotal'   => $itemData['subtotal'],
                        ]);

                        if (! empty($itemData['modifiers'])) {
                            $orderItem->modifiers()->createMany($itemData['modifiers']);
                        }

                        // Deduct stock
                        if ($itemData['product']->track_stock) {
                            $stockBefore = (int) $itemData['product']->stock;
                            $stockAfter = max(0, $stockBefore - $itemData['quantity']);
                            $itemData['product']->update(['stock' => $stockAfter]);
                            StockMutation::create([
                                'product_id'     => $itemData['product']->id,
                                'user_id'        => $cashier->id,
                                'type'           => 'out',
                                'quantity'       => -$itemData['quantity'],
                                'stock_before'   => $stockBefore,
                                'stock_after'    => $stockAfter,
                                'reference_note' => "Penjualan via Order #{$order->invoice_number}",
                                'created_at'     => $orderTime,
                                'updated_at'     => $orderTime,
                            ]);
                        }
                    }
                }

                // Close shift metrics (hanya jika shift berstatus closed)
                if (! $isOpenToday) {
                    $shiftOrders = Order::where('shift_id', $shift->id)->where('status', 'completed')->get();
                    $cashSales = $shiftOrders->where('payment_method', 'cash')->sum('total_amount');
                    $totalRevenue = $shiftOrders->sum('total_amount');

                    $shift->update([
                        'expected_cash'   => round($startingCash + $cashSales, 2),
                        'actual_cash'     => round($startingCash + $cashSales + random_int(-5000, 10000), 2),
                        'cash_difference' => round(random_int(-5000, 10000), 2),
                    ]);
                }
            }
        }

        // Pastikan stok produk tetap mencukupi untuk simulasi kasir
        foreach ($productList as $p) {
            if ($p->track_stock && $p->stock < 20) {
                $p->update(['stock' => random_int(40, 120)]);
            }
        }
    }
}
