import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { generateEmbedding } from "@/lib/openai"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const { query, limit = 5, threshold = 0.5 } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: "搜索内容不能为空" }, { status: 400 })
    }

    // 生成查询文本的向量
    const embedding = await generateEmbedding(query)

    if (!embedding) {
      return NextResponse.json({ error: "无法生成搜索向量" }, { status: 500 })
    }

    // 执行向量相似度查询
    // 注意：这里假设数据库已经启用了 vector 扩展，并且 embedding 列类型正确
    // 1 - (embedding <=> query) 计算余弦相似度 (1为完全相同, 0为完全不同)
    const results = await prisma.$queryRaw`
      SELECT 
        id, 
        title, 
        content, 
        "updatedAt",
        1 - (embedding <=> ${embedding}::vector) as similarity
      FROM "Note"
      WHERE 
        "authorId" = ${session.user.id} 
        AND embedding IS NOT NULL
        AND 1 - (embedding <=> ${embedding}::vector) > ${threshold}
      ORDER BY similarity DESC
      LIMIT ${limit};
    `

    return NextResponse.json({ results })
  } catch (error: any) {
    console.error("语义搜索错误:", error)
    
    // 如果是数据库错误（例如 vector 扩展未启用），给予友好提示
    if (error.message?.includes('vector')) {
      return NextResponse.json({ 
        error: "语义搜索服务暂不可用（数据库未启用向量扩展）" 
      }, { status: 503 })
    }

    return NextResponse.json({ error: "搜索失败" }, { status: 500 })
  }
}

