import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

export const dynamic = 'force-dynamic'

const tagSchema = z.object({
  name: z.string().min(1, "标签名称不能为空"),
  color: z.string().nullable().optional(),
})

// GET - 获取标签列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const tags = await prisma.tag.findMany({
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

    return NextResponse.json({ tags })
  } catch (error: any) {
    console.error("获取标签列表错误:", error)
    return NextResponse.json(
      { error: "获取标签列表失败" },
      { status: 500 }
    )
  }
}

// POST - 创建标签
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const body = await request.json()
    const data = tagSchema.parse(body)

    // 检查标签是否已存在
    const existing = await prisma.tag.findFirst({
      where: {
        authorId: session.user.id,
        name: data.name,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "该标签已存在" },
        { status: 400 }
      )
    }

    // 创建标签
    const tag = await prisma.tag.create({
      data: {
        ...data,
        authorId: session.user.id,
      },
    })

    return NextResponse.json({ tag }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "输入验证失败", details: error.errors },
        { status: 400 }
      )
    }
    console.error("创建标签错误:", error)
    return NextResponse.json(
      { error: "创建标签失败" },
      { status: 500 }
    )
  }
}
