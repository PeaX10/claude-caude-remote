import { useEffect, useRef } from 'react'
import { View, TouchableOpacity, Animated, StyleSheet } from 'react-native'
import { colors } from '../theme/colors'

interface BurgerMenuProps {
  isOpen: boolean
  onPress: () => void
}

export function BurgerMenu({ isOpen, onPress }: BurgerMenuProps) {
  const topBarAnim = useRef(new Animated.Value(0)).current
  const middleBarAnim = useRef(new Animated.Value(1)).current
  const bottomBarAnim = useRef(new Animated.Value(0)).current
  const rotateAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      // Top bar animation
      Animated.timing(topBarAnim, {
        toValue: isOpen ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      // Middle bar fade
      Animated.timing(middleBarAnim, {
        toValue: isOpen ? 0 : 1,
        duration: 200,
        useNativeDriver: true,
      }),
      // Bottom bar animation
      Animated.timing(bottomBarAnim, {
        toValue: isOpen ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      // Rotation
      Animated.timing(rotateAnim, {
        toValue: isOpen ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start()
  }, [isOpen])

  const topBarTransform = {
    transform: [
      {
        translateY: topBarAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 7],
        }),
      },
      {
        rotate: topBarAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '45deg'],
        }),
      },
    ],
  }

  const bottomBarTransform = {
    transform: [
      {
        translateY: bottomBarAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -7],
        }),
      },
      {
        rotate: bottomBarAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '-45deg'],
        }),
      },
    ],
  }

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <View style={styles.iconContainer}>
        <Animated.View style={[styles.bar, styles.topBar, topBarTransform]} />
        <Animated.View style={[styles.bar, styles.middleBar, { opacity: middleBarAnim }]} />
        <Animated.View style={[styles.bar, styles.bottomBar, bottomBarTransform]} />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginLeft: -8,
  },
  iconContainer: {
    width: 18,
    height: 14,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bar: {
    width: 18,
    height: 1.5,
    backgroundColor: colors.text.secondary,
    borderRadius: 1,
  },
  topBar: {
    position: 'absolute',
    top: 0,
  },
  middleBar: {
    position: 'absolute',
    top: 6.25,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
  },
})