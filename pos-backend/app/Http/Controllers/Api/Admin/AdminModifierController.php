<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ModifierGroup;
use App\Models\ModifierItem;
use Illuminate\Http\Request;

class AdminModifierController extends Controller
{
    /**
     * List semua kelompok modifier beserta item variannya.
     */
    public function indexGroup()
    {
        $groups = ModifierGroup::with(['items.ingredient:id,name,base_unit'])->latest()->get();

        return response()->json([
            'message' => 'Daftar grup modifier & varian',
            'data'    => $groups
        ]);
    }

    /**
     * Tambah grup modifier baru.
     */
    public function storeGroup(Request $request)
    {
        $validated = $request->validate([
            'name'          => 'required|string|max:100',
            'is_required'   => 'boolean',
            'min_selection' => 'nullable|integer|min:0',
            'max_selection' => 'nullable|integer|min:1',
            'items'         => 'nullable|array',
            'items.*.name'  => 'required|string|max:100',
            'items.*.price' => 'required|numeric|min:0',
        ]);

        $group = ModifierGroup::create([
            'name'          => $validated['name'],
            'is_required'   => $validated['is_required'] ?? false,
            'min_selection' => $validated['min_selection'] ?? 0,
            'max_selection' => $validated['max_selection'] ?? 1,
        ]);

        if (!empty($validated['items'])) {
            foreach ($validated['items'] as $item) {
                $group->items()->create([
                    'name'  => $item['name'],
                    'price' => $item['price'],
                ]);
            }
        }

        return response()->json([
            'message' => 'Grup modifier berhasil dibuat',
            'data'    => $group->load('items')
        ], 201);
    }

    /**
     * Edit grup modifier.
     */
    public function updateGroup(Request $request, ModifierGroup $modifierGroup)
    {
        $validated = $request->validate([
            'name'          => 'required|string|max:100',
            'is_required'   => 'boolean',
            'min_selection' => 'nullable|integer|min:0',
            'max_selection' => 'nullable|integer|min:1',
        ]);

        $modifierGroup->update($validated);

        return response()->json([
            'message' => 'Grup modifier berhasil diperbarui',
            'data'    => $modifierGroup->load('items')
        ]);
    }

    /**
     * Hapus grup modifier.
     */
    public function destroyGroup(ModifierGroup $modifierGroup)
    {
        $modifierGroup->delete();

        return response()->json([
            'message' => 'Grup modifier berhasil dihapus'
        ]);
    }

    /**
     * Tambah item modifier (topping/varian tunggal).
     */
    public function storeItem(Request $request)
    {
        $validated = $request->validate([
            'modifier_group_id' => 'required|exists:modifier_groups,id',
            'name'              => 'required|string|max:100',
            'price'             => 'required|numeric|min:0',
            'ingredient_id'     => 'nullable|exists:ingredients,id',
            'quantity_needed'   => 'nullable|numeric|min:0',
        ]);

        $validated['quantity_needed'] = $validated['quantity_needed'] ?? 0;

        $item = ModifierItem::create($validated)->load('ingredient:id,name,base_unit');

        return response()->json([
            'message' => 'Item modifier berhasil dibuat',
            'data'    => $item
        ], 201);
    }

    /**
     * Edit item modifier.
     */
    public function updateItem(Request $request, ModifierItem $modifierItem)
    {
        $validated = $request->validate([
            'name'            => 'required|string|max:100',
            'price'           => 'required|numeric|min:0',
            'ingredient_id'   => 'nullable|exists:ingredients,id',
            'quantity_needed' => 'nullable|numeric|min:0',
        ]);

        $validated['quantity_needed'] = $validated['quantity_needed'] ?? 0;

        $modifierItem->update($validated);

        return response()->json([
            'message' => 'Item modifier berhasil diperbarui',
            'data'    => $modifierItem->load('ingredient:id,name,base_unit')
        ]);
    }

    /**
     * Hapus item modifier.
     */
    public function destroyItem(ModifierItem $modifierItem)
    {
        $modifierItem->delete();

        return response()->json([
            'message' => 'Item modifier berhasil dihapus'
        ]);
    }
}
