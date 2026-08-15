import { useEffect, useRef, useState } from 'react'
import { addRandom, canMove, move, newBoard, type Board, type Direction } from './logic'
import { readJSON, STORAGE_KEYS, updateStats, writeJSON } from '../../storage'

type Save = { board: Board; score: number; best: number; over: boolean; won: boolean }
const initial = (): Save => readJSON<Save>(STORAGE_KEYS.game2048, { board: newBoard(), score: 0, best: 0, over: false, won: false })
export function Game2048({ onBack }: { onBack: () => void }) {
  const [game, setGame] = useState(initial), [notice, setNotice] = useState<'won'|'over'|null>(game.over ? 'over' : null), [pulse, setPulse] = useState(0)
  const touch = useRef({ x: 0, y: 0 })
  useEffect(() => writeJSON(STORAGE_KEYS.game2048, game), [game])
  const act = (direction: Direction) => setGame(current => {
    if (current.over) return current
    const result = move(current.board, direction); if (!result.moved) return current
    const board = addRandom(result.board), score = current.score + result.score, best = Math.max(current.best, score), wonNow = !current.won && board.some(row => row.some(v => v >= 2048)), over = !canMove(board)
    if (wonNow) { setNotice('won'); const stats = readJSON(STORAGE_KEYS.stats, { gamesPlayed: 0, wins: 0, recentGame: null }); updateStats({ wins: stats.wins + 1 }) }
    if (over) setNotice('over'); setPulse(p => p + 1)
    return { board, score, best, won: current.won || wonNow, over }
  })
  useEffect(() => { const key = (e: KeyboardEvent) => { const map: Record<string, Direction> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }; if (map[e.key]) { e.preventDefault(); act(map[e.key]) } }; addEventListener('keydown', key); return () => removeEventListener('keydown', key) })
  const restart = () => { if (!confirm('确定重新开始？这一局的进度会消失。')) return; const best = game.best; setGame({ board: newBoard(), score: 0, best, over: false, won: false }); setNotice(null); const stats = readJSON(STORAGE_KEYS.stats, { gamesPlayed: 0, wins: 0, recentGame: null }); updateStats({ gamesPlayed: stats.gamesPlayed + 1, recentGame: '2048' }) }
  return <main className="game-page"><nav><button className="icon-button" onClick={onBack} aria-label="返回首页">←</button><span>2048</span><button className="text-button" onClick={restart}>重新开始</button></nav><section className="score-row"><div><small>当前分数</small><strong key={`s${pulse}`}>{game.score}</strong></div><div><small>历史最高</small><strong>{game.best}</strong></div></section><section className="board-wrap"><div className="board" onTouchStart={e => { const t=e.touches[0]; touch.current={x:t.clientX,y:t.clientY} }} onTouchEnd={e => { const t=e.changedTouches[0], dx=t.clientX-touch.current.x, dy=t.clientY-touch.current.y; if (Math.max(Math.abs(dx),Math.abs(dy)) < 24) return; act(Math.abs(dx)>Math.abs(dy) ? (dx>0?'right':'left') : (dy>0?'down':'up')) }} aria-label="2048 棋盘">{game.board.flatMap((row,r) => row.map((value,c) => <div className={`tile tile-${value || 0} ${value ? 'born' : ''}`} key={`${r}-${c}-${value}-${pulse}`}><span>{value || ''}</span></div>))}</div>{notice && <div className="game-modal"><strong>{notice === 'won' ? '2048！漂亮。' : '本局结束'}</strong><p>{notice === 'won' ? '还能继续冲更高数字。' : `最终得分 ${game.score}`}</p><button onClick={() => notice === 'won' ? setNotice(null) : restart()}>{notice === 'won' ? '继续挑战' : '再来一局'}</button></div>}</section><p className="hint">滑动棋盘合并数字 · 方向键也可以</p></main>
}
