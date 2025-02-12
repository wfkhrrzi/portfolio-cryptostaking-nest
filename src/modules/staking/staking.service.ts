import { PageDto } from '@/common/dto/page.dto';
import abiCryptostaking from '@/interfaces/abi-cryptostaking';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { CacheRedis } from 'cache-manager';
import { plainToInstance } from 'class-transformer';
import { flatMap, map, partition } from 'lodash';
import { ILike, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import {
  ContractEventName,
  GetContractEventsReturnType,
  Hex,
  PublicClient,
  TransactionReceipt,
  decodeEventLog,
  decodeFunctionData,
} from 'viem';
import { UserRegisterDto } from '../auth-siwe/dto/user-register.dto';
import { TokenNotFoundException } from '../token/exceptions/token-not-found.exception';
import { TokenEntity } from '../token/token.entity';
import { UserEntity } from '../user-v2/user.entity';
import { ViemService } from '../viem/viem.service';
import { CreateStakeDto } from './dtos/create-stake.dto';
import { CreateWithdrawalDto } from './dtos/create-withdrawal.dto';
import { StakeDto } from './dtos/stake.dto';
import { StakesPageOptionsDto } from './dtos/stakes-page-options.dto';
import { UpdateWithdrawalDto } from './dtos/update-withdrawal.dto';
import { WithdrawalDto } from './dtos/withdrawal.dto';
import { StakeEntity } from './entities/stake.entity';
import { WithdrawalEntity } from './entities/withdrawal.entity';
import { WithdrawalType } from './enums/withdrawal-type';
import { StakeNotFoundException } from './exceptions/stake-not-found.exception';
import { TransactionNotConfirmedException } from './exceptions/stake-not-found.exception copy';
import { WithdrawalInvalidParamException } from './exceptions/withdrawal-invalid-param.exception';
import { WithdrawalNotFoundException } from './exceptions/withdrawal-not-found.exception';

@Injectable()
export class StakingService implements OnApplicationBootstrap {
  private num_block_confirmations = 6;

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

  async findStakes(
    pageOptionsDto: StakesPageOptionsDto,
  ): Promise<PageDto<StakeDto>> {
    const queryBuilder = this.stakeRepository.createQueryBuilder('stake');
    const [items, pageMetaDto] = await queryBuilder.paginate(pageOptionsDto);

    return items.toPageDto(pageMetaDto);
  }

  async findStake(stakeId: Uuid): Promise<StakeDto> {
    const stake = await this.stakeRepository.findOneBy({ id: stakeId });

    if (!stake) {
      throw new StakeNotFoundException();
    }

    return stake.toDto();
  }

  @Transactional()
  async createStake(
    createStakeDto: CreateStakeDto,
    user: UserEntity,
  ): Promise<StakeDto> {
    // get token
    const token = await this.tokenRepository.findOne({
      where: { id: createStakeDto.token_id },
      relations: {
        chain: true,
      },
    });

    if (!token)
      throw new TokenNotFoundException(
        `token_id ${createStakeDto.token_id} is invalid.`,
      );

    const client = this.viemService.getPublicClient(token.chain.chain_id);

    // validate tx confirmation
    if (
      !(await this._validateTxBlockConfirmation(createStakeDto.tx_hash, client))
    ) {
      throw new TransactionNotConfirmedException();
    }

    // get tx log
    let txReceipt: TransactionReceipt;
    try {
      txReceipt = await client.getTransactionReceipt({
        hash: createStakeDto.tx_hash,
      });
    } catch (error) {
      // FIXME format this error
      throw new Error(
        `Transaction by tx_hash ${createStakeDto.tx_hash} is not found`,
      );
    }

    const log = txReceipt.logs
      .map((log) =>
        decodeEventLog({
          abi: abiCryptostaking,
          topics: log.topics,
          data: log.data,
        }),
      )
      .filter((event) => event.eventName == 'StakeUSDT')[0];

    // get tx time
    const txTime = new Date(
      Number(
        (await client.getBlock({ blockHash: txReceipt.blockHash })).timestamp,
      ) * 1000,
    );

    // create & save stake to db
    const stake = await this._createStake(
      user,
      token,
      {
        transactionHash: createStakeDto.tx_hash,
        args: log.args,
        txTime,
      },
      true,
    );

    return stake.toDto();
  }

  /**
   * - Calculate reward between the interval of start & current time
   * - Create & return StakeEntity
   * - Save stake into db, if specified
   * @param user user entity
   * @param token token entity
   * @param log tx log
   * @param saveToDb save to db?
   * @returns {Promise<StakeEntity>} stake entity
   */
  private async _createStake(
    user: UserEntity,
    token: TokenEntity,
    log: Pick<
      GetContractEventsReturnType<typeof abiCryptostaking, 'StakeUSDT'>[0],
      'transactionHash' | 'args'
    > & {
      txTime: Date;
    },
    saveToDb = false,
  ): Promise<StakeEntity> {
    // create stake
    const stake = this.stakeRepository.create({
      principal: log.args.amount,
      tx_hash: log.transactionHash,
      reward_updated_at: log.txTime, // head-point cutoff must be from block.timestamp
      user,
      token,
    });

    // save to db
    if (saveToDb) {
      await this.stakeRepository.save(stake);
    }

    // return stake
    return stake;
  }

  /**
   * - Update rewards & define withdrawal amount
   * - Generate signature for withdrawal operation
   * - Create & save withdrawal into db
   * @param createWithdrawalDto
   * @returns signature & withdrawal
   */
  @Transactional()
  async createWithdrawal(
    createWithdrawalDto: CreateWithdrawalDto,
  ): Promise<WithdrawalDto> {
    // get stake
    const stake = await this.stakeRepository.findOne({
      where: {
        id: createWithdrawalDto.stake_id,
        tx_hash: createWithdrawalDto.stake_tx_hash,
      },
      relations: ['token', 'user', 'token.user', 'token.chain'],
    });

    if (!stake) throw new StakeNotFoundException();

    // define withdrawal amount
    // FIX: if wanna combine unstake w/ claim reward, add another ops and its respective event log in SC &
    // NOTE: currently only one operation at a time. cannot unstake and claim reward at the same time.
    let withdrawalAmount: bigint;

    if (createWithdrawalDto.type === WithdrawalType.CLAIM_REWARD) {
      // update rewards
      const new_rewardUpdatedAt = new Date(); // middle-point cutoff point does not have to be from block.timestamp
      const pending_reward: bigint = this._calcReward(
        stake.principal,
        stake.reward_updated_at,
        new_rewardUpdatedAt,
        stake.token!.reward_rate_per_second!,
        stake.token!.decimals,
      );

      // update total reward in stake and save into db
      this.stakeRepository.merge(stake, {
        reward_updated_at: new_rewardUpdatedAt,
        total_reward: stake.total_reward.toBigInt() + pending_reward,
      });

      await this.stakeRepository.update(stake.id, stake);

      // get total unclaimed reward
      withdrawalAmount =
        stake.total_reward.toBigInt() - stake.claimed_reward.toBigInt();
    } else {
      // get full principal amount
      withdrawalAmount = stake.principal.toBigInt();
    }

    // check for valid amount, if supplied
    if (
      createWithdrawalDto.amount &&
      createWithdrawalDto.amount.toBigInt() > withdrawalAmount
    ) {
      throw new WithdrawalInvalidParamException(
        `Amount supplied [${createWithdrawalDto.amount}] exceeded max amount [${withdrawalAmount}]`,
      );
    }

    // update supplied amount
    withdrawalAmount = createWithdrawalDto.amount
      ? createWithdrawalDto.amount.toBigInt()
      : withdrawalAmount;

    // generate signature
    const client = this.viemService.getWalletClient({
      chainId: stake.token!.chain.chain_id,
      privateKey: stake.token!.user.wallet_key!,
    });

    const signatureTimestamp = Math.floor(Date.now() / 1000);
    const message = `${stake.user!.wallet_address}_${createWithdrawalDto.type === WithdrawalType.UNSTAKE ? 0 : 1}_${withdrawalAmount.toString()}_${signatureTimestamp}`;
    const signature = await client.signMessage({
      message,
    });

    // create withdrawal entity & save into db
    const withdrawal = this.withdrawalRepository.create({
      ...createWithdrawalDto,
      stake,
      signature,
      signature_message: message,
    });

    await this.withdrawalRepository.save(withdrawal);

    // return signature
    return withdrawal.toDto();
  }

  @Transactional()
  async updateWithdrawal(updateWithdrawalDto: UpdateWithdrawalDto) {
    const client = this.viemService.getPublicClient(
      updateWithdrawalDto.chain_id,
    );

    // get tx timestamp
    const txTimestamp = (
      await client.getBlock({
        blockHash: (
          await client.getTransactionReceipt({
            hash: updateWithdrawalDto.tx_hash,
          })
        ).blockHash,
      })
    ).timestamp;

    // validate tx confirmation
    if (
      !(await this._validateTxBlockConfirmation(
        updateWithdrawalDto.tx_hash,
        client,
      ))
    ) {
      throw new TransactionNotConfirmedException();
    }

    // update withdrawal & save into db
    const { stake, withdrawal } = await this._updateWithdrawalAndStake(
      updateWithdrawalDto,
      new Date(Number(txTimestamp) * 1000),
    );

    // save to db
    await this.withdrawalRepository.save(withdrawal);
    await this.stakeRepository.save(stake);

    // return withdrawal
    return withdrawal.toDto();
  }

  private _calcRewardRatePerSecond(percent: number): number {
    return percent / 100 / (365 * 24 * 60 * 60); // USDT etc.
  }

  /**
   * Fetch, update (bout not save in db) & return related withdrawal & stake entity
   * @param updateWithdrawalId withdrawal identification e.g. signature & txHash
   * @param isTxConfirmed withdrawal tx confirmation
   * @returns updated withdrawal and stake
   */
  private async _updateWithdrawalAndStake(
    updateWithdrawalId: Required<
      Pick<UpdateWithdrawalDto, 'signature' | 'tx_hash'>
    >,
    txTimestamp: Date,
  ): Promise<{
    withdrawal: WithdrawalEntity;
    stake: StakeEntity;
  }> {
    // get tx row by signature
    const withdrawal: WithdrawalEntity | null =
      await this.withdrawalRepository.findOne({
        where: {
          signature: ILike(updateWithdrawalId.signature),
        },
        relations: ['stake', 'stake.token'],
      });

    if (!withdrawal) throw new WithdrawalNotFoundException();

    // create withdrawal if inexist (IMPOSSIBLE because the row should already exist when the signature is generated)

    // update withdrawal's tx_hash
    this.withdrawalRepository.merge(withdrawal, {
      tx_hash: updateWithdrawalId.tx_hash,
    });

    // update rewards / principal in stakes
    const stake = withdrawal.stake!;
    const token = stake.token!;

    switch (withdrawal.type) {
      case WithdrawalType.UNSTAKE:
        // calculate current reward
        const reward: bigint = this._calcReward(
          stake.principal,
          stake.reward_updated_at,
          txTimestamp, // tail-point cutoff point must be from block.timestamp
          token.reward_rate_per_second ||
            this._calcRewardRatePerSecond(token.stake_APR),
          token.decimals,
        );

        // unstake usdt
        stake.principal =
          stake.principal.toBigInt() - withdrawal.amount.toBigInt();

        // update reward details
        stake.reward_updated_at = txTimestamp;
        stake.total_reward = stake.total_reward.toBigInt() + reward.toBigInt();

        break;

      case WithdrawalType.CLAIM_REWARD:
        stake.claimed_reward =
          stake.claimed_reward.toBigInt() + withdrawal.amount.toBigInt();
        break;
    }

    if (
      stake.claimed_reward.toBigInt() == stake.total_reward.toBigInt() &&
      stake.principal.toBigInt() == 0n
    ) {
      stake.is_active = false;
    }

    return {
      withdrawal,
      stake,
    };
  }

  /**
   * Validate number of block confirmation
   * @param {Hex} txHash
   * @param {PublicClient | number} option either a public client or chain id
   */
  private async _validateTxBlockConfirmation<T extends Hex[] | Hex>(
    txHash: T,
    client: PublicClient,
  ): Promise<T extends Hex[] ? boolean[] : boolean>;
  private async _validateTxBlockConfirmation<T extends Hex[] | Hex>(
    txHash: T,
    chainId: number,
  ): Promise<T extends Hex[] ? boolean[] : boolean>;
  private async _validateTxBlockConfirmation<T extends Hex[] | Hex>(
    txHash: T,
    option: PublicClient | number,
  ): Promise<T extends Hex[] ? boolean[] : boolean> {
    // convert to hash
    const _inputArray = Array.isArray(txHash);
    const _txHash: Hex[] = _inputArray ? txHash : [txHash];

    // confirm block
    let client: PublicClient;
    if (typeof option == 'object') {
      client = option;
    } else {
      client = this.viemService.getPublicClient(option);
    }

    const result = map(
      await Promise.all(
        _txHash.map((hash) => client.getTransactionConfirmations({ hash })),
      ),
      (result) => result >= this.num_block_confirmations, // 6 or more block confirmations
    );

    // return booleans result
    return (_inputArray ? result : result[0]) as T extends Hex[]
      ? boolean[]
      : boolean;
  }

  private _calcReward(
    principal: bigint,
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
      (endTime.getTime() - startTime.getTime()) / 1000,
    );

    // calc reward
    const reward =
      rewardRatePerSecond * (Number(principal) / 10 ** tokenDecimal) * duration; // reward for that duration

    const adjustedReward = Math.floor(reward * 10 ** tokenDecimal).toBigInt();

    return adjustedReward; // adjusted reward
  }

  private async getCacheReadBlockNumber(token: TokenEntity): Promise<bigint> {
    return BigInt(
      (await this.cacheManager.get(
        `stakeReader_currentBlockNumber_${token.id}`,
      )) || 0n,
    );
  }

  private async setCacheReadBlockNumber(
    token: TokenEntity,
    latestBlockNumber: bigint,
  ): Promise<void> {
    await this.cacheManager.set(
      `stakeReader_currentBlockNumber_${token.id}`,
      (latestBlockNumber + 1n).toString(),
    );
  }

  @Cron('*/15 * * * * *', {
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
          // init client
          const client = this.viemService.getPublicClient(token.chain.chain_id);

          // get range of blocks to read from
          const latestBlock: bigint =
            (await client.getBlockNumber()) -
            this.num_block_confirmations.toBigInt(); // offset block confirmation
          const currentReadBlock: bigint =
            (await this.getCacheReadBlockNumber(token)) || latestBlock;

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

          // === handle StakeUSDT Event ===
          await Promise.all(
            map(stakeLogs, async (log) => {
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
                user = this.userRepository.create(
                  plainToInstance(UserRegisterDto, {
                    wallet_address: log.args.from,
                  } as UserRegisterDto),
                );
              }

              // create stake
              const stake = await this._createStake(user, token, {
                transactionHash: log.transactionHash,
                args: log.args,
                txTime,
              });

              // push stakes data
              stakes.push(stake);
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

          // === handle Withdrawal Events (UnstakeUSDT & ClaimReward) ===
          await Promise.all(
            map(withdrawalLogs, async (log, i) => {
              // decode withdrawal params
              const withdrawal_params = decodeFunctionData({
                abi: abiCryptostaking,
                data: withdrawalLogs_txInfo[i].input,
              });

              //   handle withdrawal operation
              const { withdrawal, stake } =
                await this._updateWithdrawalAndStake(
                  {
                    signature: withdrawal_params.args[0] as Hex,
                    tx_hash: log.transactionHash,
                  },
                  new Date(
                    Number(
                      blocks.find((block) => block.hash === log.blockHash)!
                        .timestamp,
                    ) * 1000,
                  ),
                );

              //   update withdrawal
              withdrawals.push(withdrawal);

              //   update stake
              stakes.push(stake);
            }),
          );

          // save latestBlockNumber into Redis
          await this.setCacheReadBlockNumber(token, latestBlock);
        }),
      );

      // save stakes & withdraw into db
      if (stakes.length > 0) {
        await this.stakeRepository.save(stakes);
      }

      if (withdrawals.length > 0) {
        await this.withdrawalRepository.save(withdrawals);
      }
    } catch (error) {
      this.logger.error('Error inside the service!', (error as Error).message);
      //   @ts-ignore
      //   this.logger.error(error.message);
    }

    this.logger.log('`txReader` cron job ended.');
  }
}
