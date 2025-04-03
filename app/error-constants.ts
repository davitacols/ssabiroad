// Define error constants for the application
export const ErrorCodes = {
    // Client errors (4xx)
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    REQUEST_TIMEOUT: 408,
    PAYLOAD_TOO_LARGE: 413,
    URI_TOO_LONG: 414,
    UNSUPPORTED_MEDIA_TYPE: 415,
    TOO_MANY_REQUESTS: 429,
  
    // Server errors (5xx)
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
  }
  
  export const ErrorMessages = {
    // Client errors (4xx)
    [ErrorCodes.BAD_REQUEST]: "Bad Request: The server cannot process the request due to a client error.",
    [ErrorCodes.UNAUTHORIZED]: "Unauthorized: Authentication is required and has failed or has not been provided.",
    [ErrorCodes.FORBIDDEN]: "Forbidden: You don't have permission to access this resource.",
    [ErrorCodes.NOT_FOUND]: "Not Found: The requested resource could not be found.",
    [ErrorCodes.METHOD_NOT_ALLOWED]:
      "Method Not Allowed: The request method is not supported for the requested resource.",
    [ErrorCodes.REQUEST_TIMEOUT]: "Request Timeout: The server timed out waiting for the request.",
    [ErrorCodes.PAYLOAD_TOO_LARGE]: "Payload Too Large: The request entity is larger than limits defined by server.",
    [ErrorCodes.URI_TOO_LONG]:
      "URI Too Long: The URI requested by the client is longer than the server is willing to interpret.",
    [ErrorCodes.UNSUPPORTED_MEDIA_TYPE]:
      "Unsupported Media Type: The media format of the requested data is not supported.",
    [ErrorCodes.TOO_MANY_REQUESTS]: "Too Many Requests: You have sent too many requests in a given amount of time.",
  
    // Server errors (5xx)
    [ErrorCodes.INTERNAL_SERVER_ERROR]:
      "Internal Server Error: The server has encountered a situation it doesn't know how to handle.",
    [ErrorCodes.BAD_GATEWAY]: "Bad Gateway: The server received an invalid response from an upstream server.",
    [ErrorCodes.SERVICE_UNAVAILABLE]: "Service Unavailable: The server is not ready to handle the request.",
    [ErrorCodes.GATEWAY_TIMEOUT]: "Gateway Timeout: The server is acting as a gateway and cannot get a response in time.",
  }
  
  // Specific error messages for common scenarios
  export const SpecificErrorMessages = {
    MISSING_API_KEY: "Server configuration error: Missing API key",
    MISSING_CREDENTIALS: "Server configuration error: Missing credentials",
    INVALID_CONTENT_TYPE: "Content-Type must be multipart/form-data or application/x-www-form-urlencoded",
    FORM_PARSE_ERROR: "Failed to parse form data",
    NO_IMAGE_PROVIDED: "No image file provided",
    FILE_TOO_LARGE: "Image file exceeds maximum size",
    INVALID_COORDINATES: "Invalid coordinates provided",
    GEOCODING_FAILED: "Address could not be geocoded",
    MISSING_LOCATION_ID: "Missing location ID",
    LOCATION_NOT_FOUND: "Location not found",
    MISSING_SEARCH_QUERY: "Missing search query",
    MISSING_ADDRESS: "Missing address",
    MISSING_CATEGORY: "Missing category",
    MISSING_BUILDING_TYPE: "Missing building type",
    INVALID_JSON: "Invalid JSON in request body",
    MISSING_UPDATE_DATA: "Missing update data",
    INVALID_OPERATION: "Invalid operation",
    NO_OPERATION_SPECIFIED: "No operation specified",
    DATABASE_ERROR: "Database error",
    VISION_API_ERROR: "Vision API error",
    MAPS_API_ERROR: "Maps API error",
    OPERATION_TIMEOUT: "Operation timed out",
  }
  
  