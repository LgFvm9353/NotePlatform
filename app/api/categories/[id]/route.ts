import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

export const dynamic = 'force-dynamic'

const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})

// PUT - 更新分类
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
    const data = updateCategorySchema.parse(body)

    // 检查分类是否存在且属于当前用户
    const existingCategory = await prisma.category.findUnique({
      where: {
        id: params.id,
        authorId: session.user.id,
      }
    })

    if (!existingCategory) {
      return NextResponse.json({ error: "分类不存在" }, { status: 404 })
    }

    // 更新分类
    const category = await prisma.category.update({
      where: {
        id: params.id,
      },
      data: {
        ...data,
      }
    })

    return NextResponse.json({ category })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "输入验证失败", details: error.errors },
        { status: 400 }
      )
    }
    console.error("更新分类错误:", error)
    return NextResponse.json(
      { error: "更新分类失败" },
      { status: 500 }
    )
  }
}

// DELETE - 删除分类
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    // 检查分类是否存在且属于当前用户
    const existingCategory = await prisma.category.findUnique({
      where: {
        id: params.id,
        authorId: session.user.id,
      }
    })

    if (!existingCategory) {
      return NextResponse.json({ error: "分类不存在" }, { status: 404 })
    }

    // 删除分类
    await prisma.category.delete({
      where: {
        id: params.id,
      }
    })

    return NextResponse.json({ success: true, message: "删除成功" })
  } catch (error: any) {
    console.error("删除分类错误:", error)
    return NextResponse.json(
      { error: "删除分类失败" },
      { status: 500 }
    )
  }
}
