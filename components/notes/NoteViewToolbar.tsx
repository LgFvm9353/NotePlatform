"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit, Printer } from "lucide-react"

interface NoteViewToolbarProps {
  noteId: string
}

export function NoteViewToolbar({ noteId }: NoteViewToolbarProps) {
  return (
    <div className="border-b bg-muted/10 sticky top-14 z-40 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between max-w-4xl">
        <div className="flex items-center gap-2">
          <Link href="/notes">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-1" />
              返回列表
            </Button>
          </Link>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" title="打印" onClick={() => window.print()}>
             <Printer className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Link href={`/notes/${noteId}`}>
            <Button size="sm" variant="outline">
              <Edit className="h-3.5 w-3.5 mr-2" />
              编辑笔记
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

