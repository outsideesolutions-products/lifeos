import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateSecretDto {
  @IsString()
  @MinLength(1)
  key!: string;

  @IsString()
  @MinLength(1)
  scope!: string;

  @IsString()
  @MinLength(1)
  value!: string;

  @IsOptional()
  @IsString()
  workspaceId?: string;
}
