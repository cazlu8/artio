import { Injectable } from '@nestjs/common';
import { RedisService } from 'nestjs-redis';
import * as OpenTok from 'opentok';
import { promisify } from 'util';
import * as bluebird from 'bluebird';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../shared/services/logger.service';
@Injectable()
export class ShowRoomService {
  private readonly redisClient: any;

  private readonly OpenTok: any;

  constructor(
    private readonly redisService: RedisService,
    private readonly loggerService: LoggerService,
    private configService: ConfigService,
  ) {
    this.redisClient = bluebird.promisifyAll(this.redisService.getClient());
    const [apiKey, apiSecret] = this.configService.get('vonage');
    this.redisClient.set(`vonageApiKey`, apiKey);
    this.OpenTok = new OpenTok(apiKey, apiSecret);
    this.OpenTok.createSession = promisify(this.OpenTok.createSession);
  }

  private async createSession(eventId: number, sponsorId: number) {
    await this.OpenTok.createSession({ mediaMode: 'routed' }).then(
      ({ sessionId }) => {
        this.redisClient.set(
          `event-${eventId}:sponsor-${sponsorId}:vonageSessionId`,
          sessionId,
        );
      },
    );
    const vonageSessionId = await this.redisClient.get(
      `event-${eventId}:sponsor-${sponsorId}:vonageSessionId`,
    );
    const token = this.OpenTok.generateToken(vonageSessionId, {});
    await this.redisClient.set(
      `event-${eventId}:sponsor-${sponsorId}:vonageToken`,
      token,
    );
    await this.redisClient.set(
      `event-${eventId}:sponsor-${sponsorId}:roomState`,
      'online',
    );
  }

  async getSessionData(eventId: number, sponsorId: number) {
    const sessionId = await this.redisClient.get(
      `event-${eventId}:sponsor-${sponsorId}:vonageSessionId`,
    );
    const token = await this.redisClient.get(
      `event-${eventId}:sponsor-${sponsorId}:vonageToken`,
    );
    const apiKey = await this.redisClient.get(`vonageApiKey`);
    return { sessionId, token, apiKey };
  }

  async startSponsorRoomState(eventId: number, sponsorId: number) {
    await this.createSession(eventId, sponsorId);
  }

  async getSponsorRoomState(eventId: number, sponsorId: number) {
    const state = await this.redisClient.get(
      `event-${eventId}:sponsor-${sponsorId}:roomState`,
    );
    return state || false;
  }

  async stopSponsorRoom(eventId: number, sponsorId: number) {
    const removeAllKeys = [
      `event-${eventId}:sponsor-${sponsorId}:vonageSessionId`,
      `event-${eventId}:sponsor-${sponsorId}:vonageToken`,
      `event-${eventId}:sponsor-${sponsorId}:roomState`,
    ].map(key => this.redisClient.del(key));
    await Promise.all(removeAllKeys);
  }
}
