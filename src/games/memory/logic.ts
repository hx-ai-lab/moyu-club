import type { Card } from './types'
export const SYMBOLS=['◆','●','▲','★','✿','☂','♞','♫']
export function createDeck(random=Math.random):Card[]{const d=SYMBOLS.flatMap((symbol,i)=>[{id:i*2,symbol,matched:false},{id:i*2+1,symbol,matched:false}]);for(let i=d.length-1;i;i--){const j=Math.floor(random()*(i+1));[d[i],d[j]]=[d[j],d[i]]}return d}
export const isMatch=(a:Card,b:Card)=>a.id!==b.id&&a.symbol===b.symbol
export const memoryWon=(cards:Card[])=>cards.every(c=>c.matched)
