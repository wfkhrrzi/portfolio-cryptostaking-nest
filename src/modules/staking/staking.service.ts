import abiCryptostaking from '@/interfaces/abi-cryptostaking';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { CacheRedis } from 'cache-manager';
import { flatMap, map, partition } from 'lodash';
import { ILike, IsNull, Not, Repository } from 'typeorm';
import { ContractEventName, Hex, decodeAbiParameters } from 'viem';
import { UserRegisterDto } from '../auth-siwe/dto/user-register.dto';
import { TokenEntity } from '../token/token.entity';
import { UserEntity } from '../user-v2/user.entity';
import { ViemService } from '../viem/viem.service';
import { StakeDto } from './dtos/stake.dto';
import { StakeEntity } from './entities/stake.entity';
import { WithdrawalEntity } from './entities/withdrawal.entity';

@Injectable()
export class StakingService implements OnApplicationBootstrap {
  private logger = new Logger('StakingService');

  constructor(
    @InjectRepository(StakeEntity)
    private stakeRepository: Repository<StakeEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(TokenEntity)
    private tokenRepository: Repository<TokenEntity>,
    @InjectRepository(WithdrawalEntity)
    private withdrawalRepository: Repository<WithdrawalEntity>,
    @Inject(CACHE_MANAGER) private cacheManager: CacheRedis,
    private viemService: ViemService,
  ) {}

  async onApplicationBootstrap() {
    // get all tokens
    const tokens = await this.tokenRepository.find({
      relations: {
        chain: true,
      },
    });

    // set currentBlockNumber for all registered tokens
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      await this.setCacheReadBlockNumber(
        token,
        await this.viemService
          .getPublicClient(token.chain.chain_id)
          .getBlockNumber(),
      );
    }

    this.logger.log('Redis currentBlockNumber is set up.');
  }

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

  async validateTxBlockConfirmation<T extends Hex[] | Hex>(
    txHash: T,
    chainId: number,
  ): Promise<T extends Hex[] ? boolean[] : boolean> {
    // convert to hash
    const _inputArray = Array.isArray(txHash);
    const _txHash: Hex[] = _inputArray ? txHash : [txHash];

    // confirm block
    const client = this.viemService.getPublicClient(chainId);

    const result = map(
      await Promise.all(
        _txHash.map((hash) => client.getTransactionConfirmations({ hash })),
      ),
      (result) => result >= 12n, // 12 or more block confirmations
    );

    // return booleans result
    return (_inputArray ? result : result[0]) as T extends Hex[]
      ? boolean[]
      : boolean;
  }

  private _calcReward(
    startTime: Date,
    endTime: Date,
    rewardRatePerSecond: number,
    tokenDecimal: number,
  ): bigint {
    // return 0 if start time > end time
    if (startTime.getTime() > endTime.getTime()) {
      return 0n;
    }

    // calc duration
    const duration = Math.floor(
      (endTime.getTime() - startTime.getTime()) * 1000,
    );

    // calc reward
    const reward = rewardRatePerSecond * duration; // reward for that duration

    const adjustedReward = BigInt(Math.floor(reward * 10 ** tokenDecimal));

    return adjustedReward; // adjusted reward
  }

  async getCacheReadBlockNumber(token: TokenEntity): Promise<bigint> {
    return BigInt(
      (await this.cacheManager.get(
        `stakeReader_currentBlockNumber_${token.id}`,
      )) || 0n,
    );
  }

  async setCacheReadBlockNumber(
    token: TokenEntity,
    latestBlockNumber: bigint,
  ): Promise<void> {
    await this.cacheManager.set(
      `stakeReader_currentBlockNumber_${token.id}`,
      (latestBlockNumber + 1n).toString(),
    );
  }

  @Cron('*/13 * * * * *') // every 15 seconds
  //   @ts-ignore
  private async validateBlockConfirmationReader() {
    this.logger.verbose(
      'started `validateBlockConfirmationReader` cron job...',
    );

    // fetch all tokens
    const tokens = await this.tokenRepository.find({
      relations: {
        chain: true,
      },
    });

    const stakesToSave: StakeEntity[] = [];
    const withdrawalsToSave: WithdrawalEntity[] = [];

    await Promise.all(
      tokens.map(async (token) => {
        // fetch pending transactions
        const stakes = await this.stakeRepository.find({
          select: {
            id: true,
            tx_hash: true,
          },
          where: {
            is_confirmed: false,
            is_active: true,
            tx_hash: Not(IsNull()),
          },
        });
        const withdrawals = await this.withdrawalRepository.find({
          where: { is_confirmed: false, tx_hash: Not(IsNull()) },
          select: {
            id: true,
            tx_hash: true,
          },
        });

        // exit if no tx
        const tx = [
          ...map(stakes, (stake) => stake.tx_hash),
          ...map(withdrawals, (withdrawal) => withdrawal.tx_hash),
        ];

        if (!tx) return;

        //   validate tx
        const results = await this.validateTxBlockConfirmation(
          tx,
          token.chain.chain_id,
        );

        //   push rows
        stakesToSave.push(
          ...results
            .slice(0, stakes.length)
            .map((is_confirmed, i) =>
              this.stakeRepository.merge(stakes[i], { is_confirmed }),
            ),
        );

        withdrawalsToSave.push(
          ...results
            .slice(stakes.length)
            .map((is_confirmed, i) =>
              this.withdrawalRepository.merge(withdrawals[i], { is_confirmed }),
            ),
        );
      }),
    );

    // save into db
    if (stakesToSave) await this.stakeRepository.save(stakesToSave);
    if (withdrawalsToSave)
      await this.withdrawalRepository.save(withdrawalsToSave);

    this.logger.log('`validateBlockConfirmationReader` cron job ended.');
  }

  @Cron(CronExpression.EVERY_30_SECONDS, {
    timeZone: 'Asia/Kuala_Lumpur',
  })
  // @ts-ignore
  private async txReader(): Promise<void> {
    this.logger.verbose('started `txReader` cron job...');

    try {
      const stakes: StakeEntity[] = [];
      const withdrawals: WithdrawalEntity[] = [];

      // fetch all tokens' contract address
      const tokens = await this.tokenRepository.find({
        relations: {
          chain: true,
        },
      });

      if (!tokens) return;

      // extract transactions for all tokens registered in the platform
      await Promise.all(
        tokens.map(async (token) => {
          // init
          const client = this.viemService.getPublicClient(token.chain.chain_id);

          // get range of blocks to read from
          const latestBlock: bigint = await client.getBlockNumber();
          const currentReadBlock: bigint =
            (await this.getCacheReadBlockNumber(token)) || latestBlock;

          // fetch USDT rewards rate per second
          const rewardRatePerSecond: number =
            token.reward_rate_per_second ??
            this.calcRewardRatePerSecond(token.stake_APR);

          // extract logs containing all ops
          // segregate StakeUSDT & Withdrawal Events
          const [stakeLogs, withdrawalLogs] = partition(
            flatMap(
              await Promise.all(
                (
                  [
                    'StakeUSDT',
                    'UnstakeUSDT',
                    'ClaimUSDTReward',
                  ] as ContractEventName<typeof abiCryptostaking>[]
                ).map((eventName) =>
                  client.getContractEvents({
                    abi: abiCryptostaking,
                    address: '0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0',
                    fromBlock: currentReadBlock,
                    toBlock: latestBlock,
                    eventName,
                  }),
                ),
              ),
            ),
            (log) => log.eventName == 'StakeUSDT',
          );

          // fetch blocks for stakeLogs (to get block timestamp)
          const blocks = await Promise.all(
            [
              ...new Set(
                [...stakeLogs, ...withdrawalLogs].map((log) => log.blockHash),
              ),
            ].map((blockHash) => client.getBlock({ blockHash })),
          );

          if (!blocks) throw new Error('blocks == null');

          // fetch tx confirmation for stakeLogs
          const stakeLogs_txConfirmation =
            await this.validateTxBlockConfirmation(
              map(stakeLogs, (log) => log.transactionHash),
              token.chain.chain_id,
            );

          // === handle StakeUSDT Event ===
          await Promise.all(
            map(stakeLogs, async (log, i) => {
              // get timestamp
              const txTime: Date = new Date(
                Number(
                  blocks.find((block) => block.hash === log.blockHash)!
                    .timestamp,
                ) * 1000,
              );

              // get user
              let user = await this.userRepository.findOne({
                where: {
                  wallet_address: log.args.from,
                },
              });

              // create user if not existed
              if (!user) {
                user = this.userRepository.create({
                  wallet_address: log.args.from,
                } as UserRegisterDto);
              }

              // calculate current reward from initial staking time
              const reward: bigint = this._calcReward(
                txTime,
                new Date(),
                rewardRatePerSecond,
                token.decimals,
              );

              // push stakes data
              stakes.push(
                this.stakeRepository.create({
                  principal: log.args.amount,
                  tx_hash: log.transactionHash,
                  is_confirmed: stakeLogs_txConfirmation[i],
                  total_reward: reward, // calculated reward
                  reward_updated_at: txTime,
                  user,
                  token,
                }),
              );
            }),
          );

          //   fetch tx for withdrawal logs (to get signature from contract call)
          const withdrawalLogs_txInfo = flatMap(
            await Promise.all(
              withdrawalLogs.map((log) =>
                client.getTransaction({ hash: log.transactionHash }),
              ),
            ),
          );

          // fetch tx confirmation for stakeLogs
          const withdrawalLogs_txConfirmation =
            await this.validateTxBlockConfirmation(
              map(withdrawalLogs, (log) => log.transactionHash),
              token.chain.chain_id,
            );

          // === handle Withdrawal Events (UnstakeUSDT & ClaimReward) ===
          await Promise.all(
            map(withdrawalLogs, async (log, i) => {
              // decode withdrawal params
              const withdrawal_params = decodeAbiParameters(
                abiCryptostaking['17'].inputs,
                withdrawalLogs_txInfo[i].input,
              );

              // get tx row by signature
              let withdrawal: WithdrawalEntity =
                (await this.withdrawalRepository.findOne({
                  where: {
                    signature: ILike(withdrawal_params[0]),
                  },
                }))!;

              // create withdrawal if inexist (IMPOSSIBLE because the row should already exist when the signature is generated)

              // insert/update tx fulfilled tx
              this.withdrawalRepository.merge(withdrawal, {
                tx_hash: log.transactionHash,
                is_confirmed: withdrawalLogs_txConfirmation[i], //FIXME need to do block confirmations
              });

              withdrawals.push(withdrawal);

              // update rewards / principal in stakes
              const stake = withdrawal.stake!;

              switch (log.eventName) {
                case 'UnstakeUSDT':
                  // unstake usdt only(?)
                  stake.principal -= withdrawal.amount;
                  break;

                case 'ClaimUSDTReward':
                  stake.claimed_reward += withdrawal.amount;
                  break;
              }

              if (
                stake.claimed_reward == stake.total_reward &&
                stake.principal == 0n
              ) {
                stake.is_active = false;
              }

              //   update stake
              stakes.push(stake);
            }),
          );

          // save latestBlockNumber into Redis
          await this.setCacheReadBlockNumber(token, latestBlock);
        }),
      );

      // save stakes into db
      if (stakes.length > 0) {
        await this.stakeRepository.save(stakes);
      }
    } catch (error) {
      this.logger.error('Error inside the service!');
      //   @ts-ignore
      //   this.logger.error(error.message);
    }

    this.logger.log('`txReader` cron job ended.');
  }
}
