import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseModule } from '../../shared/modules/base.module';
import { CardWalletController } from './cardWallet.controller';
import { CardWalletRepository } from './cardWallet.repository';
import { UserRepository } from '../user/user.repository';
import { CardWalletGateway } from './cardWallet.gateway';
import { JwtService } from '../../shared/services/jwt.service';
import { CardWalletService } from './cardWallet.service';

@Module({
  imports: [
    BaseModule,
    TypeOrmModule.forFeature([CardWalletRepository, UserRepository]),
  ],
  controllers: [CardWalletController],
  providers: [JwtService, CardWalletGateway, CardWalletService],
})
export class CardWalletModule {}
