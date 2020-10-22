import { uuid } from 'uuidv4';
import { isBefore, isEqual } from 'date-fns';
import * as AWS from 'aws-sdk';
import { Injectable } from '@nestjs/common';
import { EventRepository } from '../event/event.repository';
import { EventStagesRepository } from '../eventStages/eventStages.repository';
import SetupInfraDTO from './dto/liveManagement.setupInfra.dto';
import encode1080p from './assets/encode-1080';

@Injectable()
export class LiveManagementService {
  constructor(
    private readonly repository: EventRepository,
    private readonly eventStagesRepository: EventStagesRepository,
  ) {}

  async setupInfra(setupInfraDTO: SetupInfraDTO) {
    const { eventId, stageId, region } = setupInfraDTO;
    const { startDate } = await this.repository.findOne({
      select: ['startDate'],
      where: { id: eventId },
    });
    const startDateFmt = +new Date(startDate);
    const dateNow = Date.now();
    if (isEqual(startDateFmt, dateNow) || isBefore(startDateFmt, dateNow)) {
      const {
        mediaPackageChannelArn,
        mediaPackagePriUser,
        mediaPackagePriUrl,
      } = await this.createMediaPackageChannel(eventId, stageId, region);
      const mediaPackageEndpointUrl = await this.createdMediaPackageEndpoint(
        eventId,
        stageId,
        region,
      );
      const {
        mediaLiveInputArn,
        mediaLiveInputId,
        streamUrl,
        streamKey,
      } = await this.createMediaLiveInput(eventId, stageId, region);
      const channelId = await this.createMediaLiveChannel(
        eventId,
        mediaLiveInputId,
        mediaLiveInputArn,
        mediaPackagePriUser,
        mediaPackagePriUrl,
        stageId,
        region,
      );
      const cdnDistributionId = await this.createdCDNDistribution(
        eventId,
        mediaPackageEndpointUrl,
        mediaPackageChannelArn,
        region,
      );
      await this.eventStagesRepository.update(stageId, {
        streamUrl,
        streamKey,
        region,
        cdnDistributionId,
        mediaLiveChannelId: +channelId,
        mediaLiveInputId: +mediaLiveInputId,
        liveUrl: mediaPackageEndpointUrl,
      });
    } else {
      console.log(`aki`);
      throw new Error(`start date from event ${eventId} does not started yet.`);
    }
  }

  private async createMediaPackageChannel(
    eventId: number,
    stageId: number,
    region: string,
  ) {
    const mediaPackage = new AWS.MediaPackage({
      region,
    });
    const ssm = new AWS.SSM({
      region,
    });
    const params = {
      Id: `event-${eventId}-stage-${stageId}`,
      Description: `Live Streaming for the event ${eventId}`,
    };
    console.log(`antes do package`, eventId, stageId);
    const {
      Arn: mediaPackageChannelArn,
      HlsIngest: { IngestEndpoints },
    } = await mediaPackage.createChannel(params).promise();
    console.log(`dps do package`);
    const primaryUser = {
      Type: 'String',
      Name: IngestEndpoints[0].Username,
      Value: IngestEndpoints[0].Password,
      Description: `MediaPackage Primary Ingest Username for the event: ${eventId}`,
    };
    await ssm.putParameter(primaryUser).promise();
    return {
      mediaPackageChannelArn,
      mediaPackagePriUser: IngestEndpoints[0].Username,
      mediaPackagePriUrl: IngestEndpoints[0].Url,
    };
  }

  private async createdMediaPackageEndpoint(
    eventId: number,
    stageId: number,
    region: string,
  ) {
    const mediaPackage = new AWS.MediaPackage({
      region,
    });
    const packages = {
      HlsPackage: {
        IncludeIframeOnlyStream: false,
        PlaylistType: 'NONE',
        PlaylistWindowSeconds: 60,
        ProgramDateTimeIntervalSeconds: 0,
        SegmentDurationSeconds: 6,
        UseAudioRenditionGroup: false,
        AdMarkers: 'PASSTHROUGH',
      },
    };
    const params = {
      ChannelId: `event-${eventId}-stage-${stageId}`,
      Description: `Live Streaming for the event ${eventId}`,
      ManifestName: 'index',
      StartoverWindowSeconds: 0,
      TimeDelaySeconds: 0,
      Id: `event-${eventId}-stage-${stageId}-hls`,
      HlsPackage: packages.HlsPackage,
    };
    const {
      Url: mediaPackageEndpointUrl,
    } = await mediaPackage.createOriginEndpoint(params).promise();
    return mediaPackageEndpointUrl;
  }

  private async createdCDNDistribution(
    eventId: number,
    mediaPackageEndpointUrl: string,
    mediaPackageChannelArn: string,
    region: string,
  ) {
    const cloudFront = new AWS.CloudFront({ region, apiVersion: '2020-05-31' });
    const originId = mediaPackageEndpointUrl
      .replace('https://', '')
      .split('.')[0];
    const originDomainName = mediaPackageEndpointUrl
      .replace('https://', '')
      .split('/')[0];
    const cdnParams = {
      DistributionConfigWithTags: {
        DistributionConfig: {
          Enabled: true,
          CallerReference: (+new Date()).toString(),
          Comment: `CDN for media package for event: ${eventId}`,
          DefaultCacheBehavior: {
            TargetOriginId: 'TEMP_ORIGIN_ID/channel',
            ViewerProtocolPolicy: 'redirect-to-https',
            ForwardedValues: {
              QueryString: false,
              Cookies: {
                Forward: 'none',
              },
            },
            MinTTL: 0,
            AllowedMethods: {
              Quantity: 2,
              Items: ['GET', 'HEAD'],
            },
            TrustedSigners: {
              Enabled: false,
              Quantity: 0,
            },
          },
          Origins: {
            Items: [
              {
                Id: `EMP-${originId}`,
                DomainName: originDomainName,
                ConnectionAttempts: 3,
                ConnectionTimeout: 10,
                CustomOriginConfig: {
                  HTTPPort: 80,
                  HTTPSPort: 443,
                  OriginProtocolPolicy: 'match-viewer',
                  OriginReadTimeout: 30,
                  OriginKeepaliveTimeout: 5,
                },
              },
              {
                Id: 'TEMP_ORIGIN_ID/channel',
                DomainName: 'mediapackage.amazonaws.com',
                ConnectionAttempts: 3,
                ConnectionTimeout: 10,
                CustomOriginConfig: {
                  HTTPPort: 80,
                  HTTPSPort: 443,
                  OriginProtocolPolicy: 'match-viewer',
                  OriginReadTimeout: 30,
                  OriginKeepaliveTimeout: 5,
                },
              },
            ],
            Quantity: 2,
          },
          CacheBehaviors: {
            Quantity: 2,
            Items: [
              {
                TargetOriginId: `EMP-${originId}`,
                PathPattern: 'index.ism/*',
                ViewerProtocolPolicy: 'redirect-to-https',
                SmoothStreaming: true,
                ForwardedValues: {
                  QueryString: true,
                  Cookies: {
                    Forward: 'none',
                  },
                  QueryStringCacheKeys: {
                    Quantity: 3,
                    Items: ['end', 'm', 'start'],
                  },
                },
                MinTTL: 0,
                AllowedMethods: {
                  Quantity: 2,
                  Items: ['GET', 'HEAD'],
                },
                TrustedSigners: {
                  Enabled: false,
                  Quantity: 0,
                },
              },
              {
                TargetOriginId: `EMP-${originId}`,
                PathPattern: '*',
                ViewerProtocolPolicy: 'redirect-to-https',
                ForwardedValues: {
                  QueryString: false,
                  Cookies: {
                    Forward: 'none',
                  },
                },
                MinTTL: 0,
                AllowedMethods: {
                  Quantity: 2,
                  Items: ['GET', 'HEAD'],
                },
                TrustedSigners: {
                  Enabled: false,
                  Quantity: 0,
                },
              },
            ],
          },
        },
        Tags: {
          Items: [
            {
              Key: 'mediapackage:cloudfront_assoc',
              Value: mediaPackageChannelArn,
            },
          ],
        },
      },
    };
    const {
      Distribution: { Id },
    } = await cloudFront.createDistributionWithTags(cdnParams).promise();
    return Id;
  }

  private async createMediaLiveInput(
    eventId: number,
    stageId: number,
    region: string,
  ) {
    const mediaLive = new AWS.MediaLive({
      region,
    });
    const params = {
      InputSecurityGroups: ['3521646'],
      Name: `event-${eventId}-stage-${stageId}`,
      Type: 'RTMP_PUSH',
      Destinations: [
        {
          StreamName: `${eventId}/${uuid()}`,
        },
      ],
    };
    const {
      Input: { Id: mediaLiveInputId, Destinations, Arn: mediaLiveInputArn },
    } = await mediaLive.createInput(params).promise();
    const lastIndexOfSlashBar = Destinations[0].Url.lastIndexOf('/');
    return {
      mediaLiveInputArn,
      mediaLiveInputId,
      streamUrl: Destinations[0].Url.substring(0, lastIndexOfSlashBar),
      streamKey: Destinations[0].Url.substring(
        lastIndexOfSlashBar + 1,
        Destinations[0].Url.length,
      ),
    };
  }

  private async createMediaLiveChannel(
    eventId: number,
    mediaLiveInputId: string,
    mediaLiveInputArn: string,
    mediaPackagePriUser: string,
    mediaPackagePriUrl: string,
    stageId: number,
    region: string,
  ) {
    const mediaLive = new AWS.MediaLive({
      region,
    });
    const params = {
      ChannelClass: 'SINGLE_PIPELINE',
      Destinations: [
        {
          Id: 'destination1',
          Settings: [
            {
              PasswordParam: mediaPackagePriUser,
              Url: mediaPackagePriUrl,
              Username: mediaPackagePriUser,
            },
          ],
        },
      ],
      InputSpecification: {
        Codec: 'AVC',
        Resolution: 'HD',
        MaximumBitrate: 'MAX_20_MBPS',
      },
      Name: `event-${eventId}-stage-${stageId}`,
      RoleArn: 'arn:aws:iam::141803952892:role/MediaLiveAccessRole',
      InputAttachments: [
        {
          InputId: mediaLiveInputId,
          InputSettings: {},
        },
      ],
      EncoderSettings: encode1080p,
      Tags: {
        MediaLiveInputAssoc: mediaLiveInputArn,
        Event: `event-${eventId}`,
      },
    };
    const {
      Channel: { Id },
    } = await mediaLive.createChannel(params).promise();
    return Id;
  }

  async startMediaLiveChannel(mediaLiveChannelId: string, region: string) {
    const mediaLive = new AWS.MediaLive({
      region,
    });
    const params = {
      ChannelId: mediaLiveChannelId,
    };

    await mediaLive.startChannel(params).promise();
  }

  async stopMediaLiveChannel(mediaLiveChannelId: string, region: string) {
    const mediaLive = new AWS.MediaLive({
      region,
    });
    const params = {
      ChannelId: mediaLiveChannelId,
    };
    await mediaLive.stopChannel(params).promise();
  }

  private async deleteMediaLiveChannel(
    mediaLiveChannelId: string,
    region: string,
  ) {
    const mediaLive = new AWS.MediaLive({
      region,
    });
    const { State }: any = await mediaLive
      .describeChannel({ ChannelId: mediaLiveChannelId })
      .promise();
    const isRunning = State === 'RUNNING' || State === 'STARTING';
    isRunning
      ? await this.stopMediaLiveChannel(mediaLiveChannelId, region)
      : null;
    isRunning &&
      (await mediaLive
        .waitFor('channelStopped', { ChannelId: mediaLiveChannelId })
        .promise());
    const params = {
      ChannelId: mediaLiveChannelId,
    };
    await mediaLive.deleteChannel(params).promise();
  }

  private async deleteMediaPackageChannel(eventId: number, region: string) {
    const mediaPackage = new AWS.MediaPackage({
      region,
    });
    const params = {
      Id: `event-${eventId}`,
    };
    await mediaPackage.deleteChannel(params).promise();
  }

  private async deleteMediaLiveInput(mediaLiveInputId: string, region: string) {
    const mediaLive = new AWS.MediaLive({
      region,
    });
    const params = {
      InputId: mediaLiveInputId,
    };
    await mediaLive.deleteInput(params).promise();
  }

  private async deleteCloudFrontDistribution(
    distributionId: string,
    region: string,
  ) {
    const cloudFront = new AWS.CloudFront({ region, apiVersion: '2020-05-31' });
    const params = {
      Id: distributionId,
    };
    await cloudFront.deleteDistribution(params).promise();
  }

  private async deleteMediaPackageEndpoint(eventId: number, region: string) {
    const mediaPackage = new AWS.MediaPackage({ region });
    const params = {
      Id: `event-${eventId}-hls`,
    };
    await mediaPackage.deleteOriginEndpoint(params).promise();
  }

  private async disableDistribution(distributionId: string, region: string) {
    const cloudFront = new AWS.CloudFront({ region, apiVersion: '2020-05-31' });
    const params: any = await cloudFront
      .getDistributionConfig({ Id: distributionId })
      .promise();
    params.Id = distributionId;
    params.IfMatch = params.ETag;
    delete params.ETag;
    params.DistributionConfig.Enabled = false;
    await cloudFront.updateDistribution(params).promise();
  }

  async destroyInfra(
    eventId: number,
    mediaLiveChannelId: string,
    distributionId: string,
    region: string,
  ) {
    await this.deleteMediaLiveChannel(mediaLiveChannelId, region);
    await this.deleteMediaPackageEndpoint(eventId, region);
    await this.deleteMediaPackageChannel(eventId, region);
    await this.disableDistribution(distributionId, region);
  }

  async deleteCDNDistributionAndMediaLiveInput(
    mediaLiveInputId: string,
    distributionId: string,
    region: string,
  ) {
    await this.deleteMediaLiveInput(mediaLiveInputId, region);
    await this.deleteCloudFrontDistribution(distributionId, region);
  }
}
