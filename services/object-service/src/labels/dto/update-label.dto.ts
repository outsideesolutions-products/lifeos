import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateLabelDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;
}
