import type { GameDefinition } from '../types'

export function GameCard({ game, onPlay }: { game: GameDefinition; onPlay: () => void }) {
  return <button className={`game-card ${game.playable ? 'playable' : ''}`} disabled={!game.playable} onClick={onPlay}>
    <span className="game-icon" aria-hidden>{game.icon}</span><span className="game-copy"><strong>{game.title}</strong><small>{game.description}</small></span>
    <span className="status">{game.playable ? '开始玩' : '即将上线'}</span>
  </button>
}
