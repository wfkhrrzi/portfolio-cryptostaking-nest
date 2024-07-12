import { DuplicateResourceCreated } from '@/exceptions/duplicate-resource-created.exception';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { ContractFunctionName, createPublicClient, erc20Abi, http } from 'viem';
import { bscTestnet } from 'viem/chains';
import { CreateTokenDto } from './dtos/create-token.dto';
import { UpdateTokenDto } from './dtos/update-token.dto';
import { TokenNotFoundException } from './exceptions/token-not-found.exception';
import { TokenEntity } from './token.entity';

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(TokenEntity)
    private tokenRepository: Repository<TokenEntity>,
  ) {}

  async create(createTokenDto: CreateTokenDto): Promise<TokenEntity> {
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
      await createPublicClient({
        // (FIXME: needed to be injected as provider)
        transport: http(),
        chain: bscTestnet,
      }).multicall({
        allowFailure: false,
        contracts: token_attr.map((functionName) => ({
          abi: erc20Abi,
          address: createTokenDto.contract_address,
          functionName,
        })),
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
