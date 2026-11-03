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
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Master Data
        $users = $this->seedUsers();
        $this->seedSettings();
        $categories = $this->seedCategories();
        $modifierGroups = $this->seedModifiers();
        $products = $this->seedProducts($categories, $modifierGroups);
        $this->seedTables();

        // 2. Data Transaksi & Shift (30 Hari)
        $this->seedOrdersAndShifts($products, $users, $modifierGroups);

        // 3. Bahan Baku, Resep (BOM), Waste & Mutasi Stok Bahan
        $this->call(IngredientSeeder::class);
    }

    private function seedUsers(): array
    {
        $owner = User::updateOrCreate(
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

        $kasir1 = User::updateOrCreate(
            ['email' => 'kasir@pos.com'],
            [
                'name'      => 'Rina Wulandari',
                'password'  => Hash::make('password'),
                'role'      => 'cashier',
                'is_active' => true,
            ]
        );

        $kasir2 = User::updateOrCreate(
            ['email' => 'kasir2@pos.com'],
            [
                'name'      => 'Dedi Kurniawan',
                'password'  => Hash::make('password'),
                'role'      => 'cashier',
                'is_active' => true,
            ]
        );

        $kitchen = User::updateOrCreate(
            ['email' => 'kitchen@pos.com'],
            [
                'name'      => 'Mas Agus',
                'password'  => Hash::make('password'),
                'role'      => 'kitchen',
                'is_active' => true,
            ]
        );

        return [
            'owner'   => $owner,
            'admin'   => $admin,
            'kasir1'  => $kasir1,
            'kasir2'  => $kasir2,
            'kitchen' => $kitchen,
        ];
    }

    private function seedSettings(): void
    {
        Setting::updateOrCreate(
            ['id' => 1],
            [
                'store_name'          => 'Arunika Coffee and Space',
                'store_address'       => 'Lt. 2 Gedung Unimus Mart, Jl. Kedungmundu No. 18, Semarang',
                'store_phone'         => '0889-8572-2088',
                'receipt_header'      => 'ARUNIKA COFFEE & SPACE',
                'receipt_footer'      => 'Terima kasih! Follow IG @arunika.coffee',
                'default_tax_rate'    => 10.00,
                'service_charge_rate' => 0.00,
                'invoice_prefix'      => 'ARN-',
            ]
        );
    }

    private function seedCategories(): array
    {
        return [
            'warmindo' => Category::updateOrCreate(
                ['slug' => 'warmindo'],
                ['name' => 'Warmindo & Mie', 'is_active' => true]
            ),
            'coffee' => Category::updateOrCreate(
                ['slug' => 'coffee'],
                ['name' => 'Kopi', 'is_active' => true]
            ),
            'non-coffee' => Category::updateOrCreate(
                ['slug' => 'non-coffee'],
                ['name' => 'Non-Coffee', 'is_active' => true]
            ),
            'bottled' => Category::updateOrCreate(
                ['slug' => 'bottled'],
                ['name' => 'Minuman Botol', 'is_active' => true]
            ),
            'snack' => Category::updateOrCreate(
                ['slug' => 'snack'],
                ['name' => 'Snack & Cemilan', 'is_active' => true]
            ),
        ];
    }

    private function seedModifiers(): array
    {
        // 1. Topping Mie
        $toppingGroup = ModifierGroup::firstOrCreate(
            ['name' => 'Pilihan Topping Mie'],
            [
                'is_required'   => false,
                'min_selection' => 0,
                'max_selection' => 5,
            ]
        );

        $toppings = [
            ['name' => 'Telur Ceplok', 'price' => 4000],
            ['name' => 'Telur Dadar', 'price' => 4000],
            ['name' => 'Kornet', 'price' => 5000],
            ['name' => 'Keju Parut', 'price' => 3000],
            ['name' => 'Sosis', 'price' => 5000],
            ['name' => 'Bakso 3pcs', 'price' => 5000],
        ];
        foreach ($toppings as $t) {
            ModifierItem::firstOrCreate(
                ['modifier_group_id' => $toppingGroup->id, 'name' => $t['name']],
                ['price' => $t['price']]
            );
        }

        // 2. Level Gula
        $sugarGroup = ModifierGroup::firstOrCreate(
            ['name' => 'Level Gula'],
            [
                'is_required'   => true,
                'min_selection' => 1,
                'max_selection' => 1,
            ]
        );
        foreach (['Normal', 'Less Sugar', 'No Sugar'] as $s) {
            ModifierItem::firstOrCreate(
                ['modifier_group_id' => $sugarGroup->id, 'name' => $s],
                ['price' => 0]
            );
        }

        // 3. Ukuran Cup
        $sizeGroup = ModifierGroup::firstOrCreate(
            ['name' => 'Ukuran Cup'],
            [
                'is_required'   => true,
                'min_selection' => 1,
                'max_selection' => 1,
            ]
        );
        ModifierItem::firstOrCreate(
            ['modifier_group_id' => $sizeGroup->id, 'name' => 'Regular'],
            ['price' => 0]
        );
        ModifierItem::firstOrCreate(
            ['modifier_group_id' => $sizeGroup->id, 'name' => 'Large +Rp4.000'],
            ['price' => 4000]
        );

        // 4. Level Es
        $iceGroup = ModifierGroup::firstOrCreate(
            ['name' => 'Level Es'],
            [
                'is_required'   => true,
                'min_selection' => 1,
                'max_selection' => 1,
            ]
        );
        foreach (['Normal Ice', 'Less Ice', 'No Ice'] as $ice) {
            ModifierItem::firstOrCreate(
                ['modifier_group_id' => $iceGroup->id, 'name' => $ice],
                ['price' => 0]
            );
        }

        return [
            'topping' => $toppingGroup,
            'sugar'   => $sugarGroup,
            'size'    => $sizeGroup,
            'ice'     => $iceGroup,
        ];
    }

    private function seedProducts(array $cats, array $mods): array
    {
        $products = [];

        $menuList = [
            // Warmindo & Mie
            [
                'category'    => 'warmindo',
                'sku'         => 'WMD-IND-GRG',
                'is_best_seller' => true,
                'name'        => 'Indomie Goreng',
                'price'       => 8000,
                'cost'        => 4000,
                'stock'       => 150,
                'modifiers'   => ['topping'],
                'image'       => 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80',
            ],
            [
                'category'    => 'warmindo',
                'sku'         => 'WMD-IND-RBS',
                'name'        => 'Indomie Rebus',
                'price'       => 8000,
                'cost'        => 4000,
                'stock'       => 120,
                'modifiers'   => ['topping'],
                'image'       => 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
            ],
            [
                'category'    => 'warmindo',
                'sku'         => 'WMD-IND-DBL',
                'name'        => 'Indomie Goreng Double',
                'price'       => 12000,
                'cost'        => 7500,
                'stock'       => 100,
                'modifiers'   => ['topping'],
                'image'       => 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80',
            ],
            [
                'category'    => 'warmindo',
                'sku'         => 'WMD-MIE-JAWA',
                'is_best_seller' => true,
                'name'        => 'Mie Goreng Jawa',
                'price'       => 12000,
                'cost'        => 6000,
                'stock'       => 90,
                'modifiers'   => ['topping'],
                'image'       => 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80',
            ],
            [
                'category'    => 'warmindo',
                'sku'         => 'WMD-NAS-GRG',
                'is_best_seller' => true,
                'name'        => 'Nasi Goreng Spesial',
                'price'       => 15000,
                'cost'        => 7000,
                'stock'       => 90,
                'modifiers'   => ['topping'],
                'image'       => 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=600&q=80',
            ],
            [
                'category'    => 'warmindo',
                'sku'         => 'WMD-NAS-TLR',
                'name'        => 'Nasi Telur',
                'price'       => 8000,
                'cost'        => 4500,
                'stock'       => 80,
                'modifiers'   => [],
                'image'       => 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
            ],

            // Kopi
            [
                'category'    => 'coffee',
                'sku'         => 'KOP-SUSU-ARN',
                'is_best_seller' => true,
                'name'        => 'Kopi Susu Gula Aren',
                'price'       => 15000,
                'cost'        => 5500,
                'stock'       => 140,
                'modifiers'   => ['sugar', 'size', 'ice'],
                'image'       => 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80',
            ],
            [
                'category'    => 'coffee',
                'sku'         => 'KOP-SUSU-VAN',
                'name'        => 'Kopi Susu Vanilla',
                'price'       => 16000,
                'cost'        => 6000,
                'stock'       => 100,
                'modifiers'   => ['sugar', 'size', 'ice'],
                'image'       => 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80',
            ],
            [
                'category'    => 'coffee',
                'sku'         => 'KOP-SUSU-HZL',
                'name'        => 'Kopi Susu Hazelnut',
                'price'       => 17000,
                'cost'        => 6500,
                'stock'       => 100,
                'modifiers'   => ['sugar', 'size', 'ice'],
                'image'       => 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=600&q=80',
            ],
            [
                'category'    => 'coffee',
                'sku'         => 'KOP-AMERICANO',
                'name'        => 'Americano',
                'price'       => 12000,
                'cost'        => 3500,
                'stock'       => 80,
                'modifiers'   => ['size', 'ice'],
                'image'       => 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
            ],
            [
                'category'    => 'coffee',
                'sku'         => 'KOP-CAPPUCCINO',
                'is_best_seller' => true,
                'name'        => 'Cappuccino',
                'price'       => 15000,
                'cost'        => 5000,
                'stock'       => 80,
                'modifiers'   => ['size'],
                'image'       => 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80',
            ],
            [
                'category'    => 'coffee',
                'sku'         => 'KOP-V60-BREW',
                'is_best_seller' => true,
                'is_manual_brew' => true,
                'name'        => 'V60 Manual Brew',
                'price'       => 18000,
                'cost'        => 7000,
                'stock'       => 50,
                'modifiers'   => [],
                'image'       => 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80',
            ],
            [
                'category'    => 'coffee',
                'sku'         => 'KOP-ESPRESSO',
                'name'        => 'Espresso',
                'price'       => 10000,
                'cost'        => 3000,
                'stock'       => 60,
                'modifiers'   => [],
                'image'       => 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=600&q=80',
            ],

            // Non-Coffee
            [
                'category'    => 'non-coffee',
                'sku'         => 'NCF-MATCHA',
                'is_new'         => true,
                'name'        => 'Matcha Latte',
                'price'       => 18000,
                'cost'        => 7500,
                'stock'       => 90,
                'modifiers'   => ['sugar', 'size', 'ice'],
                'image'       => 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80',
            ],
            [
                'category'    => 'non-coffee',
                'sku'         => 'NCF-COKLAT',
                'name'        => 'Coklat',
                'price'       => 15000,
                'cost'        => 5500,
                'stock'       => 100,
                'modifiers'   => ['sugar', 'size', 'ice'],
                'image'       => 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80',
            ],
            [
                'category'    => 'non-coffee',
                'sku'         => 'NCF-TARO',
                'name'        => 'Taro Latte',
                'price'       => 16000,
                'cost'        => 6000,
                'stock'       => 80,
                'modifiers'   => ['sugar', 'size', 'ice'],
                'image'       => 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=600&q=80',
            ],
            [
                'category'    => 'non-coffee',
                'sku'         => 'NCF-ES-TEH',
                'name'        => 'Es Teh Manis',
                'price'       => 5000,
                'cost'        => 1200,
                'stock'       => 200,
                'modifiers'   => [],
                'image'       => 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80',
            ],
            [
                'category'    => 'non-coffee',
                'sku'         => 'NCF-ES-JERUK',
                'name'        => 'Es Jeruk',
                'price'       => 7000,
                'cost'        => 2500,
                'stock'       => 100,
                'modifiers'   => [],
                'image'       => 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80',
            ],
            [
                'category'    => 'non-coffee',
                'sku'         => 'NCF-LEMON-TEA',
                'name'        => 'Lemon Tea',
                'price'       => 8000,
                'cost'        => 3000,
                'stock'       => 90,
                'modifiers'   => ['sugar', 'ice'],
                'image'       => 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
            ],

            // Minuman Botol
            [
                'category'    => 'bottled',
                'sku'         => 'BTL-AQUA-600',
                'name'        => 'Aqua 600ml',
                'price'       => 5000,
                'cost'        => 2500,
                'stock'       => 120,
                'modifiers'   => [],
                'image'       => 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=600&q=80',
            ],
            [
                'category'    => 'bottled',
                'sku'         => 'BTL-TEH-PUCUK',
                'name'        => 'Teh Pucuk',
                'price'       => 5000,
                'cost'        => 3000,
                'stock'       => 110,
                'modifiers'   => [],
                'image'       => 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=600&q=80',
            ],
            [
                'category'    => 'bottled',
                'sku'         => 'BTL-COCA-COLA',
                'name'        => 'Coca Cola',
                'price'       => 7000,
                'cost'        => 4500,
                'stock'       => 70,
                'modifiers'   => [],
                'image'       => 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80',
            ],

            // Snack & Cemilan
            [
                'category'    => 'snack',
                'sku'         => 'SNK-KENTANG',
                'is_best_seller' => true,
                'name'        => 'Kentang Goreng',
                'price'       => 12000,
                'cost'        => 5000,
                'stock'       => 90,
                'modifiers'   => [],
                'image'       => 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80',
            ],
            [
                'category'    => 'snack',
                'sku'         => 'SNK-RISOL-MAYO',
                'name'        => 'Risol Mayo 3pcs',
                'price'       => 8000,
                'cost'        => 3500,
                'stock'       => 80,
                'modifiers'   => [],
                'image'       => 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=600&q=80',
            ],
            [
                'category'    => 'snack',
                'sku'         => 'SNK-ROTI-BAKAR',
                'is_best_seller' => true,
                'name'        => 'Roti Bakar Coklat Keju',
                'price'       => 10000,
                'cost'        => 4500,
                'stock'       => 70,
                'modifiers'   => [],
                'image'       => 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80',
            ],
        ];

        foreach ($menuList as $item) {
            $catId = $cats[$item['category']]->id;
            $product = Product::updateOrCreate(
                ['sku' => $item['sku']],
                [
                    'category_id' => $catId,
                    'name'        => $item['name'],
                    'price'       => $item['price'],
                    'cost_price'  => $item['cost'],
                    'stock'       => $item['stock'],
                    'image'       => $item['image'] ?? null,
                    'track_stock' => true,
                    'is_active'   => true,
                    'is_best_seller' => $item['is_best_seller'] ?? false,
                    'is_new'         => $item['is_new'] ?? false,
                    'is_manual_brew' => $item['is_manual_brew'] ?? false,
                ]
            );

            $modGroupIds = [];
            foreach ($item['modifiers'] as $mKey) {
                if (isset($mods[$mKey])) {
                    $modGroupIds[] = $mods[$mKey]->id;
                }
            }
            if (! empty($modGroupIds)) {
                $product->modifierGroups()->syncWithoutDetaching($modGroupIds);
            }

            $products[$item['sku']] = $product;
        }

        return $products;
    }

    private function seedTables(): void
    {
        $hasLocation = Schema::hasColumn('tables', 'location');

        // M01 - M04: kapasitas 2 (meja kecil)
        for ($i = 1; $i <= 4; $i++) {
            $data = ['capacity' => 2, 'status' => 'available'];
            if ($hasLocation) {
                $data['location'] = 'indoor';
            }
            Table::updateOrCreate(['table_number' => sprintf('M%02d', $i)], $data);
        }

        // M05 - M08: kapasitas 4 (meja biasa)
        for ($i = 5; $i <= 8; $i++) {
            $data = ['capacity' => 4, 'status' => 'available'];
            if ($hasLocation) {
                $data['location'] = 'indoor';
            }
            Table::updateOrCreate(['table_number' => sprintf('M%02d', $i)], $data);
        }

        // M09 - M10: kapasitas 6 (meja besar)
        for ($i = 9; $i <= 10; $i++) {
            $data = ['capacity' => 6, 'status' => 'available'];
            if ($hasLocation) {
                $data['location'] = 'indoor';
            }
            Table::updateOrCreate(['table_number' => sprintf('M%02d', $i)], $data);
        }

        // L01 - L02: kapasitas 4 (lesehan / outdoor)
        for ($i = 1; $i <= 2; $i++) {
            $data = ['capacity' => 4, 'status' => 'available'];
            if ($hasLocation) {
                $data['location'] = 'outdoor';
            }
            Table::updateOrCreate(['table_number' => sprintf('L%02d', $i)], $data);
        }
    }

    private function seedOrdersAndShifts(array $products, array $users, array $mods): void
    {
        $kasir1 = $users['kasir1']; // Rina Wulandari (shift pagi: 08:00 - 15:00)
        $kasir2 = $users['kasir2']; // Dedi Kurniawan (shift siang-malam: 15:00 - 22:00)
        $admin  = $users['admin'];

        $tables = Table::pluck('id')->toArray();

        // Ambil item modifier per grup
        $toppingItems = ModifierItem::where('modifier_group_id', $mods['topping']->id)->get();
        $sugarItems   = ModifierItem::where('modifier_group_id', $mods['sugar']->id)->get();
        $sizeItems    = ModifierItem::where('modifier_group_id', $mods['size']->id)->get();
        $iceItems     = ModifierItem::where('modifier_group_id', $mods['ice']->id)->get();

        // Bobot popularitas produk mahasiswa Arunika
        $productWeights = [
            'KOP-SUSU-ARN'   => 30, // Most popular coffee
            'WMD-IND-GRG'    => 28, // Most popular food
            'NCF-ES-TEH'     => 22, // Most popular cheap drink
            'WMD-IND-DBL'    => 14,
            'SNK-KENTANG'    => 14,
            'WMD-NAS-GRG'    => 13,
            'SNK-RISOL-MAYO' => 12,
            'WMD-IND-RBS'    => 12,
            'WMD-MIE-JAWA'   => 10,
            'WMD-NAS-TLR'    => 10,
            'KOP-SUSU-VAN'   => 10,
            'BTL-AQUA-600'   => 10,
            'BTL-TEH-PUCUK'  => 10,
            'NCF-MATCHA'     => 9,
            'NCF-COKLAT'     => 9,
            'KOP-SUSU-HZL'   => 8,
            'NCF-ES-JERUK'   => 8,
            'SNK-ROTI-BAKAR' => 8,
            'NCF-LEMON-TEA'  => 7,
            'NCF-TARO'       => 7,
            'BTL-COCA-COLA'  => 6,
            'KOP-AMERICANO'  => 5,
            'KOP-CAPPUCCINO' => 5,
            'KOP-V60-BREW'   => 2, // Rare specialty
            'KOP-ESPRESSO'   => 2, // Rare
        ];

        // Buat weighted product array pool
        $weightedProductPool = [];
        foreach ($productWeights as $sku => $weight) {
            if (isset($products[$sku])) {
                for ($w = 0; $w < $weight; $w++) {
                    $weightedProductPool[] = $products[$sku];
                }
            }
        }

        // Bobot jam kunjungan (08:00 - 22:00)
        // 11-13 (lunch rush), 16-18 (after-class rush), 08-09 (sepi, cuma kopi)
        $hourWeights = [
            8  => 2,
            9  => 3,
            10 => 6,
            11 => 18,
            12 => 22,
            13 => 15,
            14 => 9,
            15 => 11,
            16 => 17,
            17 => 19,
            18 => 14,
            19 => 11,
            20 => 8,
            21 => 5,
        ];
        $hourPool = [];
        foreach ($hourWeights as $hour => $weight) {
            for ($h = 0; $h < $weight; $h++) {
                $hourPool[] = $hour;
            }
        }

        // Catatan pelanggan natural untuk mahasiswa
        $customerNotes = [
            'warmindo' => [
                'gak pake sawi',
                'kuah dipisah ya kak',
                'extra pedas',
                'gak pake bawang goreng',
                'pedas sedang',
                'sambal dipisah',
                'telur setengah matang',
                'telur ceplok matang banget',
                'jangan terlalu asin',
            ],
            'drink' => [
                'susu oat +5rb',
                'jangan terlalu manis ya',
                'less sweet kak',
                'es sedikit saja',
                'tanpa sedotan plastik',
                'gula cair dipisah',
            ],
            'snack' => [
                'mayo dipisah',
                'saus sambal banyakin kak',
                'goreng agak garing ya',
                'bumbu ditabur terpisah',
            ],
        ];

        // Rencana void: 3 order di seluruh periode 30 hari (hari ke-23, ke-14, ke-4)
        $voidSchedule = [
            23 => ['reason' => 'Salah input menu makanan'],
            14 => ['reason' => 'Pelanggan batal jadi karena buru-buru kelas'],
            4  => ['reason' => 'Salah pilih meja dan pembayaran gagal'],
        ];

        $startingCashAmount = 300000.00;

        // Loop 30 hari (dari H-29 sampai H-0 hari ini)
        for ($day = 29; $day >= 0; $day--) {
            $baseDate = Carbon::today()->subDays($day);
            $isWeekend = in_array($baseDate->dayOfWeek, [Carbon::SATURDAY, Carbon::SUNDAY]);
            $isToday = ($day === 0);

            // Jumlah order: Weekdays (25-40), Weekends (35-55)
            // Hari ini jika masih berjalan: 14-20 order pada shift pagi
            $dailyOrderCount = $isToday
                ? rand(14, 20)
                : ($isWeekend ? rand(35, 55) : rand(25, 40));

            // Buka Shift Pagi (Rina: 08:00 - 15:00)
            $shift1OpenTime = $baseDate->copy()->setTime(8, rand(0, 4), 0);
            $shift1CloseTime = $baseDate->copy()->setTime(15, rand(0, 5), 0);
            $isShift1Open = $isToday; // Shift pagi hari ini berstatus 'open'

            $shift1 = Shift::create([
                'user_id'         => $kasir1->id,
                'opened_at'       => $shift1OpenTime,
                'closed_at'       => $isShift1Open ? null : $shift1CloseTime,
                'starting_cash'   => $startingCashAmount,
                'expected_cash'   => null,
                'actual_cash'     => null,
                'cash_difference' => null,
                'status'          => $isShift1Open ? 'open' : 'closed',
                'notes'           => $isShift1Open ? null : 'Shift pagi selesai lancar.',
                'created_at'      => $shift1OpenTime,
                'updated_at'      => $isShift1Open ? $shift1OpenTime : $shift1CloseTime,
            ]);

            // Buka Shift Siang-Malam (Dedi: 15:00 - 22:00) - hanya jika bukan hari ini pagi
            $shift2 = null;
            if (! $isToday) {
                $shift2OpenTime = $baseDate->copy()->setTime(15, rand(0, 4), 0);
                $shift2CloseTime = $baseDate->copy()->setTime(22, rand(0, 8), 0);

                $shift2 = Shift::create([
                    'user_id'         => $kasir2->id,
                    'opened_at'       => $shift2OpenTime,
                    'closed_at'       => $shift2CloseTime,
                    'starting_cash'   => $startingCashAmount,
                    'expected_cash'   => null,
                    'actual_cash'     => null,
                    'cash_difference' => null,
                    'status'          => 'closed',
                    'notes'           => 'Shift malam tutup kasir klop.',
                    'created_at'      => $shift2OpenTime,
                    'updated_at'      => $shift2CloseTime,
                ]);
            }

            // Generate order times for today or past days
            $generatedOrders = [];
            for ($o = 0; $o < $dailyOrderCount; $o++) {
                if ($isToday) {
                    // Hanya jam 08:00 sampai 14:00 untuk shift pagi hari ini
                    $hour = rand(8, 14);
                } else {
                    $hour = $hourPool[array_rand($hourPool)];
                }
                $minute = rand(0, 59);
                $second = rand(0, 59);

                $orderTime = $baseDate->copy()->setTime($hour, $minute, $second);
                $generatedOrders[] = $orderTime;
            }

            // Urutkan order berdasarkan waktu agar nomor invoice sekuensial kronologis
            usort($generatedOrders, fn($a, $b) => $a->timestamp <=> $b->timestamp);

            $dailyInvoiceCounter = 1;

            foreach ($generatedOrders as $orderIndex => $orderTime) {
                $hour = $orderTime->hour;

                // Tentukan shift & kasir yang bertugas
                if ($hour < 15 || ! $shift2) {
                    $currentCashier = $kasir1;
                    $currentShift   = $shift1;
                } else {
                    $currentCashier = $kasir2;
                    $currentShift   = $shift2;
                }

                // Format invoice number: ARN-YYYYMMDD-XXXX
                $invoiceNumber = sprintf('ARN-%s-%04d', $baseDate->format('Ymd'), $dailyInvoiceCounter++);

                // Cek apakah order ini harus di-void
                $isVoidOrder = (! $isToday && isset($voidSchedule[$day]) && $orderIndex === 5);

                // Ukuran pesanan mahasiswa: 50% 1 item, 35% 2 items, 10% 3 items, 5% 4 items
                $itemCountRoll = rand(1, 100);
                if ($itemCountRoll <= 50) {
                    $itemCount = 1;
                } elseif ($itemCountRoll <= 85) {
                    $itemCount = 2;
                } elseif ($itemCountRoll <= 95) {
                    $itemCount = 3;
                } else {
                    $itemCount = 4;
                }

                // Pilih produk unik untuk order ini
                $selectedProducts = [];
                for ($it = 0; $it < $itemCount; $it++) {
                    $chosen = $weightedProductPool[array_rand($weightedProductPool)];
                    $selectedProducts[] = $chosen;
                }

                $subtotal = 0.0;
                $lineItemsPayload = [];

                foreach ($selectedProducts as $prod) {
                    // Mahasiswa umumnya pesan 1 porsi (80%) atau 2 porsi (20%)
                    $qty = (rand(1, 10) <= 8) ? 1 : 2;
                    $basePrice = (float) $prod->price;
                    $itemUnitPrice = $basePrice;
                    $modifiersData = [];

                    // Catatan pelanggan pada ~15% item
                    $itemNote = null;
                    if (rand(1, 100) <= 15) {
                        if (str_starts_with($prod->sku, 'WMD-')) {
                            $itemNote = $customerNotes['warmindo'][array_rand($customerNotes['warmindo'])];
                        } elseif (str_starts_with($prod->sku, 'KOP-') || str_starts_with($prod->sku, 'NCF-')) {
                            $itemNote = $customerNotes['drink'][array_rand($customerNotes['drink'])];
                        } elseif (str_starts_with($prod->sku, 'SNK-')) {
                            $itemNote = $customerNotes['snack'][array_rand($customerNotes['snack'])];
                        }
                    }

                    // 1. Topping Mie (Pilihan Topping Mie)
                    if ($prod->modifierGroups->contains($mods['topping']->id) && rand(1, 10) <= 6) {
                        $topCount = rand(1, 2);
                        $chosenToppings = $toppingItems->random($topCount);
                        foreach ($chosenToppings as $top) {
                            $modifiersData[] = [
                                'modifier_item_id' => $top->id,
                                'unit_price'       => (float) $top->price,
                                'subtotal'         => round((float) $top->price * $qty, 2),
                            ];
                            $itemUnitPrice += (float) $top->price;
                        }
                    }

                    // 2. Level Gula (Minuman Kopi & Non-Coffee tertentu)
                    if ($prod->modifierGroups->contains($mods['sugar']->id)) {
                        // 70% Normal, 20% Less Sugar, 10% No Sugar
                        $sugarRoll = rand(1, 10);
                        $sugarItem = ($sugarRoll <= 7)
                            ? $sugarItems->firstWhere('name', 'Normal')
                            : (($sugarRoll <= 9) ? $sugarItems->firstWhere('name', 'Less Sugar') : $sugarItems->firstWhere('name', 'No Sugar'));

                        if ($sugarItem) {
                            $modifiersData[] = [
                                'modifier_item_id' => $sugarItem->id,
                                'unit_price'       => 0.0,
                                'subtotal'         => 0.0,
                            ];
                        }
                    }

                    // 3. Ukuran Cup (Regular Rp0, Large +Rp4.000)
                    if ($prod->modifierGroups->contains($mods['size']->id)) {
                        $sizeRoll = rand(1, 10);
                        $isLarge = ($sizeRoll >= 8); // 30% Large
                        $sizeItem = $isLarge
                            ? $sizeItems->firstWhere('name', 'Large +Rp4.000')
                            : $sizeItems->firstWhere('name', 'Regular');

                        if ($sizeItem) {
                            $modifiersData[] = [
                                'modifier_item_id' => $sizeItem->id,
                                'unit_price'       => (float) $sizeItem->price,
                                'subtotal'         => round((float) $sizeItem->price * $qty, 2),
                            ];
                            $itemUnitPrice += (float) $sizeItem->price;
                        }
                    }

                    // 4. Level Es (Normal Ice, Less Ice, No Ice)
                    if ($prod->modifierGroups->contains($mods['ice']->id)) {
                        $iceRoll = rand(1, 10);
                        $iceItem = ($iceRoll <= 7)
                            ? $iceItems->firstWhere('name', 'Normal Ice')
                            : (($iceRoll <= 9) ? $iceItems->firstWhere('name', 'Less Ice') : $iceItems->firstWhere('name', 'No Ice'));

                        if ($iceItem) {
                            $modifiersData[] = [
                                'modifier_item_id' => $iceItem->id,
                                'unit_price'       => 0.0,
                                'subtotal'         => 0.0,
                            ];
                        }
                    }

                    $rowSubtotal = round($itemUnitPrice * $qty, 2);
                    $subtotal += $rowSubtotal;

                    $lineItemsPayload[] = [
                        'product'    => $prod,
                        'quantity'   => $qty,
                        'unit_price' => $basePrice,
                        'subtotal'   => $rowSubtotal,
                        'notes'      => $itemNote,
                        'modifiers'  => $modifiersData,
                    ];
                }

                // Diskon: hanya 10% transaksi yang mendapatkan diskon
                $discountAmount = 0.0;
                if (rand(1, 100) <= 10) {
                    if (rand(1, 2) === 1) {
                        // member_10: diskon 10% untuk mahasiswa reguler
                        $discountAmount = round($subtotal * 0.10, 2);
                    } elseif ($subtotal >= 30000) {
                        // promo_5k: potongan Rp5.000 untuk pembelian > Rp30.000
                        $discountAmount = 5000.00;
                    }
                }

                $taxableAmount = max(0, $subtotal - $discountAmount);
                $taxAmount     = round($taxableAmount * 0.10, 2);
                $totalAmount   = round($taxableAmount + $taxAmount, 2);

                // Metode Pembayaran: 55% QRIS, 30% Cash, 10% Transfer, 5% Card
                $payRoll = rand(1, 100);
                if ($payRoll <= 55) {
                    $paymentMethod = 'qris';
                } elseif ($payRoll <= 85) {
                    $paymentMethod = 'cash';
                } elseif ($payRoll <= 95) {
                    $paymentMethod = 'transfer';
                } else {
                    $paymentMethod = 'card';
                }

                $cashTendered = null;
                $changeDue    = null;

                if ($paymentMethod === 'cash') {
                    // Nominal uang tunai bulat khas Rupiah
                    if ($totalAmount <= 10000) {
                        $cashTendered = 10000.00;
                    } elseif ($totalAmount <= 20000) {
                        $cashTendered = (rand(1, 2) === 1) ? 20000.00 : 50000.00;
                    } elseif ($totalAmount <= 50000) {
                        $cashTendered = (rand(1, 3) <= 2) ? 50000.00 : ceil($totalAmount / 5000) * 5000;
                    } else {
                        $cashTendered = 100000.00;
                    }
                    if ($cashTendered < $totalAmount) {
                        $cashTendered = ceil($totalAmount / 10000) * 10000;
                    }
                    $changeDue = round($cashTendered - $totalAmount, 2);
                }

                // Tipe pesanan: 70% dine_in, 25% takeaway (punya meja null), 5% takeaway tanpa meja
                $typeRoll = rand(1, 100);
                if ($typeRoll <= 70) {
                    $orderType = 'dine_in';
                    $tableId   = ! empty($tables) ? $tables[array_rand($tables)] : null;
                } else {
                    $orderType = 'takeaway';
                    $tableId   = null;
                }

                // Status order
                $orderStatus   = $isVoidOrder ? 'cancelled' : 'completed';
                $paymentStatus = $isVoidOrder ? 'refunded' : 'paid';

                $order = Order::create([
                    'invoice_number'  => $invoiceNumber,
                    'user_id'         => $currentCashier->id,
                    'shift_id'        => $currentShift->id,
                    'table_id'        => $tableId,
                    'order_type'      => $orderType,
                    'subtotal'        => $subtotal,
                    'discount_amount' => $discountAmount,
                    'tax_amount'      => $taxAmount,
                    'service_charge'  => 0.00,
                    'total_amount'    => $totalAmount,
                    'payment_method'  => $paymentMethod,
                    'cash_tendered'   => $cashTendered,
                    'change_due'      => $changeDue,
                    'payment_status'  => $paymentStatus,
                    'status'          => $orderStatus,
                    'void_reason'     => $isVoidOrder ? $voidSchedule[$day]['reason'] : null,
                    'voided_at'       => $isVoidOrder ? $orderTime->copy()->addMinutes(rand(3, 15)) : null,
                    'voided_by'       => $isVoidOrder ? $currentCashier->id : null,
                    'created_at'      => $orderTime,
                    'updated_at'      => $isVoidOrder ? $orderTime->copy()->addMinutes(rand(3, 15)) : $orderTime,
                ]);

                // Buat item pesanan & mutasi stok produk (jika order tidak di-void)
                foreach ($lineItemsPayload as $line) {
                    $orderItem = OrderItem::create([
                        'order_id'   => $order->id,
                        'product_id' => $line['product']->id,
                        'quantity'   => $line['quantity'],
                        'unit_price' => $line['unit_price'],
                        'subtotal'   => $line['subtotal'],
                        'notes'      => $line['notes'],
                        'created_at' => $orderTime,
                        'updated_at' => $orderTime,
                    ]);

                    if (! empty($line['modifiers'])) {
                        foreach ($line['modifiers'] as $mPayload) {
                            OrderItemModifier::create([
                                'order_item_id'    => $orderItem->id,
                                'modifier_item_id' => $mPayload['modifier_item_id'],
                                'unit_price'       => $mPayload['unit_price'],
                                'subtotal'         => $mPayload['subtotal'],
                                'created_at'       => $orderTime,
                                'updated_at'       => $orderTime,
                            ]);
                        }
                    }

                    // Catat mutasi stok produk keluar hanya jika order selesai
                    if (! $isVoidOrder && $line['product']->track_stock) {
                        $stockBefore = (int) $line['product']->stock;
                        $stockAfter  = max(0, $stockBefore - $line['quantity']);
                        $line['product']->stock = $stockAfter;
                        $line['product']->update(['stock' => $stockAfter]);

                        StockMutation::create([
                            'product_id'     => $line['product']->id,
                            'ingredient_id'  => null,
                            'user_id'        => $currentCashier->id,
                            'type'           => StockMutation::TYPE_OUT,
                            'quantity'       => -$line['quantity'],
                            'stock_before'   => $stockBefore,
                            'stock_after'    => $stockAfter,
                            'reference_type' => 'order',
                            'reference_id'   => $order->id,
                            'reference_note' => "Penjualan via Order #{$order->invoice_number}",
                            'created_at'     => $orderTime,
                            'updated_at'     => $orderTime,
                        ]);
                    }
                }
            }

            // Hitung rekonsiliasi kas untuk shift yang sudah ditutup
            // Shift 1 (Rina) jika bukan hari ini
            if (! $isShift1Open) {
                $shift1CashSales = Order::where('shift_id', $shift1->id)
                    ->where('status', 'completed')
                    ->where('payment_method', 'cash')
                    ->sum('total_amount');

                $expected1 = round($startingCashAmount + (float) $shift1CashSales, 2);
                $humanDiff1 = rand(-3, 3) * 1000; // ±Rp1.000 - Rp3.000
                $actual1 = round($expected1 + $humanDiff1, 2);

                $shift1->update([
                    'expected_cash'   => $expected1,
                    'actual_cash'     => $actual1,
                    'cash_difference' => $humanDiff1,
                ]);
            }

            // Shift 2 (Dedi)
            if ($shift2) {
                $shift2CashSales = Order::where('shift_id', $shift2->id)
                    ->where('status', 'completed')
                    ->where('payment_method', 'cash')
                    ->sum('total_amount');

                $expected2 = round($startingCashAmount + (float) $shift2CashSales, 2);
                $humanDiff2 = rand(-4, 4) * 1000; // ±Rp2.000 - Rp4.000
                $actual2 = round($expected2 + $humanDiff2, 2);

                $shift2->update([
                    'expected_cash'   => $expected2,
                    'actual_cash'     => $actual2,
                    'cash_difference' => $humanDiff2,
                ]);
            }
        }

        // Restock produk agar sisa stok berada di level yang ideal (40-120) untuk demo POS
        foreach ($products as $p) {
            if ($p->track_stock && $p->stock < 40) {
                $restockQty = rand(60, 110);
                $stockBefore = (int) $p->stock;
                $stockAfter  = $stockBefore + $restockQty;
                $p->update(['stock' => $stockAfter]);

                StockMutation::create([
                    'product_id'     => $p->id,
                    'ingredient_id'  => null,
                    'user_id'        => $admin->id,
                    'type'           => StockMutation::TYPE_IN,
                    'quantity'       => $restockQty,
                    'stock_before'   => $stockBefore,
                    'stock_after'    => $stockAfter,
                    'reference_type' => 'supplier',
                    'reference_note' => 'Restock berkala master produk untuk operasional demo Arunika',
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ]);
            }
        }
    }
}
