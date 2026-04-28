/**
 * YYYY-MM-DD ổn định theo múi giờ.
 */
export function toDateInputString(d: Date = new Date()): string {
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
}
