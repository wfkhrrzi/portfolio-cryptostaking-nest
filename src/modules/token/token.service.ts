import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenDto } from './dtos/token.dto';
import { UpdateTokenDto } from './dtos/update-token.dto';
import { TokenNotFoundException } from './exceptions/token-not-found.exception';
import { TokenEntity } from './token.entity';

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(TokenEntity)
    private tokenRepository: Repository<TokenEntity>,
  ) {}

  async create(createTokenDto: TokenDto): Promise<TokenEntity> {
    const token = this.tokenRepository.create(createTokenDto);

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
