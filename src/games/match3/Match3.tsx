import { useRef, useState } from 'react'
import { calculateScore, collapseBoard, createBoard, findMatches, hasPossibleMove, isLegalSwap, refillBoard, removeMatches, shuffleBoard, swapTiles } from './logic'
import type { Board, Position } from './types'

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const symbols = ['◆', '●', '▲', '✚', '■', '⬟']
const same = (a: Position, b: Position) => a.row === b.row && a.col === b.col

export function Match3({ onBack }: { onBack: () => void }) {
  const [board, setBoard] = useState<Board>(() => createBoard())
  const [selected, setSelected] = useState<Position | null>(null)
  const [moving, setMoving] = useState<[Position, Position] | null>(null)
  const [removing, setRemoving] = useState<Position[]>([])
  const [score, setScore] = useState(0), [moves, setMoves] = useState(30), [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0), [cleared, setCleared] = useState(0)
  const [locked, setLocked] = useState(false), [ended, setEnded] = useState(false)
  const [message, setMessage] = useState('点选两个相邻棋子，或滑动交换')
  const pointer = useRef<{ position: Position; x: number; y: number } | null>(null)

  const settle = async (start: Board, remaining: number) => {
    let current = start, chain = 0
    while (true) {
      const matches = findMatches(current)
      if (!matches.length) break
      chain++; setCombo(chain); setMaxCombo(value => Math.max(value, chain)); setRemoving(matches)
      setMessage(chain >= 2 ? `Combo ×${chain}` : '漂亮！')
      setScore(value => value + calculateScore(matches.length, chain)); setCleared(value => value + matches.length)
      if (chain >= 3) navigator.vibrate?.(35)
      await wait(210); current = collapseBoard(removeMatches(current, matches)); setRemoving([]); setBoard(current)
      await wait(170); current = refillBoard(current); setBoard(current); await wait(240)
    }
    setCombo(0)
    if (remaining === 0) { setEnded(true); setLocked(false); return }
    if (!hasPossibleMove(current)) {
      setMessage('没有可消除组合，正在重新洗牌'); await wait(700)
      current = shuffleBoard(current); setBoard(current); await wait(250)
    }
    setMessage('继续摸鱼，继续消除'); setLocked(false)
  }

  const attempt = async (a: Position, b: Position) => {
    if (locked || !board[a.row]?.[a.col] || !board[b.row]?.[b.col]) return
    if (Math.abs(a.row - b.row) + Math.abs(a.col - b.col) !== 1) { setSelected(b); return }
    setLocked(true); setSelected(null); setMoving([a, b]); await wait(180)
    const swapped = swapTiles(board, a, b); setBoard(swapped); setMoving(null)
    if (!isLegalSwap(board, a, b)) {
      setMessage('这一步消不了'); setMoving([b, a]); await wait(180); setBoard(board); setMoving(null)
      navigator.vibrate?.(10); setLocked(false); return
    }
    navigator.vibrate?.(15)
    const remaining = moves - 1; setMoves(remaining); await settle(swapped, remaining)
  }
  const choose = (position: Position) => {
    if (locked) return
    if (!selected) setSelected(position)
    else if (same(selected, position)) setSelected(null)
    else void attempt(selected, position)
  }
  const reset = () => {
    setBoard(createBoard()); setScore(0); setMoves(30); setCombo(0); setMaxCombo(0); setCleared(0)
    setEnded(false); setLocked(false); setMessage('新一局，开摸！')
  }
  const transform = (position: Position) => {
    if (!moving) return undefined
    const [a, b] = moving
    if (same(position, a)) return `translate(${(b.col - a.col) * 100}%, ${(b.row - a.row) * 100}%)`
    if (same(position, b)) return `translate(${(a.col - b.col) * 100}%, ${(a.row - b.row) * 100}%)`
  }

  return <main className="game-page match3-page">
    <nav><button className="icon-button" onClick={onBack} aria-label="返回">←</button><span>消消乐</span><button className="text-button" onClick={reset}>重新开始</button></nav>
    <section className="match3-stats"><div><small>分数</small><strong>{score}</strong></div><div><small>COMBO</small><strong>×{combo}</strong></div><div><small>剩余步数</small><strong>{moves}</strong></div></section>
    <p className="match3-message" aria-live="polite">{message}</p><div className="board-wrap">
      <div className={`match3-board ${locked ? 'locked' : ''}`}>{board.flatMap((row, r) => row.map((value, c) => {
        const position = { row: r, col: c }, fading = removing.some(item => same(item, position))
        return <button key={value?.id ?? `${r}-${c}`} aria-label={value ? `棋子 ${symbols[value.kind]}` : '空位'} className={`match3-tile kind-${value?.kind ?? 0} ${selected && same(selected, position) ? 'selected' : ''} ${fading ? 'removing' : ''}`} style={{ transform: transform(position) }} onClick={() => choose(position)} onPointerDown={event => { pointer.current = { position, x: event.clientX, y: event.clientY } }} onPointerUp={event => {
          const start = pointer.current; pointer.current = null; if (!start || locked) return
          const dx = event.clientX - start.x, dy = event.clientY - start.y
          if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return
          const target = Math.abs(dx) > Math.abs(dy) ? { row: start.position.row, col: start.position.col + Math.sign(dx) } : { row: start.position.row + Math.sign(dy), col: start.position.col }
          if (board[target.row]?.[target.col]) void attempt(start.position, target)
        }}>{value && <span aria-hidden>{symbols[value.kind]}</span>}</button>
      }))}</div>
      {ended && <section className="game-modal"><strong>本局完成</strong><p>得分 {score}<br/>最大 Combo ×{maxCombo}<br/>共消除 {cleared} 枚棋子</p><button onClick={reset}>再来一局</button><button className="modal-back" onClick={onBack}>返回游戏厅</button></section>}
    </div><p className="hint">每次有效交换消耗 1 步 · 自动连锁不耗步数</p>
  </main>
}
