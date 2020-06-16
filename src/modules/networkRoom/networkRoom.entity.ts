import { Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class NetworkRoom {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  sid: string;

  @ApiProperty()
  uniqueName: string;
}
