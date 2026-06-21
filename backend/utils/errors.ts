/**
 * Custom API Error class for handling HTTP errors
 */
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Common HTTP error factories
 */
export const errors = {
  badRequest: (message: string) => new ApiError(400, message),
  unauthorized: (message: string = 'Unauthorized') => new ApiError(401, message),
  forbidden: (message: string = 'Forbidden') => new ApiError(403, message),
  notFound: (message: string = 'Not found') => new ApiError(404, message),
  conflict: (message: string) => new ApiError(409, message),
  internal: (message: string = 'Internal server error') => new ApiError(500, message),
};

export default ApiError;
