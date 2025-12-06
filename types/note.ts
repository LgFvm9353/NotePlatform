/**
 * 笔记相关的 TypeScript 类型定义
 */

export interface Note {
  id: string
  title: string
  content: string
  summary?: string
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
  
  authorId: string
  author?: User
  
  categoryId?: string
  category?: Category
  
  tags?: Tag[]
}

export interface Category {
  id: string
  name: string
  color?: string
  description?: string
  createdAt: Date
  updatedAt: Date
  
  authorId: string
  author?: User
  
  notes?: Note[]
}

export interface Tag {
  id: string
  name: string
  color?: string
  createdAt: Date
  updatedAt: Date
  
  authorId: string
  author?: User
  
  notes?: Note[]
}

export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

export interface NoteListResponse {
  notes: Note[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface NoteCreateInput {
  title: string
  content: string
  categoryId?: string
  tagIds?: string[]
}

export interface NoteUpdateInput extends Partial<NoteCreateInput> {
  id: string
}

export interface SearchParams {
  q?: string
  categoryId?: string
  tagId?: string
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'updatedAt' | 'title'
  order?: 'asc' | 'desc'
}

