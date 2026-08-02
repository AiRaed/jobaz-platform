/** Client-side UUID for inserts when RLS blocks SELECT-after-insert (anonymous assessments). */
export function createRecordId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `rec_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}
