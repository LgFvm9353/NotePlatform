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
import { getActualContent, hasSummary, upsertSummary } from "@/lib/markdownUtils"
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
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchNote = useCallback(async () => {
    setError(null)
    try {
      const note = await noteService.getNote(noteId) as NoteWithRelations

      if (note) {
        setTitle(note.title)
        setContent(note.content)
        setCategoryId(note.category?.id || null)
        setTagIds(note.tags?.map((tag) => tag.id) || [])
      } else {
        setError("笔记不存在或已被删除")
      }
    } catch (error) {
      console.error("获取笔记失败:", error)
      setError("加载失败，请检查网络连接")
    } finally {
      setLoading(false)
    }
  }, [noteId])

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
      // 检查是否存在摘要（用于判断是替换还是新增）
      const hasExistingSummary = hasSummary(content)
      
      // 提取实际内容（去除已有的AI摘要部分）
      const actualContent = getActualContent(content)
      
      // 使用实际内容生成摘要
      const response = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: actualContent }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // 使用工具函数生成新内容
        const newContent = upsertSummary(content, data.summary)
        
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
  // 组合所有需要保存的状态作为依赖，任何变化都会触发
  // 使用 JSON.stringify 生成简单的指纹用于比较变化
  const autoSaveValue = JSON.stringify({ title, content, categoryId, tagIds })

  useAutoSave({
    value: autoSaveValue,
    onSave: async () => {
      // 如果正在进行手动保存，跳过本次自动保存，防止冲突
      if (isSavingRef.current) return
      
      // 只有标题和内容都不为空才保存
      if (!title.trim() || !content.trim()) return
      
      try {
        // 在自动保存期间也标记状态，防止手动保存同时触发
        isSavingRef.current = true
        const updated = await noteService.updateNote(noteId, {
          title,
          content,
          categoryId,
          tagIds,
        })
        if (updated) {
            setLastSavedAt(new Date())
        }
      } catch (error) {
        console.error("自动保存失败:", error)
      } finally {
        isSavingRef.current = false
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

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <p className="text-destructive font-medium">{error}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/notes")}>返回列表</Button>
          <Button onClick={() => fetchNote()}>重试</Button>
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
          onSave={handleSave}
        />
      </main>
    </div>
  )
}
