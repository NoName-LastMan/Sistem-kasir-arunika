<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    // List produk untuk grid kasir (mendukung filter kategori & pencarian nama)
    public function index(Request $request)
    {
        $query = Product::with(['category', 'modifierGroups.items'])
            ->where('is_active', true);

        // Filter per kategori jika kasir klik tab kategori
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Pencarian realtime nama produk atau SKU
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        $products = $query->latest()->get();

        return response()->json([
            'data' => $products
        ]);
    }

    // Tambah produk baru beserta penentuan modifier yang aktif
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id'      => 'required|exists:categories,id',
            'name'             => 'required|string|max:150',
            'sku'              => 'nullable|string|unique:products,sku',
            'description'      => 'nullable|string',
            'price'            => 'required|numeric|min:0',
            'cost_price'       => 'nullable|numeric|min:0',
            'stock'            => 'nullable|integer|min:0',
            'track_stock'      => 'boolean',
            'image'            => 'nullable|string',
            'modifier_group_ids' => 'nullable|array',
            'modifier_group_ids.*' => 'exists:modifier_groups,id'
        ]);

        $product = Product::create([
            'category_id' => $validated['category_id'],
            'name'        => $validated['name'],
            'sku'         => $validated['sku'] ?? null,
            'description' => $validated['description'] ?? null,
            'price'       => $validated['price'],
            'cost_price'  => $validated['cost_price'] ?? 0,
            'stock'       => $validated['stock'] ?? 0,
            'track_stock' => $validated['track_stock'] ?? false,
            'image'       => $validated['image'] ?? null,
            'is_active'   => true,
        ]);

        // Hubungkan varian/topping jika dipilih
        if (!empty($validated['modifier_group_ids'])) {
            $product->modifierGroups()->sync($validated['modifier_group_ids']);
        }

        return response()->json([
            'message' => 'Produk berhasil dibuat',
            'data'    => $product->load(['category', 'modifierGroups.items'])
        ], 201);
    }

    // Detail single product
    public function show(Product $product)
    {
        return response()->json([
            'data' => $product->load(['category', 'modifierGroups.items'])
        ]);
    }

    // Cari produk langsung via Barcode / SKU untuk scanner
    public function byBarcode(string $barcode)
    {
        $product = Product::with(['category', 'modifierGroups.items'])
            ->where('is_active', true)
            ->where('sku', $barcode)
            ->first();

        if (!$product) {
            return response()->json([
                'message' => "Produk dengan barcode/SKU '{$barcode}' tidak ditemukan"
            ], 404);
        }

        return response()->json([
            'message' => 'Produk ditemukan',
            'data'    => $product
        ]);
    }

    /**
     * Katalog menu publik untuk guest di cafe-frontend.
     */
    public function publicMenu()
    {
        $categories = \App\Models\Category::all();
        $products = Product::with(['category', 'modifierGroups.items'])
            ->where('is_active', true)
            ->get();
        $modifierGroups = \App\Models\ModifierGroup::with('items')->get();

        return response()->json([
            'data' => [
                'categories'      => $categories,
                'products'        => $products,
                'modifier_groups' => $modifierGroups,
            ]
        ]);
    }

    /**
     * Upload foto produk dari perangkat kasir / admin dengan kompresi WebP otomatis
     */
    public function uploadImage(Request $request)
    {
        $request->validate([
            'image' => 'nullable|file|mimes:jpeg,png,jpg,webp,gif|max:10240',
            'image_base64' => 'nullable|string',
        ]);

        $destinationPath = public_path('uploads/products');
        if (!file_exists($destinationPath)) {
            @mkdir($destinationPath, 0755, true);
        }

        // 1. Jika via multipart file
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $data = file_get_contents($file->getRealPath());
            $filename = $this->saveOptimizedWebp($data, $destinationPath, $file->getClientOriginalExtension());
            $url = url('uploads/products/' . $filename);

            return response()->json([
                'message'  => 'Foto produk berhasil dioptimasi & diunggah',
                'url'      => $url,
                'filename' => $filename
            ]);
        }

        // 2. Jika via base64 data URL
        if ($request->filled('image_base64')) {
            $base64Data = $request->input('image_base64');
            if (preg_match('/^data:image\/(\w+);base64,/', $base64Data, $type)) {
                $base64Data = substr($base64Data, strpos($base64Data, ',') + 1);
                $ext = strtolower($type[1]);
                if (!in_array($ext, ['jpg', 'jpeg', 'gif', 'png', 'webp'])) {
                    return response()->json(['message' => 'Format gambar tidak didukung'], 422);
                }
                $decoded = base64_decode($base64Data);
                if ($decoded === false) {
                    return response()->json(['message' => 'Gagal membaca data gambar'], 422);
                }

                $filename = $this->saveOptimizedWebp($decoded, $destinationPath, $ext);
                $url = url('uploads/products/' . $filename);

                return response()->json([
                    'message'  => 'Foto produk berhasil dioptimasi & diunggah',
                    'url'      => $url,
                    'filename' => $filename
                ]);
            }
        }

        return response()->json(['message' => 'File atau data gambar tidak ditemukan.'], 400);
    }

    /**
     * Kompres dan konversi gambar ke WebP teroptimasi (maks 800x800, quality 82)
     */
    private function saveOptimizedWebp(string $rawData, string $destinationPath, ?string $originalExt = null): string
    {
        $randomName = 'menu_' . time() . '_' . \Illuminate\Support\Str::random(8);

        if (function_exists('imagewebp') && function_exists('imagecreatefromstring')) {
            $src = @imagecreatefromstring($rawData);
            if ($src !== false) {
                $width = imagesx($src);
                $height = imagesy($src);
                $maxDimension = 800;

                if ($width > $maxDimension || $height > $maxDimension) {
                    if ($width >= $height) {
                        $newWidth = $maxDimension;
                        $newHeight = (int) round(($height / $width) * $maxDimension);
                    } else {
                        $newHeight = $maxDimension;
                        $newWidth = (int) round(($width / $height) * $maxDimension);
                    }

                    $scaled = imagescale($src, $newWidth, $newHeight, IMG_BILINEAR_FIXED);
                    if ($scaled !== false) {
                        imagedestroy($src);
                        $src = $scaled;
                    }
                }

                imagepalettetotruecolor($src);
                imagealphablending($src, true);
                imagesavealpha($src, true);

                $webpFilename = $randomName . '.webp';
                $targetFile = $destinationPath . '/' . $webpFilename;

                if (imagewebp($src, $targetFile, 82)) {
                    imagedestroy($src);
                    return $webpFilename;
                }
                imagedestroy($src);
            }
        }

        // Fallback simpan berkas asli jika GD tidak dapat memproses
        $ext = $originalExt ? strtolower($originalExt) : 'jpg';
        $fallbackFilename = $randomName . '.' . $ext;
        file_put_contents($destinationPath . '/' . $fallbackFilename, $rawData);
        return $fallbackFilename;
    }
}