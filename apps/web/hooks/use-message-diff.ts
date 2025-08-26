export function useMessageDiff() {
  let lastFullContent = ''

  const getDiffContent = (newContent: string): string => {
    if (!lastFullContent) {
      lastFullContent = newContent
      return newContent
    }
    
    if (newContent.startsWith(lastFullContent)) {
      const diff = newContent.substring(lastFullContent.length).trim()
      if (diff) {
        lastFullContent = newContent
        return diff
      }
    }
    
    lastFullContent = newContent
    return newContent
  }

  const resetDiff = () => {
    lastFullContent = ''
  }

  return {
    getDiffContent,
    resetDiff
  }
}