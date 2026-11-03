<?php

namespace App\Services;

use App\Models\ModifierItem;
use App\Models\Product;
use Illuminate\Validation\ValidationException;

class OrderPricingService
{
    /**
     * Hitung pricing breakdown untuk satu baris item.
     * Mendukung preloaded collection untuk mencegah N+1 query saat checkout banyak item.
     */
    public function calculateLineItem(
        array $item,
        ?\Illuminate\Support\Collection $preloadedProducts = null,
        ?\Illuminate\Support\Collection $preloadedModifiers = null
    ): array {
        $product = $preloadedProducts?->get($item['product_id']) ?? Product::findOrFail($item['product_id']);

        $itemTotalPrice = round((float) $product->price, 2);
        $modifiersData  = [];

        if (! empty($item['modifiers'])) {
            foreach ($item['modifiers'] as $mod) {
                $modId = $mod['id'] ?? null;
                $modifierItem = $modId ? ($preloadedModifiers?->get($modId) ?? ModifierItem::findOrFail($modId)) : null;
                if (! $modifierItem) continue;

                $modPrice     = round((float) $modifierItem->price, 2);
                $itemTotalPrice = round($itemTotalPrice + $modPrice, 2);

                $modifiersData[] = [
                    'modifier_item_id' => $modifierItem->id,
                    'unit_price'       => $modifierItem->price,
                    'subtotal'         => round($modPrice * $item['quantity'], 2),
                ];
            }
        }

        $rowSubtotal = round($itemTotalPrice * $item['quantity'], 2);

        return [
            'product_model' => $product,
            'product_id'    => $product->id,
            'unit_price'    => $product->price,
            'quantity'      => $item['quantity'],
            'subtotal'      => $rowSubtotal,
            'notes'         => $item['notes'] ?? null,
            'modifiers'     => $modifiersData,
        ];
    }

    /**
     * Hitung jumlah diskon (persen atau nominal, ter-clamp).
     */
    public function calculateDiscount(float $subtotal, ?string $discountType, ?float $discountValue): float
    {
        $discountType  = $discountType ?? 'none';
        $discountValue = round($discountValue ?? 0, 2);

        return match ($discountType) {
            'percentage' => round(
                ($subtotal * min(100, max(0, $discountValue))) / 100, 2
            ),
            'fixed' => round(
                min($subtotal, max(0, $discountValue)), 2
            ),
            default => 0.0,
        };
    }

    /**
     * Hitung pajak dari jumlah taxable.
     */
    public function calculateTax(float $taxableAmount, float $taxRate): float
    {
        return round(($taxableAmount * max(0.0, $taxRate)) / 100, 2);
    }

    /**
     * Hitung kembalian tunai. Throw jika uang kurang dengan proteksi presisi float IEEE 754.
     */
    public function calculateChangeDue(float $totalAmount, float $cashTendered): float
    {
        $roundedTendered = round($cashTendered, 2);
        $roundedTotal    = round($totalAmount, 2);

        if ($roundedTendered < $roundedTotal) {
            throw ValidationException::withMessages([
                'cash_tendered' => ['Uang tunai kurang dari total tagihan'],
            ]);
        }

        return max(0.0, round($roundedTendered - $roundedTotal, 2));
    }

    /**
     * Full order pricing breakdown — entry point utama.
     */
    public function calculateOrderPricing(
        array   $items,
        ?string $discountType = null,
        ?float  $discountValue = null,
        float   $taxRate = 10.0,
        ?float  $cashTendered = null,
        ?string $paymentMethod = null,
    ): array {
        $subtotal  = 0.0;
        $lineItems = [];

        // Batch pre-load semua produk dan modifier sekaligus (mengurangi puluhan query menjadi hanya 2 query)
        $productIds = array_unique(array_filter(array_column($items, 'product_id')));
        $preloadedProducts = ! empty($productIds)
            ? Product::whereIn('id', $productIds)->get()->keyBy('id')
            : collect();

        $modifierIds = [];
        foreach ($items as $item) {
            if (! empty($item['modifiers'])) {
                foreach ($item['modifiers'] as $mod) {
                    if (! empty($mod['id'])) {
                        $modifierIds[] = $mod['id'];
                    }
                }
            }
        }
        $modifierIds = array_unique($modifierIds);
        $preloadedModifiers = ! empty($modifierIds)
            ? ModifierItem::whereIn('id', $modifierIds)->get()->keyBy('id')
            : collect();

        foreach ($items as $item) {
            $line     = $this->calculateLineItem($item, $preloadedProducts, $preloadedModifiers);
            $subtotal = round($subtotal + $line['subtotal'], 2);
            $lineItems[] = $line;
        }

        $discountAmount = $this->calculateDiscount($subtotal, $discountType, $discountValue);
        $taxableAmount  = round(max(0, $subtotal - $discountAmount), 2);
        $taxAmount      = $this->calculateTax($taxableAmount, $taxRate);
        $totalAmount    = round($taxableAmount + $taxAmount, 2);

        $changeDue = null;
        if ($paymentMethod === 'cash' && $cashTendered !== null) {
            $changeDue = $this->calculateChangeDue($totalAmount, $cashTendered);
        }

        return [
            'line_items'      => $lineItems,
            'subtotal'        => $subtotal,
            'discount_amount' => $discountAmount,
            'taxable_amount'  => $taxableAmount,
            'tax_rate'        => $taxRate,
            'tax_amount'      => $taxAmount,
            'total_amount'    => $totalAmount,
            'change_due'      => $changeDue,
        ];
    }
}
