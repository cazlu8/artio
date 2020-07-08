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
import { RoleService } from './role.service';
import CreateRoleDTO from './dto/role.create.dto';
import { BaseWithoutAuthController } from '../../shared/controllers/base.withoutAuth.controller';
import { Role } from './role.entity';
import { AuthGuard } from '../../shared/guards/auth.guard';
import { VerifyIfIsAuthenticatedUserGuard } from '../../shared/guards/verifyIfIsAuthenticatedUser.guard';

@ApiTags('Role')
@Controller('role')
export class RoleController extends BaseWithoutAuthController {
  constructor(private service: RoleService) {
    super();
  }

  @ApiCreatedResponse({
    type: CreateRoleDTO,
    description: 'the role has been successfully created',
  })
  @UseGuards(AuthGuard, VerifyIfIsAuthenticatedUserGuard)
  @Post()
  create(@Body() createRoleDTO: CreateRoleDTO) {
    return this.service.create(createRoleDTO);
  }

  @ApiCreatedResponse({
    type: Role,
    description: 'get role by id',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @UseGuards(AuthGuard, VerifyIfIsAuthenticatedUserGuard)
  @Get('/:id')
  async findOne(@Param('id', ParseIntPipe) id): Promise<Partial<Role> | void> {
    return this.service.getRole(id);
  }

  @ApiCreatedResponse({
    type: Role,
    description: 'get all roles',
  })
  @UseGuards(AuthGuard, VerifyIfIsAuthenticatedUserGuard)
  @Get()
  async find(): Promise<Partial<Role[]> | void> {
    return this.service.getRoles();
  }
}