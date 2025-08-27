import { View, Animated } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors } from '../../theme/colors'
import { useEffect, useRef } from 'react'

interface LoadingSpinnerProps {
  size?: number
  color?: string
}

export function LoadingSpinner({ 
  size = 12, 
  color = colors.accent.primary,
  style
}: LoadingSpinnerProps & { style?: any }) {
  const spinValue = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const spin = () => {
      spinValue.setValue(0)
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => spin())
    }
    spin()
  }, [spinValue])

  const rotate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  return (
    <Animated.View style={[{ transform: [{ rotate }] }, style]}>
      <Feather 
        name="loader" 
        size={size} 
        color={color} 
      />
    </Animated.View>
  )
}