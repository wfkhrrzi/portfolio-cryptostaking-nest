import { AbstractDto } from '@/common/dto/abstract.dto';
import { BigintField, DateFieldOptional, StringField } from '@/decorators';
import { Hex } from 'viem';
import { StakeEntity } from '../entities/stake.entity';

export class StakeDto extends AbstractDto {
  @StringField({ maxLength: 66, minLength: 66 })
  tx_hash: Hex;

  @BigintField()
  principal: bigint;

  @BigintField()
  total_reward: bigint;

  @BigintField()
  claimed_reward: bigint;

  @DateFieldOptional()
  reward_updated_at: Date;

  constructor(stake: StakeEntity) {
    super(stake);

    this.tx_hash = stake.tx_hash;
    this.principal = stake.principal;
    this.total_reward = stake.total_reward;
    this.claimed_reward = stake.claimed_reward;
    this.reward_updated_at = stake.reward_updated_at;
  }
}
