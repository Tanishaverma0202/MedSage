import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { authService } from '../services/auth.service';
import { logger } from '../services/database.service';

// ============================================================================
// ERROR CLASSES
// ============================================================================

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// ============================================================================
// ERROR HANDLER MIDDLEWARE
// ============================================================================

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response, 

  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';
  let details = null;
  let referenceId = null;

  if (err.name === 'ApiError' || err.constructor.name === 'ApiError' || (err as any).statusCode) {
    const apiErr = err as any;
    statusCode = apiErr.statusCode || 400;
    message = apiErr.message;
    code = apiErr.code || 'API_ERROR';
    details = apiErr.details;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    details = err.message;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Database CastError on property '${(err as any).path}': Invalid value '${(err as any).value}'`;
    code = 'CAST_ERROR';
  } else if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    statusCode = 409;
    message = 'Duplicate entry';
    code = 'DUPLICATE_ERROR';
  }

  // Generate reference ID for server errors
  if (statusCode === 500) {

    console.error('🔥 FULL BACKEND ERROR:', err);
    
    referenceId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    logger.error('Server error:', {
      referenceId,
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method
    });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
      ...(referenceId && { referenceId })
    }
  });
};

// ============================================================================
// NOT FOUND HANDLER
// ============================================================================

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
};

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access token required'
        }
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = authService.verifyAccessToken(token);

    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code || 'UNAUTHORIZED',
          message: error.message
        }
      });
      return;
    }
    
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid token'
      }
    });
  }
};

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err: ValidationError) => ({
      field: (err as any).path || 'unknown',
      message: err.msg,
      value: (err as any).value
    }));

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: formattedErrors
      }
    });
    return;
  }

  next();
};

// ============================================================================
// RATE LIMITING
// ============================================================================

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // 1000 for dev, 100 for prod
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later',
      retryAfter: 900
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded:', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests, please try again later',
        retryAfter: 900
      }
    });
  }
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 50 : 5, // 50 attempts for dev, 5 for prod
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many authentication attempts, please try again later',
      retryAfter: 900
    }
  },
  skipSuccessfulRequests: true
});

// ============================================================================
// SECURITY MIDDLEWARE CONFIG
// ============================================================================

export const securityMiddleware = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", 'data:', 'https:', "blob:"],
        connectSrc: ["'self'", 'ws:', 'wss:', 'https://api.openai.com', 'https://generativelanguage.googleapis.com']
      }
    },
    crossOriginEmbedderPolicy: false
  }),
  cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:59667'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }),
  compression(),
  morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim())
    }
  })
];

// ============================================================================
// REQUEST ID MIDDLEWARE
// ============================================================================

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  (req as any).id = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};

// ============================================================================
// LOGGING MIDDLEWARE
// ============================================================================

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger.log(level, 'HTTP Request', {
      requestId: (req as any).id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('user-agent'),
      ip: req.ip
    });
  });

  next();
};

// ============================================================================
// PAGINATION HELPER
// ============================================================================

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export const getPaginationParams = (req: Request): PaginationParams => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const createPaginationResponse = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) => ({
  data,
  pagination: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1
  }
});
