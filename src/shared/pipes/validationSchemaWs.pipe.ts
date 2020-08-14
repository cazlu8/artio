import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class ValidationSchemaWsPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    try {
      if (!metatype || !this.toValidate(metatype)) {
        return value;
      }
      const object = plainToClass(metatype, value);
      const errors = await validate(object);
      if (errors.length > 0) {
        throw new WsException(JSON.stringify(errors));
      }
      return value;
    } catch (err) {
      throw new WsException(JSON.stringify(err));
    }
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
