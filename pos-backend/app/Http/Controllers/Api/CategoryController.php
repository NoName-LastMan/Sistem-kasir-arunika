<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    // List semua kategori aktif untuk menu POS
    public function index()
    {
        $categories = Category::where('is_active', true)
            ->withCount('products')
            ->latest()
            ->get();

        return response()->json([
            'data' => $categories
        ]);
    }

    // Tambah kategori baru (Admin)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'      => 'required|string|max:100|unique:categories,name',
            'is_active' => 'boolean'
        ]);

        $category = Category::create([
            'name'      => $validated['name'],
            'slug'      => Str::slug($validated['name']),
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'Kategori berhasil ditambahkan',
            'data'    => $category
        ], 201);
    }

    // Hapus kategori
    public function destroy(Category $category)
    {
        $category->delete();

        return response()->json([
            'message' => 'Kategori berhasil dihapus'
        ]);
    }
}