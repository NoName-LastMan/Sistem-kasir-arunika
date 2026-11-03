<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\StockMutation;
use App\Models\WasteRecord;
use Illuminate\Http\Request;

class WasteController extends Controller
{
    public function index(Request $request)
    {
        $query = WasteRecord::with(['ingredient:id,name,base_unit', 'user:id,name', 'shift:id,name'])
            ->latest();

        if ($request->filled('ingredient_id')) {
            $query->where('ingredient_id', $request->ingredient_id);
        }

        if ($request->filled('reason')) {
            $query->where('reason', $request->reason);
        }

        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        return response()->json([
            'message' => 'Laporan waste/spoilage',
            'data'    => $query->paginate($request->input('per_page', 20)),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'ingredient_id' => 'required|exists:ingredients,id',
            'quantity'      => 'required|numeric|min:0.001',
            'reason'        => 'required|in:expired,damaged,spoilage,cooking_error,other',
            'notes'         => 'nullable|string|max:500',
            'shift_id'      => 'nullable|exists:shifts,id',
            'image_proof'   => 'nullable|image|max:2048',
        ]);

        $imagePath = null;
        if ($request->hasFile('image_proof')) {
            $imagePath = $request->file('image_proof')->store('waste-proofs', 'public');
        }

        $waste = WasteRecord::create([
            'ingredient_id' => $validated['ingredient_id'],
            'quantity'      => $validated['quantity'],
            'reason'        => $validated['reason'],
            'notes'         => $validated['notes'] ?? null,
            'user_id'       => $request->user()->id,
            'shift_id'      => $validated['shift_id'] ?? null,
            'image_proof'   => $imagePath,
        ]);

        // Kurangi stok bahan baku
        $ingredient = \App\Models\Ingredient::findOrFail($validated['ingredient_id']);
        $stockBefore = (float) $ingredient->stock_quantity;
        $stockAfter = round($stockBefore - (float) $validated['quantity'], 3);

        $ingredient->update(['stock_quantity' => max(0, $stockAfter)]);

        StockMutation::create([
            'ingredient_id'  => $ingredient->id,
            'user_id'        => $request->user()->id,
            'type'           => 'out',
            'quantity'       => -(float) $validated['quantity'],
            'stock_before'   => $stockBefore,
            'stock_after'    => max(0, $stockAfter),
            'reference_type' => 'waste',
            'reference_id'   => $waste->id,
            'reference_note' => "Waste: {$validated['reason']} - " . ($validated['notes'] ?? ''),
        ]);

        return response()->json([
            'message' => 'Waste berhasil dicatat dan stok dikurangi',
            'data'    => $waste->load('ingredient:id,name,base_unit'),
        ], 201);
    }

    public function summary(Request $request)
    {
        $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
        $endDate   = $request->input('end_date', now()->endOfMonth()->toDateString());

        $request->merge([
            'start_date' => $startDate,
            'end_date'   => $endDate,
        ]);

        $request->validate([
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after_or_equal:start_date',
        ]);

        $query = WasteRecord::whereDate('created_at', '>=', $request->start_date)
            ->whereDate('created_at', '<=', $request->end_date);

        $totalQuantity = (float) $query->sum('quantity');

        $byReason = WasteRecord::whereDate('created_at', '>=', $request->start_date)
            ->whereDate('created_at', '<=', $request->end_date)
            ->selectRaw('reason, SUM(quantity) as total_quantity, COUNT(*) as count')
            ->groupBy('reason')
            ->get();

        $byIngredient = WasteRecord::whereDate('created_at', '>=', $request->start_date)
            ->whereDate('created_at', '<=', $request->end_date)
            ->selectRaw('ingredient_id, SUM(quantity) as total_quantity, COUNT(*) as count')
            ->groupBy('ingredient_id')
            ->with('ingredient:id,name,base_unit')
            ->get();

        return response()->json([
            'message' => 'Ringkasan waste',
            'data'    => [
                'period' => [
                    'start' => $request->start_date,
                    'end'   => $request->end_date,
                ],
                'total_quantity' => $totalQuantity,
                'by_reason'      => $byReason,
                'by_ingredient'  => $byIngredient,
            ],
        ]);
    }
}
