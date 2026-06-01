import {
  DEFAULT_CLASS_ID,
  isClassId,
  type ClassId,
} from '../game/classDatabase'

const STORAGE_KEY = 'arena-selected-class'

export function loadSelectedClass(): ClassId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw && isClassId(raw)) return raw
  } catch {
    /* ignore */
  }
  return DEFAULT_CLASS_ID
}

export function saveSelectedClass(classId: ClassId): void {
  localStorage.setItem(STORAGE_KEY, classId)
}
