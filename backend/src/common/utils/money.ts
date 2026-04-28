import { DiscountType } from '@prisma/client';

/**
 * Tính CẦN THU sau giảm. discountValue: VND hoặc 0–100 nếu PERCENT.
 */
export function computeAmountDue(
  subtotal: number,
  discountType: DiscountType,
  discountValue: number,
): number {
  const s = Math.max(0, Math.floor(subtotal));
  if (discountType === 'VND') {
    return Math.max(0, s - Math.min(s, Math.max(0, Math.floor(discountValue))));
  }
  const pct = Math.max(0, Math.min(100, Math.floor(discountValue)));
  return Math.max(0, Math.round(s * (1 - pct / 100)));
}
