import { useState, useCallback } from 'react'

export interface ToolExecution {
  id: string
  name: string
  timestamp: number
  status: 'running' | 'completed' | 'error'
  isAgent?: boolean
  agentType?: string
  description?: string
  duration?: number
  tokenCount?: number
  toolCount?: number
  parentAgent?: string
}

export function useToolTracker() {
  const [runningTools, setRunningTools] = useState<ToolExecution[]>([])
  const [completedTools, setCompletedTools] = useState<ToolExecution[]>([])
  const [totalToolsUsed, setTotalToolsUsed] = useState(0)
  const [nestedToolsByParent, setNestedToolsByParent] = useState<Record<string, ToolExecution[]>>({})
  const [activeAgents, setActiveAgents] = useState<ToolExecution[]>([])
  const [completedAgents, setCompletedAgents] = useState<ToolExecution[]>([])
  const [agentToolCounts, setAgentToolCounts] = useState<Record<string, number>>({})
  const [agentToolIds, setAgentToolIds] = useState<Record<string, string[]>>({})

  const detectAgentFromInput = (toolName: string, input: any) => {
    // Detect Task tool with subagent_type
    if (toolName === 'Task' && input?.subagent_type) {
      return {
        isAgent: true,
        agentType: input.subagent_type,
        description: input.description || input.prompt?.substring(0, 50) + '...'
      }
    }
    return { isAgent: false }
  }

  const startTool = useCallback((id: string, name: string, input?: any, parentId?: string) => {
    const agentInfo = detectAgentFromInput(name, input)
    
    const tool: ToolExecution = {
      id,
      name,
      timestamp: Date.now(),
      status: 'running',
      isAgent: agentInfo.isAgent,
      agentType: agentInfo.agentType,
      description: agentInfo.description
    }

    setRunningTools(prev => [...prev, tool])
    setTotalToolsUsed(prev => prev + 1)

    // If this is an agent, track it separately
    if (agentInfo.isAgent) {
      setActiveAgents(prev => [...prev, tool])
      setAgentToolCounts(prev => ({ ...prev, [id]: 0 }))
      setAgentToolIds(prev => ({ ...prev, [id]: [] }))
    }

    // Track nested tools if parent exists or if there's an active agent
    if (parentId) {
      setNestedToolsByParent(prev => {
        const updated = { ...prev }
        updated[parentId] = [...(prev[parentId] || []), tool]
        return updated
      })
    }

    // If there are active agents and this isn't an agent, it might be a nested tool
    if (!agentInfo.isAgent) {
      setActiveAgents(prev => prev.map(agent => {
        // Increment tool count for all active agents (since we don't know exactly which agent)
        setAgentToolCounts(counts => {
          const updated = { ...counts }
          updated[agent.id] = (counts[agent.id] || 0) + 1
          return updated
        })
        
        // Track tool IDs for each agent
        setAgentToolIds(toolIds => {
          const updated = { ...toolIds }
          updated[agent.id] = [...(toolIds[agent.id] || []), id]
          return updated
        })
        
        return {
          id: agent.id,
          name: agent.name,
          timestamp: agent.timestamp,
          status: agent.status,
          isAgent: agent.isAgent,
          agentType: agent.agentType,
          description: agent.description,
          toolCount: (agent.toolCount || 0) + 1
        }
      }))
    }
  }, [])

  const completeTool = useCallback((id: string, hasError = false, result?: any) => {
    const status = hasError ? 'error' : 'completed'
    let completedTool: ToolExecution | undefined

    setRunningTools(prev => {
      const tool = prev.find(t => t.id === id)
      if (tool) {
        completedTool = tool
      }
      return prev.filter(t => t.id !== id)
    })
    
    setCompletedTools(prev => {
      const tool = completedTool || prev.find(t => t.id === id) || {
        id,
        name: 'Unknown',
        timestamp: Date.now(),
        status
      }
      
      // Calculate duration and extract agent stats from result
      const duration = Date.now() - tool.timestamp
      let updatedTool: ToolExecution = { 
        ...tool, 
        status: status as 'completed' | 'error', 
        duration 
      }

      // If this was an agent, extract statistics from result
      if (tool.isAgent && result) {
        // Try to get stats from toolUseResult first (from history)
        if (result.totalToolUseCount) {
          updatedTool.toolCount = result.totalToolUseCount
        }
        if (result.totalTokens) {
          updatedTool.tokenCount = result.totalTokens  
        }
        if (result.totalDurationMs) {
          updatedTool.duration = result.totalDurationMs
        }
        
        // Fallback to parsing content if no direct stats
        if (!updatedTool.toolCount && result.content) {
          const content = typeof result.content === 'string' ? result.content : JSON.stringify(result.content)
          
          // Parse tool count from result (look for patterns like "117 tool uses")
          const toolCountMatch = content.match(/(\d+)\s+(?:more\s+)?tool\s+uses?/i)
          if (toolCountMatch) {
            updatedTool.toolCount = parseInt(toolCountMatch[1])
          }
          
          // Parse token count from result (look for patterns like "100.9k tokens")
          const tokenCountMatch = content.match(/([\d.]+)([km])?\s+tokens?/i)
          if (tokenCountMatch) {
            let tokens = parseFloat(tokenCountMatch[1])
            const unit = tokenCountMatch[2]?.toLowerCase()
            if (unit === 'k') tokens *= 1000
            if (unit === 'm') tokens *= 1000000
            updatedTool.tokenCount = Math.round(tokens)
          }
        }
      }
      
      const newList = [updatedTool, ...prev.filter(t => t.id !== id)]
      
      // Keep only the last 10 for performance
      return newList.slice(0, 10)
    })

    // Handle agent completion
    if (completedTool?.isAgent) {
      setActiveAgents(prev => prev.filter(agent => agent.id !== id))
      setCompletedAgents(prev => {
        const updated: ToolExecution = { 
          id: completedTool!.id,
          name: completedTool!.name,
          timestamp: completedTool!.timestamp,
          status: status as 'completed' | 'error',
          isAgent: completedTool!.isAgent,
          agentType: completedTool!.agentType,
          description: completedTool!.description,
          toolCount: completedTool!.toolCount,
          tokenCount: completedTool!.tokenCount,
          duration: Date.now() - completedTool!.timestamp 
        }
        return [updated, ...prev.slice(0, 4)] // Keep last 5 completed agents
      })
    }

    // Update nested tools status
    setNestedToolsByParent(prev => {
      const newNested = { ...prev }
      Object.keys(newNested).forEach(parentId => {
        newNested[parentId] = newNested[parentId].map(tool => 
          tool.id === id ? { ...tool, status } : tool
        )
      })
      return newNested
    })
  }, [])

  const getLastThreeTools = useCallback(() => {
    return completedTools.slice(0, 3)
  }, [completedTools])

  const getRunningCount = useCallback(() => {
    return runningTools.length
  }, [runningTools])

  const getNestedTools = useCallback((parentId: string) => {
    return nestedToolsByParent[parentId] || []
  }, [nestedToolsByParent])

  const getAgentToolIds = useCallback((agentId: string) => {
    return agentToolIds[agentId] || []
  }, [agentToolIds])

  const reset = useCallback(() => {
    setRunningTools([])
    setCompletedTools([])
    setTotalToolsUsed(0)
    setNestedToolsByParent({})
    setActiveAgents([])
    setCompletedAgents([])
    setAgentToolCounts({})
    setAgentToolIds({})
  }, [])

  return {
    startTool,
    completeTool,
    getLastThreeTools,
    getRunningCount,
    getNestedTools,
    getAgentToolIds,
    totalToolsUsed,
    runningTools,
    nestedToolsByParent,
    activeAgents,
    completedAgents,
    agentToolCounts,
    reset
  }
}