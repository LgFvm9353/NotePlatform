"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Plus, Tag as TagIcon, Search, MoreHorizontal, Trash2, PenLine } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Tag {
  id: string
  name: string
  color?: string
  _count?: {
    notes: number
  }
}

const PRESET_COLORS = [
  "#ef4444", // red-500
  "#f97316", // orange-500
  "#f59e0b", // amber-500
  "#84cc16", // lime-500
  "#10b981", // emerald-500
  "#06b6d4", // cyan-500
  "#3b82f6", // blue-500
  "#6366f1", // indigo-500
  "#8b5cf6", // violet-500
  "#d946ef", // fuchsia-500
  "#f43f5e", // rose-500
  "#64748b", // slate-500
]

export default function TagsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Create State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newTagName, setNewTagName] = useState("")
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[6]) // Default Blue

  // Edit State
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("")

  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch("/api/tags")
      const data = await response.json()

      if (response.ok) {
        setTags(data.tags || [])
      }
    } catch (error) {
      console.error("获取标签列表失败:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchTags()
    }
  }, [status, router, fetchTags])

  const handleCreate = async () => {
    if (!newTagName.trim()) {
      toast({
        title: "请输入名称",
        description: "标签名称不能为空",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTagName,
          color: newTagColor,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({ title: "创建成功", description: "新标签已添加" })
        setNewTagName("")
        setNewTagColor(PRESET_COLORS[6])
        setIsCreateOpen(false)
        fetchTags()
      } else {
        toast({
          title: "创建失败",
          description: data.error || "请稍后重试",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "出错啦",
        description: "无法连接到服务器",
        variant: "destructive",
      })
    }
  }

  const openEdit = (tag: Tag) => {
    setEditingTag(tag)
    setEditName(tag.name)
    setEditColor(tag.color || PRESET_COLORS[6])
  }

  const handleUpdate = async () => {
    if (!editingTag || !editName.trim()) return

    try {
      const response = await fetch(`/api/tags/${editingTag.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          color: editColor,
        }),
      })

      if (response.ok) {
        toast({ title: "更新成功", description: "标签信息已保存" })
        setEditingTag(null)
        fetchTags()
      } else {
        const data = await response.json()
        toast({
          title: "更新失败",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "更新失败",
        description: "请稍后重试",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个标签吗？相关的笔记将不再包含此标签。")) return

    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({ title: "删除成功" })
        if (editingTag?.id === id) setEditingTag(null)
        fetchTags()
      } else {
        toast({
          title: "删除失败",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("删除标签失败:", error)
    }
  }

  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-muted-foreground animate-pulse">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 顶部栏 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">标签管理</h1>
            <p className="text-muted-foreground mt-1">管理您的笔记分类标签</p>
        </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索标签..."
                className="pl-9 bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
              <Plus className="h-4 w-4 mr-2" />
                  新建标签
            </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>创建新标签</DialogTitle>
                  <DialogDescription>
                    为您的笔记创建一个新的分类标签。
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Input
                      id="name"
                      placeholder="例如：工作、学习、生活"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex flex-wrap gap-2 mt-2">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={cn(
                            "w-6 h-6 rounded-full border border-muted transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
                            newTagColor === c && "ring-2 ring-offset-2 ring-primary scale-110"
                          )}
                          style={{ backgroundColor: c }}
                          onClick={() => setNewTagColor(c)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>取消</Button>
                  <Button onClick={handleCreate}>创建</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 标签网格 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredTags.map((tag) => (
            <Card 
              key={tag.id} 
              className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-muted/60 bg-card/50 hover:bg-card cursor-pointer"
              onClick={() => openEdit(tag)}
            >
              <div className="p-5 flex flex-col items-center text-center space-y-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: tag.color || '#94a3b8' }}
                >
                  <TagIcon className="h-6 w-6" />
                  </div>
                
                <div className="space-y-1.5 w-full">
                  <h3 className="font-semibold truncate px-2 text-lg">{tag.name}</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary/50 text-muted-foreground">
                    {tag._count?.notes || 0} 篇笔记
                  </span>
                </div>
              </div>
              
              {/* Hover Actions */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                 <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-background/80">
                   <PenLine className="h-3.5 w-3.5" />
                 </Button>
              </div>
            </Card>
          ))}

          {/* New Tag Ghost Card (Optional, serves as a quick access) */}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-muted-foreground/20 rounded-xl hover:border-muted-foreground/40 hover:bg-muted/50 transition-all h-full min-h-[140px]"
          >
            <Plus className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <span className="text-sm font-medium text-muted-foreground">新建标签</span>
          </button>
        </div>

        {filteredTags.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <TagIcon className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-medium text-foreground">没有找到标签</h3>
            <p className="text-muted-foreground mt-1">开始创建一个新的标签吧</p>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingTag} onOpenChange={(open) => !open && setEditingTag(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>编辑标签</DialogTitle>
              <DialogDescription>
                修改标签名称或颜色
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex flex-wrap gap-2 mt-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={cn(
                        "w-6 h-6 rounded-full border border-muted transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
                        editColor === c && "ring-2 ring-offset-2 ring-primary scale-110"
                      )}
                      style={{ backgroundColor: c }}
                      onClick={() => setEditColor(c)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                type="button" 
                variant="destructive" 
                className="mr-auto"
                onClick={() => editingTag && handleDelete(editingTag.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除
              </Button>
              <Button variant="outline" onClick={() => setEditingTag(null)}>取消</Button>
              <Button onClick={handleUpdate}>保存更改</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
