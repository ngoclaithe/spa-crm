import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: '0901234567' })
  @IsString()
  @MinLength(8, { message: 'Số điện thoại không hợp lệ' })
  phone: string;

  @ApiProperty({ example: 'Nguyễn A' })
  @IsString()
  @MinLength(1)
  name: string;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;
}

export class UpsertCustomerDto extends CreateCustomerDto {}
