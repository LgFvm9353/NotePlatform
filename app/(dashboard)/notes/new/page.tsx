"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
// import { Header } from "@/components/layout/Header" // Remove Header
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, ChevronLeft } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { CategoryTagSelector } from "@/components/notes/CategoryTagSelector"
import { useToast } from "@/hooks/use-toast"
import { noteService } from "@/services/noteService"

// 动态导入 Markdown 编辑器（避免 SSR 问题）
const SplitMarkdownEditor = dynamic(
  () => import("@/components/notes/SplitMarkdownEditor"),
  { ssr: false }
)

export default function NewNotePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [tagIds, setTagIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const isSavingRef = useRef(false)
  const { toast } = useToast()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  const handleSave = async () => {
    if (isSavingRef.current) return

    if (!title.trim()) {
      toast({
        title: "保存失败",
        description: "请输入标题",
        variant: "destructive",
      })
      return
    }

    isSavingRef.current = true
    setSaving(true)
    let success = false

    try {
      const note = await noteService.createNote({
        title,
        content,
        categoryId,
        tagIds,
      })

      if (note) {
        success = true
        toast({
          title: "保存成功",
          description: "笔记已创建",
        })
        router.push(`/notes/${note.id}/view`) // 保存后直接跳转到查看模式
      } else {
        toast({
          title: "保存失败",
          description: "请稍后重试",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("保存笔记失败:", error)
      toast({
        title: "保存失败",
        description: "请稍后重试",
        variant: "destructive",
      })
    } finally {
      // 只有失败时才恢复状态，成功时保持 loading 直到页面跳转
      if (!success) {
        setSaving(false)
        isSavingRef.current = false
      }
    }
  }

  // 快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S 或 Cmd+S 保存
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        handleSave()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, categoryId, tagIds])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">加载编辑器...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Removed Header component to optimize layout */}
      
      <div className="border-b bg-background/95 backdrop-blur z-20 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Link href="/notes" title="返回列表">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground -ml-2">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            
            <div className="h-8 w-[1px] bg-border/50 mx-1" />

            <Input
              placeholder="输入笔记标题..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-bold border-0 bg-transparent focus-visible:ring-0 px-2 h-auto py-1 placeholder:text-muted-foreground/50 flex-1 min-w-0"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden sm:block">
              <CategoryTagSelector
                selectedCategoryId={categoryId}
                selectedTagIds={tagIds}
                onCategoryChange={setCategoryId}
                onTagsChange={setTagIds}
                compact
              />
            </div>
            
            <Button onClick={handleSave} disabled={saving} size="sm" className={saving ? "opacity-80" : ""}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "保存中..." : "创建笔记"}
            </Button>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-hidden relative">
        <SplitMarkdownEditor value={content} onChange={setContent} />
      </main>
    </div>
  )
}
