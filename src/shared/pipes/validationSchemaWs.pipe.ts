import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class ValidationSchemaWsPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    const object = plainToClass(metatype, value);
    const errors = await validate(object);
    const errorMessage = errors.reduce((acc, cur) => {
      acc += `${Object.values(cur.constraints)} `;
      return acc;
    }, '');
    if (errors.length > 0) {
      throw new WsException(errorMessage);
    }
    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
