"use client"

import { useToastContext } from '@/contexts/toast-context'
import { useApi } from '@/hooks/use-api'
import { ApiClient } from '@/lib/api-client'

export function ToastDemo() {
  const toast = useToastContext()
  const { execute, loading } = useApi({
    showSuccessToast: true,
    successMessage: 'API call successful!'
  })

  return (
    <div className="p-6 space-y-4 max-w-md">
      <h2 className="text-2xl font-bold">Toast Examples</h2>
      
      <div className="space-y-2">
        <button
          onClick={() => toast.success('Success!', 'Operation completed successfully')}
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Show Success Toast
        </button>
        
        <button
          onClick={() => toast.error('Error!', 'Something went wrong')}
          className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Show Error Toast
        </button>
        
        <button
          onClick={() => toast.warning('Warning!', 'Please be careful')}
          className="w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
        >
          Show Warning Toast
        </button>
        
        <button
          onClick={() => toast.info('Info', 'Here is some information')}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Show Info Toast
        </button>
        
        <button
          onClick={() => execute(() => ApiClient.get('/api/stats'))}
          disabled={loading}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Test API Call'}
        </button>
      </div>
    </div>
  )
}
