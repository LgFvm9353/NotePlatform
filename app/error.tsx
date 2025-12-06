'use client'

import { useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-destructive/10 p-6 rounded-full mb-6">
        <AlertTriangle className="h-12 w-12 text-destructive" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight mb-2">
        出错了
      </h2>
      <p className="text-muted-foreground mb-8 max-w-sm">
        抱歉，加载页面时遇到了问题。请尝试刷新或稍后再试。
      </p>
      <Button onClick={reset}>
        重试
      </Button>
    </div>
  )
}

