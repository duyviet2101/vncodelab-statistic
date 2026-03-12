import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { StudentRecord } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** True if this student has a model prediction (from field or derived from predicted_tier / p_high / p_disengaged). */
export function hasPrediction(s: StudentRecord): boolean {
  if (s.has_prediction === true) return true
  return (
    (s.predicted_tier != null && String(s.predicted_tier).trim() !== '') ||
    typeof s.p_high === 'number' ||
    typeof s.p_disengaged === 'number'
  )
}
