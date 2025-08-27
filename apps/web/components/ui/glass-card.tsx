import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { colors, shadows } from '../../theme/colors'

interface GlassCardProps {
  children: React.ReactNode
  style?: ViewStyle
  blur?: boolean
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  style, 
  blur = true 
}) => {
  return (
    <View style={[styles.container, blur && styles.blur, style]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.primary,
    shadowColor: shadows.sm.shadowColor,
    shadowOffset: shadows.sm.shadowOffset,
    shadowOpacity: shadows.sm.shadowOpacity,
    shadowRadius: shadows.sm.shadowRadius,
    elevation: shadows.sm.elevation,
  },
  blur: {
    backgroundColor: colors.surface.glass,
    backdropFilter: 'blur(10px)',
  },
})