"use client"

import { useState, useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import "highlight.js/styles/github.css"

interface SplitMarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  viewMode?: "split" | "edit" | "preview"
  onViewModeChange?: (mode: "split" | "edit" | "preview") => void
}

export default function SplitMarkdownEditor({
  value,
  onChange,
  placeholder = "开始编写你的笔记...",
  viewMode: externalViewMode,
  onViewModeChange,
}: SplitMarkdownEditorProps) {
  const [splitRatio, setSplitRatio] = useState(50) // 50% 表示左右各一半
  const [isDragging, setIsDragging] = useState(false)
  const [internalViewMode, setInternalViewMode] = useState<"split" | "edit" | "preview">("split")
  const containerRef = useRef<HTMLDivElement>(null)

  const viewMode = externalViewMode || internalViewMode
  const setViewMode = (mode: "split" | "edit" | "preview") => {
    setInternalViewMode(mode)
    onViewModeChange?.(mode)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = (x / rect.width) * 100
      
      // 限制在 20% 到 80% 之间
      const newRatio = Math.max(20, Math.min(80, percentage))
      setSplitRatio(newRatio)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  const handleMouseDown = () => {
    setIsDragging(true)
  }
  
  // 快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 确保按键事件来自文本框
      if (!(e.target instanceof HTMLTextAreaElement)) return

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0
      const metaKey = isMac ? e.metaKey : e.ctrlKey
      
      // Ctrl/Cmd + B: 加粗
      if (metaKey && e.key.toLowerCase() === "b") {
        e.preventDefault()
        e.stopPropagation() // 阻止事件冒泡，防止触发其他全局快捷键
        
        const textarea = e.target as HTMLTextAreaElement
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const text = textarea.value
        
        const before = text.substring(0, start)
        const selected = text.substring(start, end)
        const after = text.substring(end)
        
        const newText = `${before}**${selected}**${after}`
        
        // 使用新值调用 onChange
        onChange(newText)
        
        // 恢复光标位置
        setTimeout(() => {
            textarea.focus()
            // 选中加粗的内容（不包含**）
            textarea.setSelectionRange(start + 2, end + 2)
        }, 0)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onChange])


  return (
    <div ref={containerRef} className="split-editor-container flex flex-col h-full overflow-hidden">
      {/* 移动端视图切换按钮 */}
      <div className="lg:hidden flex border-b bg-muted/50">
        <button
          onClick={() => setViewMode("edit")}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            viewMode === "edit"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          编辑
        </button>
        <button
          onClick={() => setViewMode("preview")}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            viewMode === "preview"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          预览
        </button>
      </div>

      {/* 桌面端和移动端内容区域 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧编辑区域 */}
        <div 
          className={`flex-col border-r bg-background ${
            viewMode === "preview" ? "hidden" : "flex w-full lg:w-[var(--editor-width)]"
          }`}
          style={{ 
            "--editor-width": viewMode === "split" ? `${splitRatio}%` : "100%",
          } as React.CSSProperties}
        >
          <div className="px-4 py-2 border-b bg-muted/50 hidden lg:block">
            <span className="text-sm font-medium text-muted-foreground">编辑</span>
          </div>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 w-full p-4 resize-none border-0 focus:outline-none focus:ring-0 font-mono text-sm bg-background"
            style={{ minHeight: 0 }}
          />
        </div>

        {/* 分割线（仅桌面端显示） */}
        {viewMode === "split" && (
          <div
            className="hidden lg:block w-1 bg-border cursor-col-resize hover:bg-primary/50 transition-colors relative group"
            onMouseDown={handleMouseDown}
          >
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 flex items-center justify-center">
              <div className="w-1 h-12 bg-muted-foreground/30 rounded-full group-hover:bg-primary/50 transition-colors" />
            </div>
          </div>
        )}

        {/* 右侧预览区域 */}
        <div 
          className={`flex-col bg-muted/20 overflow-auto ${
            viewMode === "edit" ? "hidden" : "flex w-full lg:w-[var(--preview-width)]"
          } ${
            viewMode === "split" ? "hidden lg:flex" : "" 
          }`}
          style={{ 
            "--preview-width": viewMode === "split" ? `${100 - splitRatio}%` : "100%",
          } as React.CSSProperties}
        >
          <div className="px-4 py-2 border-b bg-muted/50 sticky top-0 z-10 hidden lg:block">
            <span className="text-sm font-medium text-muted-foreground">预览</span>
          </div>
          <div className="flex-1 p-4 prose prose-slate max-w-none dark:prose-invert overflow-auto">
            {value ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
              >
                {value}
              </ReactMarkdown>
            ) : (
              <div className="text-muted-foreground italic">
                {placeholder}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
