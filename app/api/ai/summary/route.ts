import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generateSummary } from "@/lib/openai"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const { content } = await request.json()

    if (!content || content.length < 50) {
      return NextResponse.json({ error: "内容太短，无法生成摘要" }, { status: 400 })
    }

    const summary = await generateSummary(content)

    if (!summary) {
      return NextResponse.json({ error: "生成摘要失败" }, { status: 500 })
    }

    return NextResponse.json({ summary })
  } catch (error: any) {
    console.error("AI 摘要错误:", error)
    return NextResponse.json({ error: "生成摘要失败" }, { status: 500 })
  }
}

