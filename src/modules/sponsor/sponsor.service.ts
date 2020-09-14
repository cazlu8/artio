import { Injectable } from '@nestjs/common';
import { ObjectLiteral, Repository, UpdateResult } from 'typeorm';
import * as sharp from 'sharp';
import { uuid } from 'uuidv4';
import { InjectRepository } from '@nestjs/typeorm';
import { PromiseResult } from 'aws-sdk/lib/request';
import { AWSError, S3 } from 'aws-sdk';
import { ManagedUpload } from 'aws-sdk/clients/s3';
import { Sponsor } from './sponsor.entity';
import { CreateSponsorDto } from './dto/sponsor.create.dto';
import { UpdateSponsorDto } from './dto/sponsor.update.dto';
import { CreateLogoDto } from './dto/sponsor.create.logo.dto';
import { handleBase64 } from '../../shared/utils/image.utils';
import { SponsorRepository } from './sponsor.repository';
import { EventSponsors } from '../eventSponsors/eventSponsors.entity';
import { LoggerService } from '../../shared/services/logger.service';
import { UploadService } from '../../shared/services/upload.service';
import { CreateBannerDto } from './dto/sponsor.create.banner.dto';

@Injectable()
export class SponsorService {
  constructor(
    private readonly repository: SponsorRepository,
    @InjectRepository(EventSponsors)
    private readonly eventSponsorRepository: Repository<EventSponsors>,
    private readonly loggerService: LoggerService,
    private readonly uploadService: UploadService,
  ) {}

  updateSponsorInfo(
    id: number,
    updateSponsorDto: UpdateSponsorDto,
  ): Promise<UpdateResult> {
    return this.update(id, updateSponsorDto);
  }

  async create(
    createSponsorDto: CreateSponsorDto,
  ): Promise<void | ObjectLiteral> {
    const { id: sponsorId } = await this.repository.save(createSponsorDto);
    await this.eventSponsorRepository.save({
      sponsorId,
      eventId: createSponsorDto.eventId,
    });

    this.loggerService.info(
      `Sponsor ${sponsorId} Created and binded with event ${createSponsorDto.eventId}`,
    );
  }

  async uploadLogo(
    createLogoDto: CreateLogoDto,
  ): Promise<void | ObjectLiteral> {
    const { logo, id: sponsorId } = createLogoDto;
    const logoId: string = uuid();
    const { entity, sharpedImage } = await this.processLogoImage(
      logo,
      sponsorId,
      logoId,
    );
    const params = {
      Bucket: process.env.S3_BUCKET_SPONSOR,
      Key: `${logoId}.png`,
      Body: sharpedImage,
      ACL: 'private',
      ContentEncoding: 'base64',
      ContentType: `image/png`,
    };
    const { Bucket } = params;
    const functions: any = [
      ...this.updateLogoImage(params, sponsorId, logoId),
      this.deleteLogo(entity, Bucket),
    ];
    await Promise.all(functions);
    this.loggerService.info(`Sponsor logo id(${sponsorId}) was created`);
    return {
      url: `${process.env.S3_BUCKET_SPONSOR_PREFIX_URL}${logoId}.png`,
    };
  }

  async uploadBanner(
    createBannerDto: CreateBannerDto,
  ): Promise<void | ObjectLiteral> {
    const { banner, id: sponsorId } = createBannerDto;
    const bannerId: string = uuid();
    const { entity, sharpedImage } = await this.processLogoImage(
      banner,
      sponsorId,
      bannerId,
    );
    const params = {
      Bucket: process.env.S3_BUCKET_SPONSOR,
      Key: `${bannerId}.png`,
      Body: sharpedImage,
      ACL: 'private',
      ContentEncoding: 'base64',
      ContentType: `image/png`,
    };
    const { Bucket } = params;
    const functions: any = [
      ...this.updateBannerImage(params, sponsorId, bannerId),
      this.deleteBanner(entity, Bucket),
    ];
    await Promise.all(functions);
    this.loggerService.info(`Sponsor banner id(${sponsorId}) was created`);
    return {
      url: `${process.env.S3_BUCKET_SPONSOR_PREFIX_URL}${bannerId}.png`,
    };
  }

  private async processLogoImage(
    logo: string,
    sponsorId: number,
    logoId: string,
  ): Promise<any> {
    const base64Data = Buffer.from(handleBase64(logo), 'base64');
    const sharpedImage = await sharp(base64Data)
      .resize(440, 240)
      .png();
    const entity: any = await this.repository.get({
      select: ['logo'],
      where: { id: sponsorId },
    });
    return { sharpedImage, entity, logoId };
  }

  private deleteLogo(
    entity: any,
    Bucket: string,
  ): Promise<PromiseResult<S3.DeleteObjectOutput, AWSError> | void> {
    if (entity?.logo) {
      const { logo: formerUrl } = entity;
      const lastIndex = formerUrl.lastIndexOf('/');
      const currentKey = formerUrl.substr(lastIndex + 1, formerUrl.length);
      this.loggerService.info(`Sponsor logo ${formerUrl} was deleted`);
      return this.uploadService.deleteObject({ Bucket, Key: `${currentKey}` });
    }
    return Promise.resolve();
  }

  private deleteBanner(
    entity: any,
    Bucket: string,
  ): Promise<PromiseResult<S3.DeleteObjectOutput, AWSError> | void> {
    if (entity?.banner) {
      const { banner: formerUrl } = entity;
      const lastIndex = formerUrl.lastIndexOf('/');
      const currentKey = formerUrl.substr(lastIndex + 1, formerUrl.length);
      this.loggerService.info(`Sponsor banner ${formerUrl} was deleted`);
      return this.uploadService.deleteObject({ Bucket, Key: `${currentKey}` });
    }
    return Promise.resolve();
  }

  private updateLogoImage(
    params: any,
    sponsorId: number,
    bannerId: string,
  ): (Promise<ManagedUpload.SendData> | Promise<UpdateResult>)[] {
    return [
      this.uploadService.uploadObject(params),
      this.update(sponsorId, {
        logo: `${process.env.S3_BUCKET_SPONSOR_PREFIX_URL}${bannerId}.png`,
      }),
    ];
  }

  private updateBannerImage(
    params: any,
    sponsorId: number,
    bannerId: string,
  ): (Promise<ManagedUpload.SendData> | Promise<UpdateResult>)[] {
    return [
      this.uploadService.uploadObject(params),
      this.update(sponsorId, {
        banner: `${process.env.S3_BUCKET_SPONSOR_PREFIX_URL}${bannerId}.png`,
      }),
    ];
  }

  async removeLogo(id: number): Promise<void> {
    const entity: any = await this.repository.get({
      select: ['logo'],
      where: { id },
    });
    await this.repository.removeLogoUrl(id);
    const Bucket = process.env.S3_BUCKET_SPONSOR;
    await this.deleteLogo(entity, Bucket);
  }

  private async update(
    id: number,
    entityData: Partial<Sponsor>,
  ): Promise<UpdateResult> {
    const sponsor = await this.repository.update(id, entityData);
    this.loggerService.info(`Sponsor ${id} has been updated`);
    return sponsor;
  }
}
