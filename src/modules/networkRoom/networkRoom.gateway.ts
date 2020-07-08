import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'ws';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Mutex } from 'async-mutex';

const mutex = new Mutex();

@WebSocketGateway(3030)
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  private readonly clients: any;

  constructor(
    @InjectQueue('networkRoom') private readonly networkRoomQueue: Queue,
  ) {
    this.clients = [];
  }

  saveClient(client) {
    this.clients.push(client);
  }

  @SubscribeMessage('events')
  async onEvent(currentClient: any) {
    await mutex.runExclusive(async () => {
      this.saveClient(currentClient);
      if (this.clients.length === 4) {
        await this.networkRoomQueue.add('transcode');
      }
    });
  }

  event(roomName: string) {
    const clients = this.clients.splice(0, 4);
    clients.forEach(client => {
      client.send(roomName);
    });
  }
}
