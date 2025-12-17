import { ErrorCodes } from '@/app/error-constants'
import { ApiError } from '@/app/middleware-error-handler'

interface RequestOptions extends RequestInit {
  timeout?: number
}

export class ApiClient {
  private static async fetchWithTimeout(url: string, options: RequestOptions = {}) {
    const { timeout = 30000, ...fetchOptions } = options

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return response
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new ApiError(ErrorCodes.GATEWAY_TIMEOUT, 'Request timeout')
      }
      throw error
    }
  }

  static async request<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const response = await this.fetchWithTimeout(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw {
        response: {
          status: response.status,
          data: errorData,
        },
        message: errorData.error || response.statusText,
      }
    }

    return response.json()
  }

  static get<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: 'GET' })
  }

  static post<T>(url: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  static put<T>(url: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  static delete<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(url, { ...options, method: 'DELETE' })
  }
}
