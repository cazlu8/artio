import { Injectable } from '@nestjs/common';
import { ObjectLiteral } from 'typeorm';
import * as twilio from 'twilio';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as short from 'short-uuid';
import * as bluebird from 'bluebird';
import { RedisService } from 'nestjs-redis';
import { config } from '../../shared/config/twilio';
import { NetworkRoomTokenDto } from './dto/networkRoomToken.dto';
import { LoggerService } from '../../shared/services/logger.service';
import networkEventEmitter from './networkRoom.event';
import { NetworkRoomRoomStatusDto } from './dto/networkRoomRoomStatus.dto';

const { AccessToken } = twilio.jwt;
const { VideoGrant } = AccessToken;

@Injectable()
export class NetworkRoomService {
  private readonly redisClient: any;

  private readonly clientConfig: any;

  private readonly twilioConfig: any;

  constructor(
    @InjectQueue('networkRoom') private readonly networkRoomQueue: Queue,
    private readonly redisService: RedisService,
    private readonly loggerService: LoggerService,
  ) {
    const { clientConfig, twilioConfig } = config();
    this.clientConfig = clientConfig();
    this.twilioConfig = twilioConfig();
    this.redisClient = bluebird.promisifyAll(this.redisService.getClient());
  }

  async roomStatus(data: NetworkRoomRoomStatusDto) {
    const { StatusCallbackEvent, RoomName } = data;
    const eventId = RoomName.split('-')[0];
    if (StatusCallbackEvent === 'participant-disconnected') {
      this.loggerService.info(
        `status-callback-${eventId}, ${StatusCallbackEvent}, ${RoomName}`,
      );
      await this.redisClient.zincrby(`event-${eventId}:rooms`, -1, RoomName);
      networkEventEmitter.emit('changedQueuesOrRooms', eventId);
    }
  }

  async createRoom(eventId: number): Promise<any> {
    const uid = short.generate();
    return await this.clientConfig.video.rooms
      .create({
        statusCallback: process.env.TWILIO_STATUS_CALLBACK_URL,
        statusCallbackMethod: 'POST',
        recordParticipantsOnConnect: true,
        type: 'group-small',
        uniqueName: `${eventId}-${uid}`,
      })
      .then(room => ({
        sid: room.sid,
        uniqueName: room.uniqueName,
      }));
  }

  videoToken(networkRoomTokenDto: NetworkRoomTokenDto): ObjectLiteral {
    const { identity, room } = networkRoomTokenDto;
    const videoGrant = new VideoGrant({ room });
    const token: any = this.twilioConfig;
    token.addGrant(videoGrant);
    token.identity = identity;
    return token.toJwt();
  }

  addCreateRoomOnQueue(eventId: number, isRepeat = false) {
    return [
      this.networkRoomQueue.add('createRooms', { eventId, isRepeat }),
      this.networkRoomQueue.add(
        `clearExpiredRooms`,
        { eventId },
        { delay: 270000 },
      ),
    ];
  }

  async getNewTwillioRoom(eventId: number): Promise<{ uniqueName: string }> {
    await this.requestToCreateNewRooms(eventId);
    const newRoom = await this.redisClient.lpop(`event-${eventId}:roomsTwilio`);
    return newRoom ? { uniqueName: newRoom } : await this.createRoom(eventId);
  }

  private async requestToCreateNewRooms(eventId: number): Promise<void> {
    const roomsLength = +(await this.redisClient.llen(
      `event-${eventId}:roomsTwilio`,
    ));
    if (roomsLength < 8) {
      await this.addCreateRoomOnQueue(eventId, true);
    }
  }

  async getRoomsWithScores(eventId: number, limit = false) {
    const queueLength = +(await this.redisClient.llen(
      `event-${eventId}:queue`,
    ));
    let roomsWithScores;
    if (limit) {
      const threeLength = await this.redisClient.get(
        `twilioRoomThreeLength-${eventId}`,
      );
      const max = threeLength === 'true' ? 2 : 3;
      roomsWithScores = await this.redisClient.zrangebyscore(
        `event-${eventId}:rooms`,
        queueLength >= 2 ? 0 : 1,
        max,
        'WITHSCORES',
        'LIMIT',
        0,
        1,
      );
    } else
      roomsWithScores = await this.redisClient.zrangebyscore(
        `event-${eventId}:rooms`,
        queueLength >= 2 ? 0 : 1,
        3,
        'WITHSCORES',
      );
    return (roomsWithScores || []).reduce((acc, cur, i, rooms) => {
      if (i !== 0) i += i;
      if (i >= rooms.length) return acc;
      acc.push({ room: rooms[i], score: +rooms[i + 1] });
      return acc;
    }, []);
  }

  async findAvailableRoom(
    eventId: number,
    roomsWithScores: [{ room: string; score: number }],
  ) {
    const { room } = roomsWithScores[0];
    const currentRoomScore = await this.redisClient.zscore(
      `event-${eventId}:rooms`,
      room,
    );
    if (+currentRoomScore < 4) {
      await this.redisClient.zincrby(`event-${eventId}:rooms`, 1, room);
      const socketId = await this.redisClient.lpop(`event-${eventId}:queue`);
      networkEventEmitter.emit('sendAvailableRoom', {
        socketId,
        room: { uniqueName: room },
      });
      const queueLength = await this.redisClient.llen(`event-${eventId}:queue`);
      !!+queueLength &&
        networkEventEmitter.emit('changedQueuesOrRooms', eventId);
      this.loggerService.info(
        `findAvailableRooms: room ${room} sent to socket.`,
      );
    }
  }

  async switchRoom(eventId: number, socketId: string, room: string) {
    const currentRoomScore = await this.redisClient.zscore(
      `event-${eventId}:rooms`,
      room,
    );
    if (currentRoomScore === null || +currentRoomScore < 4) {
      networkEventEmitter.emit('sendSwitchRoom', {
        socketId,
        room: { uniqueName: room },
      });
      await this.redisClient.lpop(`event-${eventId}:queueSwitch`);
      await this.redisClient.zincrby(`event-${eventId}:rooms`, 1, room);
    }
  }

  async findRoomToSwitch(
    eventId: number,
    roomsWithScores: [{ room: string; score: number }],
  ) {
    for (const current of roomsWithScores) {
      const clientToSwitch = await this.redisClient.lrange(
        `event-${eventId}:queueSwitch`,
        0,
        0,
      );
      if (clientToSwitch.length) {
        const { currentRoom, socketId } = JSON.parse(clientToSwitch[0]);
        if (current.room !== currentRoom) {
          await this.switchRoom(eventId, socketId, current.room);
          break;
        }
      }
    }
  }

  async getQueueSocketIdsAndSendRoom(eventId: number) {
    const socketIds = await this.redisClient.lrange(
      `event-${eventId}:queue`,
      0,
      1,
    );
    await this.redisClient.ltrim(`event-${eventId}:queue`, 2, -1);
    const twilioRoom = await this.sendTwillioRoomToSockets(socketIds, eventId);
    await this.redisClient.zadd(
      `event-${eventId}:rooms`,
      2,
      twilioRoom.uniqueName,
    );
    return twilioRoom.uniqueName;
  }

  async sendTwillioRoomToSockets(
    socketIds: string[],
    eventId: number,
  ): Promise<{ uniqueName: string }> {
    const newTwilioRoom = await this.getNewTwillioRoom(eventId);
    socketIds.forEach(id =>
      networkEventEmitter.emit('sendAvailableRoom', {
        socketId: id,
        room: newTwilioRoom,
      }),
    );
    return newTwilioRoom;
  }

  // force brute to handle too many requests error and get concurrency performance
  async createRoomAndSave(eventId: number) {
    return this.createRoom(eventId)
      .then(async ({ uniqueName }) => {
        await this.redisClient.rpush(
          `event-${eventId}:roomsTwilio`,
          uniqueName,
        );
        return uniqueName;
      })
      .catch(() => Promise.resolve(this.createRoomAndSave(eventId)));
  }
}
