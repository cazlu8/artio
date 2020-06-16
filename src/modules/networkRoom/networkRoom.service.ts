import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { uuid } from 'uuidv4';
import * as twilio from 'twilio';
import { config } from '../../shared/config/Twilio';
import { NetworkRoom } from './networkRoom.entity';
import { NetworkRoomTokenDto } from './dto/networkRoomToken.dto';

const { AccessToken } = twilio.jwt;
const { VideoGrant } = AccessToken;
const catchError = err => {
  throw new Error(err);
};

@Injectable()
export class NetworkRoomService {
  private readonly clientConfig: any;

  private readonly twilioConfig: any;

  constructor(
    @InjectRepository(NetworkRoom)
    private readonly repository: Repository<NetworkRoom>,
  ) {
    const { clientConfig, twilioConfig } = config();
    this.clientConfig = clientConfig();
    this.twilioConfig = twilioConfig();
  }

  async createRoom(): Promise<any> {
    const uid = uuid();
    return await this.clientConfig.video.rooms
      .create({
        recordParticipantsOnConnect: true,
        type: 'group-small',
        uniqueName: uid,
      })
      .then(room => ({ sid: room.sid, uniqueName: room.uniqueName }))
      .catch(catchError);
  }

  getRoom(rooms): Promise<any> {
    const roomUniqueName = rooms.uniqueName;
    const roomSid = rooms.sid;
    return this.clientConfig.video
      .rooms(roomSid)
      .participants.list(
        { status: 'connected' },
        async (error, participants) => {
          if (participants.length < 3) {
            return roomUniqueName;
          }
          return await this.createRoom();
        },
      )
      .catch(catchError);
  }

  async room(): Promise<ObjectLiteral | void> {
    const rooms = await this.clientConfig.video.rooms.list({
      status: 'in-progress',
    });
    const availableRoom = rooms.find(
      async ({ sid, uniqueName }) => await this.getRoom({ sid, uniqueName }),
    );
    return availableRoom || (await this.createRoom());
  }

  videoToken(networkRoomTokenDto: NetworkRoomTokenDto): ObjectLiteral {
    const { identity, room } = networkRoomTokenDto;
    const videoGrant = room ? new VideoGrant({ room }) : new VideoGrant();
    const token: any = this.twilioConfig;
    token.addGrant(videoGrant);
    token.identity = identity;
    return token;
  }

  killRoom(params: { sid: string }): Promise<string | void> {
    return this.clientConfig.video
      .rooms(params.sid)
      .update({ status: 'completed' })
      .then(room => room.uniqueName)
      .catch(catchError);
  }
}
