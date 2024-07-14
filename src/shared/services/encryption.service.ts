import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { Hex } from 'viem';
import { ApiConfigService } from './api-config.service';

@Injectable()
export class EncryptionService {
  private AES_ALGORITHM = 'aes-256-cbc';

  constructor(private configService: ApiConfigService) {}

  encrypt(data: string) {
    const iv = randomBytes(16);

    const cipher = createCipheriv(
      this.AES_ALGORITHM,
      Buffer.from(this.configService.aesSecretKey, 'hex'),
      iv,
    );

    let encrypted_data = cipher.update(data, 'utf8', 'hex');
    encrypted_data += cipher.final('hex');

    return {
      encrypted_data: encrypted_data as Hex,
      iv: iv.toString('hex'),
    };
  }

  decrypt(encrypted_data: string, iv: string) {
    const decipher = createDecipheriv(
      this.AES_ALGORITHM,
      Buffer.from(this.configService.aesSecretKey, 'hex'),
      Buffer.from(iv, 'hex'),
    );

    let decrypted_data = decipher.update(encrypted_data, 'hex', 'utf8');
    decrypted_data += decipher.final('utf8');

    return decrypted_data as Hex;
  }
}
