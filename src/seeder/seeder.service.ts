import { TokenService } from '@/modules/token/token.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SeederService {
  constructor(private tokenService: TokenService) {}

  /**
   * Single entrypoint for seeding run by main app. Include all seed handlers in this function
   */
  async run() {
    await this.tokenSeeder();
  }

  private async tokenSeeder() {
    // seed 'usdt' token
    await this.tokenService.create({
      contract_address: '0x281164a08efe10445772B26D2154fd6F4b90Fc08',
      stake_APR: 3,
    });
  }
}
