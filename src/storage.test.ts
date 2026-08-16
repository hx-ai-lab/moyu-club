import { describe, expect, it } from 'vitest'
import { createGame2048, initialGame2048, restartedGame2048 } from './games/2048/gameState'
import { GAME_2048_SAVE_VERSION, loadGame2048Save, saveGame2048, STORAGE_KEYS, type Game2048Save, type StorageLike } from './storage'

class MemoryStorage implements StorageLike {
  values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
}

const board = [[2, 4, 8, 16], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]
const saved: Game2048Save = { version: GAME_2048_SAVE_VERSION, board, score: 30, best: 128, over: false, won: true }

describe('2048 storage', () => {
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
    expect(initialGame2048(storage, () => 0)).toEqual(createGame2048(() => 0))
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
    const storage = new MemoryStorage(); storage.setItem(STORAGE_KEYS.game2048, JSON.stringify({ ...saved, version: undefined }))
    expect(loadGame2048Save(storage)).toEqual(saved)
  })
})
