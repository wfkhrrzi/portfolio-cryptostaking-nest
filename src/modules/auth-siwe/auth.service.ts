import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { RoleType, TokenType } from '@/constants';
import { SiweInvalidSignatureException } from '@/modules/auth-siwe/exceptions/siwe-invalid-signature.exception';
import { ApiConfigService } from '@/shared/services/api-config.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { REQUEST } from '@nestjs/core';
import { Cache } from 'cache-manager';
import { Request } from 'express';
import { Address, createPublicClient, http } from 'viem';
import * as chains from 'viem/chains';
import {
  SiweMessage,
  createSiweMessage,
  generateSiweNonce,
  parseSiweMessage,
} from 'viem/siwe';
import { UserEntity } from '../user-v2/user.entity';
import { UserService } from '../user-v2/user.service';
import { TokenPayloadDto } from './dto/token-payload.dto';
import { type UserLoginDto } from './dto/user-login.dto';
import { SiweExpiredMessageException } from './exceptions/siwe-expired-message.exception';

@Injectable()
export class AuthService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(REQUEST) private request: Request,
    private jwtService: JwtService,
    private configService: ApiConfigService,
    private userService: UserService,
  ) {}

  async createAccessToken(data: {
    role: RoleType;
    userId: Uuid;
  }): Promise<TokenPayloadDto> {
    return new TokenPayloadDto({
      expiresIn: this.configService.authConfig.jwtExpirationTime,
      accessToken: await this.jwtService.signAsync({
        userId: data.userId,
        type: TokenType.ACCESS_TOKEN,
        role: data.role,
      }),
    });
  }

  async validateUser(userLoginDto: UserLoginDto): Promise<UserEntity> {
    // retrieve message from Redis
    const messageRedis = await this.cacheManager.get<string>(
      this.parseSiweCacheKey(userLoginDto.wallet_address),
    );

    if (!messageRedis) {
      throw new SiweExpiredMessageException();
    }

    const message: SiweMessage = parseSiweMessage(messageRedis) as SiweMessage;

    // verify message
    const success = await createPublicClient({
      transport: http(),
      chain: Object.values(chains).find(
        (chain) => message.chainId === chain[1].id,
      ),
    }).verifySiweMessage({
      message: createSiweMessage(message),
      signature: userLoginDto.signature,
    });

    if (!success) {
      throw new SiweInvalidSignatureException();
    }

    // revoke SIWE message (remove from redis)
    this.cacheManager.del(this.parseSiweCacheKey(userLoginDto.wallet_address));

    // get user
    let user: UserEntity | null;
    user = await this.userService.findOne({
      wallet_address: userLoginDto.wallet_address as Address,
    });

    // create user if not existed
    if (!user) {
      user = await this.userService.createUser({
        wallet_address: userLoginDto.wallet_address as Address,
      });
    }

    // return user
    return user;
  }

  generateSiweMessage(wallet_address: Address): {
    strMessage: string;
    objMessage: SiweMessage;
  } {
    // create message (including nonce)
    const message: SiweMessage = {
      address: wallet_address,
      chainId: chains.bscTestnet.id,
      domain: 'localhost',
      nonce: generateSiweNonce(),
      uri: 'http://localhost:3000/auth/login',
      version: '1',
    };

    // return message
    return {
      strMessage: createSiweMessage(message),
      objMessage: message,
    };
  }

  async storeSiweCache(siweMessage: {
    strMessage: string;
    objMessage: SiweMessage;
  }) {
    // store message in Redis
    await this.cacheManager.set(
      this.parseSiweCacheKey(siweMessage.objMessage.address),
      siweMessage.strMessage,
      1000 * 30, // ttl = 30 seconds
    );

    // testing
    console.log(
      `message hash in cache: key: ${this.parseSiweCacheKey(siweMessage.objMessage.address)}, value`,
      await this.cacheManager.get(
        this.parseSiweCacheKey(siweMessage.objMessage.address),
      ),
    );
  }

  parseSiweCacheKey(user_wallet_address: Address): string {
    return `${user_wallet_address}$${this.request.headers['user-agent']}`;
  }
}
