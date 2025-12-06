import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const categorySchema = z.object({
  name: z.string().min(1, "分类名称不能为空"),
  color: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})

// GET - 获取分类列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const categories = await prisma.category.findMany({
      where: {
        authorId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: { notes: true }
        }
      }
    })

    return NextResponse.json({ categories })
  } catch (error: any) {
    console.error("获取分类列表错误:", error)
    return NextResponse.json(
      { error: "获取分类列表失败" },
      { status: 500 }
    )
  }
}

// POST - 创建分类
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const body = await request.json()
    const data = categorySchema.parse(body)

    // 检查分类是否已存在
    const existing = await prisma.category.findFirst({
      where: {
        authorId: session.user.id,
        name: data.name,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "该分类已存在" },
        { status: 400 }
      )
    }

    // 创建分类
    const category = await prisma.category.create({
      data: {
        ...data,
        authorId: session.user.id,
      },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "输入验证失败", details: error.errors },
        { status: 400 }
      )
    }
    console.error("创建分类错误:", error)
    return NextResponse.json(
      { error: "创建分类失败" },
      { status: 500 }
    )
  }
}
