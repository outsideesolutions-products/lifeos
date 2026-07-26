import { IsIn, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { RelationshipType } from '@lifeos/db';

const RELATIONSHIP_TYPE_VALUES = Object.values(RelationshipType);

export class CreateRelationshipDto {
  @IsString()
  @MinLength(1)
  sourceObjectType!: string;

  @IsString()
  @MinLength(1)
  sourceObjectId!: string;

  @IsIn(RELATIONSHIP_TYPE_VALUES)
  relationshipType!: RelationshipType;

  @IsString()
  @MinLength(1)
  targetObjectType!: string;

  @IsString()
  @MinLength(1)
  targetObjectId!: string;

  @IsOptional()
  @IsNumber()
  strength?: number;
}
