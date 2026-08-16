import type { Board, Cell, Position, Tile, TileKind } from './types'

export const BOARD_SIZE = 8
export const TILE_KINDS = 6
let nextId = 1
const randomKind = (random = Math.random) => Math.floor(random() * TILE_KINDS) as TileKind
const tile = (kind: TileKind): Tile => ({ id: nextId++, kind })
export const areAdjacent = (a: Position, b: Position) => Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1
export const canSwap = (board: Board, a: Position, b: Position) => Boolean(board[a.row]?.[a.col] && board[b.row]?.[b.col] && areAdjacent(a, b))

export function swapTiles(board: Board, a: Position, b: Position): Board {
  const copy = board.map(row => [...row])
  ;[copy[a.row][a.col], copy[b.row][b.col]] = [copy[b.row][b.col], copy[a.row][a.col]]
  return copy
}

export function findMatches(board: Board): Position[] {
  const found = new Set<string>()
  const scan = (line: Cell[], positions: Position[]) => {
    let start = 0
    for (let i = 1; i <= line.length; i++) {
      if (i < line.length && line[i]?.kind === line[start]?.kind) continue
      if (line[start] && i - start >= 3) for (let j = start; j < i; j++) found.add(`${positions[j].row},${positions[j].col}`)
      start = i
    }
  }
  board.forEach((row, r) => scan(row, row.map((_, c) => ({ row: r, col: c }))))
  for (let c = 0; c < board[0].length; c++) scan(board.map(row => row[c]), board.map((_, r) => ({ row: r, col: c })))
  return [...found].map(key => { const [row, col] = key.split(',').map(Number); return { row, col } })
}

export const isLegalSwap = (board: Board, a: Position, b: Position) => canSwap(board, a, b) && findMatches(swapTiles(board, a, b)).length > 0

export function hasPossibleMove(board: Board): boolean {
  for (let r = 0; r < board.length; r++) for (let c = 0; c < board[r].length; c++) {
    if (c + 1 < board[r].length && isLegalSwap(board, { row: r, col: c }, { row: r, col: c + 1 })) return true
    if (r + 1 < board.length && isLegalSwap(board, { row: r, col: c }, { row: r + 1, col: c })) return true
  }
  return false
}

export function createBoard(size = BOARD_SIZE, random = Math.random): Board {
  for (let attempt = 0; attempt < 1000; attempt++) {
    const board: Board = Array.from({ length: size }, () => Array<Cell>(size).fill(null))
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
      let kind: TileKind
      do kind = randomKind(random)
      while ((c >= 2 && board[r][c - 1]?.kind === kind && board[r][c - 2]?.kind === kind) || (r >= 2 && board[r - 1][c]?.kind === kind && board[r - 2][c]?.kind === kind))
      board[r][c] = tile(kind)
    }
    if (hasPossibleMove(board)) return board
  }
  throw new Error('无法生成可玩的棋盘')
}

export function removeMatches(board: Board, matches: Position[]): Board {
  const copy = board.map(row => [...row])
  matches.forEach(({ row, col }) => { copy[row][col] = null })
  return copy
}

export function collapseBoard(board: Board): Board {
  const result: Board = Array.from({ length: board.length }, () => Array<Cell>(board[0].length).fill(null))
  for (let c = 0; c < board[0].length; c++) {
    const values = board.map(row => row[c]).filter((value): value is Tile => value !== null)
    let r = board.length - 1
    for (let i = values.length - 1; i >= 0; i--) result[r--][c] = values[i]
  }
  return result
}

export function refillBoard(board: Board, random = Math.random): Board {
  return board.map(row => row.map(value => value ?? tile(randomKind(random))))
}

export function shuffleBoard(board: Board, random = Math.random): Board {
  const source = board.flat().filter((value): value is Tile => value !== null)
  for (let attempt = 0; attempt < 1000; attempt++) {
    const shuffled = [...source]
    for (let i = shuffled.length - 1; i; i--) { const j = Math.floor(random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]] }
    const candidate = Array.from({ length: board.length }, (_, r) => shuffled.slice(r * board[0].length, (r + 1) * board[0].length))
    if (!findMatches(candidate).length && hasPossibleMove(candidate)) return candidate
  }
  return createBoard(board.length, random)
}

export function calculateScore(count: number, combo: number): number {
  const base = count === 3 ? 30 : count === 4 ? 50 : count >= 5 ? 80 + (count - 5) * 20 : count * 10
  return Math.round(base * (1 + Math.max(0, combo - 1) * .5))
}
