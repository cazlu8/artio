import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { uuid } from 'uuidv4';
import * as twilio from 'twilio';
import { twilioConfig, clientConfig } from '../../shared/config/Twilio';
import { NetworkRoom } from './networkRoom.entity';
import { NetworkRoomTokenDto } from './dto/networkRoomToken.dto';

const { AccessToken } = twilio.jwt;
const { VideoGrant } = AccessToken;

@Injectable()
export class NetworkRoomService {
  constructor(
    @InjectRepository(NetworkRoom)
    private readonly repository: Repository<NetworkRoom>,
  ) {}

  async createRoom(): Promise<any> {
    const uid = uuid();
    return await clientConfig()
      .video.rooms.create({
        recordParticipantsOnConnect: true,
        type: 'group-small',
        uniqueName: uid,
      })
      .then(room => {
        return { sid: room.sid, uniqueName: room.uniqueName };
      })
      .catch(console.log);
  }

  getRoom(rooms): Promise<any> {
    const roomUniqueName = rooms.uniqueName;
    const roomSid = rooms.sid;
    return clientConfig()
      .video.rooms(roomSid)
      .participants.list(
        { status: 'connected' },
        async (error, participants) => {
          if (participants.length < 3) {
            return roomUniqueName;
          }
          return await this.createRoom();
        },
      )
      .catch(console.log);
  }

  room(): Promise<ObjectLiteral | void> {
    return clientConfig()
      .video.rooms.list({ status: 'in-progress' })
      .then(async rooms => {
        const availableRoom = rooms.find(
          async ({ sid, uniqueName }) =>
            await this.getRoom({ sid, uniqueName }),
        );
        if (availableRoom) {
          return {
            uniqueName: availableRoom.uniqueName,
            sid: availableRoom.sid,
          };
        }
        return await this.createRoom();
      })
      .catch(console.log);
  }

  videoToken(networkRoomTokenDto: NetworkRoomTokenDto): ObjectLiteral {
    const { identity, room } = networkRoomTokenDto;
    let videoGrant;
    if (room !== 'undefined') {
      videoGrant = new VideoGrant({ room });
    } else {
      videoGrant = new VideoGrant();
    }
    const token: any = twilioConfig();
    token.addGrant(videoGrant);
    token.identity = identity;
    return token;
  }

  killRoom(params: { sid: string }): Promise<string | void> {
    return clientConfig()
      .video.rooms(params.sid)
      .update({ status: 'completed' })
      .then(room => {
        return room.uniqueName;
      })
      .catch(console.log);
  }
}
