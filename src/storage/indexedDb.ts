import type { Game2048Save } from '../storage'

const DATABASE_NAME = 'moyu-club'
const DATABASE_VERSION = 1
const STORE_NAME = 'game-saves'
const GAME_KEY = '2048'
const BEST_KEY = '2048-best'

export type IndexedDbDiagnostics = {
  supported: boolean
  opened: boolean
  openError: string | null
  readError: string | null
  writeError: string | null
}

const diagnostics: IndexedDbDiagnostics = {
  supported: typeof indexedDB !== 'undefined', opened: false,
  openError: null, readError: null, writeError: null,
}

const errorMessage = (error: unknown) => error instanceof Error ? error.message : String(error)

export function getIndexedDbDiagnostics(): IndexedDbDiagnostics {
  return { ...diagnostics, supported: typeof indexedDB !== 'undefined' }
}

let databasePromise: Promise<IDBDatabase> | null = null

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('IndexedDB is not supported'))
  if (databasePromise) return databasePromise
  const opening = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME)
    }
    request.onsuccess = () => { diagnostics.opened = true; diagnostics.openError = null; resolve(request.result) }
    request.onerror = () => reject(request.error ?? new Error('Unable to open IndexedDB'))
    request.onblocked = () => reject(new Error('IndexedDB upgrade is blocked'))
  }).catch((error: unknown) => {
    diagnostics.openError = errorMessage(error)
    databasePromise = null
    throw error
  })
  databasePromise = opening
  return opening
}

async function read(key: string): Promise<unknown | null> {
  try {
    const database = await openDatabase()
    const value = await new Promise<unknown>((resolve, reject) => {
      const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('Unable to read IndexedDB'))
    })
    diagnostics.readError = null
    return value ?? null
  } catch (error) {
    diagnostics.readError = errorMessage(error)
    return null
  }
}

async function write(key: string, value: unknown): Promise<boolean> {
  try {
    const database = await openDatabase()
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      transaction.objectStore(STORE_NAME).put(value, key)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error ?? new Error('Unable to write IndexedDB'))
      transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB write was aborted'))
    })
    diagnostics.writeError = null
    return true
  } catch (error) {
    diagnostics.writeError = errorMessage(error)
    return false
  }
}

export const loadIndexedGame2048 = () => read(GAME_KEY)
export const loadIndexedGame2048Best = () => read(BEST_KEY)

export async function saveIndexedGame2048(save: Game2048Save): Promise<boolean> {
  const saved = await write(GAME_KEY, save)
  const bestSaved = await write(BEST_KEY, save.best)
  return saved && bestSaved
}

export async function deleteIndexedGame2048(): Promise<boolean> {
  try {
    const database = await openDatabase()
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      transaction.objectStore(STORE_NAME).delete(GAME_KEY)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error ?? new Error('Unable to delete IndexedDB save'))
    })
    return true
  } catch (error) {
    diagnostics.writeError = errorMessage(error)
    return false
  }
}
