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
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiParam } from '@nestjs/swagger';
import { ObjectLiteral, UpdateResult } from 'typeorm';
import { CreateSponsorDto } from './dto/sponsor.create.dto';
import { CreateLogoDto } from './dto/sponsor.create.logo.dto';
import { SponsorService } from './sponsor.service';
import { Sponsor } from './sponsor.entity';
import { UpdateSponsorDto } from './dto/sponsor.update.dto';
import { BaseWithoutAuthController } from '../../shared/controllers/base.withoutAuth.controller';
import { AuthGuard } from '../../shared/guards/auth.guard';
import { AdminAuthGuard } from '../../shared/guards/adminAuth.guard';
import { SponsorRepository } from './sponsor.repository';
import { ValidateSponsorGUID } from './pipes/ValidateSponsorGUID.pipe';
import { ValidateSponsorId } from './pipes/ValidateSponsorId.pipe';
import { ValidateSponsorEmail } from './pipes/ValidateSponsorEmail.pipe';
import { CreateBannerDto } from './dto/sponsor.create.banner.dto';

@ApiTags('Sponsor')
@Controller('sponsors')
export class SponsorController extends BaseWithoutAuthController {
  constructor(
    private sponsorService: SponsorService,
    private readonly repository: SponsorRepository,
  ) {
    super();
  }

  @ApiCreatedResponse({
    type: CreateSponsorDto,
    description: 'The sponsor has been successfully created',
  })
  @UseGuards(AuthGuard)
  @Post()
  async create(
    @Body() createSponsorDto: CreateSponsorDto,
  ): Promise<ObjectLiteral | void> {
    return this.sponsorService.create(createSponsorDto);
  }

  @ApiCreatedResponse({
    type: CreateLogoDto,
    description: 'Logo has been successfully created',
  })
  @UseGuards(AuthGuard)
  @Post('/uploadLogo')
  uploadLogo(
    @Body() createLogoDto: CreateLogoDto,
  ): Promise<void | ObjectLiteral> {
    return this.sponsorService.uploadLogo(createLogoDto);
  }

  @ApiCreatedResponse({
    type: CreateLogoDto,
    description: 'Banner has been successfully created',
  })
  @UseGuards(AuthGuard)
  @Post('/uploadBanner')
  uploadBanner(
    @Body() createBannerDto: CreateBannerDto,
  ): Promise<void | ObjectLiteral> {
    return this.sponsorService.uploadBanner(createBannerDto);
  }

  @ApiParam({ name: 'id', type: 'number' })
  @ApiCreatedResponse({
    type: Sponsor,
    description: 'Sponsor logo by id was successfully retrieved',
  })
  @UsePipes(ValidateSponsorId)
  @UseGuards(AuthGuard)
  @Get('/logo/:id')
  getlogoUrl(@Param('id') id): Promise<Partial<Sponsor> | void> {
    return this.repository.findOne({
      select: ['logo'],
      where: { id },
    });
  }

  @ApiParam({ name: 'email', type: 'string' })
  @ApiCreatedResponse({
    type: Sponsor,
    description: 'Sponsor by email was successfully retrieved',
  })
  @UsePipes(ValidateSponsorEmail)
  @UseGuards(AdminAuthGuard)
  @Get('/email/:email')
  async getSponsorByEmail(@Param('email') email): Promise<Sponsor | void> {
    return this.repository.findOne({
      where: { email },
    });
  }

  @ApiParam({ name: 'id', type: 'number' })
  @ApiCreatedResponse({
    type: Sponsor,
    description: 'Sponsor by id was successfully retrieved',
  })
  @UsePipes(ValidateSponsorId)
  @UseGuards(AuthGuard)
  @Get('/:id')
  async getSponsorById(@Param('id', ParseIntPipe) id): Promise<Sponsor | void> {
    return this.repository.findOne({
      where: { id },
    });
  }

  @ApiParam({ name: 'guid', type: 'string' })
  @ApiCreatedResponse({
    type: Sponsor,
    description: 'Sponsor by guid was successfully retrieved',
  })
  @UsePipes(ValidateSponsorGUID)
  @UseGuards(AuthGuard)
  @Get('/guid/:guid')
  async findOne(@Param('guid') guid): Promise<Partial<Sponsor> | void> {
    return this.repository.findOne({ guid });
  }

  @ApiParam({ name: 'id', type: 'number' })
  @ApiCreatedResponse({
    type: UpdateSponsorDto,
    description: 'Sponsor has been successfully updated',
  })
  @UseGuards(AuthGuard)
  @Put('/:id')
  update(
    @Res() res,
    @Param('id', ParseIntPipe, ValidateSponsorId) id: number,
    @Body() updateSponsorDto: UpdateSponsorDto,
  ): Promise<void | UpdateResult> {
    return this.sponsorService
      .updateSponsorInfo(id, updateSponsorDto)
      .then(() => res.status(204).send());
  }
}
