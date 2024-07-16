import { BadRequestException } from '@nestjs/common';

export class WithdrawalInvalidParamException extends BadRequestException {
  constructor(error?: string) {
    super('error.withdrawalInvalidParam', error);
  }
}
