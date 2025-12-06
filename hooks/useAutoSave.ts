import { useEffect, useRef } from "react"

interface UseAutoSaveOptions {
  value: string
  onSave: (value: string) => Promise<void>
  delay?: number
  enabled?: boolean
}

export function useAutoSave({
  value,
  onSave,
  delay = 2000,
  enabled = true,
}: UseAutoSaveOptions) {
  const isInitialMount = useRef(true)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedValue = useRef<string>(value)

  useEffect(() => {
    // 跳过首次渲染
    if (isInitialMount.current) {
      isInitialMount.current = false
      lastSavedValue.current = value
      return
    }

    // 如果值没有变化，不保存
    if (value === lastSavedValue.current) {
      return
    }

    // 如果禁用自动保存，直接返回
    if (!enabled) {
      return
    }

    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // 设置新的定时器
    timeoutRef.current = setTimeout(async () => {
      try {
        await onSave(value)
        lastSavedValue.current = value
      } catch (error) {
        console.error("自动保存失败:", error)
      }
    }, delay)

    // 清理函数
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, onSave, delay, enabled])
}

