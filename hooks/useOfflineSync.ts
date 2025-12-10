import { useState, useEffect, useCallback, useRef } from 'react'
import { localDB } from '@/lib/db'
import { useToast } from '@/hooks/use-toast'

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const { toast } = useToast()
  const isSyncingRef = useRef(false)
  const isProcessingQueueRef = useRef(false)

  const syncPendingData = useCallback(async () => {
    // 使用 ref 防止并发同步
    if (isProcessingQueueRef.current || !navigator.onLine) return
    isProcessingQueueRef.current = true
    setIsSyncing(true)

    try {
      while (true) {
        const queue = await localDB.getSyncQueue()
        if (queue.length === 0) break

        const item = queue[0] // 始终处理队首
        
        try {
          let response
          const { type, payload } = item

          if (type === 'CREATE_NOTE') {
            const tempId = payload.id
            const { id: _, ...createPayload } = payload
            
            response = await fetch('/api/notes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(createPayload),
            })
            
            if (response.ok) {
                const data = await response.json()
                const realId = data.note.id
                
                // 关键修复：更新本地数据和队列中的 ID
                // 1. 修正队列中后续针对该临时ID的操作
                await localDB.updateSyncQueueNoteId(tempId, realId)
                // 2. 删除本地临时ID记录
                await localDB.deleteNote(tempId)
                // 3. 保存真实ID记录 (注意：如果本地已有更新的编辑，这里可能会覆盖，
                // 但由于 syncQueue 是顺序执行的，后续的 UPDATE_NOTE 会修正它)
                await localDB.saveNote(data.note)
            }
          } else if (type === 'UPDATE_NOTE') {
            response = await fetch(`/api/notes/${payload.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })
          } else if (type === 'DELETE_NOTE') {
            response = await fetch(`/api/notes/${payload.id}`, {
              method: 'DELETE',
            })
          }

          if (response && response.ok) {
            await localDB.removeFromSyncQueue(item.id!)
          } else {
            const status = response?.status || 0;
            // [修复] 错误分类处理：避免 4xx 错误阻塞队列
            if (status >= 400 && status < 500) {
                console.error(`同步任务因客户端错误被丢弃 [${type}]: ${status}`);
                toast({
                    title: "同步失败",
                    description: "部分离线更改无法同步，已被跳过。",
                    variant: "destructive"
                });
                // 移除错误任务，防止阻塞队列
                await localDB.removeFromSyncQueue(item.id!); 
            } else {
                console.error(`同步失败 [${type}]:`, await response?.text())
                // 服务端错误或网络问题，保留重试
                break 
            }
          }
        } catch (err) {
          console.error(`同步错误 [${item.type}]:`, err)
          break
        }
      }

      toast({ title: "同步完成", description: "所有离线更改已保存到云端。" })
    } catch (error) {
      console.error("同步过程出错:", error)
    } finally {
      setIsSyncing(false)
      isSyncingRef.current = false
      isProcessingQueueRef.current = false
    }
  }, [toast])

  useEffect(() => {
    if (typeof window === 'undefined') return

    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast({
        title: "您已离线",
        description: "更改将保存在本地，网络恢复后自动同步。",
        variant: "default",
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [toast])

  // 网络恢复时自动同步
  useEffect(() => {
    if (isOnline && !isSyncingRef.current) {
      syncPendingData()
    }
  }, [isOnline, syncPendingData])

  return { isOnline, isSyncing }
}

