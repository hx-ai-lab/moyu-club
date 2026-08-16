import { useEffect, useState } from 'react'
import { hasGame2048Save, loadGame2048Save } from '../storage'

type DebugState = { registration: ServiceWorkerRegistration | null; controlled: boolean; cacheVersion: string; persisted: string }

export function DebugPage({ onBack }: { onBack: () => void }) {
  const save = loadGame2048Save()
  const [debug, setDebug] = useState<DebugState>({ registration: null, controlled: Boolean(navigator.serviceWorker?.controller), cacheVersion: '未知', persisted: '不支持' })
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
    return () => { active = false; navigator.serviceWorker?.removeEventListener('message', receive) }
  }, [])
  const iosNavigator = navigator as Navigator & { standalone?: boolean }
  const standalone = matchMedia('(display-mode: standalone)').matches || Boolean(iosNavigator.standalone)
  const rows: [string, string | number][] = [
    ['运行模式', standalone ? 'standalone' : 'browser'], ['Service Worker 已注册', debug.registration ? '是' : '否'],
    ['当前页面受控', debug.controlled ? '是' : '否'], ['Service Worker scope', debug.registration?.scope ?? '—'],
    ['缓存版本', debug.cacheVersion], ['存在 2048 当前局', hasGame2048Save() ? '是' : '否'],
    ['当前保存分数', save?.score ?? '—'], ['当前历史最高分', save?.best ?? '—'], ['当前存档版本', save?.version ?? '—'],
    ['持久化存储', debug.persisted],
  ]
  return <main className="debug-page"><nav><button className="icon-button" onClick={onBack} aria-label="返回首页">←</button><strong>运行诊断</strong><span /></nav><dl>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></main>
}
