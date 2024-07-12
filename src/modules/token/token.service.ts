import { DuplicateResourceCreated } from '@/exceptions/duplicate-resource-created.exception';
import { ApiConfigService } from '@/shared/services/api-config.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { ContractFunctionName, erc20Abi } from 'viem';
import { ViemService } from '../viem/viem.service';
import { CreateTokenDto } from './dtos/create-token.dto';
import { UpdateTokenDto } from './dtos/update-token.dto';
import { TokenNotFoundException } from './exceptions/token-not-found.exception';
import { TokenEntity } from './token.entity';

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(TokenEntity)
    private tokenRepository: Repository<TokenEntity>,
    private viemService: ViemService,
    private configService: ApiConfigService,
  ) {}

  async create(createTokenDto: CreateTokenDto): Promise<TokenEntity> {
    const client = this.viemService.getPublicClient(createTokenDto.chain_id);

    // if row exist, exit
    let token: TokenEntity | null;

    token = await this.tokenRepository.findOne({
      where: {
        contract_address: createTokenDto.contract_address,
      },
    });
    if (token)
      throw new DuplicateResourceCreated(
        `Token with addresss '${token.contract_address}' is already existed`,
      );

    // fetch token data from contract
    const token_attr = ['name', 'symbol', 'decimals'] as ContractFunctionName<
      typeof erc20Abi,
      'view'
    >[];

    const token_attr_result = (
      await client.multicall({
        allowFailure: false,
        contracts: token_attr.map((functionName) => ({
          abi: erc20Abi,
          address: createTokenDto.contract_address,
          functionName,
        })),
        multicallAddress: this.configService.isLocalContractTest
          ? this.configService.localContract.multicall_contract
          : undefined,
      })
    ).reduce<DeepPartial<TokenEntity>>(
      (createTokenDto, attr, i) => ({
        ...createTokenDto,
        [token_attr[i]]: attr,
      }),
      createTokenDto,
    );

    const reward_rate_per_second =
      createTokenDto.stake_APR / 100 / (365 * 24 * 60 * 60);

    // create token
    token = this.tokenRepository.create({
      ...createTokenDto,
      ...token_attr_result,
      reward_rate_per_second,
    });

    await this.tokenRepository.save(token);

    return token;
  }

  async findAll() {
    const tokens = await this.tokenRepository.find();

    return tokens;
  }

  async update(id: Uuid, updateTokenDto: UpdateTokenDto) {
    const token = await this.tokenRepository.findOne({
      where: {
        id,
      },
    });

    if (!token) {
      throw new TokenNotFoundException();
    }

    const result = await this.tokenRepository.update(id, updateTokenDto);

    return result;
  }

  remove(id: string) {
    return `This action removes a #${id} token`;
  }
}
