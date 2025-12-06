"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/Header"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, FileText, Calendar, Search, LayoutGrid, List as ListIcon, Edit2, Trash2, Eye } from "lucide-react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { useToast } from "@/hooks/use-toast"
import { useDebounce } from "@/hooks/useDebounce"
import { noteService } from "@/services/noteService"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { NoteWithRelations, Category, Tag } from "@/types"

export default function NotesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // URL Params State
  const page = Number(searchParams.get("page")) || 1
  const categoryId = searchParams.get("category") || "all"
  const tagId = searchParams.get("tag") || "all"
  const searchParam = searchParams.get("search") || ""

  // Local State
  const [notes, setNotes] = useState<NoteWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null)
  const [totalNotes, setTotalNotes] = useState(0)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  
  // Search Input State (debounced sync to URL)
  const [searchQuery, setSearchQuery] = useState(searchParam)
  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  // Update URL helpers
  const updateUrl = useCallback((updates: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "all" || value === "") {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })
    router.push(`/notes?${params.toString()}`)
  }, [searchParams, router])

  // Sync debounced search to URL
  useEffect(() => {
    if (debouncedSearchQuery !== searchParam) {
      updateUrl({ search: debouncedSearchQuery, page: 1 })
    }
  }, [debouncedSearchQuery, searchParam, updateUrl])

  const fetchCategoriesAndTags = useCallback(async () => {
    try {
      const [categoriesRes, tagsRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/tags"),
      ])

      const [categoriesData, tagsData] = await Promise.all([
        categoriesRes.json(),
        tagsRes.json(),
      ])

      if (categoriesRes.ok) setCategories(categoriesData.categories || [])
      if (tagsRes.ok) setTags(tagsData.tags || [])
    } catch (error) {
      console.error("获取分类和标签失败:", error)
    }
  }, [])

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true)
      const params: any = {
        page,
        limit: 24, // Adjusted for grid layout (divisible by 2,3,4)
      }
      if (categoryId && categoryId !== "all") params.categoryId = categoryId
      if (tagId && tagId !== "all") params.tagId = tagId
      if (searchParam) params.search = searchParam
      
      const data = await noteService.getNotes(params)
      
      if (data) {
        setNotes(data.notes)
        setTotalPages(data.pagination.totalPages)
        setTotalNotes(data.pagination.total)
      }
    } catch (error: any) {
      console.error("获取笔记失败:", error)
      toast({ 
        title: "获取笔记失败", 
        description: error.message || "请检查网络或服务器状态",
        variant: "destructive" 
      })
      // 出错时清空列表，避免显示误导性的旧数据
      setNotes([])
    } finally {
      setLoading(false)
    }
  }, [page, categoryId, tagId, searchParam, toast])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchNotes()
      fetchCategoriesAndTags() // Moved here to run once on auth
    }
  }, [status, fetchNotes, fetchCategoriesAndTags, router])

  const handleDelete = async (id: string) => {
    try {
      const success = await noteService.deleteNote(id)
      if (success) {
        toast({ title: "删除成功" })
        setNotes(notes.filter((note) => note.id !== id))
        setTotalNotes(prev => prev - 1)
      } else {
        toast({ title: "删除失败", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "删除失败", variant: "destructive" })
    } finally {
      setDeleteDialogOpen(null)
    }
  }

  const getPreview = (content: string) => {
    return content
      .replace(/[#*`_~\[\]()]/g, '')
      .replace(/\n+/g, ' ')
      .substring(0, 120) + (content.length > 120 ? '...' : '')
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl flex-1 flex flex-col">
        {/* Header & Controls */}
        <div className="flex flex-col space-y-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">我的笔记</h1>
              <p className="text-muted-foreground mt-1">
                共 {totalNotes} 篇笔记
                {searchParam && <span className="ml-2 text-sm">(搜索结果)</span>}
              </p>
            </div>
            <Link href="/notes/new">
              <Button className="shadow-sm">
                <Plus className="h-4 w-4 mr-2" />
                新建笔记
              </Button>
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center bg-background p-4 rounded-lg border shadow-sm">
            <div className="relative w-full lg:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索标题或内容..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2 flex-1">
              <Select value={categoryId} onValueChange={(v) => updateUrl({ category: v, page: 1 })}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="全部分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部分类</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={tagId} onValueChange={(v) => updateUrl({ tag: v, page: 1 })}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="全部标签" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部标签</SelectItem>
                  {tags.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(categoryId !== "all" || tagId !== "all") && (
                <Button 
                  variant="ghost" 
                  onClick={() => updateUrl({ category: "all", tag: "all", page: 1 })}
                  className="text-muted-foreground hover:text-foreground"
                >
                  清除筛选
                </Button>
              )}
            </div>

            <div className="flex items-center border rounded-md bg-muted/50 p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2"
                onClick={() => setViewMode("list")}
              >
                <ListIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1">
          {loading ? (
             <div className={viewMode === "grid" ? "grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-4"}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
                ))}
             </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-background rounded-xl border border-dashed h-full min-h-[400px]">
              <div className="bg-muted/50 p-4 rounded-full mb-4">
                <FileText className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-medium">没有找到笔记</h3>
              <p className="text-muted-foreground mt-1 mb-6 text-center max-w-sm">
                {searchParam ? "尝试使用不同的关键词或清除筛选条件" : "开始记录你的第一篇想法吧"}
              </p>
              {!searchParam && (
                <Link href="/notes/new">
                  <Button>创建笔记</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className={viewMode === "grid" ? "grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-8" : "space-y-4 pb-8"}>
              {notes.map((note) => (
                <Card key={note.id} className={`group hover:shadow-lg transition-all duration-300 overflow-hidden flex border-muted/60 bg-card/50 hover:bg-card ${viewMode === "grid" ? "flex-col h-full min-h-[200px] hover:-translate-y-1" : "flex-row items-center p-4 h-auto"}`}>
                  <div className={`flex-1 ${viewMode === "grid" ? "p-6" : "p-0 pl-2"}`}>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <Link href={`/notes/${note.id}/view`} className="group-hover:text-primary transition-colors">
                        <h3 className="font-semibold text-lg leading-tight line-clamp-1" title={note.title}>
                          {note.title}
                        </h3>
                      </Link>
                      {viewMode === "grid" && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Link href={`/notes/${note.id}`}>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground/80 line-clamp-2 mb-4 leading-relaxed">
                      {getPreview(note.content)}
                    </p>

                    <div className={`flex items-center justify-between mt-auto ${viewMode === "grid" ? "pt-4 border-t border-border/30" : ""}`}>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 bg-secondary/40 px-2 py-1 rounded-md font-medium">
                          <Calendar className="h-3 w-3 opacity-70" />
                          {format(new Date(note.updatedAt), "MM-dd", { locale: zhCN })}
                        </span>
                        
                        {note.category && (
                          <Badge variant="outline" className="font-normal border-muted-foreground/20 px-2 py-0.5 bg-background/50">
                            <span 
                              className="w-1.5 h-1.5 rounded-full mr-1.5 shadow-[0_0_4px_rgba(0,0,0,0.1)]"
                              style={{ backgroundColor: note.category.color || "currentColor" }}
                            />
                            {note.category.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {viewMode === "list" && (
                     <div className="flex items-center gap-4 border-l pl-6 ml-6 h-full py-2">
                        <div className="flex flex-wrap gap-2 w-40 justify-end">
                        {note.tags?.slice(0, 3).map(tag => (
                            <span key={tag.id} className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full whitespace-nowrap">
                                #{tag.name}
                            </span>
                        ))}
                        </div>
                        <div className="flex items-center gap-1">
                             <Link href={`/notes/${note.id}/view`}>
                                <Button variant="ghost" size="icon">
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </Link>
                            <Link href={`/notes/${note.id}`}>
                                <Button variant="ghost" size="icon">
                                    <Edit2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </Link>
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-destructive/70 hover:text-destructive"
                                onClick={() => setDeleteDialogOpen(note.id)}
                             >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                     </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => updateUrl({ page: page - 1 })}
            >
              上一页
            </Button>
            <span className="flex items-center px-4 text-sm font-medium">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => updateUrl({ page: page + 1 })}
            >
              下一页
            </Button>
          </div>
        )}
        
        {/* Delete Dialog */}
         <AlertDialog open={!!deleteDialogOpen} onOpenChange={(open) => !open && setDeleteDialogOpen(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>确认删除</AlertDialogTitle>
                <AlertDialogDescription>删除后无法恢复，是否继续？</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteDialogOpen && handleDelete(deleteDialogOpen)} className="bg-destructive">删除</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  )
}
