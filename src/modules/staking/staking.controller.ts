import { PageDto } from '@/common/dto/page.dto';
import { RoleType } from '@/constants';
import { Auth, AuthUser } from '@/decorators';
import { ApiOkResponse } from '@/decorators/api-ok-response.decorator';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserEntity } from '../user-v2/user.entity';
import { CreateStakeDto } from './dtos/create-stake.dto';
import { CreateWithdrawalDto } from './dtos/create-withdrawal.dto';
import { StakeDto } from './dtos/stake.dto';
import { StakesPageOptionsDto } from './dtos/stakes-page-options.dto';
import { UpdateWithdrawalDto } from './dtos/update-withdrawal.dto';
import { WithdrawalDto } from './dtos/withdrawal.dto';
import { StakingService } from './staking.service';

@Controller('staking')
@ApiTags('staking')
export class StakingController {
  constructor(private stakingService: StakingService) {}

  @Get('stake')
  @Auth([RoleType.USER])
  async getStakes(
    @Query(new ValidationPipe({ transform: true }))
    pageOptionsDto: StakesPageOptionsDto,
  ): Promise<PageDto<StakeDto>> {
    return this.stakingService.findStakes(pageOptionsDto);
  }

  @Post('requestWithdrawal')
  @Auth([RoleType.USER])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: WithdrawalDto })
  async requestWithdrawal(
    @Body() param: CreateWithdrawalDto,
  ): Promise<WithdrawalDto> {
    // create withdrawal
    const withdrawal = await this.stakingService.createWithdrawal(param);

    // return payload
    return withdrawal;
  }

  @Post('stake')
  @Auth([RoleType.USER])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: StakeDto })
  async stake(
    @Body() param: CreateStakeDto,
    @AuthUser() user: UserEntity,
  ): Promise<StakeDto> {
    // create withdrawal
    const stake = await this.stakingService.createStake(param, user);

    // return payload
    return stake;
  }

  @Post('withdraw')
  @Auth([RoleType.USER])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: WithdrawalDto, description: 'Update withdrawal' })
  async withdraw(
    @Body() updateWithdrawalDto: UpdateWithdrawalDto,
  ): Promise<WithdrawalDto> {
    // update withdrawal
    const updatedWithdrawal =
      await this.stakingService.updateWithdrawal(updateWithdrawalDto);

    // return payload
    return updatedWithdrawal;
  }
}
