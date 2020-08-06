import { IsNumber, IsObject } from 'class-validator';

export class NetworkRoomLeaveRoomDto {
  @IsNumber()
  userId: number;

  @IsObject()
  auth: { token: string };
}
