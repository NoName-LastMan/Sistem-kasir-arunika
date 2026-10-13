export const mockSettings = {
  store_name: 'Arunika Coffee and Space',
  store_address: 'Lt. 2 Gedung Unimus Mart, Jl. Kedungmundu No. 18, Semarang',
  store_phone: '+62 889-8572-2088',
  store_instagram: '@arunika.coffee',
  google_maps_url: 'https://maps.app.goo.gl/dkbegKuRniHS476t5',
  opening_hours: {
    weekdays: '08:00 - 22:00',
    weekends: '08:00 - 22:00',
    open_time_hour: 8,
    close_time_hour: 22
  },
  weather: {
    temperature: '28°C',
    condition: 'Cerah Berawan',
    location: 'UNIMUS Kedungmundu, Semarang',
    recommendation: 'Sangat pas untuk Kopi Susu Arunika dingin atau sajian pasta di ruang ber-AC'
  },
  tax_rate: 10,
  service_charge: 0,
  receipt_footer: 'Terima kasih telah berkunjung ke Arunika Coffee and Space UNIMUS Semarang.'
}

export const mockCategories = [
  { id: 1, name: 'Kopi & Espresso', slug: 'kopi', description: 'Kopi susu gula aren andalan dan olahan espresso aromatik' },
  { id: 2, name: 'Manual Brew & Mocktail', slug: 'manual-brew', description: 'Single origin pilihan dan racikan mocktail segar' },
  { id: 3, name: 'Non-Kopi & Artisan Tea', slug: 'non-kopi', description: 'Matcha, cokelat pekat, taro, dan seduhan teh segar' },
  { id: 4, name: 'Makanan & Pasta', slug: 'makanan', description: 'Nasi katsu, pasta ala kafe, dan burger mengenyangkan' },
  { id: 5, name: 'Camilan Semarang & Roti', slug: 'camilan', description: 'Tahu bakso khas, kentang goreng, dan kudapan santai' }
]

export const mockModifierGroups = [
  {
    id: 1,
    name: 'Tingkat Manis (Sugar)',
    is_required: true,
    min_selection: 1,
    max_selection: 1,
    items: [
      { id: 101, name: 'Normal (100%)', price: 0 },
      { id: 102, name: 'Sedang (50%)', price: 0 },
      { id: 103, name: 'Tanpa Gula (0%)', price: 0 }
    ]
  },
  {
    id: 2,
    name: 'Pilihan Susu',
    is_required: false,
    min_selection: 0,
    max_selection: 1,
    items: [
      { id: 201, name: 'Fresh Milk Sapi (Bawaan)', price: 0 },
      { id: 202, name: 'Oatmilk Tambahan', price: 6000 }
    ]
  },
  {
    id: 3,
    name: 'Topping Tambahan',
    is_required: false,
    min_selection: 0,
    max_selection: 2,
    items: [
      { id: 301, name: 'Ekstra Telur Mata Sapi', price: 4000 },
      { id: 302, name: 'Keju Cheddar Parut', price: 3500 },
      { id: 303, name: 'Sosis Ayam Panggang', price: 4500 }
    ]
  },
  {
    id: 4,
    name: 'Metode Seduh Manual',
    is_required: true,
    min_selection: 1,
    max_selection: 1,
    items: [
      { id: 401, name: 'V60 (Bersih & Floral)', price: 0 },
      { id: 402, name: 'Aeropress (Body Tebal)', price: 0 },
      { id: 403, name: 'Japanese Iced (Segar Dingin)', price: 2000 }
    ]
  }
]

export const mockProducts = [
  {
    id: 1,
    category_id: 1,
    name: 'Kopi Susu Arunika',
    description: 'Espresso ganda, gula aren organik Sukabumi, dan susu segar creamy dengan sentuhan rempah lembut.',
    price: 24000,
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80',
    is_available: true,
    is_best_seller: true,
    is_new: false,
    tasting_notes: ['Gula Aren', 'Karamel', 'Creamy'],
    estimated_time: '5-7 menit',
    modifier_group_ids: [1, 2]
  },
  {
    id: 2,
    category_id: 1,
    name: 'Americano Sunrise',
    description: 'Dua shot espresso Flores Bajawa dengan perasan jeruk segar dan es batu bening menyegarkan.',
    price: 22000,
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    is_available: true,
    is_best_seller: false,
    is_new: true,
    tasting_notes: ['Jeruk Segar', 'Cokelat Hitam', 'Crisp'],
    estimated_time: '3-5 menit',
    modifier_group_ids: [1]
  },
  {
    id: 3,
    category_id: 1,
    name: 'Flat White Kebun',
    description: 'Ristretto pekat dibalut susu berbusa mikro halus dalam cangkir keramik artisan, manis alami.',
    price: 26000,
    image: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=600&q=80',
    is_available: true,
    is_best_seller: false,
    is_new: false,
    tasting_notes: ['Kacang Panggang', 'Madu', 'Velvety'],
    estimated_time: '5-7 menit',
    modifier_group_ids: [2]
  },
  {
    id: 4,
    category_id: 2,
    name: 'Aceh Gayo Anaerobik',
    description: 'Proses fermentasi anaerobik 72 jam menghasilkan karakter buah tropis eksotis yang berlapis.',
    price: 32000,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80',
    is_available: true,
    is_best_seller: true,
    is_new: false,
    is_manual_brew: true,
    tasting_notes: ['Nanas Madu', 'Anggur Fermentasi', 'Melati'],
    acidity: 4,
    body: 3,
    sweetness: 4,
    roast_level: 'Light-Medium',
    estimated_time: '8-10 menit',
    modifier_group_ids: [4]
  },
  {
    id: 5,
    category_id: 2,
    name: 'Manual Brew V60 Nusantara',
    description: 'Biji kopi pilihan nusantara diseduh tangan menggunakan metode pour-over V60 dengan profil rasa bersih.',
    price: 25000,
    image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80',
    is_available: true,
    is_best_seller: false,
    is_new: false,
    is_manual_brew: true,
    tasting_notes: ['Jeruk Segar', 'Floral', 'Karamel'],
    acidity: 3,
    body: 3,
    sweetness: 4,
    roast_level: 'Medium',
    estimated_time: '8-10 menit',
    modifier_group_ids: [4]
  },
  {
    id: 6,
    category_id: 2,
    name: 'Arunika Sunrise Mocktail',
    description: 'Espresso racikan dingin berpadu sirup jeruk segar dan soda fajar yang menyegarkan dahaga.',
    price: 26000,
    image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=600&q=80',
    is_available: true,
    is_best_seller: true,
    is_new: true,
    is_manual_brew: false,
    tasting_notes: ['Sitrus Segar', 'Sparkling', 'Aroma Kopi'],
    acidity: 4,
    body: 2,
    sweetness: 4,
    roast_level: 'Light-Medium',
    estimated_time: '5-7 menit',
    modifier_group_ids: []
  },
  {
    id: 7,
    category_id: 3,
    name: 'Matcha Latte Creamy',
    description: 'Matcha pilihan berpadu susu segar creamy hangat atau dingin, favorit mahasiswa dan dosen saat santai.',
    price: 24000,
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80',
    is_available: true,
    is_best_seller: true,
    is_new: false,
    tasting_notes: ['Umami Lembut', 'Creamy', 'Manis Pas'],
    estimated_time: '4-6 menit',
    modifier_group_ids: [1, 2]
  },
  {
    id: 8,
    category_id: 3,
    name: 'Lemon Lychee Iced Tea',
    description: 'Seduhan teh hitam beraroma melati dengan buah leci utuh dan perasan lemon segar Semarang.',
    price: 20000,
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
    is_available: true,
    is_best_seller: false,
    is_new: false,
    tasting_notes: ['Asam Manis', 'Buah Leci', 'Segar'],
    estimated_time: '3-5 menit',
    modifier_group_ids: [1]
  },
  {
    id: 9,
    category_id: 4,
    name: 'Nasi Ayam Katsu Saus Kari',
    description: 'Fillet ayam katsu renyah berbalut tepung panko emas, disajikan dengan nasi hangat dan kuah kari jepang gurih.',
    price: 32000,
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80',
    is_available: true,
    is_best_seller: true,
    is_new: false,
    tasting_notes: ['Katsu Renyah', 'Kari Gurih', 'Nasi Pulen'],
    estimated_time: '12-15 menit',
    modifier_group_ids: [3]
  },
  {
    id: 10,
    category_id: 4,
    name: 'Spaghetti Creamy Carbonara',
    description: 'Pasta al dente diselimuti saus krim gurih keju parmesan, potongan smoked beef renyah, dan taburan oregano.',
    price: 30000,
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
    is_available: true,
    is_best_seller: true,
    is_new: false,
    tasting_notes: ['Creamy Gurih', 'Smoked Beef', 'Keju Gurih'],
    estimated_time: '12-15 menit',
    modifier_group_ids: []
  },
  {
    id: 11,
    category_id: 5,
    name: 'Tahu Bakso Goreng Khas Semarang',
    description: 'Tahu bakso khas Semarang gurih berdaging padat digoreng renyah, disajikan dengan cabai rawit hijau segar.',
    price: 18000,
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
    is_available: true,
    is_best_seller: true,
    is_new: false,
    tasting_notes: ['Daging Gurih', 'Renyah Luar', 'Pedas Cabai'],
    estimated_time: '7-10 menit',
    modifier_group_ids: []
  },
  {
    id: 12,
    category_id: 5,
    name: 'Kentang Goreng & Sosis Krispi',
    description: 'French fries renyah keemasan bertabur bumbu gurih herbs dipadukan sosis goreng dan saus celup spesial.',
    price: 20000,
    image: 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?auto=format&fit=crop&w=600&q=80',
    is_available: true,
    is_best_seller: false,
    is_new: false,
    tasting_notes: ['Kentang Renyah', 'Gurih Saus', 'Kudapan Nugas'],
    estimated_time: '8-10 menit',
    modifier_group_ids: []
  }
]

export const mockTables = [
  { code: '01', name: 'Meja 01 (Indoor Study)', capacity: 4, area: 'Indoor AC (Coworking)' },
  { code: '02', name: 'Meja 02 (Indoor Study)', capacity: 4, area: 'Indoor AC (Coworking)' },
  { code: '03', name: 'Meja 03 (Dekat Jendela)', capacity: 2, area: 'Indoor AC' },
  { code: '04', name: 'Meja 04 (Meja Komunal AC)', capacity: 6, area: 'Indoor AC (Coworking)' },
  { code: '05', name: 'Meja 05 (Balkon Semi-Outdoor)', capacity: 4, area: 'Smoking Area' },
  { code: '06', name: 'Meja 06 (Balkon Semi-Outdoor)', capacity: 4, area: 'Smoking Area' },
  { code: '07', name: 'Meja 07 (Area Santai)', capacity: 4, area: 'Indoor AC' },
  { code: '08', name: 'Meja 08 (Meja Panjang Laptop)', capacity: 8, area: 'Indoor AC (Coworking)' },
  { code: '09', name: 'Meja 09 (Balkon Sudut)', capacity: 2, area: 'Smoking Area' },
  { code: '10', name: 'Meeting Room 01 (Private AC)', capacity: 12, area: 'Ruang Rapat Ber-AC' }
]
