import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception.getStatus();
    const exceptionResponse: any = exception.getResponse();
    const message =
      (exceptionResponse as HttpException).message || exception?.message;

    response.status(status).send({
      message,
      error: exceptionResponse.error,
      statusCode: status,
      timestamp: new Date().toISOString(),
      method: request.method,
      path: request.path,
    });
  }
}
