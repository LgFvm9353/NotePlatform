"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Tag as TagIcon, Folder, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Category, Tag } from "@/types"

interface CategoryTagSelectorProps {
  selectedCategoryId?: string | null
  selectedTagIds?: string[]
  onCategoryChange?: (categoryId: string | null) => void
  onTagsChange?: (tagIds: string[]) => void
  compact?: boolean
}

export function CategoryTagSelector({
  selectedCategoryId,
  selectedTagIds = [],
  onCategoryChange,
  onTagsChange,
  compact = false,
}: CategoryTagSelectorProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [creatingTag, setCreatingTag] = useState(false)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [tagDialogOpen, setTagDialogOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryColor, setNewCategoryColor] = useState("")
  const [newTagName, setNewTagName] = useState("")
  const [newTagColor, setNewTagColor] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchCategoriesAndTags()
  }, [])

  const fetchCategoriesAndTags = async () => {
    try {
      const [categoriesRes, tagsRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/tags"),
      ])

      const [categoriesData, tagsData] = await Promise.all([
        categoriesRes.json(),
        tagsRes.json(),
      ])

      if (categoriesRes.ok) {
        setCategories(categoriesData.categories || [])
      }
      if (tagsRes.ok) {
        setTags(tagsData.tags || [])
      }
    } catch (error) {
      console.error("获取分类和标签失败:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return

    setCreatingCategory(true)
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: newCategoryName,
          color: newCategoryColor || undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // 确保新创建的分类不包含 _count 对象，避免渲染错误
        const newCategory = {
          ...data.category,
          _count: data.category._count || { notes: 0 }
        }
        setCategories([...categories, newCategory])
        setNewCategoryName("")
        setNewCategoryColor("")
        setCategoryDialogOpen(false)
        if (onCategoryChange) {
          onCategoryChange(data.category.id)
        }
        toast({ title: "分类创建成功" })
      } else {
        const errorData = await response.json()
        toast({ 
          title: "创建分类失败", 
          description: errorData.error, 
          variant: "destructive" 
        })
      }
    } catch (error) {
      console.error("创建分类失败:", error)
      toast({ 
        title: "创建分类失败", 
        description: "网络请求错误", 
        variant: "destructive" 
      })
    } finally {
      setCreatingCategory(false)
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    setCreatingTag(true)
    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: newTagName,
          color: newTagColor || undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // 确保新创建的标签不包含 _count 对象，避免渲染错误
        const newTag = {
          ...data.tag,
          _count: data.tag._count || { notes: 0 }
        }
        setTags([...tags, newTag])
        setNewTagName("")
        setNewTagColor("")
        setTagDialogOpen(false)
        if (onTagsChange) {
          onTagsChange([...selectedTagIds, data.tag.id])
        }
        toast({ title: "标签创建成功" })
      } else {
        const errorData = await response.json()
        toast({ 
          title: "创建标签失败", 
          description: errorData.error, 
          variant: "destructive" 
        })
      }
    } catch (error) {
      console.error("创建标签失败:", error)
      toast({ 
        title: "创建标签失败", 
        description: "网络请求错误", 
        variant: "destructive" 
      })
    } finally {
      setCreatingTag(false)
    }
  }

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId)
  const selectedTags = tags.filter((t) => selectedTagIds.includes(t.id))

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {/* 分类选择 */}
        {selectedCategory ? (
          <Badge
            variant="secondary"
            className="flex items-center gap-1 text-xs"
            style={{
              backgroundColor: selectedCategory.color
                ? `${selectedCategory.color}20`
                : undefined,
              color: selectedCategory.color || undefined,
            }}
          >
            <Folder className="h-3 w-3" />
            {selectedCategory.name}
            <button
              onClick={() => onCategoryChange?.(null)}
              className="ml-1 hover:opacity-70"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ) : (
          <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7">
                <Folder className="h-3.5 w-3.5 mr-1" />
                分类
              </Button>
            </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>选择分类</DialogTitle>
                  <DialogDescription>
                    选择一个分类或创建新分类
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Button
                        key={category.id}
                        variant={
                          selectedCategoryId === category.id
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => {
                          onCategoryChange?.(
                            selectedCategoryId === category.id ? null : category.id
                          )
                          setCategoryDialogOpen(false)
                        }}
                      >
                        {category.name}
                      </Button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="新分类名称"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleCreateCategory()
                        }
                      }}
                    />
                    <Button onClick={handleCreateCategory} disabled={creatingCategory}>
                      {creatingCategory && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      创建
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

        {/* 标签选择 */}
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="flex items-center gap-1 text-xs"
          >
            <TagIcon className="h-3 w-3" />
            {tag.name}
            <button
              onClick={() => {
                onTagsChange?.(
                  selectedTagIds.filter((id) => id !== tag.id)
                )
              }}
              className="ml-1 hover:opacity-70"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7">
              <TagIcon className="h-3.5 w-3.5 mr-1" />
              标签
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>选择标签</DialogTitle>
              <DialogDescription>
                选择一个或多个标签，或创建新标签
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
                {tags.map((tag) => (
                  <Button
                    key={tag.id}
                    variant={
                      selectedTagIds.includes(tag.id) ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => {
                      if (selectedTagIds.includes(tag.id)) {
                        onTagsChange?.(
                          selectedTagIds.filter((id) => id !== tag.id)
                        )
                      } else {
                        onTagsChange?.([...selectedTagIds, tag.id])
                      }
                    }}
                  >
                    {tag.name}
                  </Button>
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="新标签名称"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleCreateTag()
                      }
                    }}
                  />
                  <Input
                    type="color"
                    value={newTagColor || "#000000"}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="w-20 h-10"
                    title="选择颜色"
                  />
                </div>
                <Button onClick={handleCreateTag} className="w-full">创建</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 分类选择 */}
      <div>
        <Label className="text-sm font-medium mb-2 block">分类</Label>
        <div className="flex flex-wrap gap-2">
          {selectedCategory ? (
            <Badge
              variant="secondary"
              className="flex items-center gap-1"
              style={{
                backgroundColor: selectedCategory.color
                  ? `${selectedCategory.color}20`
                  : undefined,
                color: selectedCategory.color || undefined,
              }}
            >
              <Folder className="h-3 w-3" />
              {selectedCategory.name}
              <button
                onClick={() => onCategoryChange?.(null)}
                className="ml-1 hover:opacity-70"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ) : (
            <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  选择分类
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>选择分类</DialogTitle>
                  <DialogDescription>
                    选择一个分类或创建新分类
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Button
                        key={category.id}
                        variant={
                          selectedCategoryId === category.id
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => {
                          onCategoryChange?.(
                            selectedCategoryId === category.id ? null : category.id
                          )
                          setCategoryDialogOpen(false)
                        }}
                      >
                        {category.name}
                      </Button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="新分类名称"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleCreateCategory()
                          }
                        }}
                      />
                      <Input
                        type="color"
                        value={newCategoryColor || "#000000"}
                        onChange={(e) => setNewCategoryColor(e.target.value)}
                        className="w-20 h-10"
                        title="选择颜色"
                      />
                    </div>
                    <Button onClick={handleCreateCategory} className="w-full" disabled={creatingCategory}>
                      {creatingCategory && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      创建
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* 标签选择 */}
      <div>
        <Label className="text-sm font-medium mb-2 block">标签</Label>
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="flex items-center gap-1"
            >
              <TagIcon className="h-3 w-3" />
              {tag.name}
              <button
                onClick={() => {
                  onTagsChange?.(
                    selectedTagIds.filter((id) => id !== tag.id)
                  )
                }}
                className="ml-1 hover:opacity-70"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                添加标签
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>选择标签</DialogTitle>
                <DialogDescription>
                  选择一个或多个标签，或创建新标签
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
                  {tags.map((tag) => (
                    <Button
                      key={tag.id}
                      variant={
                        selectedTagIds.includes(tag.id) ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => {
                        if (selectedTagIds.includes(tag.id)) {
                          onTagsChange?.(
                            selectedTagIds.filter((id) => id !== tag.id)
                          )
                        } else {
                          onTagsChange?.([...selectedTagIds, tag.id])
                        }
                      }}
                    >
                      {tag.name}
                    </Button>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="新标签名称"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleCreateTag()
                        }
                      }}
                    />
                    <Input
                      type="color"
                      value={newTagColor || "#000000"}
                      onChange={(e) => setNewTagColor(e.target.value)}
                      className="w-20 h-10"
                      title="选择颜色"
                    />
                  </div>
                  <Button onClick={handleCreateTag} className="w-full">创建</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}