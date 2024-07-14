import { NotFoundException } from '@nestjs/common';

export class WithdrawalNotFoundException extends NotFoundException {
  constructor(error?: string) {
    super('error.withdrawalNotFound', error);
  }
}
