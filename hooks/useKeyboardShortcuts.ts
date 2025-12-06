import { useEffect, useRef } from 'react'

type KeyCombo = {
  key: string
  ctrl?: boolean
  meta?: boolean
  alt?: boolean
  shift?: boolean
}

type ShortcutHandler = (e: KeyboardEvent) => void

interface ShortcutConfig {
  combo: KeyCombo
  handler: ShortcutHandler
  preventDefault?: boolean
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  // 使用 Ref 存储最新的 shortcuts 配置，避免 useEffect 频繁重新绑定
  const shortcutsRef = useRef(shortcuts)
  
  useEffect(() => {
    shortcutsRef.current = shortcuts
  }, [shortcuts])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果当前焦点在输入框/文本域中，且快捷键不是全局通用的（如Ctrl+S），则通常应跳过
      // 但考虑到 Ctrl+S 即使在输入框也要生效，这里不做统一拦截，
      // 而是建议由具体的 handler 内部决定，或者在配置中增加 ignoreInInput 选项。
      // 目前保持原样，只修复依赖引用问题。

      shortcutsRef.current.forEach(({ combo, handler, preventDefault = true }) => {
        const isKeyMatch = e.key.toLowerCase() === combo.key.toLowerCase()
        const isCtrlMatch = !!combo.ctrl === e.ctrlKey
        const isMetaMatch = !!combo.meta === e.metaKey
        const isAltMatch = !!combo.alt === e.altKey
        const isShiftMatch = !!combo.shift === e.shiftKey

        // Handle Cmd/Ctrl interchangably if only one is specified as true
        // This is common for cross-platform shortcuts like Cmd+S / Ctrl+S
        const isCmdOrCtrl = (combo.ctrl || combo.meta) && (e.ctrlKey || e.metaKey)
        const strictMatch = isKeyMatch && isCtrlMatch && isMetaMatch && isAltMatch && isShiftMatch
        
        // Loose match for Cmd/Ctrl
        const looseMatch = isKeyMatch && isCmdOrCtrl && !combo.alt && !combo.shift

        if (strictMatch || looseMatch) {
          if (preventDefault) {
            e.preventDefault()
          }
          handler(e)
        }
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, []) // 空依赖数组，只绑定一次，通过 Ref 访问最新 handler
}
