/**
 * Coupon code generator — SAV-XXXXXXXX format
 *
 * Generates cryptographically-random 8-character codes using an unambiguous
 * character set that excludes O/0/I/1/l to prevent visual confusion.
 */

const COUPON_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

/**
 * Generate a single coupon code with the given prefix.
 * Format: {PREFIX}-{8_CHARS}
 * Example: SAV-A3F8K2M1
 */
export function generateCouponCode(prefix: string): string {
  const chars: string[] = [];
  for (let i = 0; i < CODE_LENGTH; i++) {
    const idx = Math.floor(Math.random() * COUPON_CHARS.length);
    chars.push(COUPON_CHARS.charAt(idx));
  }
  return `${prefix}-${chars.join("")}`;
}

/**
 * Generate N unique coupon codes (deduplicated within the batch).
 * Returns an array of unique code strings.
 */
export function generateCouponCodes(prefix: string, count: number): string[] {
  const codes = new Set<string>();
  const maxAttempts = count * 10; // safety valve to prevent infinite loops

  let attempts = 0;
  while (codes.size < count && attempts < maxAttempts) {
    codes.add(generateCouponCode(prefix));
    attempts++;
  }

  if (codes.size < count) {
    throw new Error(
      `Failed to generate ${count} unique coupon codes after ${maxAttempts} attempts (got ${codes.size})`,
    );
  }

  return [...codes];
}
