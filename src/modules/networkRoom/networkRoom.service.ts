import { Injectable } from '@nestjs/common';
import { ObjectLiteral } from 'typeorm';
import { uuid } from 'uuidv4';
import * as twilio from 'twilio';
import * as any from 'promise.any';
import * as util from 'util';
import { RedisService } from 'nestjs-redis';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { config } from '../../shared/config/twilio';
import { NetworkRoomTokenDto } from './dto/networkRoomToken.dto';

const { AccessToken } = twilio.jwt;
const { VideoGrant } = AccessToken;

@Injectable()
export class NetworkRoomService {
  private readonly clientConfig: any;

  private readonly twilioConfig: any;

  private redisClient: any;

  constructor(
    @InjectQueue('networkRoom') private readonly networkRoomQueue: Queue,
    private readonly redisService: RedisService,
  ) {
    const { clientConfig, twilioConfig } = config();
    this.clientConfig = clientConfig();
    this.twilioConfig = twilioConfig();
    this.redisClient = this.redisService.getClient();
  }

  async createRoom(): Promise<any> {
    const uid = uuid();
    return await this.clientConfig.video.rooms
      .create({
        recordParticipantsOnConnect: true,
        type: 'group-small',
        uniqueName: uid,
      })
      .then(room => ({ sid: room.sid, uniqueName: room.uniqueName }));
  }

  findAvailableRoom(
    roomSid: string,
    roomUniqueName,
    roomLength = 3,
  ): Promise<{ uniqueName: string }> {
    const participants: any = util.promisify(
      this.clientConfig.video.rooms(roomSid).participants,
    );
    return participants.list({ status: 'connected' }).then(roomParticipants => {
      if (
        roomParticipants.length > 1 &&
        roomParticipants.length <= roomLength
      ) {
        return Promise.resolve({ uniqueName: roomUniqueName, sid: roomSid });
      }
      return Promise.reject(new Error('no room available'));
    });
  }

  async getRoom(
    rooms,
    currentRoom = '',
    roomLength?: number,
  ): Promise<{ uniqueName: string }> {
    const participants = rooms
      .filter(room => room.uniqueName !== currentRoom)
      .map(room =>
        this.findAvailableRoom(room.sid, room.uniqueName, roomLength),
      );
    return await any(participants);
  }

  getAvailableRoom(
    currentRoom?: string,
    roomLength?: number,
  ): Promise<{ uniqueName: string }> {
    return this.clientConfig.video.rooms
      .list({ status: 'in-progress' })
      .then(async rooms => {
        try {
          return await this.getRoom(rooms, currentRoom, roomLength);
        } catch (err) {
          throw new Error('no available room');
        }
      });
  }

  videoToken(networkRoomTokenDto: NetworkRoomTokenDto): ObjectLiteral {
    const { identity, room } = networkRoomTokenDto;
    const videoGrant = room ? new VideoGrant({ room }) : new VideoGrant();
    const token: any = this.twilioConfig;
    token.addGrant(videoGrant);
    token.identity = identity;
    return token.toJwt();
  }

  async addCreateRoomOnQueue(eventId: number, isRepeat = false) {
    await this.networkRoomQueue.add('createRooms', { eventId, isRepeat });
    await this.networkRoomQueue.add(
      `clearExpiredRooms`,
      { eventId },
      { delay: 270000 },
    );
  }
}
