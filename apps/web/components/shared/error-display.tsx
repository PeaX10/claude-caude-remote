import { View, Text } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors } from '../../theme/colors'
import { errorStyles } from '../../styles/tool-styles'

interface ErrorDisplayProps {
  error: string
  isInterrupted?: boolean
  inline?: boolean
}

export function ErrorDisplay({ error, isInterrupted = false, inline = false }: ErrorDisplayProps) {
  if (inline) {
    return <Text style={errorStyles.errorMessage}>{error}</Text>
  }
  
  return (
    <View style={errorStyles.errorContainer}>
      <View style={errorStyles.errorHeader}>
        <Feather 
          name={isInterrupted ? 'alert-circle' : 'x-circle'} 
          size={14} 
          color={colors.semantic.error} 
        />
        <Text style={errorStyles.errorLabel}>
          {isInterrupted ? 'Interrupted' : 'Error'}
        </Text>
      </View>
      <Text style={errorStyles.errorText}>
        {error}
      </Text>
    </View>
  )
}