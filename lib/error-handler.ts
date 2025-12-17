import { ErrorCodes, ErrorMessages, SpecificErrorMessages } from '@/app/error-constants'

export interface ErrorDetails {
  title: string
  message: string
  code?: number
  action?: string
}

export class ErrorHandler {
  static parse(error: any): ErrorDetails {
    // API Error Response
    if (error?.response?.data) {
      const data = error.response.data
      return {
        title: data.error || 'Request Failed',
        message: data.details || data.message || ErrorMessages[data.code] || 'An error occurred',
        code: data.code || error.response.status,
      }
    }

    // Network Error
    if (error?.message?.includes('Network') || error?.code === 'ERR_NETWORK') {
      return {
        title: 'Network Error',
        message: 'Unable to connect. Check your internet connection.',
        action: 'Retry',
      }
    }

    // Timeout Error
    if (error?.message?.includes('timeout') || error?.code === 'ECONNABORTED') {
      return {
        title: 'Request Timeout',
        message: 'The request took too long. Please try again.',
        action: 'Retry',
      }
    }

    // Validation Error
    if (error?.name === 'ValidationError') {
      return {
        title: 'Validation Error',
        message: error.message || 'Please check your input and try again.',
      }
    }

    // Default Error
    return {
      title: 'Error',
      message: error?.message || 'Something went wrong. Please try again.',
    }
  }

  static getStatusMessage(status: number): string {
    return ErrorMessages[status] || `Error ${status}: An unexpected error occurred.`
  }

  static isClientError(status: number): boolean {
    return status >= 400 && status < 500
  }

  static isServerError(status: number): boolean {
    return status >= 500 && status < 600
  }
}

export async function handleApiCall<T>(
  apiCall: () => Promise<T>,
  errorCallback?: (error: ErrorDetails) => void
): Promise<T | null> {
  try {
    return await apiCall()
  } catch (error) {
    const errorDetails = ErrorHandler.parse(error)
    errorCallback?.(errorDetails)
    return null
  }
}
