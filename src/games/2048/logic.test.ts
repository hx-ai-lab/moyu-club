import { describe, expect, it } from 'vitest'
import { canMove, move } from './logic'
describe('2048 logic', () => {
  it('merges each pair only once', () => expect(move([[2,2,2,2],[0,0,0,0],[0,0,0,0],[0,0,0,0]], 'left')).toMatchObject({ board: [[4,4,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]], score: 8, moved: true }))
  it('moves vertically', () => expect(move([[2,0,0,0],[2,0,0,0],[4,0,0,0],[0,0,0,0]], 'down').board.map(r => r[0])).toEqual([0,0,4,4]))
  it('detects game over', () => expect(canMove([[2,4,2,4],[4,2,4,2],[2,4,2,4],[4,2,4,2]])).toBe(false))
})
