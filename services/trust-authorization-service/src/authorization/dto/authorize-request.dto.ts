import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class AuthorizeRequestDto {
  @IsIn(['user', 'ai', 'automation', 'integration', 'system'])
  actorType!: 'user' | 'ai' | 'automation' | 'integration' | 'system';

  @IsOptional()
  @IsString()
  actorId?: string;

  @IsString()
  @MinLength(1)
  actionType!: string;

  @IsOptional()
  @IsString()
  objectType?: string;

  @IsOptional()
  @IsString()
  objectId?: string;

  @IsOptional()
  @IsIn(['VERIFIED', 'TRUSTED', 'LIMITED', 'EXPERIMENTAL'])
  integrationTrustLevel?: 'VERIFIED' | 'TRUSTED' | 'LIMITED' | 'EXPERIMENTAL';

  @IsOptional()
  dataClassificationTier?: 1 | 2 | 3 | 4;

  @IsOptional()
  @IsString()
  actionRiskLevel?: string;

  @IsOptional()
  @IsIn(['OBSERVE', 'RECOMMEND', 'EXECUTE', 'AUTONOMOUS'])
  automationPermissionLevel?:
    | 'OBSERVE'
    | 'RECOMMEND'
    | 'EXECUTE'
    | 'AUTONOMOUS';

  @IsOptional()
  @IsObject()
  userPreferences?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  currentContext?: Record<string, unknown>;

  @IsString()
  @MinLength(1)
  requestId!: string;

  @IsOptional()
  @IsString()
  workspaceId?: string;
}
