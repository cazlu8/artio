import { InternalServerErrorException } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

function catchError(error: Error) {
  throw new InternalServerErrorException(error);
}

function catchErrorWs(error: Error) {
  throw new WsException(error);
}

export { catchError, catchErrorWs };
