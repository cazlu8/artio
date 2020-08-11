import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ObjectLiteral, Repository, UpdateResult } from 'typeorm';
import * as sharp from 'sharp';
import * as AWS from 'aws-sdk';
import { uuid } from 'uuidv4';
import { InjectRepository } from '@nestjs/typeorm';
import { Sponsor } from './sponsor.entity';
import { CreateSponsorDto } from './dto/sponsor.create.dto';
import { UpdateSponsorDto } from './dto/sponsor.update.dto';
import { s3Config } from '../../shared/config/AWS';
import { CreateLogoDto } from './dto/sponsor.create.logo.dto';
import { handleBase64 } from '../../shared/utils/image.utils';
import { SponsorRepository } from './sponsor.repository';
import validateEntityUserException from '../../shared/exceptions/user/createValidation.user.exception';
import { EventSponsors } from '../eventSponsors/eventSponsors.entity';
import { LoggerService } from '../../shared/services/logger.service';

@Injectable()
export class SponsorService {
  constructor(
    private readonly repository: SponsorRepository,
    @InjectRepository(EventSponsors)
    private readonly eventSponsorRepository: Repository<EventSponsors>,
    private readonly loggerService: LoggerService,
  ) {}

  findOne(guid: string): Promise<Partial<Sponsor> | void> {
    return this.repository.findOneOrFail({ guid }).catch(error => {
      if (error.name === 'EntityNotFound') throw new NotFoundException();
      throw new InternalServerErrorException(error);
    });
  }

  updateSponsorInfo(
    id: number,
    updateSponsorDto: UpdateSponsorDto,
  ): Promise<UpdateResult> {
    return this.update(id, updateSponsorDto);
  }

  create(createSponsorDto: CreateSponsorDto): Promise<void | ObjectLiteral> {
    return this.repository
      .save(createSponsorDto)
      .then(id =>
        this.eventSponsorRepository.save({
          sponsorId: id.id,
          eventId: createSponsorDto.eventId,
        }),
      )
      .then(sponsor =>
        this.loggerService.info(
          `Sponsor ${sponsor.id} Created and binded with event ${sponsor.eventId}`,
        ),
      )
      .catch(err => validateEntityUserException.check(err));
  }

  async uploadLogo(
    createLogoDto: CreateLogoDto,
  ): Promise<void | ObjectLiteral> {
    try {
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
      const s3 = new AWS.S3(s3Config());
      const functions: any = [
        ...this.updateLogoImage(s3, params, sponsorId, logoId),
        this.deleteLogo(entity, s3, Bucket),
      ];
      await Promise.all(functions);
      this.loggerService.info(`Sponsor logo id(${sponsorId}) was created`);
      return {
        url: `${process.env.S3_BUCKET_SPONSOR_PREFIX_URL}${logoId}.png`,
      };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
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

  private deleteLogo(entity: any, s3: AWS.S3, Bucket: string) {
    if (entity?.logo) {
      const { logo: formerUrl } = entity;
      const lastIndex = formerUrl.lastIndexOf('/');
      const currentKey = formerUrl.substr(lastIndex + 1, formerUrl.length);
      this.loggerService.info(`Sponsor logo ${formerUrl} was deleted`);
      return s3.deleteObject({ Bucket, Key: `${currentKey}` }).promise();
    }
    return Promise.resolve();
  }

  private updateLogoImage(
    s3: AWS.S3,
    params: any,
    sponsorId: number,
    logoId: string,
  ) {
    return [
      s3.upload(params).promise(),
      this.update(sponsorId, {
        logo: `${process.env.S3_BUCKET_SPONSOR_PREFIX_URL}${logoId}.png`,
      }),
    ];
  }

  getlogoUrl(id): Promise<Partial<Sponsor> | void> {
    return this.repository.findOne({
      select: ['logo'],
      where: { id },
    });
  }

  getSponsorByEmail(email): Promise<Sponsor | void> {
    return this.repository
      .findOneOrFail({
        where: { email },
      })
      .catch(error => {
        if (error.name === 'EntityNotFound') throw new NotFoundException();
        throw new InternalServerErrorException(error);
      });
  }

  async removeLogo(id: number) {
    const entity: any = await this.repository.get({
      select: ['logo'],
      where: { id },
    });
    await this.repository.removeLogoUrl(id);
    const s3 = new AWS.S3(s3Config());
    const Bucket = process.env.S3_BUCKET_SPONSOR;
    await this.deleteLogo(entity, s3, Bucket);
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
