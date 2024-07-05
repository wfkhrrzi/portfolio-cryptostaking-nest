import { StringField } from '../../../decorators';

export class CreatePostDto {
  @StringField()
  title!: string;

  @StringField()
  description!: string;
}
