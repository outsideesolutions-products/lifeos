import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { PRIORITY_VALUES, Priority } from '@lifeos/domain-model';

export class UpdateFolderDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  parentFolderId?: string;

  @IsOptional()
  @IsIn(PRIORITY_VALUES)
  priority?: Priority;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;
}
