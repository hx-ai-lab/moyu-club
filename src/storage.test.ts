import { beforeEach, describe, expect, it, vi } from 'vitest'

const indexed = vi.hoisted(() => ({ loadGame: vi.fn(), loadBest: vi.fn(), save: vi.fn() }))
vi.mock('./storage/indexedDb', () => ({
  loadIndexedGame2048: indexed.loadGame,
  loadIndexedGame2048Best: indexed.loadBest,
  saveIndexedGame2048: indexed.save,
}))
import { createGame2048, initialGame2048, restartedGame2048 } from './games/2048/gameState'
import { GAME_2048_SAVE_VERSION, getGame2048RecoverySource, loadGame2048Save, persistGame2048, restoreGame2048, saveGame2048, STORAGE_KEYS, type Game2048Save, type StorageLike } from './storage'

class MemoryStorage implements StorageLike {
  values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
}

const board = [[2, 4, 8, 16], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]
const saved: Game2048Save = { version: GAME_2048_SAVE_VERSION, board, score: 30, best: 128, over: false, won: true, updatedAt: 100 }

describe('2048 storage', () => {
  beforeEach(() => {
    indexed.loadGame.mockReset().mockResolvedValue(null)
    indexed.loadBest.mockReset().mockResolvedValue(null)
    indexed.save.mockReset().mockResolvedValue(true)
  })
  it('saves and restores the current board, score, best and state', () => {
    const storage = new MemoryStorage(); saveGame2048(saved, storage)
    expect(loadGame2048Save(storage)).toEqual(saved)
    expect(storage.getItem(STORAGE_KEYS.best2048)).toBe('128')
  })
  it('restores an existing game instead of creating a new board', () => {
    const storage = new MemoryStorage(); saveGame2048(saved, storage)
    expect(initialGame2048(storage, () => 0).board).toEqual(board)
  })
  it('creates a game only when there is no valid save', () => {
    const storage = new MemoryStorage()
    const beforeCreation = Date.now()
    const created = initialGame2048(storage, () => 0)
    const afterCreation = Date.now()
    const expected = createGame2048(() => 0)

    expect(created).toMatchObject({ version: expected.version, board: expected.board, score: expected.score, best: expected.best, over: expected.over, won: expected.won })
    expect(created.updatedAt).toBeGreaterThanOrEqual(beforeCreation)
    expect(created.updatedAt).toBeLessThanOrEqual(afterCreation)
  })
  it('tolerates corrupt and structurally invalid saves', () => {
    const storage = new MemoryStorage(); storage.setItem(STORAGE_KEYS.game2048, '{broken')
    expect(loadGame2048Save(storage)).toBeNull()
    storage.setItem(STORAGE_KEYS.game2048, JSON.stringify({ ...saved, board: [[2]] }))
    expect(loadGame2048Save(storage)).toBeNull()
  })
  it('restarts the current game without clearing the best score', () => {
    const restarted = restartedGame2048(512, () => 0)
    expect(restarted).toMatchObject({ score: 0, best: 512, won: false, over: false })
    expect(restarted.board.flat().filter(Boolean)).toEqual([2, 2])
  })
  it('keeps a separately saved best score if the current game is missing', () => {
    const storage = new MemoryStorage(); storage.setItem(STORAGE_KEYS.best2048, '1024')
    expect(initialGame2048(storage, () => 0).best).toBe(1024)
  })
  it('migrates the previous unversioned save shape', () => {
    const storage = new MemoryStorage(); storage.setItem(STORAGE_KEYS.game2048, JSON.stringify({ ...saved, version: undefined, updatedAt: undefined }))
    expect(loadGame2048Save(storage)).toEqual({ ...saved, updatedAt: 0 })
  })

  it('writes every valid save to localStorage and IndexedDB', async () => {
    const storage = new MemoryStorage(); persistGame2048(saved, storage)
    expect(loadGame2048Save(storage)).toEqual(saved)
    expect(indexed.save).toHaveBeenCalledWith(saved)
  })
  it('restores IndexedDB and refreshes localStorage', async () => {
    const storage = new MemoryStorage(); indexed.loadGame.mockResolvedValue(saved)
    const restored = await restoreGame2048(best => ({ ...createGame2048(() => 0), best }), storage)
    expect(restored).toEqual(saved)
    expect(loadGame2048Save(storage)).toEqual(saved)
    expect(getGame2048RecoverySource()).toBe('IndexedDB')
  })
  it('falls back from corrupt IndexedDB to localStorage and migrates old saves', async () => {
    const storage = new MemoryStorage(); saveGame2048(saved, storage)
    indexed.loadGame.mockResolvedValue({ ...saved, board: [[3]] })
    expect(await restoreGame2048(best => ({ ...createGame2048(() => 0), best }), storage)).toEqual(saved)
    expect(indexed.save).toHaveBeenCalledWith(saved)
    expect(getGame2048RecoverySource()).toBe('migrated-from-localStorage')
  })
  it('chooses and synchronizes the newer save by updatedAt in either store', async () => {
    const storage = new MemoryStorage(), newerLocal = { ...saved, score: 40, updatedAt: 200 }
    saveGame2048(newerLocal, storage); indexed.loadGame.mockResolvedValue(saved)
    expect((await restoreGame2048(best => ({ ...createGame2048(() => 0), best }), storage)).score).toBe(40)
    expect(indexed.save).toHaveBeenLastCalledWith(newerLocal)

    const newerIndexed = { ...saved, score: 50, updatedAt: 300 }
    indexed.loadGame.mockResolvedValue(newerIndexed)
    expect((await restoreGame2048(best => ({ ...createGame2048(() => 0), best }), storage)).score).toBe(50)
    expect(loadGame2048Save(storage)?.score).toBe(50)
  })
  it('protects the greatest separate best when the current game is missing', async () => {
    const storage = new MemoryStorage(); storage.setItem(STORAGE_KEYS.best2048, '1024'); indexed.loadBest.mockResolvedValue(2048)
    const restored = await restoreGame2048(best => ({ ...createGame2048(() => 0), best }), storage)
    expect(restored.best).toBe(2048)
  })
  it('continues with localStorage when IndexedDB is unavailable or rejects writes', async () => {
    const storage = new MemoryStorage(); indexed.loadGame.mockResolvedValue(null); indexed.loadBest.mockResolvedValue(null)
    indexed.save.mockResolvedValue(false)
    const restored = await restoreGame2048(best => ({ ...createGame2048(() => 0), best }), storage)
    expect(restored.board.flat().filter(Boolean)).toEqual([2, 2])
    persistGame2048(saved, storage)
    expect(loadGame2048Save(storage)).toEqual(saved)
  })
  it('still creates a playable game when localStorage is unavailable', async () => {
    const unavailable: StorageLike = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') }, removeItem: () => {} }
    const restored = await restoreGame2048(best => ({ ...createGame2048(() => 0), best }), unavailable)
    expect(restored.board.flat().filter(Boolean)).toEqual([2, 2])
  })
})
