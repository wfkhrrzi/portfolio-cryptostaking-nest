import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenEntity } from '../token/token.entity';
import { StakeEntity } from './entities/stake.entity';
import { StakingController } from './staking.controller';
import { StakingService } from './staking.service';
import { UserEntity } from '../user-v2/user.entity';
import { WithdrawalEntity } from './entities/withdrawal.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([StakeEntity, TokenEntity, UserEntity, WithdrawalEntity]),
  ],
  controllers: [StakingController],
  providers: [StakingService],
})
export class StakingModule {}
