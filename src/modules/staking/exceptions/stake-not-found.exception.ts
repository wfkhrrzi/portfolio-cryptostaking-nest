import { NotFoundException } from '@nestjs/common';

export class StakeNotFoundException extends NotFoundException {
  constructor(error?: string) {
    super('error.stakeNotFound', error);
  }
}
