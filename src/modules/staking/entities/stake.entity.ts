import { AbstractEntity } from '@/common/abstract.entity';
import { UseDto } from '@/decorators';
import { TokenEntity } from '@/modules/token/token.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { Hex } from 'viem';
import { StakeDto } from '../dtos/stake.dto';
import { WithdrawalEntity } from './withdrawal.entity';
import { UserEntity } from '@/modules/user-v2/user.entity';

@Entity({ name: 'stakes' })
@UseDto(StakeDto)
export class StakeEntity extends AbstractEntity<StakeDto> {
  @Column({ type: 'varchar', length: '100', unique: true })
  tx_hash!: Hex;

  @Column({ default: true })
  is_active!: boolean;

  @Column({ type: 'bigint' })
  initial_principal!: bigint;

  @Column({ type: 'bigint' })
  principal!: bigint;

  @Column({ type: 'timestamp without time zone', default: 'now()' })
  principal_updated_at!: Date;

  @Column({ type: 'bigint' })
  total_reward!: bigint;

  @Column({ type: 'bigint' })
  claimed_reward!: bigint;

  @Column({ type: 'timestamp without time zone', default: 'now()' })
  reward_updated_at!: Date;

  @ManyToOne(() => UserEntity, (userEntity) => userEntity.stakes)
  user?: UserEntity;

  @ManyToOne(() => TokenEntity, (tokenEntity) => tokenEntity.stakes)
  token?: TokenEntity;

  @OneToMany(
    () => WithdrawalEntity,
    (withdrawalEntity) => withdrawalEntity.stake,
  )
  withdrawals?: WithdrawalEntity;
}
