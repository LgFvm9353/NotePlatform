"use client"

import { useState } from "react"
import MDEditor from "@uiw/react-md-editor"
import "@uiw/react-md-editor/markdown-editor.css"

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = "开始编写你的笔记..."
}: MarkdownEditorProps) {
  const [preview, setPreview] = useState<"edit" | "live" | "preview">("edit")

  return (
    <div className="w-full" data-color-mode="light">
      <div className="mb-2 flex gap-2 border-b pb-2">
        <button
          onClick={() => setPreview("edit")}
          className={`px-3 py-1 text-sm rounded ${
            preview === "edit"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
        >
          编辑
        </button>
        <button
          onClick={() => setPreview("live")}
          className={`px-3 py-1 text-sm rounded ${
            preview === "live"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
        >
          实时预览
        </button>
        <button
          onClick={() => setPreview("preview")}
          className={`px-3 py-1 text-sm rounded ${
            preview === "preview"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
        >
          预览
        </button>
      </div>
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || "")}
        preview={preview}
        hideToolbar={false}
        visibleDragbar={false}
        height={600}
      />
    </div>
  )
}

