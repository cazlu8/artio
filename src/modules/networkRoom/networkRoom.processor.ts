import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { EventsGateway } from './networkRoom.gateway';

@Processor('networkRoom')
export class NetworkRoomProcessor {
  private i: number;

  constructor(private readonly gateway: EventsGateway) {
    this.i = 0;
  }

  @Process('transcode')
  handleTranscode() {
    console.log('pa');
    this.i += 1;
    this.gateway.event(`room:${this.i}`);
  }
}
