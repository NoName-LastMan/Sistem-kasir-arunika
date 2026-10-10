<?php

namespace App\Services;

use App\Models\Ingredient;
use App\Models\Order;
use App\Models\Product;
use App\Models\StockMutation;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InventoryService
{
    /**
     * Penyesuaian stok manual (stock in, stock out, stock opname).
     */
    public function adjustStock(
        int     $productId,
        string  $type,
        int     $quantity,
        ?int    $userId,
        ?string $referenceNote = null,
    ): StockMutation {
        return DB::transaction(function () use ($productId, $type, $quantity, $userId, $referenceNote) {
            $product     = Product::findOrFail($productId);
            $stockBefore = (int) $product->stock;
            $qtyInput    = abs($quantity);

            $stockAfter  = $stockBefore;
            $mutationQty = 0;

            if ($type === StockMutation::TYPE_IN) {
                $stockAfter  = $stockBefore + $qtyInput;
                $mutationQty = $qtyInput;
            } elseif ($type === StockMutation::TYPE_OUT) {
                $stockAfter  = max(0, $stockBefore - $qtyInput);
                $mutationQty = -$qtyInput;
            } elseif ($type === StockMutation::TYPE_OPNAME) {
                $stockAfter  = max(0, $qtyInput);
                $mutationQty = $qtyInput;
            } else {
                throw ValidationException::withMessages([
                    'type' => ['Jenis mutasi tidak valid.'],
                ]);
            }

            $product->update([
                'stock'       => $stockAfter,
                'track_stock' => true,
            ]);

            return StockMutation::create([
                'product_id'     => $product->id,
                'user_id'        => $userId,
                'type'           => $type,
                'quantity'       => $mutationQty,
                'stock_before'   => $stockBefore,
                'stock_after'    => $stockAfter,
                'reference_note' => $referenceNote,
            ]);
        });
    }

    /**
     * Potong stok saat order (checkout). Membuat StockMutation sebagai audit trail.
     */
    public function deductForOrder(
        Product $product,
        int     $quantity,
        int     $orderId,
        ?int    $userId,
    ): ?StockMutation {
        if (! $product->track_stock) {
            return null;
        }

        if (! $product->hasEnoughStock($quantity)) {
            throw ValidationException::withMessages([
                'items' => [
                    "Stok tidak mencukupi untuk produk: {$product->name} (Sisa: {$product->stock})",
                ],
            ]);
        }

        $stockBefore = (int) $product->stock;
        $stockAfter  = $stockBefore - $quantity;

        $product->update(['stock' => $stockAfter]);

        return StockMutation::create([
            'product_id'     => $product->id,
            'user_id'        => $userId,
            'type'           => StockMutation::TYPE_OUT,
            'quantity'       => -$quantity,
            'stock_before'   => $stockBefore,
            'stock_after'    => $stockAfter,
            'reference_note' => "Penjualan via Order #{$orderId}",
        ]);
    }

    /**
     * Set stok awal saat pembuatan produk baru.
     */
    public function setInitialStock(
        Product $product,
        int     $initialQuantity,
        ?int    $userId,
    ): ?StockMutation {
        if ($initialQuantity <= 0 || ! $product->track_stock) {
            return null;
        }

        $product->update(['stock' => $initialQuantity]);

        return StockMutation::create([
            'product_id'     => $product->id,
            'user_id'        => $userId,
            'type'           => StockMutation::TYPE_IN,
            'quantity'       => $initialQuantity,
            'stock_before'   => 0,
            'stock_after'    => $initialQuantity,
            'reference_note' => 'Stok awal saat pembuatan produk',
        ]);
    }

    /**
     * Update stok dari admin product edit. Membuat record audit untuk delta.
     */
    public function updateStock(
        Product  $product,
        int      $newQuantity,
        ?int     $userId,
        ?string  $referenceNote = 'Penyesuaian stok via admin',
    ): ?StockMutation {
        $stockBefore = (int) $product->stock;

        if ($stockBefore === $newQuantity) {
            return null;
        }

        $product->update(['stock' => $newQuantity]);

        $delta = $newQuantity - $stockBefore;

        return StockMutation::create([
            'product_id'     => $product->id,
            'user_id'        => $userId,
            'type'           => $delta > 0 ? StockMutation::TYPE_IN : StockMutation::TYPE_OUT,
            'quantity'       => $delta,
            'stock_before'   => $stockBefore,
            'stock_after'    => $newQuantity,
            'reference_note' => $referenceNote,
        ]);
    }

    /**
     * Kembalikan stok untuk order yang di-void.
     */
    public function restoreForVoid(Order $order, ?int $userId): array
    {
        $mutations = [];

        foreach ($order->items as $item) {
            $product = $item->product;

            if (! $product || ! $product->track_stock) {
                continue;
            }

            $mutations[] = $this->adjustStock(
                productId:     $product->id,
                type:          StockMutation::TYPE_IN,
                quantity:      $item->quantity,
                userId:        $userId,
                referenceNote: "Pengembalian stok via Void Order #{$order->invoice_number}",
            );
        }

        $mutations = array_merge($mutations, $this->restoreIngredientsForVoid($order, $userId));

        return $mutations;
    }

    /**
     * Potong stok bahan baku saat order berdasarkan resep produk.
     */
    public function deductIngredientsForOrder(
        Order $order,
        ?int  $userId,
    ): array {
        $mutations = [];

        foreach ($order->items as $item) {
            $product = $item->product;

            if (! $product) {
                continue;
            }

            $ingredients = $product->ingredients;

            foreach ($ingredients as $ingredient) {
                $quantityNeeded = (float) $ingredient->pivot->quantity_needed;
                $conversionFactor = (float) $ingredient->pivot->conversion_factor;
                $totalNeeded = $quantityNeeded * $conversionFactor * $item->quantity;

                if (! $ingredient->track_stock) {
                    continue;
                }

                $stockBefore = (float) $ingredient->stock_quantity;

                if ($stockBefore < $totalNeeded) {
                    throw ValidationException::withMessages([
                        'items' => [
                            "Stok bahan {$ingredient->name} tidak mencukupi (Sisa: {$stockBefore} {$ingredient->base_unit})",
                        ],
                    ]);
                }

                $stockAfter = round($stockBefore - $totalNeeded, 3);

                $ingredient->update(['stock_quantity' => $stockAfter]);

                $mutations[] = StockMutation::create([
                    'ingredient_id'  => $ingredient->id,
                    'user_id'        => $userId,
                    'type'           => StockMutation::TYPE_OUT,
                    'quantity'       => -$totalNeeded,
                    'stock_before'   => $stockBefore,
                    'stock_after'    => $stockAfter,
                    'reference_type' => 'order',
                    'reference_id'   => $order->id,
                    'reference_note' => "Penjualan via Order #{$order->invoice_number}",
                ]);
            }
        }

        return $mutations;
    }

    /**
     * Kembalikan stok bahan baku untuk order yang di-void.
     */
    public function restoreIngredientsForVoid(Order $order, ?int $userId): array
    {
        $mutations = [];

        foreach ($order->items as $item) {
            $product = $item->product;

            if (! $product) {
                continue;
            }

            $ingredients = $product->ingredients;

            foreach ($ingredients as $ingredient) {
                if (! $ingredient->track_stock) {
                    continue;
                }

                $quantityNeeded = (float) $ingredient->pivot->quantity_needed;
                $conversionFactor = (float) $ingredient->pivot->conversion_factor;
                $totalToRestore = $quantityNeeded * $conversionFactor * $item->quantity;

                $stockBefore = (float) $ingredient->stock_quantity;
                $stockAfter = round($stockBefore + $totalToRestore, 3);

                $ingredient->update(['stock_quantity' => $stockAfter]);

                $mutations[] = StockMutation::create([
                    'ingredient_id'  => $ingredient->id,
                    'user_id'        => $userId,
                    'type'           => StockMutation::TYPE_IN,
                    'quantity'       => $totalToRestore,
                    'stock_before'   => $stockBefore,
                    'stock_after'    => $stockAfter,
                    'reference_type' => 'order',
                    'reference_id'   => $order->id,
                    'reference_note' => "Pengembalian bahan via Void Order #{$order->invoice_number}",
                ]);
            }
        }

        return $mutations;
    }
}
