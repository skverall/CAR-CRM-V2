import { useTranslations } from 'next-intl'

export function useSafeTranslations() {
  try {
    const t = useTranslations()
    
    return (key: string, fallback?: string) => {
      try {
        return t(key)
      } catch (error) {
        console.warn(`Translation key "${key}" not found, using fallback:`, fallback || key)
        return fallback || key
      }
    }
  } catch (error) {
    console.error('Error initializing translations:', error)
    
    // Return a fallback function that just returns the key or fallback
    return (key: string, fallback?: string) => {
      return fallback || key.split('.').pop() || key
    }
  }
}
