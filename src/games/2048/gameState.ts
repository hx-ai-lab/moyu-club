import { newBoard } from './logic'
import { GAME_2048_SAVE_VERSION, loadGame2048Best, loadGame2048Save, type Game2048Save, type StorageLike } from '../../storage'

export const createGame2048 = (random = Math.random): Game2048Save => ({ version: GAME_2048_SAVE_VERSION, board: newBoard(random), score: 0, best: 0, over: false, won: false })
export const initialGame2048 = (storage?: StorageLike, random = Math.random): Game2048Save => loadGame2048Save(storage) ?? { ...createGame2048(random), best: loadGame2048Best(storage) }
export const restartedGame2048 = (best: number, random = Math.random): Game2048Save => ({ ...createGame2048(random), best })
