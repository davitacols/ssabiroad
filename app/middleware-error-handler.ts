import { type NextRequest, NextResponse } from "next/server"
import { ErrorCodes, ErrorMessages, SpecificErrorMessages } from "./error-constants"

export interface ErrorResponseBody {
  success: false
  error: string
  details?: string
  code: number
  timestamp: string
  path?: string
  method?: string
}

export class ApiError extends Error {
  statusCode: number
  details?: string

  constructor(statusCode: number, message?: string, details?: string) {
    super(message || ErrorMessages[statusCode] || `Error ${statusCode}`)
    this.statusCode = statusCode
    this.details = details
    this.name = "ApiError"
  }
}

export class ErrorHandler {
  /**
   * Format an error response with consistent structure
   */
  static formatErrorResponse(statusCode: number, details?: string, request?: NextRequest): ErrorResponseBody {
    return {
      success: false,
      error: ErrorMessages[statusCode] || `Error ${statusCode}: An unexpected error occurred.`,
      details: details,
      code: statusCode,
      timestamp: new Date().toISOString(),
      path: request?.url ? new URL(request.url).pathname : undefined,
      method: request?.method,
    }
  }

  /**
   * Handle API errors and return appropriate response
   */
  static handleApiError(error: any, request?: NextRequest): { response: ErrorResponseBody; status: number } {
    console.error("API Error:", error)

    // If it's already an ApiError, use its status code
    if (error instanceof ApiError) {
      return {
        response: this.formatErrorResponse(error.statusCode, error.details, request),
        status: error.statusCode,
      }
    }

    // Handle axios errors
    if (error.isAxiosError) {
      const statusCode = error.response?.status || ErrorCodes.INTERNAL_SERVER_ERROR
      const details = error.response?.data?.error || error.message

      return {
        response: this.formatErrorResponse(statusCode, details, request),
        status: statusCode,
      }
    }

    // Handle file size errors
    if (error.message && error.message.includes("size")) {
      return {
        response: this.formatErrorResponse(ErrorCodes.PAYLOAD_TOO_LARGE, SpecificErrorMessages.FILE_TOO_LARGE, request),
        status: ErrorCodes.PAYLOAD_TOO_LARGE,
      }
    }

    // Handle timeout errors
    if (
      error.message &&
      (error.message.includes("timeout") || error.message.includes("ETIMEDOUT") || error.message.includes("timed out"))
    ) {
      return {
        response: this.formatErrorResponse(
          ErrorCodes.GATEWAY_TIMEOUT,
          SpecificErrorMessages.OPERATION_TIMEOUT,
          request,
        ),
        status: ErrorCodes.GATEWAY_TIMEOUT,
      }
    }

    // Handle database connection errors
    if ((error.message && error.message.includes("database")) || error.code === "P1001" || error.code === "P1002") {
      return {
        response: this.formatErrorResponse(
          ErrorCodes.SERVICE_UNAVAILABLE,
          SpecificErrorMessages.DATABASE_ERROR + (error.message ? `: ${error.message}` : ""),
          request,
        ),
        status: ErrorCodes.SERVICE_UNAVAILABLE,
      }
    }

    // Handle Vision API errors
    if (error.message && error.message.includes("Vision API")) {
      return {
        response: this.formatErrorResponse(
          ErrorCodes.BAD_GATEWAY,
          SpecificErrorMessages.VISION_API_ERROR + (error.message ? `: ${error.message}` : ""),
          request,
        ),
        status: ErrorCodes.BAD_GATEWAY,
      }
    }

    // Handle Maps API errors
    if (error.message && error.message.includes("Maps API")) {
      return {
        response: this.formatErrorResponse(
          ErrorCodes.BAD_GATEWAY,
          SpecificErrorMessages.MAPS_API_ERROR + (error.message ? `: ${error.message}` : ""),
          request,
        ),
        status: ErrorCodes.BAD_GATEWAY,
      }
    }

    // Default to internal server error
    return {
      response: this.formatErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        error.message || "An unexpected error occurred",
        request,
      ),
      status: ErrorCodes.INTERNAL_SERVER_ERROR,
    }
  }

  /**
   * Create a middleware wrapper that catches errors and returns formatted responses
   */
  static withErrorHandling(handler: (req: NextRequest) => Promise<NextResponse>) {
    return async (req: NextRequest): Promise<NextResponse> => {
      try {
        return await handler(req)
      } catch (error) {
        const { response, status } = this.handleApiError(error, req)
        return NextResponse.json(response, { status })
      }
    }
  }
}

/**
 * Helper function to throw appropriate API errors
 */
export function throwApiError(statusCode: number, details?: string): never {
  throw new ApiError(statusCode, ErrorMessages[statusCode], details)
}

/**
 * Validate request parameters and throw appropriate errors
 */
export function validateRequest(conditions: { [key: string]: boolean }, errorCode: number, details: string): void {
  for (const [condition, isValid] of Object.entries(conditions)) {
    if (!isValid) {
      throwApiError(errorCode, details)
    }
  }
}

/**
 * Wrap a promise with a timeout
 */
export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new ApiError(ErrorCodes.GATEWAY_TIMEOUT, errorMessage)), timeoutMs)
  })

  return Promise.race([promise, timeoutPromise])
}

