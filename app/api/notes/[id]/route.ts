import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { generateEmbedding } from "@/lib/openai"

export const dynamic = 'force-dynamic'

const updateNoteSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  tagIds: z.array(z.string()).optional(),
})

// GET - 获取单篇笔记
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const note = await prisma.note.findUnique({
      where: {
        id: params.id,
        authorId: session.user.id,
      },
      include: {
        category: true,
        tags: true,
      }
    })

    if (!note) {
      return NextResponse.json({ error: "笔记不存在" }, { status: 404 })
    }

    return NextResponse.json({ note })
  } catch (error: any) {
    console.error("获取笔记错误:", error)
    return NextResponse.json(
      { error: "获取笔记失败" },
      { status: 500 }
    )
  }
}

// PUT - 更新笔记
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const body = await request.json()
    const data = updateNoteSchema.parse(body)

    // 检查笔记是否存在且属于当前用户
    const existingNote = await prisma.note.findUnique({
      where: {
        id: params.id,
        authorId: session.user.id,
      }
    })

    if (!existingNote) {
      return NextResponse.json({ error: "笔记不存在" }, { status: 404 })
    }

    // 准备更新数据
    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.content !== undefined) updateData.content = data.content
    if (data.categoryId !== undefined) {
      updateData.categoryId = data.categoryId || null
    }

    // 如果提供了标签，更新标签关联
    if (data.tagIds !== undefined) {
      updateData.tags = {
        set: data.tagIds.map(id => ({ id }))
      }
    }

    // 更新笔记
    const note = await prisma.note.update({
      where: {
        id: params.id,
      },
      data: updateData,
      include: {
        category: true,
        tags: true,
      }
    })

    // 更新 Embedding (异步)
    // 只有当标题或内容发生变化时才重新生成
    if (data.title !== undefined || data.content !== undefined) {
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
        console.error("Embedding 更新失败:", embeddingError)
      }
    }

    return NextResponse.json({ note })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "输入验证失败", details: error.errors },
        { status: 400 }
      )
    }
    console.error("更新笔记错误:", error)
    return NextResponse.json(
      { error: "更新笔记失败" },
      { status: 500 }
    )
  }
}

// DELETE - 删除笔记
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    // 检查笔记是否存在且属于当前用户
    const existingNote = await prisma.note.findUnique({
      where: {
        id: params.id,
        authorId: session.user.id,
      }
    })

    if (!existingNote) {
      return NextResponse.json({ error: "笔记不存在" }, { status: 404 })
    }

    // 删除笔记
    await prisma.note.delete({
      where: {
        id: params.id,
      }
    })

    return NextResponse.json({ success: true, message: "删除成功" })
  } catch (error: any) {
    console.error("删除笔记错误:", error)
    return NextResponse.json(
      { error: "删除笔记失败" },
      { status: 500 }
    )
  }
}

