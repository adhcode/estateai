import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { GenerateVisitorCodeDto } from './dto/generate-visitor-code.dto';
import { ValidateVisitorCodeDto } from './dto/validate-visitor-code.dto';
import { VisitorCodeService } from './visitor-code.service';

@Controller('visitor-codes')
export class VisitorCodeController {
  constructor(private readonly visitorCodeService: VisitorCodeService) { }

  @Post('generate')
  async generateCode(@Body() generateDto: GenerateVisitorCodeDto) {
    return this.visitorCodeService.generateCode(generateDto);
  }

  @Post('validate')
  async validateCode(@Body() validateDto: ValidateVisitorCodeDto) {
    const result = await this.visitorCodeService.validateCode(validateDto);
    console.log('🚀 Controller sending response:', JSON.stringify(result, null, 2));
    return result;
  }

  @Get('occupant/:occupantId')
  async getOccupantCodes(@Param('occupantId') occupantId: string) {
    return this.visitorCodeService.getOccupantCodes(occupantId);
  }

  @Get('estate/:estateId')
  async getEstateCodes(
    @Param('estateId') estateId: string,
    @Query('status') status?: string,
  ) {
    return this.visitorCodeService.getEstateCodes(estateId, status);
  }

  @Patch(':id/cancel')
  async cancelCode(@Param('id') id: string) {
    return this.visitorCodeService.cancelCode(id);
  }

  @Get('debug/:code')
  async debugCode(@Param('code') code: string) {
    const visitorCode = await this.visitorCodeService.findByCode(code);

    return {
      success: true,
      found: !!visitorCode,
      data: visitorCode ? {
        id: visitorCode.id,
        code: visitorCode.code,
        visitorName: visitorCode.visitorName,
        status: visitorCode.status,
        expiresAt: visitorCode.expiresAt,
        createdAt: visitorCode.createdAt,
        occupant: visitorCode.occupant ? {
          name: visitorCode.occupant.name,
          unit: visitorCode.occupant.unit ? `${visitorCode.occupant.unit.block} ${visitorCode.occupant.unit.flat}` : null
        } : null
      } : null
    };
  }

  @Post('test-generate')
  async generateTestCode(@Body() body: { visitorName: string; occupantId: string; validHours?: number }) {
    const { visitorName, occupantId, validHours = 24 } = body;

    const generateDto = {
      visitorName,
      occupantId,
      purpose: 'Test visit',
      validHours
    };

    const result = await this.visitorCodeService.generateCode(generateDto);

    return {
      success: true,
      message: `Test code generated for ${visitorName}, valid for ${validHours} hours`,
      data: {
        code: result.code,
        visitorName: result.visitorName,
        expiresAt: result.expiresAt,
        validUntil: new Date(result.expiresAt).toLocaleString()
      }
    };
  }

  @Get(':id')
  async getCodeDetails(@Param('id') id: string) {
    return this.visitorCodeService.getCodeDetails(id);
  }
}