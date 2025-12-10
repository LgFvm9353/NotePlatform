
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { Header } from "@/components/layout/Header"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  Clock, 
  Tag as TagIcon, 
} from "lucide-react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import "highlight.js/styles/github-dark.css" 
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { NoteViewToolbar } from "@/components/notes/NoteViewToolbar"

// Server Component 直接获取数据，无需 useEffect 和 useState
async function getNote(noteId: string, userId: string) {
  const note = await prisma.note.findUnique({
    where: {
      id: noteId,
      authorId: userId, // 确保只能访问自己的笔记
    },
    include: {
      category: true,
      tags: true,
    }
  })
  return note
}

export default async function ViewNotePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/login")
  }

  const note = await getNote(params.id, session.user.id)

  if (!note) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* 拆分出的客户端组件 */}
      <NoteViewToolbar noteId={note.id} />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <article className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Article Header */}
          <header className="mb-8 pb-8 border-b border-border/40">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-6 leading-tight">
              {note.title}
            </h1>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5" title="创建时间">
                  <Calendar className="h-4 w-4" />
                  <span>{format(note.createdAt, "yyyy年MM月dd日", { locale: zhCN })}</span>
                </div>
                <div className="flex items-center gap-1.5" title="最后更新">
                  <Clock className="h-4 w-4" />
                  <span>{format(note.updatedAt, "HH:mm", { locale: zhCN })}</span>
                </div>
              </div>

              {(note.category || note.tags.length > 0) && (
                <div className="flex items-center gap-3 flex-wrap">
                  {note.category && (
                    <Link href={`/categories?id=${note.category.id}`} className="hover:opacity-80 transition-opacity">
                      <Badge 
                        variant="outline" 
                        className="rounded-md pl-1 pr-2 py-0.5 font-normal border-muted-foreground/20 bg-background"
                      >
                        <div 
                          className="w-2 h-2 rounded-full mr-2" 
                          style={{ backgroundColor: note.category.color || "currentColor" }} 
                        />
                        {note.category.name}
                      </Badge>
                    </Link>
                  )}
                  
                  {note.tags.length > 0 && (
                    <div className="flex items-center gap-2">
                      {note.tags.map((tag) => (
                        <span key={tag.id} className="inline-flex items-center text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                          <TagIcon className="h-3 w-3 mr-1 opacity-50" />
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </header>

          {/* Article Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-a:text-primary hover:prose-a:underline prose-img:rounded-lg prose-img:shadow-md">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-8 mb-4" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-6 mb-3 pb-1 border-b" {...props} />,
                code: ({node, className, children, ...props}: any) => {
                  const match = /language-(\w+)/.exec(className || '')
                  const isInline = !match
                  return (
                    <code 
                      className={cn(
                        className, 
                        isInline ? "bg-muted px-1.5 py-0.5 rounded font-mono text-sm text-pink-500" : "block bg-[#0d1117] p-4 rounded-lg overflow-x-auto text-sm"
                      )} 
                      {...props}
                    >
                      {children}
                    </code>
                  )
                },
                blockquote: ({node, ...props}) => (
                   <blockquote className="border-l-4 border-primary/30 bg-muted/30 pl-4 py-1 pr-2 italic rounded-r-lg my-4" {...props} />
                ),
                // [优化] 自定义图片渲染，使用原生 img + lazy loading，避免 SSR 中 next/image 的复杂配置
                // 如果是外部图片且未配置 remotePatterns，next/image 会报错。
                // 这里的保守策略是使用原生 img 并优化属性。
                img: ({node, src, alt, ...props}) => {
                  if (!src) return null
                  return (
                    <span className="block my-6 relative rounded-lg overflow-hidden shadow-md">
                        <img 
                            src={src} 
                            alt={alt || "note image"} 
                            loading="lazy" 
                            decoding="async"
                            className="w-full h-auto object-cover max-h-[600px]"
                            {...props} 
                        />
                    </span>
                  )
                },
                table: ({node, ...props}) => (
                  <div className="overflow-x-auto my-4 rounded-lg border">
                    <table className="w-full" {...props} />
                  </div>
                ),
                th: ({node, ...props}) => <th className="bg-muted px-4 py-2 text-left font-semibold border-b" {...props} />,
                td: ({node, ...props}) => <td className="px-4 py-2 border-b last:border-0" {...props} />,
              }}
            >
              {note.content}
            </ReactMarkdown>
          </div>
          
          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
            <p>End of Note</p>
          </div>
        </article>
      </main>
    </div>
  )
}
