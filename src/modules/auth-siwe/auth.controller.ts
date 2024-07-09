import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Version,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { RoleType } from '@/constants';
import { Auth, AuthUser } from '@/decorators';
import { UserDto } from '../user-v2/dtos/user.dto';
import { UserEntity } from '../user-v2/user.entity';
import { AuthService } from './auth.service';
import { LoginPayloadDto } from './dto/login-payload.dto';
import { SiweMessagePayload } from './dto/siwe-message-payload.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { UserRegisterDto } from './dto/user-register.dto';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('/siweMessage')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: SiweMessagePayload,
    description: 'Generate SIWE message to user pre-login',
  })
  async generateSiweMessage(
    @Query() param: UserRegisterDto,
  ): Promise<SiweMessagePayload> {
    // generate SIWE message
    const siweMessage = this.authService.generateSiweMessage(
      param.wallet_address,
    );

    // store message in Redis
    await this.authService.storeSiweCache(siweMessage);

    // return payload
    return new SiweMessagePayload(siweMessage.strMessage);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: LoginPayloadDto,
    description: 'User info with access token',
  })
  async userLogin(
    @Body() userLoginDto: UserLoginDto,
  ): Promise<LoginPayloadDto> {
    const userEntity = await this.authService.validateUser(userLoginDto);

    const token = await this.authService.createAccessToken({
      userId: userEntity.id,
      role: userEntity.role,
    });

    return new LoginPayloadDto(userEntity.toDto(), token);
  }

  @Version('1')
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @Auth([RoleType.USER, RoleType.ADMIN])
  @ApiOkResponse({ type: UserDto, description: 'current user info' })
  getCurrentUser(@AuthUser() user: UserEntity): UserDto {
    return user.toDto();
  }
}
