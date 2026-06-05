/** Stable unique id for client-side entities. */
export function makeId(): string {
  return crypto.randomUUID();
}
