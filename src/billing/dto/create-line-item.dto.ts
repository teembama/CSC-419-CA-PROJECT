import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateLineItemDto {
  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0) // You can't charge a negative amount
  cost!: number;
}