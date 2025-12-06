"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/Header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
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
import { Plus, Folder, Search, MoreHorizontal, Trash2, PenLine } from "lucide-react"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
  color?: string
  description?: string
  _count?: {
    notes: number
  }
}

const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#84cc16", // lime
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#d946ef", // fuchsia
  "#f43f5e", // rose
  "#64748b", // slate
]

export default function CategoriesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Create State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState(PRESET_COLORS[6])
  const [newDesc, setNewDesc] = useState("")

  // Edit State
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("")
  const [editDesc, setEditDesc] = useState("")

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/categories")
      const data = await response.json()

      if (response.ok) {
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error("获取分类列表失败:", error)
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
      fetchCategories()
    }
  }, [status, router, fetchCategories])

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast({
        title: "创建失败",
        description: "请输入分类名称",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          color: newColor,
          description: newDesc,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({ title: "创建成功", description: "新分类已添加" })
        setNewName("")
        setNewColor(PRESET_COLORS[6])
        setNewDesc("")
        setIsCreateOpen(false)
        fetchCategories()
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

  const openEdit = (category: Category) => {
    setEditingCategory(category)
    setEditName(category.name)
    setEditColor(category.color || PRESET_COLORS[6])
    setEditDesc(category.description || "")
  }

  const handleUpdate = async () => {
    if (!editingCategory || !editName.trim()) return

    try {
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          color: editColor,
          description: editDesc,
        }),
      })

      if (response.ok) {
        toast({ title: "更新成功", description: "分类信息已保存" })
        setEditingCategory(null)
        fetchCategories()
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
    if (!confirm("确定要删除这个分类吗？相关的笔记将变为无分类状态。")) return

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({ title: "删除成功" })
        if (editingCategory?.id === id) setEditingCategory(null)
        fetchCategories()
      } else {
        toast({
          title: "删除失败",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("删除分类失败:", error)
    }
  }

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
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
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">分类管理</h1>
            <p className="text-muted-foreground mt-1">组织和管理您的笔记分类</p>
        </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索分类..."
                className="pl-9 bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
              <Plus className="h-4 w-4 mr-2" />
                  新建分类
            </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>创建新分类</DialogTitle>
                  <DialogDescription>
                    创建一个新的分类文件夹。
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label htmlFor="name" className="text-sm font-medium">名称</label>
                    <Input
                      id="name"
                      placeholder="例如：工作项目"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="desc" className="text-sm font-medium">描述（可选）</label>
                      <Input
                      id="desc"
                      placeholder="简短的描述..."
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">颜色标记</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={cn(
                            "w-6 h-6 rounded-full border border-muted transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
                            newColor === c && "ring-2 ring-offset-2 ring-primary scale-110"
                          )}
                          style={{ backgroundColor: c }}
                          onClick={() => setNewColor(c)}
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

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((category) => (
            <Card 
              key={category.id} 
              className="group relative overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer border-muted/60 bg-card/50 hover:bg-card"
              onClick={() => openEdit(category)}
            >
              {/* Color Strip */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-1.5 transition-all group-hover:w-2" 
                style={{ backgroundColor: category.color || '#94a3b8' }}
              />
              
              <div className="p-6 pl-7">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-background shadow-sm border border-border/50 group-hover:border-primary/20 transition-colors">
                      <Folder className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="font-semibold text-lg truncate">{category.name}</h3>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground/80 line-clamp-2 mb-6 min-h-[2.5em] leading-relaxed">
                  {category.description || "暂无描述"}
                </p>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-4 border-t border-border/30">
                  <span className="bg-secondary/40 px-2.5 py-1 rounded-md font-medium">
                      {category._count?.notes || 0} 篇笔记
                  </span>
                  
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2 items-center text-primary font-medium translate-x-2 group-hover:translate-x-0">
                    <PenLine className="h-3.5 w-3.5" />
                    编辑
                  </span>
                </div>
              </div>
            </Card>
          ))}

          {/* New Category Ghost Card */}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted-foreground/20 rounded-xl hover:border-muted-foreground/40 hover:bg-muted/50 transition-all h-full min-h-[180px]"
          >
            <Plus className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <span className="text-base font-medium text-muted-foreground">新建分类</span>
          </button>
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Folder className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-medium text-foreground">没有找到分类</h3>
            <p className="text-muted-foreground mt-1">开始创建一个新的分类吧</p>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>编辑分类</DialogTitle>
              <DialogDescription>
                修改分类信息
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">名称</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">描述</label>
                <Input
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">颜色标记</label>
                <div className="flex flex-wrap gap-2 mt-1">
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
                onClick={() => editingCategory && handleDelete(editingCategory.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除
              </Button>
              <Button variant="outline" onClick={() => setEditingCategory(null)}>取消</Button>
              <Button onClick={handleUpdate}>保存更改</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
