import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateDebtPaymentDto {
  @ApiProperty({ description: 'ID khách hàng (cuid)' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ description: 'YYYY-MM-DD — ngày thực hiện thu' })
  @IsOptional()
  @IsDateString()
  performedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
