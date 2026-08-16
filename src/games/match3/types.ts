export type TileKind = 0 | 1 | 2 | 3 | 4 | 5
export type Tile = { id: number; kind: TileKind }
export type Cell = Tile | null
export type Board = Cell[][]
export type Position = { row: number; col: number }

