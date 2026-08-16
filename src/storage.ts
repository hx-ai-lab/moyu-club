import type { Board } from './games/2048/logic'

export const STORAGE_KEYS = {
  game2048: 'moyu:2048:v1',
  best2048: 'moyu:2048:best:v1',
  stats: 'moyu:stats:v1',
} as const

export const GAME_2048_SAVE_VERSION = 2
export type Stats = { gamesPlayed: number; wins: number; recentGame: string | null }
export type Game2048Save = { version: number; board: Board; score: number; best: number; over: boolean; won: boolean }
export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const browserStorage = (): StorageLike | null => {
  try { return typeof localStorage === 'undefined' ? null : localStorage } catch { return null }
}

export function readJSON<T>(key: string, fallback: T, storage = browserStorage()): T {
  if (!storage) return fallback
  try { const value = storage.getItem(key); return value ? JSON.parse(value) as T : fallback } catch { return fallback }
}

export function writeJSON(key: string, value: unknown, storage = browserStorage()) {
  if (!storage) return
  try { storage.setItem(key, JSON.stringify(value)) } catch { /* Private mode/storage full: gameplay still works. */ }
}

const isScore = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0
const isTile = (value: unknown) => value === 0 || (isScore(value) && value >= 2 && (value & (value - 1)) === 0)
const isBoard = (value: unknown): value is Board => Array.isArray(value) && value.length === 4 && value.every(row => Array.isArray(row) && row.length === 4 && row.every(isTile))

export function parseGame2048Save(value: unknown): Game2048Save | null {
  if (!value || typeof value !== 'object') return null
  const save = value as Partial<Game2048Save>
  if (!isBoard(save.board) || !isScore(save.score) || !isScore(save.best) || typeof save.over !== 'boolean' || typeof save.won !== 'boolean') return null
  return { version: GAME_2048_SAVE_VERSION, board: save.board.map(row => [...row]), score: save.score, best: Math.max(save.best, save.score), over: save.over, won: save.won }
}

export function loadGame2048Save(storage = browserStorage()): Game2048Save | null {
  if (!storage) return null
  let parsed: unknown
  try { const raw = storage.getItem(STORAGE_KEYS.game2048); if (!raw) return null; parsed = JSON.parse(raw) } catch { return null }
  const save = parseGame2048Save(parsed)
  if (!save) return null
  const separateBest = readJSON<unknown>(STORAGE_KEYS.best2048, 0, storage)
  if (isScore(separateBest)) save.best = Math.max(save.best, separateBest)
  return save
}

export function loadGame2048Best(storage = browserStorage()): number {
  const best = readJSON<unknown>(STORAGE_KEYS.best2048, 0, storage)
  return isScore(best) ? best : 0
}

export function hasGame2048Save(storage = browserStorage()): boolean {
  if (!storage) return false
  try { return storage.getItem(STORAGE_KEYS.game2048) !== null } catch { return false }
}

export function saveGame2048(save: Game2048Save, storage = browserStorage()) {
  if (!storage) return
  const valid = parseGame2048Save(save)
  if (!valid) return
  writeJSON(STORAGE_KEYS.game2048, valid, storage)
  writeJSON(STORAGE_KEYS.best2048, valid.best, storage)
}

export function updateStats(change: Partial<Stats>) {
  const current = readJSON<Stats>(STORAGE_KEYS.stats, { gamesPlayed: 0, wins: 0, recentGame: null })
  writeJSON(STORAGE_KEYS.stats, { ...current, ...change })
}
