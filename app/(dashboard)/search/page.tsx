"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/layout/Header"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search as SearchIcon, FileText, Calendar } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

interface Note {
  id: string
  title: string
  content: string
  updatedAt: string
  category: {
    id: string
    name: string
  } | null
  tags: {
    id: string
    name: string
  }[]
}

export default function SearchPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get("q") || "")
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (response.ok) {
        setNotes(data.notes)
      }
    } catch (error) {
      console.error("搜索失败:", error)
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
  }, [status, router])

  // Initial search from URL params
  useEffect(() => {
    if (status === "authenticated" && searchParams.get("q")) {
       handleSearch()
    }
    // Only run when status becomes authenticated or we just loaded
    // We exclude handleSearch from deps to avoid searching on every keystroke if we were to type
    // But wait, handleSearch depends on query.
    // If we want to search ONLY when URL param exists on load:
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">搜索笔记</h1>
          
          <div className="flex gap-2 mb-6">
            <Input
              placeholder="搜索标题或内容..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading}>
              <SearchIcon className="h-4 w-4 mr-2" />
              搜索
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">搜索中...</div>
          ) : notes.length === 0 && query ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">没有找到相关笔记</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <Card key={note.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>
                      <Link
                        href={`/notes/${note.id}`}
                        className="hover:underline"
                      >
                        {note.title}
                      </Link>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(note.updatedAt), "yyyy年MM月dd日", {
                        locale: zhCN,
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {note.content.substring(0, 200)}...
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

