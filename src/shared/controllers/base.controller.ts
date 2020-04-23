import {
  UseFilters,
  ClassSerializerInterceptor,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { HttpExceptionFilter } from '../filters/http.exception.filter';
import { AuthGuard } from '../guards/auth.guard';
import { ErrorsInterceptor } from '../interceptors/errors.interceptor';
import { AllExceptionsFilter } from '../filters/all.exception.filter';
@UseInterceptors(ErrorsInterceptor)
@UseGuards(AuthGuard)
@UseFilters(HttpExceptionFilter)
@UseFilters(AllExceptionsFilter)
@UseInterceptors(ClassSerializerInterceptor)
export abstract class BaseController {}
