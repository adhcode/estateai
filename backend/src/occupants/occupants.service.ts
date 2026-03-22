import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OccupantType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOccupantDto } from './dto/create-occupant.dto';

@Injectable()
export class OccupantsService {
  constructor(private prisma: PrismaService) { }

  async create(createOccupantDto: CreateOccupantDto) {
    const { estateId, unitId, primaryOccupantId, type } = createOccupantDto;

    // Verify estate exists
    const estate = await this.prisma.estate.findUnique({
      where: { id: estateId },
    });
    if (!estate) {
      throw new NotFoundException('Estate not found');
    }

    // Verify unit exists and belongs to estate
    const unit = await this.prisma.unit.findFirst({
      where: { id: unitId, estateId },
      include: {
        occupants: {
          where: {
            type: OccupantType.RESIDENT,
            isActive: true,
          },
        },
      },
    });
    if (!unit) {
      throw new NotFoundException('Unit not found in this estate');
    }

    // Business logic validation
    if (type === OccupantType.RESIDENT) {
      // Check if unit already has a primary resident
      const existingResident = unit.occupants.find(
        (occ) => occ.type === OccupantType.RESIDENT && occ.isActive
      );

      if (existingResident) {
        throw new BadRequestException(
          `This unit already has a primary resident: ${existingResident.name}. Only one primary resident is allowed per unit.`
        );
      }

      // Residents cannot have a primary occupant - ensure it's null
      if (primaryOccupantId) {
        throw new BadRequestException('Primary residents cannot be linked to another occupant');
      }

      // Mark unit as occupied
      await this.prisma.unit.update({
        where: { id: unitId },
        data: { isOccupied: true },
      });
    } else if (type === OccupantType.HOUSEHOLD_MEMBER) {
      // Household members must have a primary occupant
      if (!primaryOccupantId) {
        throw new BadRequestException('Household members must be linked to a primary resident');
      }

      // Verify primary occupant exists and is a RESIDENT
      const primaryOccupant = await this.prisma.occupant.findFirst({
        where: {
          id: primaryOccupantId,
          estateId,
          unitId,
          type: OccupantType.RESIDENT,
          isActive: true
        },
      });
      if (!primaryOccupant) {
        throw new NotFoundException('Primary resident not found in this unit or is not active');
      }
    }

    // Clean the data - ensure primaryOccupantId is null for RESIDENT type
    const cleanData = {
      ...createOccupantDto,
      primaryOccupantId: type === OccupantType.RESIDENT ? null : primaryOccupantId,
    };

    return this.prisma.occupant.create({
      data: cleanData,
      include: {
        estate: true,
        unit: true,
        primaryOccupant: true,
        householdMembers: true,
      },
    });
  }

  async findAll() {
    return this.prisma.occupant.findMany({
      include: {
        estate: true,
        unit: true,
        primaryOccupant: true,
        householdMembers: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByEstate(estateId: string) {
    return this.prisma.occupant.findMany({
      where: { estateId, isActive: true },
      include: {
        estate: true,
        unit: true,
        primaryOccupant: true,
        householdMembers: true,
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }

  async findByUnit(unitId: string) {
    return this.prisma.occupant.findMany({
      where: { unitId, isActive: true },
      include: {
        estate: true,
        unit: true,
        primaryOccupant: true,
        householdMembers: true,
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const occupant = await this.prisma.occupant.findUnique({
      where: { id },
      include: {
        estate: true,
        unit: true,
        primaryOccupant: true,
        householdMembers: true,
        visitorCodes: true,
      },
    });

    if (!occupant) {
      throw new NotFoundException('Occupant not found');
    }

    return occupant;
  }

  async update(id: string, updateData: Partial<CreateOccupantDto>) {
    const occupant = await this.findOne(id);

    return this.prisma.occupant.update({
      where: { id },
      data: updateData,
      include: {
        estate: true,
        unit: true,
        primaryOccupant: true,
        householdMembers: true,
      },
    });
  }

  async remove(id: string) {
    const occupant = await this.findOne(id);

    // If this is a primary resident with household members, prevent deletion
    if (occupant.type === OccupantType.RESIDENT && occupant.householdMembers.length > 0) {
      throw new BadRequestException(
        'Cannot delete primary resident with active household members. Please remove household members first.'
      );
    }

    // If this is a primary resident, mark the unit as unoccupied
    if (occupant.type === OccupantType.RESIDENT) {
      await this.prisma.unit.update({
        where: { id: occupant.unitId },
        data: { isOccupied: false },
      });
    }

    return this.prisma.occupant.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async hardDelete(id: string) {
    const occupant = await this.findOne(id);

    return this.prisma.occupant.delete({
      where: { id },
    });
  }

  async createHouseholdMember(residentId: string, householdMemberData: Omit<CreateOccupantDto, 'type' | 'primaryOccupantId'>) {
    // Verify the resident exists and is active
    const resident = await this.prisma.occupant.findFirst({
      where: {
        id: residentId,
        type: OccupantType.RESIDENT,
        isActive: true
      },
    });

    if (!resident) {
      throw new NotFoundException('Resident not found or is not active');
    }

    // Create household member with the resident as primary occupant
    return this.create({
      ...householdMemberData,
      type: OccupantType.HOUSEHOLD_MEMBER,
      primaryOccupantId: residentId,
      estateId: resident.estateId,
      unitId: resident.unitId,
    });
  }

  async getResidentHouseholdMembers(residentId: string) {
    const resident = await this.prisma.occupant.findFirst({
      where: {
        id: residentId,
        type: OccupantType.RESIDENT,
        isActive: true
      },
    });

    if (!resident) {
      throw new NotFoundException('Resident not found or is not active');
    }

    return this.prisma.occupant.findMany({
      where: {
        primaryOccupantId: residentId,
        isActive: true
      },
      include: {
        estate: true,
        unit: true,
        primaryOccupant: {
          select: { name: true, phone: true, email: true }
        },
      },
      orderBy: { name: 'asc' },
    });
  }
}