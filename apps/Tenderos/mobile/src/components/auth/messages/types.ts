/**
 * Shared message contracts for auth form screens.
 *
 * Each screen owns its own message file exporting the exact shape
 * it needs. This type is the common contract where screens share
 * the same field pattern (placeholder + hint + errors + success).
 */
export interface FieldMessages {
  /** Input placeholder text */
  placeholder: string
  /** Helper text shown when there is no error */
  hint: string
  /** Error messages keyed by error type */
  errors: Record<string, string>
  /** Shown briefly when the field value is valid */
  success?: string
}

export interface AlertMessages {
  /** Dialog / alert button labels */
  camera: string
  gallery: string
  cancel: string
}
