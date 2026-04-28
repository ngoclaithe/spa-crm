/**
 * Giữ tối đa chữ số, dùng làm khóa tìm kiếm/unique.
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').replace(/^84/, '0') || phone.trim();
}
