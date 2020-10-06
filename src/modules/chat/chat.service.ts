import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../shared/services/logger.service';
import SendMessageDto from './dto/chat.sendMessage.dto';
// import { dynamodb } from '../../shared/config/AWS';

@Injectable()
export class ChatService {
  constructor(private readonly loggerService: LoggerService) {}

  create(sendMessageDto: SendMessageDto): SendMessageDto {
    console.log('dto', sendMessageDto);
    // dynamodb.put();
    this.loggerService.info(
      `Message sended from: ${sendMessageDto.fromGuid}, to: ${sendMessageDto.toGuid}`,
    );
    return sendMessageDto;
  }
}
