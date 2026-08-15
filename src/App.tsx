import { useState } from 'react'
import { GameCard } from './components/GameCard'
import { Game2048 } from './games/2048/Game2048'
import type { GameDefinition } from './types'

const games: GameDefinition[] = [
  { id: '2048', icon: '🎮', title: '2048', description: '合并数字，摸到 2048', playable: true },
  { id: 'mines', icon: '💣', title: '扫雷', description: '通勤路上排雷', playable: false },
  { id: 'sudoku', icon: '🔢', title: '数独', description: '让脑子醒一醒', playable: false },
  { id: 'memory', icon: '🃏', title: '记忆翻牌', description: '记性在线吗？', playable: false },
  { id: 'match', icon: '✨', title: '消消乐', description: '消掉一点班味', playable: false },
  { id: 'tetris', icon: '🧱', title: '俄罗斯方块', description: '把碎片放整齐', playable: false },
]

export default function App() {
  const [route, setRoute] = useState(location.hash === '#2048' ? '2048' : 'home')
  const go = (next: string) => { location.hash = next === 'home' ? '' : next; setRoute(next) }
  if (route === '2048') return <Game2048 onBack={() => go('home')} />
  return <main className="home"><header><div className="brand-mark">M / G</div><p className="eyebrow">METRO MINI GAMES</p><h1>摸鱼<br/>游戏厅</h1><p className="subtitle">地铁 · 高铁 · 排队 · 发呆专用</p></header><section className="game-list" aria-label="游戏列表">{games.map(game => <GameCard key={game.id} game={game} onPlay={() => go(game.id)} />)}</section><footer><span className="offline-dot"/> 无网也能玩 · 数据只留在本机</footer></main>
}
