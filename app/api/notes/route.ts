import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { generateEmbedding } from "@/lib/openai"

const noteSchema = z.object({
  title: z.string().min(1, "标题不能为空"),
  content: z.string(),
  categoryId: z.string().nullable().optional(),
  tagIds: z.array(z.string()).optional(),
})

// GET - 获取笔记列表
export async function GET(request: NextRequest) {
  // ... (GET code remains the same) ...
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const categoryId = searchParams.get("categoryId")
    const tagId = searchParams.get("tagId")
    const search = searchParams.get("search")

    const where: Prisma.NoteWhereInput = {
      authorId: session.user.id,
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (tagId) {
      where.tags = {
        some: {
          id: tagId
        }
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ]
    }

    // 获取总数
    const total = await prisma.note.count({ where })

    // 获取分页数据
    const notes = await prisma.note.findMany({
      where,
      include: {
        category: true,
        tags: true,
      },
      orderBy: {
        updatedAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit,
    })

    return NextResponse.json({
      notes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    })
  } catch (error: any) {
    console.error("获取笔记列表错误:", error)
    // 详细日志
    if (error?.code) console.error("Error Code:", error.code)
    
    return NextResponse.json(
      { error: "获取笔记列表失败", details: error.message },
      { status: 500 }
    )
  }
}

// POST - 创建笔记
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const body = await request.json()
    const data = noteSchema.parse(body)

    // 创建笔记
    const note = await prisma.note.create({
      data: {
        title: data.title,
        content: data.content,
        authorId: session.user.id,
        categoryId: data.categoryId || null,
        tags: {
          connect: data.tagIds?.map(id => ({ id })) || []
        }
      },
      include: {
        category: true,
        tags: true,
      }
    })

    // 生成 Embedding (异步，失败不影响创建)
    // 注意：如果数据库 vector 扩展未启用，这一步会失败，我们 catch 住它
    try {
      const embedding = await generateEmbedding(`${note.title}\n${note.content}`)
      if (embedding) {
        await prisma.$executeRaw`
          UPDATE "Note"
          SET embedding = ${embedding}::vector
          WHERE id = ${note.id}
        `
      }
    } catch (embeddingError) {
      console.error("Embedding 生成或存储失败:", embeddingError)
    }

    return NextResponse.json({ note }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "输入验证失败", details: error.errors },
        { status: 400 }
      )
    }
    console.error("创建笔记错误:", error)
    return NextResponse.json(
      { error: "创建笔记失败" },
      { status: 500 }
    )
  }
}

