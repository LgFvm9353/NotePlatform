"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileQuestion } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-muted/50 p-6 rounded-full mb-6">
        <FileQuestion className="h-12 w-12 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">
        页面未找到
      </h1>
      <p className="text-muted-foreground mb-8 max-w-sm">
        抱歉，您访问的页面不存在，或者已被移动或删除。
      </p>
      <div className="flex gap-4">
        <Link href="/notes">
          <Button>返回首页</Button>
        </Link>
        <Button variant="outline" onClick={() => window.history.back()}>
          返回上一页
        </Button>
      </div>
    </div>
  )
}

