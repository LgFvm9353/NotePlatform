"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
// import { Header } from "@/components/layout/Header" // Remove Header
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, ArrowLeft, Trash2, ChevronLeft, CheckCircle2, Cloud, Sparkles, Loader2 } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { CategoryTagSelector } from "@/components/notes/CategoryTagSelector"
import { useAutoSave } from "@/hooks/useAutoSave"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { useToast } from "@/hooks/use-toast"
import { noteService } from "@/services/noteService"
import { NoteWithRelations } from "@/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const SplitMarkdownEditor = dynamic(
  () => import("@/components/notes/SplitMarkdownEditor"),
  { ssr: false }
)

export default function EditNotePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const noteId = params.id as string

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [tagIds, setTagIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const isSavingRef = useRef(false)
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editorViewMode, setEditorViewMode] = useState<"split" | "edit" | "preview">("split")
  const { toast } = useToast()

  const fetchNote = useCallback(async () => {
    try {
      const note = await noteService.getNote(noteId) as NoteWithRelations

      if (note) {
        setTitle(note.title)
        setContent(note.content)
        setCategoryId(note.category?.id || null)
        setTagIds(note.tags?.map((tag) => tag.id) || [])
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
    try {
      const updatedNote = await noteService.updateNote(noteId, {
        title,
        content,
        categoryId,
        tagIds,
      })

      if (updatedNote) {
        setLastSavedAt(new Date())
        toast({
          title: "保存成功",
          description: "笔记已保存",
        })
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
      setSaving(false)
      isSavingRef.current = false
    }
  }

  const handleGenerateSummary = async () => {
    if (!content || content.length < 50) {
      toast({
        title: "内容太短",
        description: "请先输入一些内容（至少50字）",
        variant: "destructive",
      })
      return
    }

    setGeneratingSummary(true)
    try {
      // 提取实际内容（去除已有的AI摘要部分）
      const aiSummaryPattern = /^> \*\*AI 摘要\*\*：.*?\n\n---\n\n/s
      const actualContent = content.replace(aiSummaryPattern, '').trim()
      
      // 使用实际内容生成摘要
      const response = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: actualContent }),
      })

      if (response.ok) {
        const data = await response.json()
        // 替换或添加摘要（如果已存在则替换，否则添加）
        const newSummary = `> **AI 摘要**：${data.summary}\n\n---\n\n`
        const hasExistingSummary = aiSummaryPattern.test(content)
        
        const newContent = hasExistingSummary
          ? content.replace(aiSummaryPattern, newSummary)
          : `${newSummary}${actualContent}`
        
        setContent(newContent)
        toast({ 
          title: "摘要已生成", 
          description: hasExistingSummary ? "已更新摘要" : "已添加到笔记开头" 
        })
      } else {
        toast({ 
          title: "生成失败", 
          description: "AI 服务响应异常", 
          variant: "destructive" 
        })
      }
    } catch (error) {
      console.error("摘要生成错误:", error)
      toast({ 
        title: "生成失败", 
        description: "网络请求错误", 
        variant: "destructive" 
      })
    } finally {
      setGeneratingSummary(false)
    }
  }

  // 自动保存功能
  useAutoSave({
    value: content,
    onSave: async (value) => {
      if (!title.trim() || !value.trim()) return
      
      try {
        const updated = await noteService.updateNote(noteId, {
          title,
          content: value,
          categoryId,
          tagIds,
        })
        if (updated) {
            setLastSavedAt(new Date())
        }
      } catch (error) {
        console.error("自动保存失败:", error)
      }
    },
    delay: 2000,
    enabled: !!title.trim(),
  })

  // 快捷键支持
  useKeyboardShortcuts([
    {
      combo: { key: "s", ctrl: true },
      handler: handleSave,
    },
    {
      combo: { key: "e", ctrl: true },
      handler: () => {
        setEditorViewMode((prev) => {
          if (prev === "split") return "edit"
          if (prev === "edit") return "preview"
          return "split"
        })
      },
    },
  ])

  const handleDelete = async () => {
    try {
      const success = await noteService.deleteNote(noteId)

      if (success) {
        toast({
          title: "删除成功",
          description: "笔记已删除",
        })
        router.push("/notes")
      } else {
        toast({
          title: "删除失败",
          description: "请稍后重试",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("删除笔记失败:", error)
      toast({
        title: "删除失败",
        description: "请稍后重试",
        variant: "destructive",
      })
    }
  }

  if (status === "loading" || loading) {
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
      
      {/* Toolbar */}
      <div className="border-b bg-background/95 backdrop-blur z-20 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Link href={`/notes/${noteId}/view`} title="返回查看">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground -ml-2">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            
            <div className="h-8 w-[1px] bg-border/50 mx-1" />

            <Input
              placeholder="无标题笔记..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-bold border-0 bg-transparent focus-visible:ring-0 px-2 h-auto py-1 placeholder:text-muted-foreground/50 flex-1 min-w-0"
            />
          </div>

            <div className="flex items-center gap-2 flex-shrink-0">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleGenerateSummary} 
              disabled={generatingSummary || !content}
              className="hidden sm:flex"
            >
              {generatingSummary ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2 text-yellow-500" />
              )}
              AI 摘要
            </Button>

            <div className="hidden sm:block">
               <CategoryTagSelector
                selectedCategoryId={categoryId}
                selectedTagIds={tagIds}
                onCategoryChange={setCategoryId}
                onTagsChange={setTagIds}
                compact
              />
            </div>
            
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认删除</AlertDialogTitle>
                  <AlertDialogDescription>
                    确定要删除这篇笔记吗？此操作无法撤销。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      setDeleteDialogOpen(false)
                      handleDelete()
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    删除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button onClick={handleSave} disabled={saving} size="sm" className={saving ? "opacity-80" : ""}>
              {saving ? (
                 <>
                    <Cloud className="h-4 w-4 mr-2 animate-pulse" />
                    保存中...
                 </>
              ) : lastSavedAt ? (
                 <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    已保存
                 </>
              ) : (
                 <>
                    <Save className="h-4 w-4 mr-2" />
                    保存
                 </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <main className="flex-1 overflow-hidden relative">
        <SplitMarkdownEditor 
          value={content} 
          onChange={setContent} 
          viewMode={editorViewMode}
          onViewModeChange={setEditorViewMode}
        />
      </main>
    </div>
  )
}
