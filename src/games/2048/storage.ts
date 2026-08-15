import { newBoard, type Board } from './logic'

export type Game2048Save = {
  version: 1
  board: Board
  score: number
  won: boolean
  over: boolean
}

export const GAME_2048_STORAGE_KEYS = {
  current: 'moyu:2048:current:v1',
  best: 'moyu:2048:best:v1',
  legacy: 'moyu:2048:v1',
} as const

function isTile(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
    && (value === 0 || Number.isInteger(Math.log2(value)))
}

export function isValidGameSave(value: unknown): value is Game2048Save {
  if (!value || typeof value !== 'object') return false
  const save = value as Partial<Game2048Save>
  return save.version === 1
    && Array.isArray(save.board)
    && save.board.length === 4
    && save.board.every(row => Array.isArray(row) && row.length === 4 && row.every(isTile))
    && typeof save.score === 'number'
    && Number.isSafeInteger(save.score)
    && save.score >= 0
    && typeof save.won === 'boolean'
    && typeof save.over === 'boolean'
}

function readValue(key: string): unknown {
  const raw = localStorage.getItem(key)
  return raw === null ? null : JSON.parse(raw)
}

export function saveCurrentGame(save: Game2048Save): void {
  localStorage.setItem(GAME_2048_STORAGE_KEYS.current, JSON.stringify(save))
}

export function loadBestScore(): number {
  try {
    const best = readValue(GAME_2048_STORAGE_KEYS.best)
    return typeof best === 'number' && Number.isSafeInteger(best) && best >= 0 ? best : 0
  } catch { return 0 }
}

export function saveBestScore(best: number): void {
  localStorage.setItem(GAME_2048_STORAGE_KEYS.best, JSON.stringify(best))
}

function migrateLegacySave(): Game2048Save | null {
  try {
    const legacy = readValue(GAME_2048_STORAGE_KEYS.legacy)
    if (!legacy || typeof legacy !== 'object') return null
    const candidate = { version: 1, ...(legacy as object) }
    if (!isValidGameSave(candidate)) return null
    const legacyBest = (legacy as { best?: unknown }).best
    if (typeof legacyBest === 'number' && legacyBest > loadBestScore()) saveBestScore(legacyBest)
    saveCurrentGame(candidate)
    localStorage.removeItem(GAME_2048_STORAGE_KEYS.legacy)
    return candidate
  } catch { return null }
}

export function createAndSaveGame(): Game2048Save {
  const save: Game2048Save = { version: 1, board: newBoard(), score: 0, won: false, over: false }
  try { saveCurrentGame(save) } catch { /* Storage may be unavailable; the game remains playable. */ }
  return save
}

export function loadCurrentGame(): Game2048Save {
  try {
    const current = readValue(GAME_2048_STORAGE_KEYS.current)
    if (isValidGameSave(current)) return current
    const migrated = migrateLegacySave()
    if (migrated) return migrated
  } catch { /* A malformed save is replaced below. */ }
  return createAndSaveGame()
}
