
/**
 * 在指定位置插入文本
 * @param value 当前文本内容
 * @param selectionStart 选区开始位置
 * @param selectionEnd 选区结束位置
 * @param before 插入在选区前的文本
 * @param after 插入在选区后的文本
 * @param selectText 如果没有选区，插入并选中的占位文本
 */
export function insertTextOperation(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  before: string,
  after: string = "",
  selectText: string = ""
) {
  const selectedText = value.substring(selectionStart, selectionEnd)
  const beforeText = value.substring(0, selectionStart)
  const afterText = value.substring(selectionEnd)

  let newText: string
  let newSelectionStart: number
  let newSelectionEnd: number

  if (selectedText) {
    // 如果有选中文本，在选中文本前后插入
    newText = `${beforeText}${before}${selectedText}${after}${afterText}`
    // 选中被格式化的文本（不包括标记）
    newSelectionStart = selectionStart + before.length
    newSelectionEnd = selectionEnd + before.length
  } else if (selectText) {
    // 如果没有选中文本，插入格式标记并选中中间的文本
    newText = `${beforeText}${before}${selectText}${after}${afterText}`
    newSelectionStart = selectionStart + before.length
    newSelectionEnd = selectionStart + before.length + selectText.length
  } else {
    // 直接插入，光标放在插入内容之后
    newText = `${beforeText}${before}${after}${afterText}`
    const newCursorPos = selectionStart + before.length
    newSelectionStart = newCursorPos
    newSelectionEnd = newCursorPos
  }

  return { newText, newSelectionStart, newSelectionEnd }
}

/**
 * 在行首插入或移除前缀
 * @param value 当前文本内容
 * @param selectionStart 选区开始位置
 * @param selectionEnd 选区结束位置
 * @param prefix 前缀
 * @param suffix 后缀
 * @param placeholder 占位符
 */
export function insertLineOperation(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string,
  suffix: string = "",
  placeholder: string = ""
) {
  const beforeText = value.substring(0, selectionStart)
  const afterText = value.substring(selectionEnd)

  // 找到当前行的开始和结束
  const lineStart = beforeText.lastIndexOf('\n') + 1
  const lineEnd = afterText.indexOf('\n') === -1 ? value.length : selectionEnd + afterText.indexOf('\n')
  const currentLine = value.substring(lineStart, lineEnd)

  // 检查当前行是否已经有该前缀（支持多个 # 号）
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const prefixRegex = new RegExp(`^\\s*${escapedPrefix}+`)
  const hasPrefix = prefixRegex.test(currentLine.trim())

  let newLine: string
  let newSelectionStart: number
  let newSelectionEnd: number

  if (hasPrefix) {
    // 如果已有，移除前缀
    newLine = currentLine.replace(prefixRegex, '').trimStart()
    const newCursorPos = lineStart + newLine.length
    newSelectionStart = newCursorPos
    newSelectionEnd = newCursorPos
  } else {
    // 如果没有，添加前缀
    if (placeholder && currentLine.trim() === '') {
      // 如果是空行且有占位符，插入占位符
      newLine = `${prefix}${placeholder}${suffix}`
      newSelectionStart = lineStart + prefix.length
      newSelectionEnd = lineStart + prefix.length + placeholder.length
    } else {
      newLine = `${prefix}${currentLine}${suffix}`
      const newCursorPos = lineStart + newLine.length
      newSelectionStart = newCursorPos
      newSelectionEnd = newCursorPos
    }
  }

  const newText = value.substring(0, lineStart) + newLine + value.substring(lineEnd)

  return { newText, newSelectionStart, newSelectionEnd }
}

// --- AI 摘要工具 ---

export const AI_SUMMARY_PREFIX = "> **AI 摘要**："
export const AI_SUMMARY_SEPARATOR = "\n\n---\n\n"

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 提取 AI 摘要之外的内容
 * @param content 完整内容
 */
export function getActualContent(content: string): string {
  const pattern = new RegExp(`\\s*${escapeRegExp(AI_SUMMARY_PREFIX)}.*?${escapeRegExp(AI_SUMMARY_SEPARATOR.trim())}\\s*`, 's')
  return content.replace(pattern, '').trim()
}

/**
 * 检查是否包含 AI 摘要
 * @param content 完整内容
 */
export function hasSummary(content: string): boolean {
  const pattern = new RegExp(`\\s*${escapeRegExp(AI_SUMMARY_PREFIX)}.*?${escapeRegExp(AI_SUMMARY_SEPARATOR.trim())}\\s*`, 's')
  return pattern.test(content)
}

/**
 * 插入或更新 AI 摘要
 * @param content 原内容
 * @param summaryText 摘要文本（不包含前缀）
 */
export function upsertSummary(content: string, summaryText: string): string {
  const summaryBlock = `${AI_SUMMARY_PREFIX}${summaryText}${AI_SUMMARY_SEPARATOR}`
  
  // 移除旧摘要（如果有）
  const cleanContent = getActualContent(content)
  
  // 将新摘要拼接到最前
  return `${summaryBlock}${cleanContent}`
}
