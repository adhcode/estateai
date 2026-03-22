import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  async create(createUnitDto: CreateUnitDto) {
    // Check if unit already exists in the estate
    const existingUnit = await this.prisma.unit.findFirst({
      where: {
        estateId: createUnitDto.estateId,
        block: createUnitDto.block,
        flat: createUnitDto.flat,
      },
    });

    if (existingUnit) {
      throw new ConflictException(
        `Unit ${createUnitDto.block}, ${createUnitDto.flat} already exists in this estate`,
      );
    }

    return this.prisma.unit.create({
      data: createUnitDto,
      include: {
        estate: true,
        occupants: true,
      },
    });
  }

  async findAll() {
    return this.prisma.unit.findMany({
      include: {
        estate: true,
        occupants: true,
      },
      orderBy: [{ block: 'asc' }, { flat: 'asc' }],
    });
  }

  async findByEstate(estateId: string) {
    return this.prisma.unit.findMany({
      where: { estateId },
      include: {
        occupants: true,
      },
      orderBy: [{ block: 'asc' }, { flat: 'asc' }],
    });
  }

  async findOne(id: string) {
    return this.prisma.unit.findUnique({
      where: { id },
      include: {
        estate: true,
        occupants: true,
      },
    });
  }

  async update(id: string, updateUnitDto: UpdateUnitDto) {
    return this.prisma.unit.update({
      where: { id },
      data: updateUnitDto,
      include: {
        estate: true,
        occupants: true,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.unit.delete({
      where: { id },
    });
  }

  async getOccupants(unitId: string) {
    return this.prisma.occupant.findMany({
      where: { unitId },
      include: {
        visitorCodes: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async getAvailableUnits(estateId: string) {
    const units = await this.prisma.unit.findMany({
      where: {
        estateId,
        isOccupied: false,
      },
      include: {
        estate: { select: { name: true } },
      },
      orderBy: [
        { block: 'asc' },
        { flat: 'asc' },
      ],
    });

    return {
      success: true,
      data: units,
    };
  }
}