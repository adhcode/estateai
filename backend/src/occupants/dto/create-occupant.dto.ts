import { OccupantType } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateOccupantDto {
  @IsString()
  name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  estateId: string;

  @IsString()
  unitId: string;

  @IsEnum(OccupantType)
  @IsOptional()
  type?: OccupantType = OccupantType.RESIDENT;

  @IsString()
  @IsOptional()
  primaryOccupantId?: string;
}