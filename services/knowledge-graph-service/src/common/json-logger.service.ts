import { LoggerService } from '@nestjs/common';

/** Structured JSON logger per Engineering Standards & Governance §13. */
export class JsonLoggerService implements LoggerService {
  constructor(private readonly serviceName: string) {}

  log(message: unknown, context?: string) {
    this.write('info', message, context);
  }

  error(message: unknown, trace?: string, context?: string) {
    this.write('error', message, context, trace);
  }

  warn(message: unknown, context?: string) {
    this.write('warn', message, context);
  }

  debug(message: unknown, context?: string) {
    this.write('debug', message, context);
  }

  verbose(message: unknown, context?: string) {
    this.write('verbose', message, context);
  }

  private write(
    severity: 'info' | 'error' | 'warn' | 'debug' | 'verbose',
    message: unknown,
    context?: string,
    trace?: string,
  ) {
    const entry = {
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      severity,
      message,
      ...(context ? { context } : {}),
      ...(trace ? { trace } : {}),
    };
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(entry));
  }
}
