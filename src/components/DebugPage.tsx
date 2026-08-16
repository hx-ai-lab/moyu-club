import { useEffect, useState } from 'react'
import { getGame2048RecoverySource, hasGame2048Save, loadGame2048Best, loadGame2048Save, parseGame2048Save } from '../storage'
import { getIndexedDbDiagnostics, loadIndexedGame2048, loadIndexedGame2048Best } from '../storage/indexedDb'

type DebugState = { registration: ServiceWorkerRegistration | null; controlled: boolean; cacheVersion: string; persisted: string; indexedSave: ReturnType<typeof parseGame2048Save>; indexedBest: number }

export function DebugPage({ onBack }: { onBack: () => void }) {
  const save = loadGame2048Save()
  const [debug, setDebug] = useState<DebugState>({ registration: null, controlled: Boolean(navigator.serviceWorker?.controller), cacheVersion: '未知', persisted: '不支持', indexedSave: null, indexedBest: 0 })
  useEffect(() => {
    let active = true
    const receive = (event: MessageEvent) => {
      if (active && event.data?.type === 'SW_DEBUG_INFO') setDebug(current => ({ ...current, cacheVersion: event.data.cacheVersion }))
    }
    navigator.serviceWorker?.addEventListener('message', receive)
    void navigator.serviceWorker?.getRegistration(import.meta.env.BASE_URL).then(registration => {
      if (!active) return
      setDebug(current => ({ ...current, registration: registration ?? null, controlled: Boolean(navigator.serviceWorker.controller) }))
      navigator.serviceWorker.controller?.postMessage({ type: 'GET_DEBUG_INFO' })
    })
    void navigator.storage?.persisted?.().then(persisted => active && setDebug(current => ({ ...current, persisted: persisted ? '是' : '否' })))
    void Promise.all([loadIndexedGame2048(), loadIndexedGame2048Best()]).then(([value, best]) => active && setDebug(current => ({ ...current, indexedSave: parseGame2048Save(value), indexedBest: Number.isSafeInteger(best) && (best as number) >= 0 ? best as number : 0 })))
    return () => { active = false; navigator.serviceWorker?.removeEventListener('message', receive) }
  }, [])
  const iosNavigator = navigator as Navigator & { standalone?: boolean }
  const standalone = matchMedia('(display-mode: standalone)').matches || Boolean(iosNavigator.standalone)
  const indexed = getIndexedDbDiagnostics()
  const rows: [string, string | number][] = [
    ['运行模式', standalone ? 'standalone' : 'browser'], ['Service Worker 已注册', debug.registration ? '是' : '否'],
    ['当前页面受控', debug.controlled ? '是' : '否'], ['Service Worker scope', debug.registration?.scope ?? '—'],
    ['缓存版本', debug.cacheVersion], ['存在 2048 当前局', hasGame2048Save() ? '是' : '否'],
    ['当前保存分数', save?.score ?? '—'], ['当前历史最高分', save?.best ?? '—'], ['当前存档版本', save?.version ?? '—'],
    ['IndexedDB 是否支持', indexed.supported ? '是' : '否'], ['数据库是否可以打开', indexed.opened ? '是' : '否'],
    ['IndexedDB 当前局是否存在', debug.indexedSave ? '是' : '否'], ['IndexedDB 当前分数', debug.indexedSave?.score ?? '—'],
    ['IndexedDB 历史最高分', Math.max(debug.indexedSave?.best ?? 0, debug.indexedBest) || '—'], ['IndexedDB 存档版本', debug.indexedSave?.version ?? '—'], ['IndexedDB updatedAt', debug.indexedSave?.updatedAt ?? '—'],
    ['localStorage 当前局是否存在', hasGame2048Save() ? '是' : '否'], ['localStorage 当前分数', save?.score ?? '—'],
    ['localStorage 历史最高分', Math.max(save?.best ?? 0, loadGame2048Best()) || '—'], ['localStorage 存档版本', save?.version ?? '—'], ['localStorage updatedAt', save?.updatedAt ?? '—'],
    ['本次游戏恢复来源', getGame2048RecoverySource()], ['IndexedDB open 错误', indexed.openError ?? '—'],
    ['IndexedDB read 错误', indexed.readError ?? '—'], ['IndexedDB write 错误', indexed.writeError ?? '—'],
    ['持久化存储', debug.persisted],
  ]
  return <main className="debug-page"><nav><button className="icon-button" onClick={onBack} aria-label="返回首页">←</button><strong>运行诊断</strong><span /></nav><dl>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></main>
}
