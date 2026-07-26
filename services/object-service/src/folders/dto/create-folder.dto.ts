import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { PRIORITY_VALUES, Priority } from '@lifeos/domain-model';

export class CreateFolderDto {
  @IsString()
  @MinLength(1)
  name!: string;

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
}
