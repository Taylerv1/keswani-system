export function isShallowDirty<T extends object>(
  initial: T,
  current: T,
  keys?: readonly (keyof T)[],
): boolean {
  const keysToCheck = keys ?? (Object.keys(initial) as (keyof T)[]);

  for (const key of keysToCheck) {
    if (initial[key] !== current[key]) return true;
  }

  return false;
}

export function isJsonDirty(initial: unknown, current: unknown): boolean {
  try {
    return JSON.stringify(initial) !== JSON.stringify(current);
  } catch {
    return true;
  }
}
