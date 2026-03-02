/** Lightweight runtime validators for tool parameters. */

export function positiveInt(value: unknown, name: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`${name} must be a positive integer, got: ${String(value)}`);
  }
  return n;
}

export function nonNegativeInt(value: unknown, name: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(
      `${name} must be a non-negative integer, got: ${String(value)}`,
    );
  }
  return n;
}

export function nonEmptyString(value: unknown, name: string): string {
  const s = typeof value === "string" ? value.trim() : "";
  if (!s) {
    throw new Error(`${name} must be a non-empty string`);
  }
  return s;
}

export function optionalString(value: unknown): string | undefined {
  if (value == null) return undefined;
  const s = typeof value === "string" ? value.trim() : "";
  return s || undefined;
}

export function optionalPositiveInt(
  value: unknown,
  name: string,
): number | undefined {
  if (value == null) return undefined;
  return positiveInt(value, name);
}

export function optionalNonNegativeInt(
  value: unknown,
  name: string,
): number | undefined {
  if (value == null) return undefined;
  return nonNegativeInt(value, name);
}

export function enumValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
  name: string,
  fallback: T,
): T {
  if (value == null) return fallback;
  const s = String(value);
  if (!allowed.includes(s as T)) {
    throw new Error(
      `${name} must be one of: ${allowed.join(", ")}. Got: ${s}`,
    );
  }
  return s as T;
}

export function optionalStringArray(
  value: unknown,
  name: string,
): string[] | undefined {
  if (value == null) return undefined;
  if (!Array.isArray(value)) {
    throw new Error(`${name} must be an array of strings`);
  }
  return value.map((v) => String(v));
}
