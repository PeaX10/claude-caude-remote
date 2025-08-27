import React, { useEffect, useRef } from 'react'
import { View, Text, Animated, Easing } from 'react-native'
import { colors, spacing } from '../theme/colors'
import { Feather } from '@expo/vector-icons'

// Thinking indicator with animated dots
export function ThinkingIndicator({ label = 'Thinking' }: { label?: string }) {
  const dot1 = useRef(new Animated.Value(0)).current
  const dot2 = useRef(new Animated.Value(0)).current
  const dot3 = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      ).start()
    }

    animateDot(dot1, 0)
    animateDot(dot2, 150)
    animateDot(dot3, 300)
  }, [])

  const dotStyle = (animValue: Animated.Value) => ({
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent.primary,
    opacity: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    }),
    transform: [
      {
        scale: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1.2],
        }),
      },
    ],
  })

  return (
    <View style={styles.thinkingContainer}>
      <Feather name="cpu" size={16} color={colors.accent.primary} />
      <Text style={styles.thinkingLabel}>{label}</Text>
      <View style={styles.dotsContainer}>
        <Animated.View style={dotStyle(dot1)} />
        <Animated.View style={dotStyle(dot2)} />
        <Animated.View style={dotStyle(dot3)} />
      </View>
    </View>
  )
}

// Tool use indicator - elegant with subtle animation
export function ToolUseIndicator({ 
  toolName, 
  status = 'running' 
}: { 
  toolName: string
  status?: 'running' | 'success' | 'error'
}) {
  const rotation = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (status === 'running') {
      // Subtle rotation animation
      Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start()
    }
  }, [status])

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return colors.semantic.success
      case 'error':
        return colors.semantic.error
      default:
        return colors.accent.primary
    }
  }

  const getToolIcon = () => {
    // Return specific icon based on tool name
    if (toolName.includes('Edit') || toolName.includes('Write')) return 'edit-3'
    if (toolName.includes('Read')) return 'file-text'
    if (toolName.includes('Bash') || toolName.includes('Shell')) return 'terminal'
    if (toolName.includes('Search') || toolName.includes('Grep')) return 'search'
    if (toolName.includes('Todo')) return 'check-square'
    if (toolName.includes('Web')) return 'globe'
    if (toolName.includes('Task')) return 'layers'
    if (toolName.includes('Glob') || toolName.includes('LS')) return 'folder'
    if (toolName.includes('Delete') || toolName.includes('Remove')) return 'trash-2'
    
    // Status-based icons
    switch (status) {
      case 'success':
        return 'check-circle'
      case 'error':
        return 'x-circle'
      default:
        return 'tool'
    }
  }

  return (
    <View style={[styles.toolContainer, { borderLeftColor: getStatusColor() }]}>
      <Animated.View 
        style={[
          styles.toolIcon,
          status === 'running' && {
            transform: [
              { rotate: rotateInterpolate }
            ],
          },
        ]}
      >
        <Feather name={getToolIcon()} size={18} color={getStatusColor()} />
      </Animated.View>
      <View style={styles.toolContent}>
        <Text style={styles.toolLabel}>TOOL USE</Text>
        <Text style={styles.toolName}>{toolName}</Text>
        {status === 'running' && (
          <View style={styles.progressBar}>
            <Animated.View 
              style={[
                styles.progressFill,
                { backgroundColor: getStatusColor() }
              ]} 
            />
          </View>
        )}
      </View>
    </View>
  )
}

// Analysis indicator - elegant with subtle animation
export function AnalysisIndicator({ type = 'Analyzing' }: { type?: string }) {
  const wave1 = useRef(new Animated.Value(0)).current
  const wave2 = useRef(new Animated.Value(0)).current
  
  useEffect(() => {
    const animateWave = (wave: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(wave, {
            toValue: 1,
            duration: 2000,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(wave, {
            toValue: 0,
            duration: 2000,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      ).start()
    }

    animateWave(wave1, 0)
    animateWave(wave2, 500)
  }, [])

  const waveStyle = (animValue: Animated.Value, index: number) => ({
    position: 'absolute' as const,
    width: 40 + index * 20,
    height: 40 + index * 20,
    borderRadius: (40 + index * 20) / 2,
    borderWidth: 2,
    borderColor: colors.accent.secondary,
    opacity: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 0],
    }),
    transform: [
      {
        scale: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1.5],
        }),
      },
    ],
  })

  return (
    <View style={styles.analysisContainer}>
      <View style={styles.waveContainer}>
        <Animated.View style={waveStyle(wave1, 0)} />
        <Animated.View style={waveStyle(wave2, 1)} />
        <Feather name="activity" size={20} color={colors.accent.secondary} />
      </View>
      <Text style={styles.analysisLabel}>{type}</Text>
    </View>
  )
}

// Status badge - elegant without glow
export function StatusBadge({ 
  status, 
  label 
}: { 
  status: 'active' | 'pending' | 'complete' | 'error'
  label: string
}) {

  const getStatusStyle = () => {
    switch (status) {
      case 'active':
        return {
          backgroundColor: colors.accent.primary + '20',
          borderColor: colors.accent.primary,
        }
      case 'complete':
        return {
          backgroundColor: colors.semantic.success + '20',
          borderColor: colors.semantic.success,
        }
      case 'error':
        return {
          backgroundColor: colors.semantic.error + '20',
          borderColor: colors.semantic.error,
        }
      default:
        return {
          backgroundColor: colors.background.tertiary,
          borderColor: colors.border.primary,
        }
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'active':
        return 'zap'
      case 'complete':
        return 'check'
      case 'error':
        return 'alert-circle'
      default:
        return 'clock'
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return colors.accent.primary
      case 'complete':
        return colors.semantic.success
      case 'error':
        return colors.semantic.error
      default:
        return colors.text.secondary
    }
  }

  return (
    <View 
      style={[
        styles.statusBadge,
        getStatusStyle(),
      ]}
    >
      <Feather name={getStatusIcon()} size={14} color={getStatusColor()} />
      <Text style={[styles.statusLabel, { color: getStatusColor() }]}>
        {label}
      </Text>
    </View>
  )
}

const styles = {
  // Thinking styles
  thinkingContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    marginVertical: spacing.xs,
  },
  thinkingLabel: {
    fontSize: 13,
    color: colors.text.accent,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  dotsContainer: {
    flexDirection: 'row' as const,
    gap: spacing.xs,
    alignItems: 'center' as const,
  },
  
  // Tool use styles
  toolContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginVertical: spacing.xs,
  },
  toolIcon: {
    marginRight: spacing.md,
  },
  toolContent: {
    flex: 1,
  },
  toolLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  toolName: {
    fontSize: 15,
    color: colors.text.primary,
    fontWeight: '500' as const,
  },
  progressBar: {
    height: 3,
    backgroundColor: colors.background.tertiary,
    borderRadius: 1.5,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '60%',
    borderRadius: 1.5,
  },
  
  // Analysis styles
  analysisContainer: {
    alignItems: 'center' as const,
    padding: spacing.lg,
    marginVertical: spacing.md,
  },
  waveContainer: {
    width: 80,
    height: 80,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: spacing.md,
  },
  analysisLabel: {
    fontSize: 14,
    color: colors.text.accent,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  
  // Status badge styles
  statusBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start' as const,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
}