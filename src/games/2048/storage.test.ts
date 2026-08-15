import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GAME_2048_STORAGE_KEYS, loadBestScore, loadCurrentGame, saveBestScore, saveCurrentGame, type Game2048Save } from './storage'

const values = new Map<string, string>()
const localStorageMock = {
  getItem: vi.fn((key: string) => values.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => { values.set(key, value) }),
  removeItem: vi.fn((key: string) => { values.delete(key) }),
}

describe('2048 current-game storage', () => {
  beforeEach(() => {
    values.clear()
    vi.stubGlobal('localStorage', localStorageMock)
  })

  it('saves and restores the complete unfinished game', () => {
    const save: Game2048Save = {
      version: 1,
      board: [[2, 4, 8, 16], [0, 2, 4, 8], [0, 0, 2, 4], [0, 0, 0, 2]],
      score: 128,
      won: false,
      over: false,
    }
    saveCurrentGame(save)
    expect(loadCurrentGame()).toEqual(save)
  })

  it('replaces a corrupt current game without clearing the best score', () => {
    values.set(GAME_2048_STORAGE_KEYS.current, '{broken json')
    saveBestScore(4096)
    const restored = loadCurrentGame()
    expect(restored.board.flat().filter(Boolean)).toHaveLength(2)
    expect(restored.score).toBe(0)
    expect(loadBestScore()).toBe(4096)
  })
})
