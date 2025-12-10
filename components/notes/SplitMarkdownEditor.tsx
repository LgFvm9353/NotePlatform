"use client"

import { useState, useEffect, useRef, useCallback, useDeferredValue, memo } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import "highlight.js/styles/github.css"
import { MarkdownToolbar } from "./MarkdownToolbar"
import { insertTextOperation } from "@/lib/markdownUtils"

interface SplitMarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  viewMode?: "split" | "edit" | "preview"
  onViewModeChange?: (mode: "split" | "edit" | "preview") => void
  onSave?: () => void
}

// 抽离预览组件并 Memo 化
const MarkdownPreview = memo(({ content, placeholder }: { content: string; placeholder: string }) => {
  return (
    <div className="flex-1 p-4 prose prose-slate max-w-none dark:prose-invert">
      {content ? (
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {content}
        </ReactMarkdown>
      ) : (
        <div className="text-muted-foreground italic">{placeholder}</div>
      )}
    </div>
  )
})
MarkdownPreview.displayName = "MarkdownPreview"

export default function SplitMarkdownEditor({
  value,
  onChange,
  placeholder = "开始编写你的笔记...",
  viewMode: externalViewMode,
  onViewModeChange,
  onSave,
}: SplitMarkdownEditorProps) {
  const [splitRatio, setSplitRatio] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [internalViewMode, setInternalViewMode] = useState<"split" | "edit" | "preview">("split")
  const containerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const isScrollingRef = useRef(false)

  // 历史记录状态
  const historyRef = useRef<string[]>([value])
  const historyIndexRef = useRef(0)
  const isUndoRedoRef = useRef(false)
  const lastTypeTimeRef = useRef(0)
  const MAX_HISTORY_STACK = 50 // 限制历史记录栈大小

  // 创建延迟更新的 value 用于预览
  const deferredValue = useDeferredValue(value)

  const viewMode = externalViewMode || internalViewMode
  const setViewMode = (mode: "split" | "edit" | "preview") => {
    setInternalViewMode(mode)
    onViewModeChange?.(mode)
  }

  // 更新历史记录
  const updateHistory = useCallback((newValue: string) => {
    if (isUndoRedoRef.current) return

    const now = Date.now()
    // 如果距离上次输入时间很短（例如 1秒内），且不是换行或大幅度变化，则合并历史
    // 简化处理：debounce 记录，这里先简单实现：每次非 Undo/Redo 的变更都记录（或者简单的防抖）
    
    // 这里采用一个简单的策略：如果是连续输入，不频繁记录；但为了保证 Ctrl+Z 的体验，
    // 我们在用户停止输入 500ms 后记录，或者输入长度变化较大时记录。
    // 但由于 onChange 是由父组件控制的，我们很难完全掌控频率。
    // 更好的方式可能是：每次 onChange 我们都暂时不存，而是用 debounce 存。
    // 但如果是快捷键触发的操作，我们希望立即存。
    
    // 简单实现：截断当前指针之后的历史，推入新值
    let currentHistory = historyRef.current.slice(0, historyIndexRef.current + 1)
    
    // 简单的防抖策略：如果新值只是比旧值多/少一个字符，且时间间隔短，替换当前历史
    const lastValue = currentHistory[currentHistory.length - 1]
    const isContinuousTyping = Math.abs(newValue.length - lastValue.length) === 1 && (now - lastTypeTimeRef.current < 1000)
    
    if (isContinuousTyping && currentHistory.length > 1) {
        // 替换最后一个状态
        currentHistory[currentHistory.length - 1] = newValue
    } else {
        // 添加新状态
        if (newValue !== lastValue) {
             currentHistory = [...currentHistory, newValue]
             // 限制栈大小：移除最早的记录
             if (currentHistory.length > MAX_HISTORY_STACK) {
                 currentHistory.shift()
             }
        }
    }
    
    historyRef.current = currentHistory
    // 更新索引指向最新
    historyIndexRef.current = currentHistory.length - 1
    
    lastTypeTimeRef.current = now
  }, [])

  // 监听 value 变化以更新历史（需要区分是否来自 undo/redo）
  // 注意：由于 value 是 prop，它变化时 updateHistory 会被调用。
  // 我们需要在 undo/redo 触发 change 时标记 isUndoRedoRef
  useEffect(() => {
      // 只有当 value 真正改变且不是因为 undo/redo 导致的改变时才记录
      if (value !== historyRef.current[historyIndexRef.current]) {
          updateHistory(value)
      }
  }, [value, updateHistory])


  const undo = () => {
    if (historyIndexRef.current > 0) {
      isUndoRedoRef.current = true
      historyIndexRef.current -= 1
      const newValue = historyRef.current[historyIndexRef.current]
      onChange(newValue)
      // 需要在下一个 tick 重置标志，因为 onChange 可能会导致父组件重渲染，进而触发上面的 useEffect
      setTimeout(() => { isUndoRedoRef.current = false }, 0)
    }
  }

  const redo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      isUndoRedoRef.current = true
      historyIndexRef.current += 1
      const newValue = historyRef.current[historyIndexRef.current]
      onChange(newValue)
      setTimeout(() => { isUndoRedoRef.current = false }, 0)
    }
  }

  const handleScroll = useCallback((source: 'editor' | 'preview') => {
    if (viewMode !== 'split') return
    if (isScrollingRef.current) return

    const editor = textareaRef.current
    const preview = previewRef.current

    if (editor && preview) {
      isScrollingRef.current = true
      if (source === 'editor') {
        const percentage = editor.scrollTop / (editor.scrollHeight - editor.clientHeight)
        if (!isNaN(percentage)) {
             preview.scrollTop = percentage * (preview.scrollHeight - preview.clientHeight)
        }
      } else {
        const percentage = preview.scrollTop / (preview.scrollHeight - preview.clientHeight)
        if (!isNaN(percentage)) {
            editor.scrollTop = percentage * (editor.scrollHeight - editor.clientHeight)
        }
      }
      setTimeout(() => { isScrollingRef.current = false }, 50)
    }
  }, [viewMode])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = (x / rect.width) * 100
      setSplitRatio(Math.max(20, Math.min(80, percentage)))
    }
    const handleMouseUp = () => setIsDragging(false)
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  const handleMouseDown = () => setIsDragging(true)
  
  // 快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.target instanceof HTMLTextAreaElement)) return

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0
      const metaKey = isMac ? e.metaKey : e.ctrlKey
      const key = e.key.toLowerCase()
      
      // Undo: Ctrl+Z
      if (metaKey && key === "z" && !e.shiftKey) {
        e.preventDefault()
        undo()
        return
      }

      // Redo: Ctrl+Shift+Z or Ctrl+Y
      if ((metaKey && key === "z" && e.shiftKey) || (metaKey && key === "y")) {
        e.preventDefault()
        redo()
        return
      }

      // Save: Ctrl+S
      if (metaKey && key === "s") {
        e.preventDefault()
        onSave?.()
        return
      }

      // 格式化快捷键
      if (metaKey) {
        let result = null
        const textarea = e.target as HTMLTextAreaElement

        switch(key) {
            case "b": // Bold
                e.preventDefault()
                result = insertTextOperation(value, textarea.selectionStart, textarea.selectionEnd, "**", "**")
                break
            case "i": // Italic
                e.preventDefault()
                result = insertTextOperation(value, textarea.selectionStart, textarea.selectionEnd, "*", "*")
                break
            // 可以添加更多，比如 Ctrl+K
        }

        if (result) {
            // 立即记录历史（强制）
            // 注意：onChange 触发后，useEffect 会处理历史记录。
            // 但为了确保这一步操作被视为一个独立的“撤销点”，我们可以强制打断连续输入的合并逻辑
            lastTypeTimeRef.current = 0 // 重置时间，强制新记录
            
            onChange(result.newText)
            
            setTimeout(() => {
                textarea.focus({ preventScroll: true })
                textarea.setSelectionRange(result.newSelectionStart, result.newSelectionEnd)
            }, 0)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [value, onChange, undo, redo]) // 依赖项加入 undo/redo

  return (
    <div ref={containerRef} className="split-editor-container flex flex-col h-full overflow-hidden">
      <div className="lg:hidden flex border-b bg-muted/50">
        <button
          onClick={() => setViewMode("edit")}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            viewMode === "edit" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          编辑
        </button>
        <button
          onClick={() => setViewMode("preview")}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            viewMode === "preview" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          预览
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div 
          className={`flex-col border-r bg-background overflow-hidden ${
            viewMode === "preview" ? "hidden" : "flex w-full lg:w-[var(--editor-width)]"
          }`}
          style={{ "--editor-width": viewMode === "split" ? `${splitRatio}%` : "100%" } as React.CSSProperties}
        >
          <div className="px-4 py-2 border-b bg-muted/50 hidden lg:block shrink-0">
            <span className="text-sm font-medium text-muted-foreground">编辑</span>
          </div>
          <div className="shrink-0">
            <MarkdownToolbar textareaRef={textareaRef} value={value} onChange={onChange} />
          </div>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={() => handleScroll('editor')}
            placeholder={placeholder}
            className="flex-1 w-full p-4 resize-none border-0 focus:outline-none focus:ring-0 font-mono text-sm bg-background overflow-y-auto"
            style={{ minHeight: 0 }}
          />
        </div>

        {viewMode === "split" && (
          <div
            className="hidden lg:block w-1 bg-border cursor-col-resize hover:bg-primary/50 transition-colors relative group shrink-0"
            onMouseDown={handleMouseDown}
          >
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 flex items-center justify-center">
              <div className="w-1 h-12 bg-muted-foreground/30 rounded-full group-hover:bg-primary/50 transition-colors" />
            </div>
          </div>
        )}

        <div 
          ref={previewRef}
          onScroll={() => handleScroll('preview')}
          className={`flex-col bg-muted/20 overflow-y-auto ${
            viewMode === "edit" ? "hidden" : "flex w-full lg:w-[var(--preview-width)]"
          } ${
            viewMode === "split" ? "hidden lg:flex" : "" 
          }`}
          style={{ "--preview-width": viewMode === "split" ? `${100 - splitRatio}%` : "100%" } as React.CSSProperties}
        >
          <div className="px-4 py-2 border-b bg-muted/50 sticky top-0 z-10 hidden lg:block backdrop-blur-sm shrink-0">
            <span className="text-sm font-medium text-muted-foreground">预览</span>
          </div>
          <MarkdownPreview content={deferredValue} placeholder={placeholder} />
        </div>
      </div>
    </div>
  )
}
