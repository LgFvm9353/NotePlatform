"use client"

import { 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  Heading3,
  List,
  ListOrdered,
  Link,
  Code,
  Quote,
  Minus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { insertTextOperation, insertLineOperation } from "@/lib/markdownUtils"

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>
  value: string
  onChange: (value: string) => void
}

export function MarkdownToolbar({ textareaRef, value, onChange }: MarkdownToolbarProps) {
  const applyOperation = (
    result: { newText: string; newSelectionStart: number; newSelectionEnd: number }
  ) => {
    const textarea = textareaRef.current
    if (!textarea) return

    onChange(result.newText)

    setTimeout(() => {
      textarea.focus({ preventScroll: true })
      textarea.setSelectionRange(result.newSelectionStart, result.newSelectionEnd)
    }, 0)
  }

  const insertText = (before: string, after: string = "", selectText: string = "") => {
    const textarea = textareaRef.current
    if (!textarea) return

    const result = insertTextOperation(
      value,
      textarea.selectionStart,
      textarea.selectionEnd,
      before,
      after,
      selectText
    )
    applyOperation(result)
  }

  const insertLine = (prefix: string, suffix: string = "", placeholder: string = "") => {
    const textarea = textareaRef.current
    if (!textarea) return

    const result = insertLineOperation(
      value,
      textarea.selectionStart,
      textarea.selectionEnd,
      prefix,
      suffix,
      placeholder
    )
    applyOperation(result)
  }

  const buttonClass = "h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 border-b bg-muted/30 flex-wrap">
      {/* 加粗 */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={buttonClass}
        onClick={() => insertText("**", "**")}
        title="加粗 (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </Button>

      {/* 斜体 */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={buttonClass}
        onClick={() => insertText("*", "*")}
        title="斜体 (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </Button>

      <div className="w-px h-5 bg-border mx-0.5" />

      {/* 标题 */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={buttonClass}
        onClick={() => insertLine("# ", "", "标题 1")}
        title="标题 1"
      >
        <Heading1 className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={buttonClass}
        onClick={() => insertLine("## ", "", "标题 2")}
        title="标题 2"
      >
        <Heading2 className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={buttonClass}
        onClick={() => insertLine("### ", "", "标题 3")}
        title="标题 3"
      >
        <Heading3 className="h-4 w-4" />
      </Button>

      <div className="w-px h-5 bg-border mx-0.5" />

      {/* 列表 */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={buttonClass}
        onClick={() => insertLine("- ", "")}
        title="无序列表"
      >
        <List className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={buttonClass}
        onClick={() => insertLine("1. ", "")}
        title="有序列表"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <div className="w-px h-5 bg-border mx-0.5" />

      {/* 引用 */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={buttonClass}
        onClick={() => insertLine("> ", "")}
        title="引用"
      >
        <Quote className="h-4 w-4" />
      </Button>

      {/* 代码 */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={buttonClass}
        onClick={() => insertText("`", "`", "代码")}
        title="行内代码"
      >
        <Code className="h-4 w-4" />
      </Button>

      {/* 代码块 */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={buttonClass}
        onClick={() => {
          const textarea = textareaRef.current
          if (!textarea) return

          const start = textarea.selectionStart
          const beforeText = value.substring(0, start)
          const afterText = value.substring(start)

          const codeBlock = "```\n代码\n```\n"
          const newText = beforeText + codeBlock + afterText

          onChange(newText)

          setTimeout(() => {
            textarea.focus({ preventScroll: true })
            const newPos = start + 4 // ```\n
            textarea.setSelectionRange(newPos, newPos + 2) // 选中"代码"
          }, 0)
        }}
        title="代码块"
      >
        <Code className="h-4 w-4" />
        <span className="ml-0.5 text-[10px]">块</span>
      </Button>

      <div className="w-px h-5 bg-border mx-0.5" />

      {/* 链接 */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={buttonClass}
        onClick={() => insertText("[", "](url)", "链接文本")}
        title="链接"
      >
        <Link className="h-4 w-4" />
      </Button>

      {/* 分隔线 */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={buttonClass}
        onClick={() => {
          const textarea = textareaRef.current
          if (!textarea) return

          const start = textarea.selectionStart
          const beforeText = value.substring(0, start)
          const afterText = value.substring(start)

          // 检查上一行是否为空
          const needsNewline = beforeText.length > 0 && !beforeText.endsWith("\n\n")
          const separator = needsNewline ? "\n\n---\n\n" : "---\n\n"

          const newText = beforeText + separator + afterText
          onChange(newText)

          setTimeout(() => {
            textarea.focus({ preventScroll: true })
            const newPos = start + separator.length
            textarea.setSelectionRange(newPos, newPos)
          }, 0)
        }}
        title="分隔线"
      >
        <Minus className="h-4 w-4" />
      </Button>
    </div>
  )
}
