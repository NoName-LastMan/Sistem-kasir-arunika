<?php

namespace App\Services;

use App\Models\ModifierItem;
use App\Models\Product;
use Illuminate\Validation\ValidationException;

class OrderPricingService
{
    /**
     * Hitung pricing breakdown untuk satu baris item.
     */
    public function calculateLineItem(array $item): array
    {
        $product = Product::findOrFail($item['product_id']);

        $itemTotalPrice = round((float) $product->price, 2);
        $modifiersData  = [];

        if (! empty($item['modifiers'])) {
            foreach ($item['modifiers'] as $mod) {
                $modifierItem = ModifierItem::findOrFail($mod['id']);
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
        return round(($taxableAmount * $taxRate) / 100, 2);
    }

    /**
     * Hitung kembalian tunai. Throw jika uang kurang.
     */
    public function calculateChangeDue(float $totalAmount, float $cashTendered): float
    {
        if ($cashTendered < $totalAmount) {
            throw ValidationException::withMessages([
                'cash_tendered' => ['Uang tunai kurang dari total tagihan'],
            ]);
        }

        return round($cashTendered - $totalAmount, 2);
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

        foreach ($items as $item) {
            $line     = $this->calculateLineItem($item);
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
