import { Injectable } from '@nestjs/common';
import { uuid } from 'uuidv4';
import * as AWS from 'aws-sdk';
import { ConfigService } from '@nestjs/config';
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
@Injectable()
export class ChatService {
  private readonly dynamoDB: DocumentClient;

  constructor(private configService: ConfigService) {
    this.dynamoDB = new AWS.DynamoDB.DocumentClient({
      service: new AWS.DynamoDB(this.configService.get('dynamo')),
    });
  }

  async create(
    eventId: number,
    sponsorGuid: string,
    toUserGuid: string,
    fromUserGuid: string,
    message: string,
  ): Promise<string> {
    const guid = uuid();
    const params = {
      TableName: process.env.TABLE_CHAT_SPONSOR,
      Item: {
        guid,
        sponsorGuid,
        message,
        eventId,
        toUserGuid,
        fromUserGuid,
        toRead: false,
        createdAt: Date.now(),
      },
    };
    await this.dynamoDB.put(params).promise();
    return guid;
  }

  async setReadMessage(messageGuid: string): Promise<void> {
    const params = {
      ExpressionAttributeNames: {
        '#R': 'toRead',
      },
      ExpressionAttributeValues: {
        ':t': true,
      },
      Key: {
        guid: messageGuid,
      },
      TableName: process.env.TABLE_CHAT_SPONSOR,
      UpdateExpression: 'SET #R = :t',
    };
    await this.dynamoDB.update(params).promise();
  }

  async getMessages(eventId: number, toGuid, fromGuid, sponsorGuid) {
    const params = {
      TableName: process.env.TABLE_CHAT_SPONSOR,
      ExpressionAttributeValues: {
        ':toGuid': toGuid,
        ':fromGuid': fromGuid,
        ':sponsorGuid': sponsorGuid,
        ':eventId': eventId,
      },
      ScanIndexForward: false,
      KeyConditionExpression: 'sponsorGuid = :sponsorGuid',
      FilterExpression:
        'toUserGuid = :toGuid or toUserGuid = :fromGuid or fromUserGuid = :fromGuid or fromUserGuid = :toGuid and eventId = :eventId',
      Select: `ALL_ATTRIBUTES`,
    };
    return await this.dynamoDB.query(params).promise();
  }
}
