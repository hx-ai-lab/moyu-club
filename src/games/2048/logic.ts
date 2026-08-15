export type Board = number[][]
export type Direction = 'left' | 'right' | 'up' | 'down'
export type MoveResult = { board: Board; score: number; moved: boolean; merged: string[] }
export const emptyBoard = (): Board => Array.from({ length: 4 }, () => Array(4).fill(0))
export const cloneBoard = (board: Board): Board => board.map(row => [...row])

export function addRandom(board: Board, random = Math.random): Board {
  const next = cloneBoard(board), empty: [number, number][] = []
  next.forEach((row, r) => row.forEach((v, c) => { if (!v) empty.push([r, c]) }))
  if (!empty.length) return next
  const [r, c] = empty[Math.floor(random() * empty.length)]
  next[r][c] = random() < .9 ? 2 : 4
  return next
}
export function newBoard(random = Math.random) { return addRandom(addRandom(emptyBoard(), random), random) }

function collapse(line: number[], row: number): { line: number[]; score: number; merged: string[] } {
  const values = line.filter(Boolean), output: number[] = [], merged: string[] = []; let score = 0
  for (let i = 0; i < values.length; i++) {
    if (values[i] === values[i + 1]) { const value = values[i] * 2; output.push(value); score += value; merged.push(`${row}-${output.length - 1}`); i++ } else output.push(values[i])
  }
  return { line: [...output, ...Array(4 - output.length).fill(0)], score, merged }
}
const transpose = (b: Board): Board => b[0].map((_, c) => b.map(row => row[c]))
export function move(board: Board, direction: Direction): MoveResult {
  const vertical = direction === 'up' || direction === 'down', reverse = direction === 'right' || direction === 'down'
  let oriented = vertical ? transpose(board) : cloneBoard(board); if (reverse) oriented = oriented.map(r => [...r].reverse())
  let score = 0; const merged: string[] = []
  oriented = oriented.map((line, row) => { const result = collapse(line, row); score += result.score; merged.push(...result.merged); return result.line })
  if (reverse) oriented = oriented.map(r => [...r].reverse()); const next = vertical ? transpose(oriented) : oriented
  return { board: next, score, moved: JSON.stringify(next) !== JSON.stringify(board), merged }
}
export function canMove(board: Board) {
  if (board.some(row => row.includes(0))) return true
  return board.some((row, r) => row.some((value, c) => value === row[c + 1] || value === board[r + 1]?.[c]))
}
