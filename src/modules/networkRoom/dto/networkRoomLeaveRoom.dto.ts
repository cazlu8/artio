import { IsNumber } from 'class-validator';

export class NetworkRoomLeaveRoomDto {
  @IsNumber()
  userId: number;
}
