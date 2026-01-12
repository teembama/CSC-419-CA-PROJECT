import { IsUUID, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateTestItemDto {
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsString()
  @IsNotEmpty()
  testName!: string;
}
