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
import { AdminAuthGuard } from '../../shared/guards/adminAuth.guard';
import { OrganizerAuthGuard } from '../../shared/guards/organizerAuth.guard';

@ApiTags('Users')
@Controller('users')
export class UserController extends BaseWithoutAuthController {
  constructor(private userService: UserService) {
    super();
  }

  @ApiCreatedResponse({
    type: CreateUserDto,
    description: 'User has been successfully created',
  })
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.userService.create(createUserDto);
  }

  @ApiCreatedResponse({
    type: CreateAvatarDto,
    description: 'Avatar has been successfully created',
  })
  @UseGuards(AuthGuard, VerifyIfIsAuthenticatedUserGuard)
  @Post('/create-avatar')
  async createAvatar(@Body() createAvatarDto: CreateAvatarDto) {
    return this.userService.createAvatar(createAvatarDto);
  }

  @ApiCreatedResponse({
    type: CreateAvatarDto,
    description: 'CSV file has been successfully uploaded',
  })
  @UseGuards(AuthGuard)
  @Post('uploadUsers/:eventId')
  async processCSVUsers(
    @Req() req,
    @Res() res,
    @Param('eventId', ParseIntPipe) eventId: number,
  ) {
    const { file } = req.raw.files;
    await this.userService.processCsvFile(file, eventId);
  }

  @ApiCreatedResponse({
    description: 'User found in cognito pool',
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
    description: 'Success on link a user with role to a event',
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
    description: 'Success on link a user with code to a event',
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

  // GET's (READ)

  @ApiCreatedResponse({
    type: User,
    description: 'User avatar by id ',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @UseGuards(AuthGuard)
  @Get('/avatar/:id')
  async getAvatarUrl(@Param('id') id): Promise<Partial<User> | void> {
    return this.userService.getAvatarUrl(id);
  }

  @ApiCreatedResponse({
    type: User,
    description: 'User by email was successfully retrieved',
  })
  @ApiParam({ name: 'email', type: 'string' })
  @UseGuards(AdminAuthGuard)
  @Get('/email/:email')
  async getUserByEmail(@Param('email') email): Promise<User | void> {
    return this.userService.getUserByEmail(email);
  }

  @ApiCreatedResponse({
    type: User,
    description: 'User by guid was successfully retrieved',
  })
  @ApiParam({ name: 'guid', type: 'string' })
  @UseGuards(AuthGuard, VerifyIfIsAuthenticatedUserGuard)
  @Get('/:guid')
  async findOne(@Param('guid') guid): Promise<Partial<User> | void> {
    return this.userService.findOne(guid);
  }

  @ApiCreatedResponse({
    type: Event,
    description: 'Events by user id were successfully retrieved',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @UseGuards(AuthGuard)
  @Get('events/:id')
  async getUserEvents(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getEventsByUserId(id);
  }

  // PUT's (UPDATE)

  @ApiCreatedResponse({
    type: UpdateUserDto,
    description: 'User has been successfully updated',
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
    type: Event,
    description: 'Event code was successfully redeemed',
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

  // DELETE's

  @ApiCreatedResponse({
    type: Event,
    description: 'Avatar image by user id was successfully deleted',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @UseGuards(AuthGuard, VerifyIfIsAuthenticatedUserGuard)
  @Delete('removeAvatar/:id')
  async removeAvatar(@Param('id', ParseIntPipe) id: number) {
    return this.userService.removeAvatar(id);
  }
}
