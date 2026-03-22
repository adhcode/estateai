import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateOccupantDto } from './dto/create-occupant.dto';
import { OccupantsService } from './occupants.service';

@Controller('occupants')
export class OccupantsController {
  constructor(private readonly occupantsService: OccupantsService) { }

  @Post()
  create(@Body() createOccupantDto: CreateOccupantDto) {
    // Clean empty strings to undefined/null
    const cleanedDto = {
      ...createOccupantDto,
      primaryOccupantId: createOccupantDto.primaryOccupantId?.trim() || undefined,
      email: createOccupantDto.email?.trim() || undefined,
      phone: createOccupantDto.phone?.trim() || undefined,
    };
    return this.occupantsService.create(cleanedDto);
  }

  @Get()
  findAll(@Query('estateId') estateId?: string, @Query('unitId') unitId?: string) {
    if (estateId) {
      return this.occupantsService.findByEstate(estateId);
    }
    if (unitId) {
      return this.occupantsService.findByUnit(unitId);
    }
    return this.occupantsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.occupantsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOccupantDto: Partial<CreateOccupantDto>) {
    return this.occupantsService.update(id, updateOccupantDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.occupantsService.remove(id);
  }

  @Delete(':id/hard')
  hardDelete(@Param('id') id: string) {
    return this.occupantsService.hardDelete(id);
  }

  @Post('residents/:residentId/household-members')
  createHouseholdMember(
    @Param('residentId') residentId: string,
    @Body() householdMemberData: Omit<CreateOccupantDto, 'type' | 'primaryOccupantId'>
  ) {
    return this.occupantsService.createHouseholdMember(residentId, householdMemberData);
  }

  @Get('residents/:residentId/household-members')
  getResidentHouseholdMembers(@Param('residentId') residentId: string) {
    return this.occupantsService.getResidentHouseholdMembers(residentId);
  }
}