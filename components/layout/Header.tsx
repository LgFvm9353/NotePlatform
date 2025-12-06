"use client"

import { signOut, useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Moon, Sun, LogOut, Folder, Tag as TagIcon } from "lucide-react"
import { useTheme } from "next-themes"

export function Header() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/notes" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-xl">笔记平台</span>
          </Link>
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">切换主题</span>
          </Button>
          
          {session && (
            <>
              <Link href="/categories">
                <Button variant="ghost" size="sm" className="hidden md:flex">
                  <Folder className="h-4 w-4 mr-2" />
                  分类
                </Button>
              </Link>
              <Link href="/tags">
                <Button variant="ghost" size="sm" className="hidden md:flex">
                  <TagIcon className="h-4 w-4 mr-2" />
                  标签
                </Button>
              </Link>
              
              <div className="flex items-center space-x-2 ml-2 pl-2 border-l border-border/40">
                <span className="hidden md:inline text-sm text-muted-foreground">
                  {session.user?.name || session.user?.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  title="退出登录"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">退出</span>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
