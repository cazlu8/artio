import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseModule } from '../../shared/modules/base.module';
import { CardWalletController } from './cardWallet.controller';
import { CardWalletRepository } from './cardWallet.repository';
import { UserRepository } from '../user/user.repository';

@Module({
  imports: [
    BaseModule,
    TypeOrmModule.forFeature([CardWalletRepository, UserRepository]),
  ],
  controllers: [CardWalletController],
})
export class CardWalletModule {}
