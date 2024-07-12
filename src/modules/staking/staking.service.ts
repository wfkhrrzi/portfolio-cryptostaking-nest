import abiCryptostaking from '@/interfaces/abi-cryptostaking';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { CacheRedis } from 'cache-manager';
import { Repository } from 'typeorm';
import { bsc } from 'viem/chains';
import { TokenEntity } from '../token/token.entity';
import { UserEntity } from '../user-v2/user.entity';
import { ViemService } from '../viem/viem.service';
import { StakeDto } from './dtos/stake.dto';
import { StakeEntity } from './entities/stake.entity';

@Injectable()
export class StakingService {
  constructor(
    @InjectRepository(StakeEntity)
    private stakeRepository: Repository<StakeEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(TokenEntity)
    private tokenRepository: Repository<TokenEntity>,
    @Inject(CACHE_MANAGER) private cacheManager: CacheRedis,
    private viemService: ViemService,
  ) {}

  async createStake(createStake: StakeDto) {
    // insert into db
    const stake = this.stakeRepository.create(createStake);

    this.stakeRepository.save(stake);
  }

  async createUnstake() {}
  async createClaimReward() {}

  calcRewardRatePerSecond(percent: number): number {
    return percent / 100 / (365 * 24 * 60 * 60); // USDT etc.
  }

  private _calcReward(
    startTime: Date,
    endTime: Date,
    rewardRatePerSecond: number,
    tokenDecimal: number,
  ): bigint {
    // duration
    const duration = Math.floor(
      (endTime.getTime() - startTime.getTime()) * 1000,
    );

    const reward = rewardRatePerSecond * duration; // reward for that duration

    return BigInt(Math.floor(reward * 10 ** tokenDecimal)); // adjusted reward
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  // @ts-ignore
  private async reader(): Promise<void> {
    console.log('started cron job...');

    const stakes: StakeEntity[] = [];

    // fetch all tokens' contract address
    const tokens = await this.tokenRepository.find();

    if (!tokens) return;

    // extract transactions
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      // init
      const key$currentReadBlock = `stakeReader_currentBlockNumber_${token.id}`;
      const client = this.viemService.getPublicClient(bsc.id);

      // get range of blocks to read from
      const latestBlock: bigint = await client.getBlockNumber();
      const currentReadBlock: bigint = BigInt(
        (await this.cacheManager.get(key$currentReadBlock)) || latestBlock,
      );

      // fetch USDT rewards rate per second
      const rewardRatePerSecond: number =
        token.reward_rate_per_second ??
        this.calcRewardRatePerSecond(token.stake_APR);

      // read tx
      const logs = await client.getContractEvents({
        abi: abiCryptostaking,
        address: token.contract_address,
        fromBlock: currentReadBlock,
        toBlock: latestBlock,
        eventName: 'StakeUSDT',
      });

      // parse stakes
      logs.map(async (log) => {
        // get transaction receipt
        const txTime = (
          await client.getBlock({
            blockHash: log.blockHash,
            includeTransactions: false,
          })
        ).timestamp;

        // get user
        const user = await this.userRepository.findOne({
          where: {
            wallet_address: log.args.from,
          },
        });

        // create user if not existed
        if (!user)
          await this.userRepository.save({ wallet_address: log.args.from });

        // calculate current reward from initial staking time
        const reward: bigint = this._calcReward(
          new Date(Number(txTime) * 1000),
          new Date(),
          rewardRatePerSecond,
          token.decimals,
        );

        // push stakes data
        stakes.push(
          this.stakeRepository.create({
            principal: log.args.amount,
            tx_hash: log.transactionHash,
            claimed_reward: reward, // calculated reward
          }),
        );
      });

      // save latestBlockNumber into Redis
      await this.cacheManager.set(
        key$currentReadBlock,
        (latestBlock + 1n).toString(),
      );
    }

    // save stakes into db
    if (stakes.length > 0) {
      await this.stakeRepository.save(stakes);
    }

    console.log('ended cron job...');
  }
}
