import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { DiscountType } from '@prisma/client';

class PosOrderCustomerDto {
  @ApiProperty()
  @IsString()
  @MinLength(6)
  phone: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  name: string;
}

class PosOrderItemDto {
  @ApiProperty({ description: 'ID dịch vụ (cuid từ Prisma)' })
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  sessions: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  /// Nếu bỏ qua, lấy từ defaultPrice của dịch vụ
  unitPrice?: number;
}

export class CreatePosOrderDto {
  @ApiProperty({ type: PosOrderCustomerDto })
  @ValidateNested()
  @Type(() => PosOrderCustomerDto)
  @IsNotEmpty()
  customer: PosOrderCustomerDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  orderDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  salesChannelId?: string;

  @ApiProperty({ type: [PosOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PosOrderItemDto)
  items: PosOrderItemDto[];

  @ApiProperty({ enum: DiscountType })
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @ApiProperty()
  @IsInt()
  @Min(0)
  discountValue: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  amountReceived: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
