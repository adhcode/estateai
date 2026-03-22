import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ValidateVisitorCodeDto {
  @IsString()
  @MinLength(6)
  @MaxLength(8)
  code: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  visitorName?: string;

  @IsOptional()
  @IsString()
  estateId?: string;
}