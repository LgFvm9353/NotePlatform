import OpenAI from 'openai'

let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('Missing OPENAI_API_KEY environment variable')
    }
    openaiClient = new OpenAI({
      apiKey,
      baseURL: process.env.OPENAI_BASE_URL, // Optional: for compatible APIs
    })
  }
  return openaiClient
}

export async function generateEmbedding(text: string) {
  // 移除 Markdown 格式，仅保留文本，减少 Token 消耗并提高语义准确度
  const cleanText = text.replace(/[#*`_~\[\]()]/g, '').replace(/\n+/g, ' ').trim()
  
  if (!cleanText) return null

  try {
    const openai = getOpenAIClient()
    const response = await openai.embeddings.create({
      model: process.env.OPENAI_MODEL_EMBEDDING || 'text-embedding-3-small',
      input: cleanText,
      encoding_format: 'float',
    })

    return response.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    return null
  }
}

export async function generateSummary(text: string) {
  if (!text) return null

  try {
    const openai = getOpenAIClient()
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL_CHAT || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `你是专业笔记整理助手，擅长快速抓取核心信息、去芜存菁。请针对以下笔记内容，生成50-100字的简洁摘要：
1. 提炼核心观点/关键结论，不遗漏核心信息；
2. 剔除冗余描述、重复内容，语言精炼无废话；
3. 逻辑连贯、条理清晰，优先按原文逻辑顺序整合；
4. 保留笔记中关键数据/核心概念（如专有名词、核心结论），无需额外拓展。`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      max_tokens: 150,
    })

    return response.choices[0].message.content
  } catch (error) {
    console.error('Error generating summary:', error)
    return null
  }
}
