import {
  UseGuards,
} from '@nestjs/common';

import { AuthGuard }                 from '../guards/auth.guard';
import { BaseWithoutAuthController } from "./base.withoutAuth.controller";

@UseGuards(AuthGuard)
export abstract class BaseController extends BaseWithoutAuthController {}
