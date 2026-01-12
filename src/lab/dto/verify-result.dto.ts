import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class VerifyResultDto {
  @IsBoolean()
  isVerified!: boolean;

  @IsOptional()
  @IsString()
  clinicianNotes?: string;
}
