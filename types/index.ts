import { Prisma } from "@prisma/client"

// Basic types from Prisma
export type { Note, Category, Tag, User } from "@prisma/client"

// Composite types with relations
export type NoteWithRelations = Prisma.NoteGetPayload<{
  include: {
    category: true;
    tags: true;
  }
}>

export type CategoryWithCount = Prisma.CategoryGetPayload<{
  include: {
    _count: {
      select: { notes: true }
    }
  }
}>

export type TagWithCount = Prisma.TagGetPayload<{
  include: {
    _count: {
      select: { notes: true }
    }
  }
}>

export type NoteApiResponse = {
  notes: NoteWithRelations[]
  pagination: {
    total: number
    pages: number
    page: number
    limit: number
    totalPages: number
  }
}

