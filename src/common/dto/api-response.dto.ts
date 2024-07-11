import { NumberField, StringField } from '@/decorators';
import { IApiResponseFormat } from '@/interfaces/i-api-response-format';

export class ApiResponseDTO<DTO> implements IApiResponseFormat<DTO> {
  @NumberField({ example: 200 })
  status!: number;

  @StringField({ example: 'success' })
  message!: string;

  data!: DTO;
}
