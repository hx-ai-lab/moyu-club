export const STORAGE_KEYS = { stats: 'moyu:stats:v1' } as const

export type Stats = { gamesPlayed: number; wins: number; recentGame: string | null }
export function readJSON<T>(key: string, fallback: T): T {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback } catch { return fallback }
}
export function writeJSON(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* Private mode/storage full: gameplay still works. */ } }
export function updateStats(change: Partial<Stats>) { const current = readJSON<Stats>(STORAGE_KEYS.stats, { gamesPlayed: 0, wins: 0, recentGame: null }); writeJSON(STORAGE_KEYS.stats, { ...current, ...change }) }
