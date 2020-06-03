import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class ErrorsInterceptor implements NestInterceptor {
  constructor(private readonly loggerService: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError(error => {
        const [request] = context?.getArgs();
        this.loggerService.info(error, request);
        return throwError(error);
      }),
    );
  }
}
