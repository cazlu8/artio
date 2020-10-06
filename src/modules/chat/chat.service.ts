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
      service: this.configService.get('dynamo'),
    });
  }

  async create(
    eventId: number,
    sponsorGuid: string,
    toUserGuid: string,
    fromUserGuid: string,
  ): Promise<string> {
    const guid = uuid();

    const params = {
      TableName: process.env.TABLE_CHAT_SPONSOR,
      Item: {
        guid,
        eventId,
        sponsorGuid,
        toUserGuid,
        fromUserGuid,
        toRead: false,
        createdAt: Date.now(),
      },
    };
    try {
      await this.dynamoDB.put(params).promise();
      return guid;
    } catch (err) {
      return err;
    }
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
    try {
      await this.dynamoDB.update(params).promise();
    } catch (err) {
      console.log(err);
    }
  }
}
