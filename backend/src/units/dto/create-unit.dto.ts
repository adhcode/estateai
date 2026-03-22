import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';

export class CreateUnitDto {
  @IsString()
  estateId: string;

  @IsString()
  block: string;

  @IsString()
  flat: string;

  @IsOptional()
  @IsInt()
  floor?: number;

  @IsOptional()
  @IsInt()
  bedrooms?: number;

  @IsOptional()
  @IsBoolean()
  isOccupied?: boolean;
}