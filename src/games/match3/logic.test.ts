import { describe, expect, it } from 'vitest'
import { areAdjacent, calculateScore, collapseBoard, createBoard, findMatches, hasPossibleMove, isLegalSwap, refillBoard, removeMatches, shuffleBoard, swapTiles } from './logic'
import type { Board, TileKind } from './types'
let id = 0
const board = (rows: (number | null)[][]): Board => rows.map(row => row.map(kind => kind === null ? null : ({ id: ++id, kind: kind as TileKind })))

describe('match3 board', () => {
  it('creates an 8x8 board without matches and with a move', () => { const value = createBoard(); expect(value).toHaveLength(8); expect(value.every(row => row.length === 8)).toBe(true); expect(findMatches(value)).toHaveLength(0); expect(hasPossibleMove(value)).toBe(true) })
  it('finds horizontal 3, 4 and 5', () => { for (const count of [3, 4, 5]) expect(findMatches(board([[...Array(count).fill(1), 2, 3]]))).toHaveLength(count) })
  it('finds a vertical match', () => expect(findMatches(board([[1, 2], [1, 3], [1, 4]]))).toHaveLength(3))
  it('does not count the center of T shapes twice', () => expect(findMatches(board([[2, 1, 3], [1, 1, 1], [2, 1, 3]]))).toHaveLength(5))
  it('does not count the corner of L shapes twice', () => expect(findMatches(board([[1, 2, 3], [1, 3, 2], [1, 1, 1]]))).toHaveLength(5))
  it('only allows adjacent swap attempts', () => { const value = board([[1, 2], [3, 4]]); expect(areAdjacent({row:0,col:0},{row:0,col:1})).toBe(true); expect(areAdjacent({row:0,col:0},{row:1,col:1})).toBe(false); expect(swapTiles(value,{row:0,col:0},{row:0,col:1})[0][0]?.kind).toBe(2) })
  it('rejects swaps without a match', () => expect(isLegalSwap(board([[1,2,3],[2,3,1],[3,1,2]]),{row:0,col:0},{row:0,col:1})).toBe(false))
  it('accepts swaps that create a match', () => expect(isLegalSwap(board([[1,2,1],[3,1,3],[2,3,2]]),{row:0,col:1},{row:1,col:1})).toBe(true))
  it('removes and collapses gaps downward', () => { const value = board([[1],[2],[3]]); const result = collapseBoard(removeMatches(value,[{row:2,col:0}])); expect(result.map(row => row[0]?.kind ?? null)).toEqual([null,1,2]) })
  it('refills every gap and preserves dimensions', () => { const value: Board = [[null,null],[null,null]]; const result = refillBoard(value, () => 0); expect(result).toHaveLength(2); expect(result.flat().every(Boolean)).toBe(true) })
  it('supports another match after collapse/refill', () => { const value = collapseBoard(board([[1,2,3],[2,null,1],[2,3,1],[2,3,1]])); expect(findMatches(value).length).toBeGreaterThan(0) })
  it('detects a dead board', () => expect(hasPossibleMove(board([[0,1,2],[1,2,0],[2,0,1]]))).toBe(false))
  it('shuffles to no immediate matches and a possible move', () => { const value = shuffleBoard(createBoard()); expect(findMatches(value)).toHaveLength(0); expect(hasPossibleMove(value)).toBe(true) })
  it('calculates base and combo scores', () => { expect(calculateScore(3,1)).toBe(30); expect(calculateScore(4,1)).toBe(50); expect(calculateScore(5,1)).toBe(80); expect(calculateScore(3,2)).toBe(45); expect(calculateScore(3,3)).toBe(60) })
})
