import {
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { MemoryType } from '@lifeos/db';

const MEMORY_TYPE_VALUES = Object.values(MemoryType);

export class CreateMemoryDto {
  @IsIn(MEMORY_TYPE_VALUES)
  memoryType!: MemoryType;

  @IsString()
  @MinLength(1)
  content!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsArray()
  relatedObjects?: { objectType: string; objectId: string }[];

  @IsOptional()
  @IsInt()
  importance?: number;

  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}
