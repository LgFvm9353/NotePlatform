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
           // 如果是服务器错误 (500) 或 客户端错误 (400)，抛出异常，不要静默回退到本地脏数据
           // 只有网络错误（fetch 抛出异常）才走 catch 块进行离线 fallback
           const errorData = await response.json().catch(() => ({}))
           throw new Error(errorData.error || `API Error: ${response.status}`)
        }
      } catch (error) {
        console.error("API 获取失败:", error)
        // 区分网络错误和其他错误
        // 如果是明确的 API 错误（如 500），最好让用户知道，而不是显示旧数据
        // 但为了离线可用性，这里可以保留 fallback，但在 UI 层需要提示
        throw error // 暂时直接抛出，让 UI 显示错误，解决"数据不一致"的困惑
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

