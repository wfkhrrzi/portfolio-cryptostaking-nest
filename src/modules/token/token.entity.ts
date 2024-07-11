import { AbstractEntity } from '@/common/abstract.entity';
import { UseDto } from '@/decorators';
import { Column, Entity, OneToMany } from 'typeorm';
import { Address } from 'viem';
import { StakeEntity } from '../staking/entities/stake.entity';
import { TokenDto } from './dtos/token.dto';

@Entity({ name: 'tokens' })
@UseDto(TokenDto)
export class TokenEntity extends AbstractEntity<TokenDto> {
  @Column({ length: 10 })
  name!: string;

  @Column({ length: 10 })
  symbol!: string;

  @Column()
  decimals!: number; // whole number e.g. 3 (3%)

  @Column({ length: 100 })
  contract_address!: Address;

  @Column()
  stake_APR!: number; // whole number e.g. 3 (3%)

  @Column({ nullable: true })
  reward_rate_per_second?: number; // floating-point value

  @OneToMany(() => StakeEntity, (stakesEntity) => stakesEntity.token)
  stakes!: StakeEntity;
}
