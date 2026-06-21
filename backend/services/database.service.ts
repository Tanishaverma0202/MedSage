import mongoose from 'mongoose';
import { createLogger, transports, format } from 'winston';
import 'winston-daily-rotate-file';
import dotenv from 'dotenv';
dotenv.config();

// ============================================================================
// LOGGER CONFIGURATION
// ============================================================================

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: 'medsage-backend' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ level, message, timestamp, ...metadata }) => {
          let msg = `${timestamp} [${level}]: ${message}`;
          if (Object.keys(metadata).length > 0) {
            msg += ` ${JSON.stringify(metadata)}`;
          }
          return msg;
        })
      )
    }),
    new transports.DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    }),
    new transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error'
    })
  ]
});

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in environment variables");
}

const connectDB = async (): Promise<boolean> => {
  try {
    console.log('🔌 DATABASE: Connecting to:', MONGODB_URI);
    const conn = await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

    return true;
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
      logger.error(' MONGODB CONNECTION REFUSED: Ensure MongoDB is running on localhost:27017');
      console.error('\n  ERROR: MongoDB is not running. Please start it with:');
      console.error('   & "C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe"\n');
    } else {
      logger.error('MongoDB connection failed:', error);
    }
    logger.warn('Running in DEMO MODE - Data will not be persisted');
    return false;
  }
};

// ============================================================================
// DATABASE HEALTH CHECK
// ============================================================================

const checkDatabaseHealth = async (): Promise<{ healthy: boolean; latency: number }> => {
  const start = Date.now();
  try {
    await mongoose.connection.db.admin().ping();
    return {
      healthy: true,
      latency: Date.now() - start
    };
  } catch (error) {
    return {
      healthy: false,
      latency: Date.now() - start
    };
  }
};

// ============================================================================
// BASE SERVICE CLASS
// ============================================================================

export abstract class BaseService {
  protected logger = logger;

  protected handleError(error: unknown, operation: string): never {
    const err = error instanceof Error ? error : new Error(String(error));
    this.logger.error(`Error in ${operation}:`, {
      message: err.message,
      stack: err.stack,
      operation
    });
    throw err;
  }

  protected async withTransaction<T>(fn: (session: mongoose.ClientSession) => Promise<T>): Promise<T> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const result = await fn(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  protected logOperation(operation: string, details?: Record<string, any>): void {
    this.logger.info(operation, details);
  }
}

// ============================================================================
// CACHE SERVICE (Redis)
// ============================================================================

import Redis from 'ioredis';

class CacheService {
  private client: Redis | null = null;
  private readonly DEFAULT_TTL = 300; // 5 minutes

  constructor() {
    if (process.env.REDIS_URL) {
      this.client = new Redis(process.env.REDIS_URL, {
        retryStrategy: (times) => Math.min(times * 50, 2000),
        maxRetriesPerRequest: 3
      });

      this.client.on('connect', () => logger.info('Redis connected'));
      this.client.on('error', (err) => logger.error('Redis error:', err));
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    if (!this.client) return;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      logger.error('Cache delete pattern error:', error);
    }
  }

  generateKey(...parts: string[]): string {
    return parts.join(':');
  }
}

export const cacheService = new CacheService();

// ============================================================================
// EXPORTS
// ============================================================================

export { logger, connectDB, checkDatabaseHealth };
export default { logger, connectDB, checkDatabaseHealth, cacheService };
