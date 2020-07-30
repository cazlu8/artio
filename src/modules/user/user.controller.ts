import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Param,
  UseGuards,
  Put,
  Res,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiParam } from '@nestjs/swagger';
import { UpdateResult, ObjectLiteral } from 'typeorm';
import * as AWS from 'aws-sdk';
import { uuid } from 'uuidv4';
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
import { AdminAuthGuard } from '../../shared/guards/admin-auth.guard';
import { OrganizerAuthGuard } from '../../shared/guards/organizer-auth.guard';
import { s3Config } from '../../shared/config/AWS';

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
  @UseGuards(AuthGuard)
  @Get('/avatar/:id')
  async getAvatarUrl(@Param('id') id): Promise<Partial<User> | void> {
    return this.userService.getAvatarUrl(id);
  }

  @ApiCreatedResponse({
    type: User,
    description: 'get user by email',
  })
  @ApiParam({ name: 'email', type: 'string' })
  @UseGuards(AdminAuthGuard)
  @Get('/email/:email')
  async getUserByEmail(@Param('email') email): Promise<User | void> {
    return this.userService.getUserByEmail(email);
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
    description: 'Link a user with role to a event',
  })
  @ApiParam({ name: 'userId and eventId', type: 'number' })
  @UseGuards(AdminAuthGuard || OrganizerAuthGuard)
  @Post('linkEvent')
  async bindUserEvent(
    @Res() res,
    @Body() { roleId, userId, eventId },
  ): Promise<void | ObjectLiteral> {
    const data = { roleId, userId, eventId };
    return this.userService
      .bindUserEvent(data)
      .then(() => res.status(201).send());
  }

  @ApiCreatedResponse({
    type: Event,
    description: 'Link a user with code to a event',
  })
  @ApiParam({ name: 'userId and eventId', type: 'number' })
  @UseGuards(AdminAuthGuard || OrganizerAuthGuard)
  @Post('linkEventCode')
  async bindUserEventCode(
    @Res() res,
    @Body() { userEmail, eventId },
  ): Promise<void | ObjectLiteral> {
    const data = { userEmail, eventId };
    return this.userService
      .bindUserEventCode(data)
      .then(() => res.status(201).send())
      .catch(() => res.status(404).send());
  }

  @ApiCreatedResponse({
    type: Event,
    description: 'Redeem a event code',
  })
  @ApiParam({ name: 'userId', type: 'number' })
  @UseGuards(AdminAuthGuard || OrganizerAuthGuard)
  @Put('redeemCode')
  async redeemEventCode(
    @Res() res,
    @Body() { userId, ticketCode },
  ): Promise<void | ObjectLiteral> {
    const data = { userId, ticketCode };
    return this.userService
      .redeemEventCode(data)
      .then(() => res.status(200).send())
      .catch(() => res.status(404).send());
  }

  @ApiCreatedResponse({
    type: Event,
    description: 'delete avatar image by user id',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @UseGuards(AuthGuard, VerifyIfIsAuthenticatedUserGuard)
  @Delete('removeAvatar/:id')
  async removeAvatar(@Param('id', ParseIntPipe) id: number) {
    return this.userService.removeAvatar(id);
  }

  @UseGuards(AuthGuard)
  @Post('uploadUsers/:eventId')
  async processCSVUsers(
    @Req() req,
    @Res() res,
    @Param('eventId', ParseIntPipe) eventId: number,
  ) {
    try {
      const { file } = req.raw.files;
      const s3 = new AWS.S3(s3Config());
      const id = uuid();
      const params = {
        Bucket: process.env.S3_BUCKET_CSV_USERS,
        Key: `${id}.csv`,
        Body: file.data,
        ACL: 'private',
        ContentEncoding: 'utf-8',
        ContentType: `text/csv`,
      };
      await s3.upload(params).promise();
      res.status(201).send();
    } catch (error) {
      throw new Error(error);
    }
  }
}
