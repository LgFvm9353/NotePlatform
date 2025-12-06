import { useState, useEffect } from 'react'
import { localDB } from '@/lib/db'
import { useToast } from '@/hooks/use-toast'

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (typeof window === 'undefined') return

    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      syncPendingData()
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast({
        title: "您已离线",
        description: "更改将保存在本地，网络恢复后自动同步。",
        variant: "default", // 或者 warning 样式
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const syncPendingData = async () => {
    if (isSyncing) return
    setIsSyncing(true)

    try {
      const queue = await localDB.getSyncQueue()
      if (queue.length === 0) {
        setIsSyncing(false)
        return
      }

      toast({ title: "网络已恢复", description: "正在同步离线数据..." })

      for (const item of queue) {
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
                // 1. 删除本地临时ID记录
                await localDB.deleteNote(tempId)
                // 2. 保存真实ID记录 (注意：如果本地已有更新的编辑，这里可能会覆盖，
                // 但由于 syncQueue 是顺序执行的，后续的 UPDATE_NOTE 会修正它)
                await localDB.saveNote(data.note)
                
                // 3. 修正队列中后续针对该临时ID的操作
                await localDB.updateSyncQueueNoteId(tempId, realId)
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
            console.error(`同步失败 [${type}]:`, await response?.text())
            // 可以在这里决定是否保留在队列中重试，或者标记为错误
          }
        } catch (err) {
          console.error(`同步错误 [${item.type}]:`, err)
        }
      }

      toast({ title: "同步完成", description: "所有离线更改已保存到云端。" })
    } catch (error) {
      console.error("同步过程出错:", error)
    } finally {
      setIsSyncing(false)
    }
  }

  return { isOnline, isSyncing }
}

