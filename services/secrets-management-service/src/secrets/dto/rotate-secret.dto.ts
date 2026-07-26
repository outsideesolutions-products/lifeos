import { IsString, MinLength } from 'class-validator';

export class RotateSecretDto {
  @IsString()
  @MinLength(1)
  value!: string;
}
