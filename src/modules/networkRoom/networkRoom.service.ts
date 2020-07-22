import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { uuid } from 'uuidv4';
import * as twilio from 'twilio';
import * as any from 'promise.any';
import * as util from 'util';
import { config } from '../../shared/config/Twilio';
import { NetworkRoom } from './networkRoom.entity';
import { NetworkRoomTokenDto } from './dto/networkRoomToken.dto';

const { AccessToken } = twilio.jwt;
const { VideoGrant } = AccessToken;

@Injectable()
export class NetworkRoomService {
  private readonly clientConfig: any;

  private readonly twilioConfig: any;

  constructor(
    @InjectRepository(NetworkRoom)
    private readonly repository?: Repository<NetworkRoom>,
  ) {
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

  findAvailableRoom(roomSid, roomUniqueName) {
    const participants: any = util.promisify(
      this.clientConfig.video.rooms(roomSid).participants,
    );
    return participants.list({ status: 'connected' }).then(roomParticipant => {
      if (roomParticipant.length < 4) {
        return Promise.resolve({ sid: roomSid, uniqueName: roomUniqueName });
      }
      return Promise.reject(new Error('no room available'));
    });
  }

  async getRoom(rooms): Promise<any> {
    const participants = rooms
      //   .filter(room => room.uniqueName !== currentRoom)
      .map(room => this.findAvailableRoom(room.sid, room.uniqueName));
    return await any(participants);
  }

  room(): Promise<ObjectLiteral | void> {
    return this.clientConfig.video.rooms
      .list({ status: 'in-progress' })
      .then(async rooms => {
        try {
          return await this.getRoom(rooms);
        } catch (err) {
          console.log(err);
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
}
