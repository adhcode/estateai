import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OccupantsService } from '../occupants/occupants.service';
import { CreateOccupantDto } from '../occupants/dto/create-occupant.dto';
import { OccupantType } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly occupantsService: OccupantsService,
  ) {}

  async getEstateOccupants(estateId: string) {
    const estate = await this.prisma.estate.findUnique({
      where: { id: estateId },
    });

    if (!estate) {
      throw new NotFoundException('Estate not found');
    }

    const occupants = await this.prisma.occupant.findMany({
      where: { estateId },
      include: {
        unit: true,
        primaryOccupant: {
          select: { name: true, phone: true, email: true },
        },
        householdMembers: {
          select: { id: true, name: true, phone: true, email: true },
        },
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' },
      ],
    });

    return occupants;
  }

  async addResidentWithWhatsapp(estateId: string, data: {
    name: string;
    phone: string;
    email?: string;
    unitId: string;
  }) {
    // Validate phone number format (basic validation)
    if (!data.phone.match(/^\+?[0-9\s\-\(\)]{10,15}$/)) {
      throw new BadRequestException('Invalid phone number format');
    }

    // Check if phone number already exists
    const existingOccupant = await this.prisma.occupant.findFirst({
      where: { phone: data.phone },
    });

    if (existingOccupant) {
      throw new BadRequestException('Phone number already registered');
    }

    // Create the resident
    const createDto: CreateOccupantDto = {
      name: data.name,
      phone: data.phone,
      email: data.email,
      estateId,
      unitId: data.unitId,
      type: OccupantType.RESIDENT,
    };


    

    return this.occupantsService.create(createDto);
  }

  async updateOccupantWhatsapp(occupantId: string, phone: string) {
    // Validate phone number format
    if (!phone.match(/^\+?[0-9\s\-\(\)]{10,15}$/)) {
      throw new BadRequestException('Invalid phone number format');
    }

    // Check if phone number already exists on another occupant
    const existingOccupant = await this.prisma.occupant.findFirst({
      where: { 
        phone,
        NOT: { id: occupantId },
      },
    });

    if (existingOccupant) {
      throw new BadRequestException('Phone number already registered to another occupant');
    }

    // Update the occupant
    return this.prisma.occupant.update({
      where: { id: occupantId },
      data: { phone },
      include: {
        unit: true,
        primaryOccupant: true,
      },
    });
  }

  async getEstateStats(estateId: string) {
    const estate = await this.prisma.estate.findUnique({
      where: { id: estateId },
      include: {
        _count: {
          select: {
            units: true,
            occupants: true,
            visitorCodes: true,
          },
        },
      },
    });

    if (!estate) {
      throw new NotFoundException('Estate not found');
    }

    // Get counts by occupant type
    const residents = await this.prisma.occupant.count({
      where: { 
        estateId,
        type: OccupantType.RESIDENT,
        isActive: true,
      },
    });

    const householdMembers = await this.prisma.occupant.count({
      where: { 
        estateId,
        type: OccupantType.HOUSEHOLD_MEMBER,
        isActive: true,
      },
    });

    // Get visitor code stats
    const activeCodes = await this.prisma.visitorCode.count({
      where: { 
        estateId,
        status: 'ACTIVE',
      },
    });

    const usedCodes = await this.prisma.visitorCode.count({
      where: { 
        estateId,
        status: 'USED',
      },
    });

    // Get units with and without occupants
    const occupiedUnits = await this.prisma.unit.count({
      where: { 
        estateId,
        isOccupied: true,
      },
    });

    return {
      estate: {
        id: estate.id,
        name: estate.name,
        address: estate.address,
        phoneNumber: estate.phoneNumber,
      },
      stats: {
        totalUnits: estate._count.units,
        occupiedUnits,
        vacantUnits: estate._count.units - occupiedUnits,
        totalOccupants: estate._count.occupants,
        residents,
        householdMembers,
        totalVisitorCodes: estate._count.visitorCodes,
        activeCodes,
        usedCodes,
      },
    };
  }

  async sendWhatsappInvite(occupantId: string) {
    const occupant = await this.prisma.occupant.findUnique({
      where: { id: occupantId },
      include: {
        estate: true,
        unit: true,
      },
    });

    if (!occupant) {
      throw new NotFoundException('Occupant not found');
    }

    if (!occupant.phone) {
      throw new BadRequestException('Occupant has no phone number');
    }

    // In a real implementation, you would integrate with WhatsApp Business API
    // or a service like Twilio to send the message
    
    // For now, we'll just return the message that would be sent
    const message = `Hello ${occupant.name},\\n\\n` +
      `Welcome to ${occupant.estate.name}!\\n\\n` +
      `You can now use our WhatsApp service to generate visitor codes. ` +
      `Simply send a message like "Generate code for John" to this number.\\n\\n` +
      `Your unit: ${occupant.unit.block} ${occupant.unit.flat}\\n\\n` +
      `Thank you for using our service!`;

    return {
      success: true,
      phone: occupant.phone,
      message,
      // In production, you would add the actual delivery status from your WhatsApp provider
      status: 'simulated',
    };
  }
}