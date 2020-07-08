import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Put,
  Res,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiParam } from '@nestjs/swagger';
import { UpdateResult, ObjectLiteral } from 'typeorm';
import { CreateUserDto } from './dto/user.create.dto';
import { CreateAvatarDto } from './dto/user.create.avatar.dto';
import { UserService } from './user.service';
import { User } from './user.entity';
import { VerifyIfIsAuthenticatedUserGuard } from '../../shared/guards/verifyIfIsAuthenticatedUser.guard';
import { UpdateUserDto } from './dto/user.update.dto';
import { BaseWithoutAuthController } from '../../shared/controllers/base.withoutAuth.controller';
import { AuthGuard } from '../../shared/guards/auth.guard';
import { CheckUserExistsDto } from './dto/user.checkUserExists.dto';
import { Event } from '../event/event.entity';
import { CreateUserEventDto } from '../userEvents/dto/userEvents.create.dto';

@ApiTags('Users')
@Controller('users')
export class UserController extends BaseWithoutAuthController {
  constructor(private userService: UserService) {
    super();
  }

  @ApiCreatedResponse({
    type: CreateUserDto,
    description: 'the user has been successfully created',
  })
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.userService.create(createUserDto);
  }

  @ApiCreatedResponse({
    type: CreateAvatarDto,
    description: 'the avatar has been successfully created',
  })
  @UseGuards(AuthGuard, VerifyIfIsAuthenticatedUserGuard)
  @Post('/create-avatar')
  async createAvatar(@Body() createAvatarDto: CreateAvatarDto) {
    return this.userService.createAvatar(createAvatarDto);
  }

  @ApiCreatedResponse({
    type: User,
    description: 'get user avatar by id',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @Get('/avatar/:id')
  async getAvatarUrl(@Param('id') id): Promise<Partial<User> | void> {
    return this.userService.getAvatarUrl(id);
  }

  @ApiCreatedResponse({
    type: UpdateUserDto,
    description: 'the user has been successfully updated',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @UseGuards(AuthGuard, VerifyIfIsAuthenticatedUserGuard)
  @Put('/:id')
  update(
    @Res() res,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<void | UpdateResult> {
    return this.userService
      .updateUserInfo(id, updateUserDto)
      .then(() => res.status(204).send());
  }

  @ApiCreatedResponse({
    type: User,
    description: 'get user by guid',
  })
  @ApiParam({ name: 'guid', type: 'string' })
  @UseGuards(AuthGuard, VerifyIfIsAuthenticatedUserGuard)
  @Get('/:guid')
  async findOne(@Param('guid') guid): Promise<Partial<User> | void> {
    return this.userService.findOne(guid);
  }

  @ApiCreatedResponse({
    description: 'check if a given user exists on cognito user pool',
  })
  @ApiParam({ name: 'guid', type: 'string' })
  @Post('/checkUserExists')
  async verifyIfUserExists(
    @Body() checkUserExists: CheckUserExistsDto,
  ): Promise<boolean> {
    return this.userService.exists(checkUserExists);
  }

  @ApiCreatedResponse({
    type: Event,
    description: 'get events by user id',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @UseGuards(AuthGuard)
  @Get('events/:id')
  async getUserEvents(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getEventsByUserId(id);
  }

  @ApiCreatedResponse({
    type: Event,
    description: 'Link a user to a event',
  })
  @ApiParam({ name: 'userId and eventId', type: 'number' })
  @UseGuards(AuthGuard)
  @Post('linkEvent')
  async bindUserEvent(
    @Res() res,
    @Body() createUserEventDto: CreateUserEventDto,
  ): Promise<void | ObjectLiteral> {
    return this.userService
      .bindUserEvent(createUserEventDto)
      .then(() => res.status(201).send());
  }
}
