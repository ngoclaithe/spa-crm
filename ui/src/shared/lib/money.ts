export type DiscountMode = 'VND' | 'PERCENT';

export function computeAmountDue(
  subtotal: number,
  discountType: DiscountMode,
  discountValue: number,
): number {
  const s = Math.max(0, Math.floor(subtotal));
  if (discountType === 'VND') {
    return Math.max(0, s - Math.min(s, Math.max(0, Math.floor(discountValue))));
  }
  const pct = Math.max(0, Math.min(100, Math.floor(discountValue)));
  return Math.max(0, Math.round(s * (1 - pct / 100)));
}

export function formatVnd(n: number) {
  return n.toLocaleString('vi-VN', { style: 'decimal', maximumFractionDigits: 0 });
}
