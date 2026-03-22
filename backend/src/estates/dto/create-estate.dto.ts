import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

export class UnitConfigDto {
  @IsNumber()
  @Min(1)
  @Max(100)
  totalBlocks: number;

  @IsNumber()
  @Min(1)
  @Max(50)
  flatsPerBlock: number;

  @IsOptional()
  @IsString()
  blockPrefix?: string; // e.g., "Block" (default)

  @IsOptional()
  @IsString()
  flatPrefix?: string; // e.g., "Flat" (default)
}

export class CreateEstateDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => UnitConfigDto)
  unitConfig?: UnitConfigDto;
}