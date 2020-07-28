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
} from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiParam } from '@nestjs/swagger';
import { UpdateResult } from 'typeorm';
import { CreateSponsorDto } from './dto/sponsor.create.dto';
import { CreateLogoDto } from './dto/sponsor.create.logo.dto';
import { SponsorService } from './sponsor.service';
import { Sponsor } from './sponsor.entity';
import { UpdateSponsorDto } from './dto/sponsor.update.dto';
import { BaseWithoutAuthController } from '../../shared/controllers/base.withoutAuth.controller';
import { AuthGuard } from '../../shared/guards/auth.guard';
import { AdminAuthGuard } from '../../shared/guards/admin-auth.guard';

@ApiTags('Sponsor')
@Controller('sponsors')
export class SponsorController extends BaseWithoutAuthController {
  constructor(private sponsorService: SponsorService) {
    super();
  }

  @ApiCreatedResponse({
    type: CreateSponsorDto,
    description: 'the sponsor has been successfully created',
  })
  @Post()
  async create(@Body() createUserDto: CreateSponsorDto) {
    return await this.sponsorService.create(createUserDto);
  }

  @ApiCreatedResponse({
    type: CreateLogoDto,
    description: 'the avatar has been successfully created',
  })
  @UseGuards(AuthGuard)
  @Post('/create-avatar')
  async createAvatar(@Body() createLogoDto: CreateLogoDto) {
    return this.sponsorService.createAvatar(createLogoDto);
  }

  @ApiCreatedResponse({
    type: Sponsor,
    description: 'get sponsor avatar by id',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @UseGuards(AuthGuard)
  @Get('/avatar/:id')
  async getAvatarUrl(@Param('id') id): Promise<Partial<Sponsor> | void> {
    return this.sponsorService.getAvatarUrl(id);
  }

  @ApiCreatedResponse({
    type: Sponsor,
    description: 'get sponsor by email',
  })
  @ApiParam({ name: 'email', type: 'string' })
  @UseGuards(AdminAuthGuard)
  @Get('/email/:email')
  async getSponsorByEmail(@Param('email') email): Promise<Sponsor | void> {
    return this.sponsorService.getUserByEmail(email);
  }

  @ApiCreatedResponse({
    type: UpdateSponsorDto,
    description: 'the sponsor has been successfully updated',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @UseGuards(AuthGuard)
  @Put('/:id')
  update(
    @Res() res,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSponsorDto: UpdateSponsorDto,
  ): Promise<void | UpdateResult> {
    return this.sponsorService
      .updateUserInfo(id, updateSponsorDto)
      .then(() => res.status(204).send());
  }

  @ApiCreatedResponse({
    type: Sponsor,
    description: 'get sponsor by guid',
  })
  @ApiParam({ name: 'guid', type: 'string' })
  @UseGuards(AuthGuard)
  @Get('/:guid')
  async findOne(@Param('guid') guid): Promise<Partial<Sponsor> | void> {
    return this.sponsorService.findOne(guid);
  }

  @ApiCreatedResponse({
    type: Sponsor,
    description: 'delete avatar image by sponsor id',
  })
  @ApiParam({ name: 'id', type: 'number' })
  @UseGuards(AuthGuard)
  @Delete('removeAvatar/:id')
  async removeAvatar(@Param('id', ParseIntPipe) id: number) {
    return this.sponsorService.removeAvatar(id);
  }
}
