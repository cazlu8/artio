import {
  InternalServerErrorException,
  UnprocessableEntityException,
} from '@nestjs/common';

export default abstract class CreateBaseException {
  verify(error: any, message: string | string[]) {
    if (message) throw new UnprocessableEntityException(message);

    throw new InternalServerErrorException(error);
  }
}
