import { View, Text, TouchableOpacity } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors } from '../../theme/colors'
import { commonToolStyles } from '../../styles/tool-styles'
import { getToolIcon } from '../../constants/tool-constants'
import { ShimmerText } from './shimmer-text'
import { LoadingSpinner } from './loading-spinner'

interface ToolHeaderProps {
  name: string
  displayName: string
  preview?: string
  expanded?: boolean
  onToggle?: () => void
  hasResult?: boolean
  hasError?: boolean
  isInterrupted?: boolean
  isLoading?: boolean
  children?: React.ReactNode
  showChevron?: boolean
  shimmerDisplayName?: boolean
}

export function ToolHeader({
  name,
  displayName,
  preview,
  expanded = false,
  onToggle,
  hasResult,
  hasError,
  isInterrupted,
  isLoading = false,
  children,
  showChevron = true,
  shimmerDisplayName = false,
}: ToolHeaderProps) {
  const styles = commonToolStyles
  const isExpandable = !!onToggle
  
  const Header = isExpandable ? TouchableOpacity : View
  const isRunning = shimmerDisplayName && !hasResult
  
  return (
    <Header 
      style={styles.header}
      onPress={isExpandable ? onToggle : undefined}
    >
      <View style={styles.iconContainer}>
        <Feather 
          name={getToolIcon(name) as any} 
          size={14} 
          color={colors.text.secondary} 
        />
      </View>
      
      <View style={styles.headerInfo}>
        {shimmerDisplayName ? (
          <ShimmerText 
            style={styles.label} 
            isActive={shimmerDisplayName}
          >
            {displayName}
          </ShimmerText>
        ) : (
          <Text style={styles.label}>{displayName}</Text>
        )}
        {preview && !expanded && (
          <Text style={styles.preview} numberOfLines={1}>
            {preview}
          </Text>
        )}
      </View>
      
      {children}
      
      {(hasResult || isLoading) && (
        <View style={[styles.statusIndicator, hasError && styles.errorIndicator]}>
          {isLoading ? (
            <LoadingSpinner size={12} color={colors.accent.primary} />
          ) : (
            <Feather 
              name={
                isInterrupted ? 'alert-circle' : 
                hasError ? 'x-circle' : 
                'check-circle'
              } 
              size={12} 
              color={
                isInterrupted ? colors.semantic.warning : 
                hasError ? colors.semantic.error : 
                colors.semantic.success
              } 
            />
          )}
        </View>
      )}
      
      {showChevron && isExpandable && (
        <Feather 
          name={expanded ? 'chevron-up' : 'chevron-down'} 
          size={14} 
          color={colors.text.secondary}
          style={styles.chevron}
        />
      )}
    </Header>
  )
}