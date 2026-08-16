import type { Board,Piece } from './types'
export const SHAPES=[[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[0,1,1],[1,1,0]],[[1,1,0],[0,1,1]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]]]
export const emptyBoard=():Board=>Array.from({length:20},()=>Array(10).fill(0))
export const createPiece=(random=Math.random):Piece=>{const kind=Math.floor(random()*7);return{shape:SHAPES[kind].map(r=>[...r]),x:Math.floor((10-SHAPES[kind][0].length)/2),y:0,kind:kind+1}}
export function collides(board:Board,p:Piece,dx=0,dy=0,shape=p.shape){return shape.some((row,r)=>row.some((v,c)=>v&&(p.x+c+dx<0||p.x+c+dx>=10||p.y+r+dy>=20||p.y+r+dy>=0&&board[p.y+r+dy][p.x+c+dx]))) }
export const movePiece=(b:Board,p:Piece,dx:number,dy:number)=>collides(b,p,dx,dy)?p:{...p,x:p.x+dx,y:p.y+dy}
export const rotateShape=(s:number[][])=>s[0].map((_,i)=>s.map(r=>r[i]).reverse())
export function rotatePiece(b:Board,p:Piece){const shape=rotateShape(p.shape);return collides(b,p,0,0,shape)?p:{...p,shape}}
export function lockPiece(b:Board,p:Piece){const n=b.map(r=>[...r]);p.shape.forEach((row,r)=>row.forEach((v,c)=>{if(v&&p.y+r>=0)n[p.y+r][p.x+c]=p.kind}));return n}
export function clearLines(b:Board){const kept=b.filter(r=>r.some(v=>!v)),count=20-kept.length;return{board:[...Array.from({length:count},()=>Array(10).fill(0)),...kept],count}}
export const gameOver=(b:Board,p:Piece)=>collides(b,p)
