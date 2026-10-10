<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminCategoryController extends Controller
{
    public function index(Request $request)
    {
        $categories = Category::withCount('products')->latest()->get();

        return response()->json([
            'message' => 'Daftar kategori',
            'data'    => $categories
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'      => 'required|string|max:100|unique:categories,name',
            'is_active' => 'boolean',
        ]);

        $category = Category::create([
            'name'      => $validated['name'],
            'slug'      => Str::slug($validated['name']),
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'Kategori berhasil dibuat',
            'data'    => $category
        ], 201);
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name'      => ['required', 'string', 'max:100', Rule::unique('categories')->ignore($category->id)],
            'is_active' => 'boolean',
        ]);

        $category->update([
            'name'      => $validated['name'],
            'slug'      => Str::slug($validated['name']),
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'Kategori berhasil diperbarui',
            'data'    => $category
        ]);
    }

    public function destroy(Category $category)
    {
        $category->delete();

        return response()->json([
            'message' => 'Kategori berhasil dihapus'
        ]);
    }
}
