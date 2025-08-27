export const TOOL_ICONS = {
  edit: 'edit-3',
  write: 'edit-3',
  read: 'file-text',
  bash: 'terminal',
  shell: 'terminal',
  search: 'search',
  grep: 'search',
  todo: 'check-square',
  web: 'globe',
  task: 'layers',
  glob: 'folder',
  ls: 'folder',
  delete: 'trash-2',
  remove: 'trash-2',
  default: 'tool'
} as const

export const COMPACT_TOOLS = ['Write', 'Glob', 'LS', 'Grep', 'Search', 'Delete', 'Remove']

export const getToolIcon = (name: string): string => {
  const lowerName = name.toLowerCase()
  for (const [key, icon] of Object.entries(TOOL_ICONS)) {
    if (lowerName.includes(key)) return icon
  }
  return TOOL_ICONS.default
}

export const formatMCPToolName = (name: string): string => {
  if (name.startsWith('mcp__')) {
    const parts = name.replace('mcp__', '').split('__')
    const toolName = parts[parts.length - 1]
    // Convert camelCase to Title Case
    return toolName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  }
  return name
}

export const isInterrupted = (error?: string): boolean => {
  return !!error && (error.includes('interrupted') || error.includes('cancelled'))
}