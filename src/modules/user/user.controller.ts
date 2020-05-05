import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Put,
  HttpCode,
  Header,
  ParseIntPipe,
}                                                from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiParam } from '@nestjs/swagger';
import { CreateUserDto }                         from './dto/user.create.dto';
import { UserService }                           from './user.service';
import { User }                                  from './user.entity';
import { VerifyIfIsAuthenticatedUserGuard }      from '../../shared/guards/verifyIfIsAuthenticatedUser.guard';
import { UpdateUserDto }                         from './dto/user.update.dto';
import { BaseWithoutAuthController }             from '../../shared/controllers/base.withoutAuth.controller';
import { AuthGuard }                             from '../../shared/guards/auth.guard';

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
    type: UpdateUserDto,
    description: 'the user has been successfully updated',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @UseGuards(AuthGuard, VerifyIfIsAuthenticatedUserGuard)
  @Header('Content-Length', '0')
  @HttpCode(204)
  @Put('/:id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.userService.update(id, updateUserDto);
  }

  @ApiCreatedResponse({
    type: User,
    description: 'get user by guid',
  })
  @ApiParam({ name: 'guid', type: 'string' })
  @UseGuards(AuthGuard, VerifyIfIsAuthenticatedUserGuard)
  @Get('/:guid')
  async findOne(@Param('guid') guid): Promise<User | void> {
    return this.userService.findOne(guid);
  }
}
