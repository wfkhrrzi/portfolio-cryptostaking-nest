import { AbstractDto } from '@/common/dto/abstract.dto';
import { DateFieldOptional, StringField } from '@/decorators';
import { ApiProperty } from '@nestjs/swagger';
import { Hex } from 'viem';
import { StakeEntity } from '../entities/stake.entity';

export class StakeDto extends AbstractDto {
  @StringField({ maxLength: 66, minLength: 66 })
  tx_hash: Hex;

  @ApiProperty()
  initial_principal: bigint;

  @ApiProperty()
  principal: bigint;

  @DateFieldOptional()
  principal_updated_at: Date;

  @ApiProperty()
  total_reward: bigint;

  @ApiProperty()
  claimed_reward: bigint;

  @DateFieldOptional()
  reward_updated_at: Date;

  constructor(stake: StakeEntity) {
    super(stake);

    this.tx_hash = stake.tx_hash;
    this.initial_principal = stake.initial_principal;
    this.principal = stake.principal;
    this.principal_updated_at = stake.principal_updated_at;
    this.total_reward = stake.total_reward;
    this.claimed_reward = stake.claimed_reward;
    this.reward_updated_at = stake.reward_updated_at;
  }
}
