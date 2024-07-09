import { Column, Entity, OneToMany } from 'typeorm';

import { AbstractEntity } from '@/common/abstract.entity';
import { RoleType } from '@/constants';
import { UseDto } from '@/decorators';
import { Address } from 'viem';
import { PostEntity } from '../post/post.entity';
import { StakeEntity } from '../staking/entities/stake.entity';
import { UserDto, type UserDtoOptions } from './dtos/user.dto';

@Entity({ name: 'users' })
@UseDto(UserDto)
export class UserEntity extends AbstractEntity<UserDto, UserDtoOptions> {
  @Column({ type: 'varchar', length: 100 })
  wallet_address!: Address;

  @Column({ type: 'enum', enum: RoleType, default: RoleType.USER })
  role!: RoleType;

  @OneToMany(() => PostEntity, (postEntity) => postEntity.user)
  posts?: PostEntity[];

  @OneToMany(() => StakeEntity, (stakesEntity) => stakesEntity.user)
  stakes?: StakeEntity[];
}
