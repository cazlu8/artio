import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiParam } from '@nestjs/swagger';
import { ObjectLiteral } from 'typeorm';
import { RoleService } from './role.service';
import CreateRoleDTO from './dto/role.create.dto';
import { BaseWithoutAuthController } from '../../shared/controllers/base.withoutAuth.controller';
import { Role } from './role.entity';
import { AuthGuard } from '../../shared/guards/auth.guard';
import { VerifyIfIsAuthenticatedUserGuard } from '../../shared/guards/verifyIfIsAuthenticatedUser.guard';
import { RoleRepository } from './role.repository';
import { ValidateRoleId } from './pipes/ValidateRoleId.pipe';
import { LoggerService } from '../../shared/services/logger.service';

@ApiTags('Role')
@Controller('role')
export class RoleController extends BaseWithoutAuthController {
  constructor(
    private readonly loggerService: LoggerService,
    private service: RoleService,
    private readonly repository: RoleRepository,
  ) {
    super();
  }

  @ApiCreatedResponse({
    type: CreateRoleDTO,
    description: 'The role has been successfully created',
  })
  @UseGuards(AuthGuard, VerifyIfIsAuthenticatedUserGuard)
  @Post()
  async create(
    @Body() createRoleDTO: CreateRoleDTO,
  ): Promise<void | ObjectLiteral> {
    await this.repository.save(createRoleDTO);
    this.loggerService.info(`Role ${createRoleDTO.name} Created`);
  }

  @ApiParam({ name: 'id', type: 'number' })
  @ApiCreatedResponse({
    type: Role,
    description: 'Role by id was successfully retrieved',
  })
  @UseGuards(AuthGuard, VerifyIfIsAuthenticatedUserGuard)
  @Get('/:id')
  async findOne(
    @Param('id', ParseIntPipe, ValidateRoleId) id,
  ): Promise<Partial<Role> | void> {
    return this.repository.findOne({ id });
  }

  @ApiCreatedResponse({
    type: Role,
    description: 'All roles were successfully retrieved',
  })
  @UseGuards(AuthGuard, VerifyIfIsAuthenticatedUserGuard)
  @Get()
  async find(): Promise<Partial<Role[]> | void> {
    return this.repository.find();
  }
}
