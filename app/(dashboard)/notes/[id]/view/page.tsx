"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Edit, 
  Calendar, 
  Clock, 
  Folder, 
  Tag as TagIcon, 
  MoreHorizontal,
  Share2,
  Printer
} from "lucide-react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import "highlight.js/styles/github-dark.css" 
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface Note {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  category: {
    id: string
    name: string
    color?: string
  } | null
  tags: {
    id: string
    name: string
    color?: string
  }[]
}

export default function ViewNotePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const noteId = params.id as string

  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchNote = useCallback(async () => {
    try {
      const response = await fetch(`/api/notes/${noteId}`)
      const data = await response.json()

      if (response.ok) {
        setNote(data.note)
      } else {
        router.push("/notes")
      }
    } catch (error) {
      console.error("获取笔记失败:", error)
      router.push("/notes")
    } finally {
      setLoading(false)
    }
  }, [noteId, router])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchNote()
    }
  }, [status, noteId, router, fetchNote])

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground text-sm">加载笔记中...</p>
        </div>
      </div>
    )
  }

  if (!note) return null

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Top Action Bar */}
      <div className="border-b bg-muted/10 sticky top-14 z-40 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between max-w-4xl">
          <div className="flex items-center gap-2">
            <Link href="/notes">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4 mr-1" />
                返回列表
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" title="打印" onClick={() => window.print()}>
               <Printer className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Link href={`/notes/${noteId}`}>
              <Button size="sm" variant="outline">
                <Edit className="h-3.5 w-3.5 mr-2" />
                编辑笔记
              </Button>
            </Link>
          </div>
        </div>
      </div>

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
                  <span>{format(new Date(note.createdAt), "yyyy年MM月dd日", { locale: zhCN })}</span>
                </div>
                <div className="flex items-center gap-1.5" title="最后更新">
                  <Clock className="h-4 w-4" />
                  <span>{format(new Date(note.updatedAt), "HH:mm", { locale: zhCN })}</span>
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
