import { BadRequestException } from '@nestjs/common';

export class TransactionNotConfirmedException extends BadRequestException {
  constructor(error?: string) {
    super('error.transactionNotConfirmed', error);
  }
}
