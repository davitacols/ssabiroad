# Toast & Error Management System

## Overview
Comprehensive error handling and toast notification system for SSABIRoad.

## Components

### 1. Toast Context (`contexts/toast-context.tsx`)
Global toast management with type-safe notifications.

**Usage:**
```tsx
import { useToastContext } from '@/contexts/toast-context'

function MyComponent() {
  const toast = useToastContext()
  
  // Simple notifications
  toast.success('Operation successful!')
  toast.error('Something went wrong')
  toast.warning('Please be careful')
  toast.info('Here is some information')
  
  // With descriptions
  toast.success('Saved!', 'Your changes have been saved successfully')
  toast.error('Failed', 'Unable to connect to the server')
}
```

### 2. Error Boundary (`components/error-boundary.tsx`)
Catches React errors and displays fallback UI.

**Features:**
- Automatic error catching
- Custom fallback UI
- Reload functionality

### 3. Error Handler (`lib/error-handler.ts`)
Client-side error parsing and handling.

**Usage:**
```tsx
import { ErrorHandler, handleApiCall } from '@/lib/error-handler'

// Parse errors
const errorDetails = ErrorHandler.parse(error)
console.log(errorDetails.title, errorDetails.message)

// Handle API calls
const result = await handleApiCall(
  () => fetch('/api/data').then(r => r.json()),
  (error) => toast.error(error.title, error.message)
)
```

### 4. API Client (`lib/api-client.ts`)
Centralized HTTP client with timeout and error handling.

**Usage:**
```tsx
import { ApiClient } from '@/lib/api-client'

// GET request
const data = await ApiClient.get('/api/locations')

// POST request
const result = await ApiClient.post('/api/save', { name: 'Test' })

// With timeout
const data = await ApiClient.get('/api/data', { timeout: 5000 })
```

### 5. useApi Hook (`hooks/use-api.ts`)
React hook for API calls with automatic error handling.

**Usage:**
```tsx
import { useApi } from '@/hooks/use-api'

function MyComponent() {
  const { execute, loading, data, error } = useApi({
    showSuccessToast: true,
    successMessage: 'Data loaded!',
    onSuccess: (data) => console.log('Success:', data),
    onError: (error) => console.error('Error:', error)
  })
  
  const loadData = async () => {
    await execute(() => ApiClient.get('/api/data'))
  }
  
  return (
    <button onClick={loadData} disabled={loading}>
      {loading ? 'Loading...' : 'Load Data'}
    </button>
  )
}
```

## Server-Side Error Handling

### Existing Middleware Error Handler
Located at `app/middleware-error-handler.ts`

**Usage in API routes:**
```tsx
import { ErrorHandler, throwApiError } from '@/app/middleware-error-handler'
import { ErrorCodes } from '@/app/error-constants'

export const GET = ErrorHandler.withErrorHandling(async (req) => {
  const query = req.nextUrl.searchParams.get('q')
  
  if (!query) {
    throwApiError(ErrorCodes.BAD_REQUEST, 'Query parameter required')
  }
  
  const data = await fetchData(query)
  return NextResponse.json({ success: true, data })
})
```

## Error Types

### Toast Types
- `success` - Green, 5s duration
- `error` - Red, 7s duration
- `warning` - Yellow, 5s duration
- `info` - Blue, 5s duration

### HTTP Error Codes
All standard codes defined in `app/error-constants.ts`:
- 400 - Bad Request
- 401 - Unauthorized
- 403 - Forbidden
- 404 - Not Found
- 429 - Too Many Requests
- 500 - Internal Server Error
- 502 - Bad Gateway
- 503 - Service Unavailable
- 504 - Gateway Timeout

## Best Practices

1. **Use useApi hook** for component-level API calls
2. **Use ApiClient** for direct API calls
3. **Use ErrorHandler.withErrorHandling** for API routes
4. **Always provide user-friendly error messages**
5. **Use appropriate toast types** for different scenarios
6. **Set reasonable timeouts** for API calls (default: 30s)

## Migration Guide

### Old Pattern:
```tsx
try {
  const res = await fetch('/api/data')
  const data = await res.json()
  alert('Success!')
} catch (error) {
  alert('Error!')
}
```

### New Pattern:
```tsx
const toast = useToastContext()
const { execute, loading } = useApi({
  showSuccessToast: true,
  successMessage: 'Data loaded successfully'
})

await execute(() => ApiClient.get('/api/data'))
```

## Examples

### Example 1: Form Submission
```tsx
function SaveForm() {
  const toast = useToastContext()
  const { execute, loading } = useApi()
  
  const handleSubmit = async (formData: any) => {
    try {
      await execute(() => ApiClient.post('/api/save', formData))
      toast.success('Saved!', 'Your data has been saved')
    } catch (error) {
      // Error toast shown automatically
    }
  }
  
  return <form onSubmit={handleSubmit}>...</form>
}
```

### Example 2: Data Fetching
```tsx
function DataList() {
  const { execute, loading, data } = useApi({
    showErrorToast: true
  })
  
  useEffect(() => {
    execute(() => ApiClient.get('/api/items'))
  }, [])
  
  if (loading) return <div>Loading...</div>
  return <div>{data?.map(item => ...)}</div>
}
```

### Example 3: API Route
```tsx
import { ErrorHandler, throwApiError } from '@/app/middleware-error-handler'
import { ErrorCodes, SpecificErrorMessages } from '@/app/error-constants'

export const POST = ErrorHandler.withErrorHandling(async (req) => {
  const body = await req.json()
  
  if (!body.name) {
    throwApiError(ErrorCodes.BAD_REQUEST, SpecificErrorMessages.MISSING_UPDATE_DATA)
  }
  
  const result = await saveData(body)
  return NextResponse.json({ success: true, data: result })
})
```
