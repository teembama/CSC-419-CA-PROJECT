import { IsUUID, IsString, IsOptional, IsEnum } from 'class-validator';

export enum AbnormalityFlag {
  NORMAL = 'Normal',
  LOW = 'Low',
  HIGH = 'High',
  CRITICAL_LOW = 'Critical Low',
  CRITICAL_HIGH = 'Critical High',
}

export class UploadResultDto {
  @IsOptional()
  @IsUUID()
  testItemId?: string;

  @IsString()
  resultValue!: string;

  @IsOptional()
  @IsEnum(AbnormalityFlag)
  abnormalityFlag?: AbnormalityFlag;

  @IsOptional()
  @IsString()
  fileUrl?: string;
}
