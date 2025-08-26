import { useState, useRef, useEffect } from 'react'
import { ScrollView } from 'react-native'

export function useScrollHandler() {
  const scrollViewRef = useRef<ScrollView>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [scrollViewHeight, setScrollViewHeight] = useState(0)
  const [contentHeight, setContentHeight] = useState(0)

  const checkIfAtBottom = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent
    const threshold = 50
    const atBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - threshold
    setIsAtBottom(atBottom)
  }

  const scrollToBottom = (animated: boolean = true) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated })
    }
  }

  const handleLayout = (event: any) => {
    setScrollViewHeight(event.nativeEvent.layout.height)
  }

  const handleContentSizeChange = (contentWidth: number, contentHeight: number) => {
    setContentHeight(contentHeight)
  }

  return {
    scrollViewRef,
    isAtBottom,
    scrollViewHeight,
    contentHeight,
    checkIfAtBottom,
    scrollToBottom,
    handleLayout,
    handleContentSizeChange
  }
}