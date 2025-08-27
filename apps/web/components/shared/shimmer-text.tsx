import React, { useEffect, useRef } from 'react'
import { Animated, Text } from 'react-native'

interface ShimmerTextProps {
  children: string
  style?: any
  isActive?: boolean
}

export function ShimmerText({ children, style, isActive = true }: ShimmerTextProps) {
  const pulseAnim = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    if (isActive) {
      const animate = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start(() => animate())
      }
      animate()
    } else {
      pulseAnim.setValue(1)
    }
  }, [isActive, pulseAnim])

  if (!isActive) {
    return <Text style={style}>{children}</Text>
  }

  return (
    <Animated.Text style={[style, { opacity: pulseAnim }]}>
      {children}
    </Animated.Text>
  )
}
