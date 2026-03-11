import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';

interface AuditEntry {
  timestamp: string;
  userId: string | null;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  ip: string;
  userAgent: string;
}

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AuditLog');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const startTime = Date.now();

    // Skip health-check and documentation routes
    if (
      request.url.includes('/health') ||
      request.url.includes('/docs')
    ) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const entry = this.buildAuditEntry(
            request,
            response.statusCode,
            startTime,
          );
          this.logEntry(entry);
        },
        error: (error) => {
          const statusCode = error?.status || error?.statusCode || 500;
          const entry = this.buildAuditEntry(request, statusCode, startTime);
          this.logEntry(entry, error.message);
        },
      }),
    );
  }

  private buildAuditEntry(
    request: Request,
    statusCode: number,
    startTime: number,
  ): AuditEntry {
    const user = request.user as any;
    return {
      timestamp: new Date().toISOString(),
      userId: user?.id || null,
      method: request.method,
      path: request.url,
      statusCode,
      durationMs: Date.now() - startTime,
      ip: request.ip || request.socket.remoteAddress || 'unknown',
      userAgent: request.headers['user-agent'] || 'unknown',
    };
  }

  private logEntry(entry: AuditEntry, errorMessage?: string): void {
    const logLine = `${entry.method} ${entry.path} ${entry.statusCode} ${entry.durationMs}ms [user:${entry.userId || 'anon'}] [ip:${entry.ip}]`;

    if (entry.statusCode >= 500) {
      this.logger.error(`${logLine} - ${errorMessage}`);
    } else if (entry.statusCode >= 400) {
      this.logger.warn(logLine);
    } else {
      this.logger.log(logLine);
    }
  }
}
