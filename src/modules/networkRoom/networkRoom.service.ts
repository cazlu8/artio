import { Injectable } from '@nestjs/common';
import { ObjectLiteral } from 'typeorm';
import { uuid } from 'uuidv4';
import * as twilio from 'twilio';
import * as any from 'promise.any';
import * as util from 'util';
import { config } from '../../shared/config/twilio';
import { NetworkRoomTokenDto } from './dto/networkRoomToken.dto';

const { AccessToken } = twilio.jwt;
const { VideoGrant } = AccessToken;

@Injectable()
export class NetworkRoomService {
  private readonly clientConfig: any;

  private readonly twilioConfig: any;

  constructor() {
    const { clientConfig, twilioConfig } = config();
    this.clientConfig = clientConfig();
    this.twilioConfig = twilioConfig();
  }

  private catchError(err) {
    throw new Error(err);
  }

  async createRoom(): Promise<any> {
    const uid = uuid();
    return await this.clientConfig.video.rooms
      .create({
        recordParticipantsOnConnect: true,
        type: 'group-small',
        uniqueName: uid,
      })
      .then(room => {
        return { sid: room.sid, uniqueName: room.uniqueName };
      })
      .catch(this.catchError);
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
        return Promise.resolve({ uniqueName: roomUniqueName });
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
          throw new Error(err);
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

  killRoom(params: { sid: string }): Promise<string | void> {
    return this.clientConfig.video
      .rooms(params.sid)
      .update({ status: 'completed' })
      .then(room => room.uniqueName)
      .catch(this.catchError);
  }

  listAll() {
    return this.clientConfig.video.rooms
      .list({ status: 'in-progress' })
      .then(async rooms => {
        return rooms.map(r => {
          return r.sid;
        });
      });
  }

  killAll() {
    return this.clientConfig.video.rooms
      .list({ status: 'in-progress' })
      .then(async rooms => {
        return rooms.map(r => {
          return this.killRoom({ sid: r.sid });
        });
      });
  }
}
