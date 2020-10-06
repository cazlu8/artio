import { Injectable } from '@nestjs/common';
import { uuid } from 'uuidv4';
import { LoggerService } from '../../shared/services/logger.service';
import SendMessageDto from './dto/chat.sendMessage.dto';
import { dynamodb } from '../../shared/config/AWS';

@Injectable()
export class ChatService {
  constructor(private readonly loggerService: LoggerService) {}

  create(sendMessageDto: SendMessageDto): SendMessageDto {
    console.log('dto', sendMessageDto);

    const guid = uuid();

    const params = {
      TableName: 'artio-chat',
      Item: {
        PK: `PK#${guid}`,
        SK: `SK#${guid}`,
        eventId: 1,
        sponsorGuid: guid,
        toGuid: guid,
        fromGuid: guid,
        toRead: false,
        createdAt: Date.now(),
      },
    };

    dynamodb.put(params, (err, data) => {
      if (err) console.log(err);
      else console.log(data);
    });
    return sendMessageDto;
  }
}
