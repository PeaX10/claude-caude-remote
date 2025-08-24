import React from 'react'
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native'
import { colors, shadows, spacing } from '../../theme/colors'

interface ButtonProps {
  title: string
  onPress: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  style?: ViewStyle
  icon?: string
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  disabled = false,
  variant = 'primary',
  size = 'md',
  style,
  icon
}) => {
  const getSizeStyle = () => {
    switch (size) {
      case 'sm': return styles.sm
      case 'lg': return styles.lg
      default: return styles.md
    }
  }

  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return disabled ? styles.primaryDisabled : styles.primary
      case 'secondary':
        return disabled ? styles.secondaryDisabled : styles.secondary
      case 'ghost':
        return disabled ? styles.ghostDisabled : styles.ghost
      case 'danger':
        return disabled ? styles.dangerDisabled : styles.danger
      default:
        return styles.primary
    }
  }

  const getTextSizeStyle = () => {
    switch (size) {
      case 'sm': return styles.smText
      case 'lg': return styles.lgText
      default: return styles.mdText
    }
  }

  const getTextVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return disabled ? styles.primaryTextDisabled : styles.primaryText
      case 'secondary':
        return disabled ? styles.secondaryTextDisabled : styles.secondaryText
      case 'ghost':
        return disabled ? styles.ghostTextDisabled : styles.ghostText
      case 'danger':
        return disabled ? styles.dangerTextDisabled : styles.dangerText
      default:
        return styles.primaryText
    }
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, getSizeStyle(), getVariantStyle(), style]}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, getTextSizeStyle(), getTextVariantStyle()]}>
        {icon && `${icon} `}{title}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    ...shadows.sm,
  },
  sm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 32,
  },
  md: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 40,
  },
  lg: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  primary: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  primaryDisabled: {
    backgroundColor: colors.background.tertiary,
    borderColor: colors.border.primary,
  },
  
  secondary: {
    backgroundColor: colors.background.secondary,
    borderColor: colors.border.primary,
  },
  secondaryDisabled: {
    backgroundColor: colors.background.primary,
    borderColor: colors.border.primary,
  },
  
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  ghostDisabled: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  
  danger: {
    backgroundColor: colors.semantic.error,
    borderColor: colors.semantic.error,
  },
  dangerDisabled: {
    backgroundColor: colors.background.tertiary,
    borderColor: colors.border.primary,
  },
  text: {
    fontWeight: '500',
    textAlign: 'center',
  },
  
  smText: {
    fontSize: 13,
  },
  mdText: {
    fontSize: 14,
  },
  lgText: {
    fontSize: 16,
  },
  primaryText: {
    color: '#ffffff',
  },
  primaryTextDisabled: {
    color: colors.text.tertiary,
  },
  
  secondaryText: {
    color: colors.text.primary,
  },
  secondaryTextDisabled: {
    color: colors.text.tertiary,
  },
  
  ghostText: {
    color: colors.text.secondary,
  },
  ghostTextDisabled: {
    color: colors.text.tertiary,
  },
  
  dangerText: {
    color: '#ffffff',
  },
  dangerTextDisabled: {
    color: colors.text.tertiary,
  },
})