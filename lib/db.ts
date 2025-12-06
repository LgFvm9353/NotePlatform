import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface NotePlatformDB extends DBSchema {
  notes: {
    key: string
    value: any
    indexes: { 'by-updated': string }
  }
  categories: {
    key: string
    value: any
  }
  tags: {
    key: string
    value: any
  }
  syncQueue: {
    key: number
    value: {
      id?: number
      type: 'CREATE_NOTE' | 'UPDATE_NOTE' | 'DELETE_NOTE'
      payload: any
      timestamp: number
    }
    indexes: { 'by-timestamp': number }
  }
}

const DB_NAME = 'note-platform-db'
const DB_VERSION = 1

class LocalDB {
  private dbPromise: Promise<IDBPDatabase<NotePlatformDB>>

  constructor() {
    if (typeof window === 'undefined') {
      this.dbPromise = Promise.resolve() as any
      return
    }

    this.dbPromise = openDB<NotePlatformDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Notes store
        if (!db.objectStoreNames.contains('notes')) {
          const noteStore = db.createObjectStore('notes', { keyPath: 'id' })
          noteStore.createIndex('by-updated', 'updatedAt')
        }
        
        // Categories store
        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'id' })
        }

        // Tags store
        if (!db.objectStoreNames.contains('tags')) {
          db.createObjectStore('tags', { keyPath: 'id' })
        }

        // Sync Queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const queueStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true })
          queueStore.createIndex('by-timestamp', 'timestamp')
        }
      },
    })
  }

  async getDB() {
    return this.dbPromise
  }

  // --- Notes Operations ---

  async saveNote(note: any) {
    const db = await this.getDB()
    await db.put('notes', note)
  }

  async getNote(id: string) {
    const db = await this.getDB()
    return db.get('notes', id)
  }

  async getAllNotes() {
    const db = await this.getDB()
    return db.getAllFromIndex('notes', 'by-updated')
  }

  async deleteNote(id: string) {
    const db = await this.getDB()
    await db.delete('notes', id)
  }

  // --- Sync Queue Operations ---

  async addToSyncQueue(type: 'CREATE_NOTE' | 'UPDATE_NOTE' | 'DELETE_NOTE', payload: any) {
    const db = await this.getDB()
    await db.add('syncQueue', {
      type,
      payload,
      timestamp: Date.now(),
    })
  }

  async getSyncQueue() {
    const db = await this.getDB()
    return db.getAllFromIndex('syncQueue', 'by-timestamp')
  }

  async removeFromSyncQueue(id: number) {
    const db = await this.getDB()
    await db.delete('syncQueue', id)
  }

  async clearSyncQueue() {
    const db = await this.getDB()
    await db.clear('syncQueue')
  }

  async updateSyncQueueNoteId(oldId: string, newId: string) {
    const db = await this.getDB()
    const tx = db.transaction('syncQueue', 'readwrite')
    const store = tx.objectStore('syncQueue')
    let cursor = await store.openCursor()

    while (cursor) {
      const item = cursor.value
      let changed = false

      if (item.payload && item.payload.id === oldId) {
        item.payload.id = newId
        changed = true
      }

      if (changed) {
        await cursor.update(item)
      }
      cursor = await cursor.continue()
    }
    
    await tx.done
  }
}

export const localDB = new LocalDB()

