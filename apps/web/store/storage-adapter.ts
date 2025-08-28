// Storage adapter that works on both web and mobile
import { Platform } from 'react-native'

class StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      // Use localStorage for web
      try {
        return localStorage.getItem(key)
      } catch (error) {
        console.error('Failed to get item from localStorage:', error)
        return null
      }
    } else {
      // Use SecureStore for mobile
      try {
        const SecureStore = require('expo-secure-store')
        return await SecureStore.getItemAsync(key)
      } catch (error) {
        console.error('Failed to get item from SecureStore:', error)
        return null
      }
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      // Use localStorage for web
      try {
        localStorage.setItem(key, value)
      } catch (error) {
        console.error('Failed to set item in localStorage:', error)
      }
    } else {
      // Use SecureStore for mobile
      try {
        const SecureStore = require('expo-secure-store')
        await SecureStore.setItemAsync(key, value)
      } catch (error) {
        console.error('Failed to set item in SecureStore:', error)
      }
    }
  }

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      // Use localStorage for web
      try {
        localStorage.removeItem(key)
      } catch (error) {
        console.error('Failed to remove item from localStorage:', error)
      }
    } else {
      // Use SecureStore for mobile
      try {
        const SecureStore = require('expo-secure-store')
        await SecureStore.deleteItemAsync(key)
      } catch (error) {
        console.error('Failed to remove item from SecureStore:', error)
      }
    }
  }
}

export const Storage = new StorageAdapter()