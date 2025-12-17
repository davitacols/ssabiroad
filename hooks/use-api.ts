import { useState, useCallback } from 'react'
import { useToastContext } from '@/contexts/toast-context'
import { ErrorHandler } from '@/lib/error-handler'

interface UseApiOptions {
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
  showSuccessToast?: boolean
  showErrorToast?: boolean
  successMessage?: string
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<any>(null)
  const toast = useToastContext()

  const execute = useCallback(async (apiCall: () => Promise<T>) => {
    setLoading(true)
    setError(null)

    try {
      const result = await apiCall()
      setData(result)
      
      if (options.showSuccessToast) {
        toast.success(options.successMessage || 'Success')
      }
      
      options.onSuccess?.(result)
      return result
    } catch (err: any) {
      const errorDetails = ErrorHandler.parse(err)
      setError(errorDetails)
      
      if (options.showErrorToast !== false) {
        toast.error(errorDetails.title, errorDetails.message)
      }
      
      options.onError?.(errorDetails)
      throw err
    } finally {
      setLoading(false)
    }
  }, [options, toast])

  return { execute, loading, data, error }
}
