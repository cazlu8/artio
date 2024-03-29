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
  HttpCode,
  UsePipes,
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
import { RedeemEventCodeDTO } from '../userEvents/dto/userEvents.redeemEventCode.dto';
import { LinkToEventWithRoleDTO } from './dto/user.linkToEventWithRole.dto';
import { AuthGuard } from '../../shared/guards/auth.guard';
import { CheckUserExistsDto } from './dto/user.checkUserExists.dto';
import { Event } from '../event/event.entity';
import { AdminOrganizerAuthGuard } from '../../shared/guards/adminOrganizerAuth.guard';
import { UserRepository } from './user.repository';
import { ValidateIfIdExists } from './pipes/ValidateIfIdExists.pipe';
import { ValidateIfEmailExists } from './pipes/ValidateIfEmailExists.pipe';
import { ValidateIfGuidExists } from './pipes/ValidateIfGuidExists.pipe';
import { ValidateIfEventExists } from '../event/pipes/ValidateIfEventExists.pipe';
import { ValidateIfUserIsUnique } from './pipes/validateIfUserIsUnique.pipe';

@ApiTags('Users')
@Controller('users')
export class UserController extends BaseWithoutAuthController {
  constructor(
    private userService: UserService,
    private readonly repository: UserRepository,
  ) {
    super();
  }

  @ApiCreatedResponse({
    type: CreateUserDto,
    description: 'User has been successfully created',
  })
  @UsePipes(ValidateIfUserIsUnique)
  @Post()
  async create(
    @Body() createUserDto: CreateUserDto,
  ): Promise<void | ObjectLiteral> {
    return this.userService.create(createUserDto);
  }

  @ApiCreatedResponse({
    type: CreateAvatarDto,
    description: 'Avatar has been successfully created',
  })
  @UsePipes(ValidateIfIdExists)
  @UseGuards(AuthGuard, VerifyIfIsAuthenticatedUserGuard)
  @Post('/create-avatar')
  createAvatar(
    @Body() createAvatarDto: CreateAvatarDto,
  ): Promise<void | ObjectLiteral> {
    return this.userService.createAvatar(createAvatarDto);
  }

  @ApiCreatedResponse({
    type: CreateAvatarDto,
    description: 'CSV file has been successfully uploaded',
  })
  @UseGuards(AuthGuard)
  @UsePipes(ValidateIfEventExists)
  @HttpCode(201)
  @Post('uploadUsers/:eventId')
  async processCSVUsers(
    @Req() req,
    @Param('eventId', ParseIntPipe) eventId: number,
  ): Promise<void> {
    await this.userService.processCsvFile(req.raw, eventId);
  }

  @ApiParam({ name: 'guid', type: 'string' })
  @ApiCreatedResponse({
    description: 'User found in cognito pool',
  })
  @Post('/checkUserExists')
  verifyIfUserExists(
    @Body() checkUserExists: CheckUserExistsDto,
  ): Promise<boolean> {
    return this.userService.exists(checkUserExists);
  }

  @ApiParam({ name: 'userId and eventId', type: 'number' })
  @ApiCreatedResponse({
    type: Event,
    description: 'Success on link a user with role to a event',
  })
  @UseGuards(AdminOrganizerAuthGuard)
  @Post('linkEvent')
  @HttpCode(201)
  @UsePipes(ValidateIfIdExists, ValidateIfEventExists)
  bindUserEvent(
    @Body() linkToEventWithRoleDTO: LinkToEventWithRoleDTO,
  ): Promise<boolean | void> {
    return this.userService.bindUserEvent(linkToEventWithRoleDTO);
  }

  @ApiParam({ name: 'id', type: 'number' })
  @ApiCreatedResponse({
    type: User,
    description: 'User avatar by id ',
  })
  @UsePipes(ValidateIfIdExists)
  @UseGuards(AuthGuard)
  @Get('/avatar/:id')
  async getAvatarUrl(@Param('id') id): Promise<Partial<User> | void> {
    return this.repository.findOne({
      select: ['avatarImgUrl'],
      where: { id },
    });
  }

  @ApiParam({ name: 'email', type: 'string' })
  @ApiCreatedResponse({
    type: User,
    description: 'User by email was successfully retrieved',
  })
  @UsePipes(ValidateIfEmailExists)
  @UseGuards(AdminOrganizerAuthGuard)
  @Get('/email/:email')
  async getUserByEmail(@Param('email') email): Promise<User | void> {
    return this.repository.findOne({
      where: { email },
    });
  }

  @ApiParam({ name: 'guid', type: 'string' })
  @ApiCreatedResponse({
    type: User,
    description: 'User by guid was successfully retrieved',
  })
  @UsePipes(ValidateIfGuidExists)
  @UseGuards(AuthGuard, VerifyIfIsAuthenticatedUserGuard)
  @Get('/:guid')
  async findOne(@Param('guid') guid): Promise<Partial<User> | void> {
    return this.repository.findOne({ guid });
  }

  @ApiParam({ name: 'guid', type: 'string' })
  @ApiParam({ name: 'hash', type: 'string' })
  @ApiCreatedResponse({
    type: User,
    description: 'Validate user login',
  })
  @UseGuards(AuthGuard, VerifyIfIsAuthenticatedUserGuard)
  @Get('/validateSignIn/:guid/:hash')
  async validateSignIn(
    @Param('guid', ValidateIfGuidExists) guid: string,
    @Param('hash') hash: string,
  ): Promise<string | boolean> {
    return this.userService.validateSignIn(guid, hash);
  }

  @ApiParam({ name: 'id', type: 'number' })
  @ApiCreatedResponse({
    type: Event,
    description: 'Events by user id were successfully retrieved',
  })
  @UsePipes(ValidateIfIdExists)
  @UseGuards(AuthGuard)
  @Get('events/:id')
  async getUserEvents(@Param('id', ParseIntPipe) id: number): Promise<Event[]> {
    return this.repository.getEventsByUserId(id);
  }

  @ApiParam({ name: 'id', type: 'number' })
  @ApiCreatedResponse({
    type: UpdateUserDto,
    description: 'User has been successfully updated',
  })
  @UseGuards(AuthGuard, VerifyIfIsAuthenticatedUserGuard)
  @Put('/:userId')
  @HttpCode(204)
  update(
    @Param('userId', ParseIntPipe, ValidateIfIdExists)
    id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<void | UpdateResult> {
    return this.userService.updateUserInfo(id, updateUserDto);
  }

  @ApiParam({ name: 'userId', type: 'number' })
  @ApiCreatedResponse({
    type: Event,
    description: 'Event code was successfully redeemed',
  })
  @UseGuards(AuthGuard)
  @Put('redeemCode')
  redeemEventCode(
    @Res() res,
    @Body() redeemEventCodeDTO: RedeemEventCodeDTO,
  ): Promise<void | ObjectLiteral> {
    return this.userService
      .redeemEventCode(redeemEventCodeDTO)
      .then(() => res.status(200).send())
      .catch(() => res.status(404).send());
  }

  @ApiParam({ name: 'id', type: 'number' })
  @ApiCreatedResponse({
    type: Event,
    description: 'Avatar image by user id was successfully deleted',
  })
  @UsePipes(ValidateIfIdExists)
  @UseGuards(AuthGuard, VerifyIfIsAuthenticatedUserGuard)
  @Delete('removeAvatar/:userId')
  removeAvatar(@Param('userId', ParseIntPipe) id: number): Promise<void> {
    return this.userService.removeAvatar(id);
  }
}
