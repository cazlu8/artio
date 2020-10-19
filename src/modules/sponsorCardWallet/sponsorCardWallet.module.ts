import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseModule } from '../../shared/modules/base.module';
import { SponsorCardWalletRepository } from './sponsorCardWallet.repository';
import { SponsorCardWalletController } from './sponsorCardWallet.controller';
import { UserRepository } from '../user/user.repository';

@Module({
  imports: [
    BaseModule,
    TypeOrmModule.forFeature([SponsorCardWalletRepository, UserRepository]),
  ],
  controllers: [SponsorCardWalletController],
})
export class SponsorCardWalletModule {}
