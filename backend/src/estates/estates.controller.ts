import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateEstateDto, UnitConfigDto } from './dto/create-estate.dto';
import { UpdateEstateDto } from './dto/update-estate.dto';
import { EstatesService } from './estates.service';

@Controller('estates')
export class EstatesController {
  constructor(private readonly estatesService: EstatesService) { }

  @Post()
  create(@Body() createEstateDto: CreateEstateDto) {
    return this.estatesService.create(createEstateDto);
  }

  @Post(':id/units/bulk-create')
  createUnits(@Param('id') id: string, @Body() unitConfig: UnitConfigDto) {
    return this.estatesService.createUnitsForEstate(id, unitConfig);
  }

  @Get(':id/units/configuration')
  getUnitConfiguration(@Param('id') id: string) {
    return this.estatesService.getUnitConfiguration(id);
  }

  @Delete(':id/units/unoccupied')
  deleteUnoccupiedUnits(@Param('id') id: string) {
    return this.estatesService.deleteUnoccupiedUnits(id);
  }

  @Get()
  findAll() {
    return this.estatesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.estatesService.findOne(id);
  }

  @Get(':id/stats')
  getStats(@Param('id') id: string) {
    return this.estatesService.getStats(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEstateDto: UpdateEstateDto) {
    return this.estatesService.update(id, updateEstateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.estatesService.remove(id);
  }
}