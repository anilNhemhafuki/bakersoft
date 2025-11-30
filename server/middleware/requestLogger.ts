import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

declare global {
  namespace Express {
    interface Request {
      startTime?: number;
      requestId?: string;
    }
  }
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  req.startTime = Date.now();
  req.requestId = generateRequestId();

  const userId = (req as any).user?.id || (req as any).session?.passport?.user || 'anonymous';
  
  // Only log incoming requests for non-GET methods or when there's a body/query
  // This reduces console noise from frequent polling requests
  const shouldLogIncoming = req.method !== 'GET' || 
                           Object.keys(req.query).length > 0 || 
                           (req.body && Object.keys(req.body).length > 0);
  
  if (shouldLogIncoming) {
    logger.debug(`Incoming request`, {
      module: 'HTTP',
      details: {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
        body: req.method !== 'GET' && Object.keys(req.body || {}).length > 0 
          ? sanitizeBody(req.body) 
          : undefined,
        userId,
        ip: req.ip,
      }
    });
  }

  const originalSend = res.send;
  res.send = function(body: any): Response {
    const duration = req.startTime ? Date.now() - req.startTime : 0;
    
    logger.request(
      req.method,
      req.path,
      res.statusCode,
      duration,
      userId !== 'anonymous' ? userId : undefined
    );

    if (res.statusCode >= 400) {
      let errorMessage = 'Unknown error';
      try {
        if (typeof body === 'string') {
          const parsed = JSON.parse(body);
          errorMessage = parsed.error || parsed.message || body;
        } else if (typeof body === 'object') {
          errorMessage = body.error || body.message || JSON.stringify(body);
        }
      } catch {
        errorMessage = typeof body === 'string' ? body : String(body);
      }
      
      logger.error(`Request failed: ${errorMessage}`, undefined, {
        module: 'HTTP',
        details: {
          requestId: req.requestId,
          statusCode: res.statusCode,
          path: req.path,
          method: req.method,
        }
      });
    }

    return originalSend.call(this, body);
  };

  next();
}

function sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = ['password', 'confirmPassword', 'token', 'secret', 'apiKey', 'accessToken'];
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(body)) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeBody(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

export function errorLogger(err: Error, req: Request, res: Response, next: NextFunction): void {
  const duration = req.startTime ? Date.now() - req.startTime : 0;
  const userId = (req as any).user?.id || (req as any).session?.passport?.user || 'anonymous';

  logger.error(`Unhandled error in ${req.method} ${req.path}`, err, {
    module: 'HTTP',
    userId,
    details: {
      requestId: req.requestId,
      duration: `${duration}ms`,
      stack: err.stack,
    }
  });

  next(err);
}

export function activityLogger(
  action: string,
  module: string,
  userId?: string,
  details?: Record<string, unknown>
): void {
  logger.activity(action, {
    module,
    userId,
    details,
  });
}
