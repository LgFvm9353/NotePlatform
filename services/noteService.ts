import { localDB } from '@/lib/db'

export interface Note {
  id: string
  title: string
  content: string
  updatedAt: string
  categoryId?: string | null
  tagIds?: string[]
  [key: string]: any
}

class NoteService {
  // 获取笔记列表（优先 API，失败则回退到本地）
  async getNotes(params: any = {}) {
    if (navigator.onLine) {
      try {
        // 构建 URL 查询参数
        const queryParams = new URLSearchParams()
        if (params.page) queryParams.append('page', params.page.toString())
        if (params.limit) queryParams.append('limit', params.limit.toString())
        if (params.search) queryParams.append('search', params.search)
        if (params.categoryId && params.categoryId !== 'all') queryParams.append('categoryId', params.categoryId)
        if (params.tagId && params.tagId !== 'all') queryParams.append('tagId', params.tagId)

        const response = await fetch(`/api/notes?${queryParams.toString()}`)
        
        if (response.ok) {
          const data = await response.json()
          
          // 简单策略：在线时以服务器数据为准，顺便更新本地缓存
          // 注意：这里不做复杂的全量同步，避免本地脏数据干扰
          // 在实际生产中，应该有一个更完善的 Sync Engine
          
          // 仅当是第一页且无搜索筛选时，才考虑清理本地旧数据（可选）
          // 目前策略：覆盖/新增
          data.notes.forEach((note: any) => localDB.saveNote(note))
          
          return data
        } else {
          // 服务器错误（4xx, 5xx）：区分可恢复和不可恢复的错误
          // 401/403: 认证错误，应该抛出，不回退
          // 500: 服务器错误，可能临时，可以回退到本地
          if (response.status === 401 || response.status === 403) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || `认证错误: ${response.status}`)
          }
          // 其他错误（400, 500等）回退到离线模式
          console.warn(`API 返回错误 ${response.status}，回退到离线模式`)
          // 继续执行离线逻辑
        }
      } catch (error: any) {
        // 判断是否是网络错误（TypeError: Failed to fetch）
        // 网络错误应该回退到离线模式
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          console.warn("网络错误，回退到离线模式:", error)
          // 继续执行离线逻辑
        } else {
          // 其他错误（如认证错误）直接抛出
          console.error("API 获取失败:", error)
          throw error
        }
      }
    }


    // 离线模式：从本地读取
    // 注意：本地 IndexedDB 查询比较简单，不支持复杂的服务端搜索/分页逻辑
    // 这里做一个简单的全量过滤模拟
    const allNotes = await localDB.getAllNotes()
    let filtered = allNotes

    if (params.search) {
      const q = params.search.toLowerCase()
      filtered = filtered.filter((n: any) => 
        n.title?.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q)
      )
    }
    
    // 简单的内存分页
    const page = params.page || 1
    const limit = params.limit || 50
    const start = (page - 1) * limit
    const paginated = filtered.slice(start, start + limit)

    return {
      notes: paginated,
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit)
      }
    }
  }

  async getNote(id: string) {
    if (navigator.onLine) {
      try {
        const response = await fetch(`/api/notes/${id}`)
        if (response.ok) {
          const data = await response.json()
          localDB.saveNote(data.note)
          return data.note
        }
      } catch (error) {
        console.warn("API 获取详情失败，尝试读取本地:", error)
      }
    }
    return localDB.getNote(id)
  }

  async createNote(noteData: Partial<Note>) {
    // 生成临时 ID (如果离线)
    const tempId = crypto.randomUUID()
    const newNote = { ...noteData, id: tempId, updatedAt: new Date().toISOString() }

    if (navigator.onLine) {
      try {
        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(noteData),
        })
        if (response.ok) {
          const data = await response.json()
          localDB.saveNote(data.note)
          return data.note
        }
      } catch (error) {
        console.error("API 创建失败:", error)
        // 网络请求失败也视为离线处理
      }
    }

    // 离线处理
    await localDB.saveNote(newNote)
    await localDB.addToSyncQueue('CREATE_NOTE', newNote)
    return newNote
  }

  async updateNote(id: string, noteData: Partial<Note>) {
    if (navigator.onLine) {
      try {
        const response = await fetch(`/api/notes/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(noteData),
        })
        if (response.ok) {
          const data = await response.json()
          localDB.saveNote(data.note)
          return data.note
        }
      } catch (error) {
        console.warn("API 更新失败，转入离线模式:", error)
      }
    }

    // 离线处理
    // 先获取旧数据合并
    const oldNote = await localDB.getNote(id) || {}
    const updatedNote = { ...oldNote, ...noteData, updatedAt: new Date().toISOString() }
    
    await localDB.saveNote(updatedNote)
    await localDB.addToSyncQueue('UPDATE_NOTE', { id, ...noteData })
    return updatedNote
  }

  async deleteNote(id: string) {
    if (navigator.onLine) {
      try {
        const response = await fetch(`/api/notes/${id}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          await localDB.deleteNote(id)
          return true
        }
      } catch (error) {
        console.warn("API 删除失败:", error)
      }
    }

    await localDB.deleteNote(id)
    await localDB.addToSyncQueue('DELETE_NOTE', { id })
    return true
  }
}

export const noteService = new NoteService()

