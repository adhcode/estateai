import { IsDateString, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class GenerateVisitorCodeDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  visitorName: string;

  @IsOptional()
  @IsString()
  visitorPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  purpose?: string;

  @IsString()
  occupantId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(168) // Max 1 week
  validHours?: number; // Default 1 hour

  @IsOptional()
  @IsDateString()
  expiresAt?: string; // Alternative to validHours
}