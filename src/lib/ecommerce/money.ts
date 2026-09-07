/**
 * Money helpers.
 *
 * NOTE ON PRECISION: money fields on Product/Order/etc. are Prisma `Float`
 * columns because SQLite has no reliable native Decimal type. All arithmetic
 * here rounds to 2 decimal places before persisting/displaying to avoid
 * floating point drift (e.g. 19.99 * 3 = 59.97000000000001). A production
 * migration to PostgreSQL should switch these columns to `Decimal(10,2)`
 * and this rounding becomes a formatting-only concern.
 */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function sum(values: number[]): number {
  return round2(values.reduce((acc, v) => acc + v, 0));
}
