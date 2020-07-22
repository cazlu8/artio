import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiCreatedResponse } from '@nestjs/swagger';
import { NetworkRoomService } from './networkRoom.service';
import { NetworkRoomDto } from './dto/networkRoom.dto';
import { NetworkRoomTokenDto } from './dto/networkRoomToken.dto';
import { BaseWithoutAuthController } from '../../shared/controllers/base.withoutAuth.controller';
import { AuthGuard } from '../../shared/guards/auth.guard';

@ApiTags('NetworkRoom')
@Controller('networkRoom')
export class NetworkRoomController extends BaseWithoutAuthController {
  constructor(private networkRoomService: NetworkRoomService) {
    super();
  }

  @ApiCreatedResponse({
    type: NetworkRoomDto,
    description: 'this is your room id',
  })
  @UseGuards(AuthGuard)
  @Get()
  getRoom() {
    return this.networkRoomService.room();
  }

  @ApiCreatedResponse({
    type: NetworkRoomDto,
    description: 'this is your token',
  })
  @UseGuards(AuthGuard)
  @Post('/getToken')
  getToken(@Body() networkRoomTokenDto: NetworkRoomTokenDto) {
    return this.networkRoomService.videoToken(networkRoomTokenDto);
  }

  @ApiCreatedResponse({
    type: NetworkRoomDto,
    description: 'Finished with success',
  })
  @UseGuards(AuthGuard)
  @Post('/finishRoom')
  killRoom(@Body() params: { sid: string }) {
    return this.networkRoomService.killRoom(params);
  }

  @ApiCreatedResponse({
    type: NetworkRoomDto,
    description: 'this is your room id',
  })
  @UseGuards(AuthGuard)
  @Get('/listAll')
  listAll() {
    return this.networkRoomService.listAll();
  }

  @ApiCreatedResponse({
    type: NetworkRoomDto,
    description: 'this is your room id',
  })
  @UseGuards(AuthGuard)
  @Get('/killAll')
  killAll() {
    return this.networkRoomService.killAll();
  }
}
