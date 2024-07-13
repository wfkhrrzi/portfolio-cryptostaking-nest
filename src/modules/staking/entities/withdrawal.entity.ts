import { AbstractEntity } from '@/common/abstract.entity';
import { UseDto } from '@/decorators';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Hex } from 'viem';
import { WithdrawalDto } from '../dtos/withdrawal.dto';
import { WithdrawalType } from '../enums/withdrawal-type';
import { StakeEntity } from './stake.entity';

@Entity({ name: 'withdrawals' })
@UseDto(WithdrawalDto)
export class WithdrawalEntity extends AbstractEntity<WithdrawalDto> {
  @Column({ type: 'varchar', length: '100', unique: true, nullable: true })
  tx_hash!: Hex;

  @Column({ default: false })
  is_confirmed!: boolean;

  @Column({ type: 'bigint' })
  amount!: bigint;

  @Column({ type: 'enum', enum: WithdrawalType })
  type!: WithdrawalType;

  @Column({ type: 'varchar', length: '100', unique: true })
  signature!: Hex;

  @Column({ type: 'varchar', length: '100', nullable: true })
  signature_hash!: Hex;

  @Column({ type: 'varchar', nullable: true })
  signature_message!: string;

  @ManyToOne(() => StakeEntity, (stakesEntity) => stakesEntity.withdrawals)
  stake?: StakeEntity;
}
