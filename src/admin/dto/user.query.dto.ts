import { IsOptional, IsString, IsBoolean, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UserQueryDto {
  @IsOptional()
  @IsString()
  search?: string; // Search by name, email, or phone

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  roleId?: number; // Filter by role

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean; // Filter by active status

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
