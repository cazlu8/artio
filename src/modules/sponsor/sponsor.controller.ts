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
import { AdminAuthGuard } from '../../shared/guards/adminAuth.guard';

@ApiTags('Sponsor')
@Controller('sponsors')
export class SponsorController extends BaseWithoutAuthController {
  constructor(private sponsorService: SponsorService) {
    super();
  }

  @ApiCreatedResponse({
    type: CreateSponsorDto,
    description: 'The sponsor has been successfully created',
  })
  @Post()
  async create(@Body() createSponsorDto: CreateSponsorDto) {
    return await this.sponsorService.create(createSponsorDto);
  }

  @ApiCreatedResponse({
    type: CreateLogoDto,
    description: 'Logo has been successfully created',
  })
  @UseGuards(AuthGuard)
  @Post('/uploadLogo')
  uploadLogo(@Body() createLogoDto: CreateLogoDto) {
    return this.sponsorService.uploadLogo(createLogoDto);
  }

  @ApiParam({ name: 'id', type: 'number' })
  @ApiCreatedResponse({
    type: Sponsor,
    description: 'Sponsor logo by id was successfully retrieved',
  })
  @UseGuards(AuthGuard)
  @Get('/logo/:id')
  getlogoUrl(@Param('id') id): Promise<Partial<Sponsor> | void> {
    return this.sponsorService.getlogoUrl(id);
  }

  @ApiParam({ name: 'email', type: 'string' })
  @ApiCreatedResponse({
    type: Sponsor,
    description: 'Sponsor by email was successfully retrieved',
  })
  @UseGuards(AdminAuthGuard)
  @Get('/email/:email')
  async getSponsorByEmail(@Param('email') email): Promise<Sponsor | void> {
    return await this.sponsorService.getSponsorByEmail(email);
  }

  @ApiParam({ name: 'guid', type: 'string' })
  @ApiCreatedResponse({
    type: Sponsor,
    description: 'Sponsor by guid was successfully retrieved',
  })
  @UseGuards(AuthGuard)
  @Get('/:guid')
  async findOne(@Param('guid') guid): Promise<Partial<Sponsor> | void> {
    return await this.sponsorService.findOne(guid);
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
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSponsorDto: UpdateSponsorDto,
  ): Promise<void | UpdateResult> {
    return this.sponsorService
      .updateSponsorInfo(id, updateSponsorDto)
      .then(() => res.status(204).send());
  }

  @ApiParam({ name: 'id', type: 'number' })
  @ApiCreatedResponse({
    type: Sponsor,
    description: 'Image by sponsor id was successfully deleted',
  })
  @UseGuards(AuthGuard)
  @Delete('removeLogo/:id')
  removeLogo(@Param('id', ParseIntPipe) id: number) {
    return this.sponsorService.removeLogo(id);
  }
}
