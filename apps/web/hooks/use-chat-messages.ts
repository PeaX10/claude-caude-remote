import { useState, useRef } from 'react'
import { Animated } from 'react-native'

interface Message {
  id: string
  type: 'user' | 'claude' | 'system'
  content: string
  timestamp: number
}

export function useChatMessages() {
  const [messages, setMessages] = useState<Message[]>([])
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current

  const addMessage = (type: 'user' | 'claude' | 'system', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, newMessage])
    
    fadeAnim.setValue(0)
    slideAnim.setValue(30)
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start()

    return newMessage
  }

  const clearMessages = () => {
    setMessages([])
  }

  return {
    messages,
    fadeAnim,
    slideAnim,
    addMessage,
    clearMessages
  }
}