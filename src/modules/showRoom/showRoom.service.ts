import { Injectable } from '@nestjs/common';
import { RedisService } from 'nestjs-redis';
import fetch from 'node-fetch';
import { sign } from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import * as bluebird from 'bluebird';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../shared/services/logger.service';

@Injectable()
export class ShowRoomService {
  private readonly redisClient: any;

  private readonly broadcastOptions = {
    sessionId: null,
    outputs: {
      hls: {},
    },
    maxDuration: 5400,
    resolution: '640x480',
    layout: {
      type: 'bestFit',
    },
  };

  constructor(
    private readonly redisService: RedisService,
    private readonly loggerService: LoggerService,
    private configService: ConfigService,
  ) {
    this.redisClient = bluebird.promisifyAll(this.redisService.getClient());
    const [apiKey, apiSecret] = this.configService.get('vonage');
    this.redisClient.set(`vonageApiKey`, apiKey);
    this.redisClient.set(`vonageApiSecret`, apiSecret);
  }

  private async generateJWT() {
    try {
      const vonageApiKey = await this.redisClient.get(`vonageApiKey`);
      const vonageApiSecret = await this.redisClient.get(`vonageApiSecret`);
      const jwtExpiresTime = 86400;
      return sign(
        {
          iss: vonageApiKey,
          ist: 'project',
          iat: Math.floor(new Date().getTime() / 1000),
          exp: Math.floor(new Date().getTime() / 1000) + jwtExpiresTime,
          jti: uuid(),
        },
        vonageApiSecret,
        { algorithm: 'HS256' },
      );
    } catch (err) {
      return err;
    }
  }

  private async createSession(eventId: number, sponsorId: number) {
    const token = await this.generateJWT();
    return await fetch(`https://api.opentok.com/session/create`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-OPENTOK-AUTH': token,
      },
      method: 'POST',
      body: JSON.stringify({ mediaMode: 'routed', archiveMode: 'always' }),
    })
      .then(response => response.json())
      .then(data => {
        this.redisClient.set(
          `event-${eventId}:sponsor-${sponsorId}:vonageSessionId`,
          data[0].session_id,
        );
        this.redisClient.set(
          `event-${eventId}:sponsor-${sponsorId}:vonageToken`,
          token,
        );
        this.redisClient.set(
          `event-${eventId}:sponsor-${sponsorId}:roomState`,
          'online',
        );
        return data[0];
      })
      .catch(err => console.log(err));
  }

  async startBroadcastSponsorRoom(eventId: number, sponsorId: number) {
    const vonageSessionId = await this.redisClient.get(
      `event-${eventId}:sponsor-${sponsorId}:vonageSessionId`,
    );
    const token = await this.redisClient.get(
      `event-${eventId}:sponsor-${sponsorId}:vonageToken`,
    );
    this.broadcastOptions.sessionId = vonageSessionId;
    const vonageApiKey = await this.redisClient.get(`vonageApiKey`);

    return await fetch(
      `https://api.opentok.com/v2/project/${vonageApiKey}/broadcast`,
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-OPENTOK-AUTH': token,
        },
        method: 'POST',
        body: JSON.stringify(this.broadcastOptions),
      },
    )
      .then(response => response.json())
      .then(data => {
        this.redisClient.set(
          `event-${eventId}:sponsor-${sponsorId}:broadcastId`,
          data.id,
        );
        return data;
      })
      .catch(err => console.log(err));
  }

  async getBroadcastInfo(eventId: number, sponsorId: number) {
    const broadcastId = await this.redisClient.get(
      `event-${eventId}:sponsor-${sponsorId}:broadcastId`,
    );
    const token = await this.redisClient.get(
      `event-${eventId}:sponsor-${sponsorId}:vonageToken`,
    );
    const vonageApiKey = await this.redisClient.get('vonageApiKey');
    return await fetch(
      `https://api.opentok.com/v2/project/${vonageApiKey}/broadcast/${broadcastId}`,
      { headers: { 'X-OPENTOK-AUTH': token }, method: 'GET' },
    )
      .then(response => response.json())
      .then(data => {
        return data;
      });
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
    const broadcastId = await this.redisClient.get(
      `event-${eventId}:sponsor-${sponsorId}:broadcastId`,
    );
    const token = await this.redisClient.get(
      `event-${eventId}:sponsor-${sponsorId}:vonageToken`,
    );
    await fetch(
      `https://api.opentok.com/v2/project/${this.redisClient.get(
        'vonageApiKey',
      )}/broadcast/${broadcastId}/stop`,
      {
        headers: { 'X-OPENTOK-AUTH': token },
        method: 'POST',
      },
    ).then(response => response.json());

    const removeAllKeys = [
      `event-${eventId}:sponsor-${sponsorId}:vonageSessionId`,
      `event-${eventId}:sponsor-${sponsorId}:vonageToken`,
      `event-${eventId}:sponsor-${sponsorId}:roomState`,
      `event-${eventId}:sponsor-${sponsorId}:broadcastId`,
    ].map(key => this.redisClient.del(key));
    await Promise.all(removeAllKeys);
  }
}
