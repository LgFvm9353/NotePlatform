import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

// GET - 搜索笔记
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q") || ""
    const categoryId = searchParams.get("categoryId")
    const tagId = searchParams.get("tagId")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const sortBy = searchParams.get("sortBy") || "updatedAt"
    const order = searchParams.get("order") || "desc"

    const where: Prisma.NoteWhereInput = {
      authorId: session.user.id,
    }

    // 关键词搜索
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
      ]
    }

    // 分类筛选
    if (categoryId) {
      where.categoryId = categoryId
    }

    // 标签筛选
    if (tagId) {
      where.tags = {
        some: {
          id: tagId
        }
      }
    }

    // 获取总数
    const total = await prisma.note.count({ where })

    // 获取数据
    const notes = await prisma.note.findMany({
      where,
      include: {
        category: true,
        tags: true,
      },
      orderBy: {
        [sortBy]: order
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
    console.error("搜索错误:", error)
    return NextResponse.json(
      { error: "搜索失败" },
      { status: 500 }
    )
  }
}
