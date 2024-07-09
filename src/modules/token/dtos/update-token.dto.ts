import { NumberFieldOptional, StringFieldOptional } from '@/decorators';
import { Address } from 'viem';

export class UpdateTokenDto {
  @StringFieldOptional({ maxLength: 50 })
  name?: string;

  @StringFieldOptional({ maxLength: 5 })
  symbol?: string;

  @StringFieldOptional({ minLength: 42, maxLength: 42 })
  contract_address?: Address;

  @NumberFieldOptional()
  stake_APR?: number;
}
