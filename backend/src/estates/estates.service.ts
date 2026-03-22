import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEstateDto } from './dto/create-estate.dto';
import { UpdateEstateDto } from './dto/update-estate.dto';

@Injectable()
export class EstatesService {
  private readonly logger = new Logger(EstatesService.name);

  constructor(private prisma: PrismaService) { }

  async create(createEstateDto: CreateEstateDto) {
    const { unitConfig, ...estateData } = createEstateDto;

    // Create estate first
    const estate = await this.prisma.estate.create({
      data: estateData,
      include: {
        units: true,
        occupants: true,
        _count: {
          select: {
            units: true,
            occupants: true,
            visitorCodes: true,
          },
        },
      },
    });

    // If unit configuration is provided, create units in bulk
    if (unitConfig) {
      this.logger.log(`Creating ${unitConfig.totalBlocks * unitConfig.flatsPerBlock} units for estate ${estate.name}`);
      await this.createUnitsForEstate(estate.id, unitConfig);
    }

    // Return estate with units
    return this.findOne(estate.id);
  }

  /**
   * Create units in bulk for an estate
   */
  async createUnitsForEstate(
    estateId: string,
    config: {
      totalBlocks: number;
      flatsPerBlock: number;
      blockPrefix?: string;
      flatPrefix?: string;
    }
  ) {
    const blockPrefix = config.blockPrefix || 'Block';
    const flatPrefix = config.flatPrefix || 'Flat';

    const units = [];

    for (let block = 1; block <= config.totalBlocks; block++) {
      for (let flat = 1; flat <= config.flatsPerBlock; flat++) {
        units.push({
          estateId,
          block: `${blockPrefix} ${block}`,
          flat: `${flatPrefix} ${flat}`,
          isOccupied: false,
        });
      }
    }

    // Bulk insert units
    const result = await this.prisma.unit.createMany({
      data: units,
      skipDuplicates: true,
    });

    this.logger.log(`✅ Created ${result.count} units for estate ${estateId}`);

    return result;
  }

  async findAll() {
    return this.prisma.estate.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            units: true,
            occupants: true,
            visitorCodes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.estate.findUnique({
      where: { id },
      include: {
        units: {
          include: {
            occupants: true,
          },
        },
        occupants: true,
        visitorCodes: {
          where: { status: 'ACTIVE' },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            units: true,
            occupants: true,
            visitorCodes: true,
          },
        },
      },
    });
  }

  async update(id: string, updateEstateDto: UpdateEstateDto) {
    return this.prisma.estate.update({
      where: { id },
      data: updateEstateDto,
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
  }

  async remove(id: string) {
    return this.prisma.estate.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getStats(id: string) {
    const estate = await this.prisma.estate.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            units: true,
            occupants: true,
            visitorCodes: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
    });

    const occupiedUnits = await this.prisma.unit.count({
      where: { estateId: id, isOccupied: true },
    });

    return {
      totalUnits: estate._count.units,
      occupiedUnits,
      totalOccupants: estate._count.occupants,
      activeVisitorCodes: estate._count.visitorCodes,
    };
  }

  /**
   * Get current unit configuration for an estate
   */
  async getUnitConfiguration(estateId: string) {
    const units = await this.prisma.unit.findMany({
      where: { estateId },
      select: {
        block: true,
        flat: true,
        isOccupied: true,
      },
      orderBy: [{ block: 'asc' }, { flat: 'asc' }],
    });

    if (units.length === 0) {
      return {
        totalUnits: 0,
        totalBlocks: 0,
        flatsPerBlock: 0,
        occupiedUnits: 0,
        availableUnits: 0,
        blockPrefix: 'Block',
        flatPrefix: 'Flat',
      };
    }

    // Extract block and flat numbers
    const blockNumbers = new Set<number>();
    const flatsByBlock = new Map<string, Set<number>>();
    let occupiedCount = 0;

    units.forEach(unit => {
      if (unit.isOccupied) occupiedCount++;

      // Extract block number (e.g., "Block 1" -> 1)
      const blockMatch = unit.block.match(/(\d+)/);
      if (blockMatch) {
        const blockNum = parseInt(blockMatch[1]);
        blockNumbers.add(blockNum);

        if (!flatsByBlock.has(unit.block)) {
          flatsByBlock.set(unit.block, new Set());
        }

        // Extract flat number
        const flatMatch = unit.flat.match(/(\d+)/);
        if (flatMatch) {
          flatsByBlock.get(unit.block)!.add(parseInt(flatMatch[1]));
        }
      }
    });

    // Determine prefixes from first unit
    const firstUnit = units[0];
    const blockPrefix = firstUnit.block.replace(/\d+/g, '').trim();
    const flatPrefix = firstUnit.flat.replace(/\d+/g, '').trim();

    // Calculate max flats per block
    let maxFlatsPerBlock = 0;
    flatsByBlock.forEach(flats => {
      maxFlatsPerBlock = Math.max(maxFlatsPerBlock, flats.size);
    });

    return {
      totalUnits: units.length,
      totalBlocks: blockNumbers.size,
      flatsPerBlock: maxFlatsPerBlock,
      occupiedUnits: occupiedCount,
      availableUnits: units.length - occupiedCount,
      blockPrefix,
      flatPrefix,
    };
  }

  /**
   * Delete all unoccupied units for an estate
   * This allows reconfiguring units without affecting occupied ones
   */
  async deleteUnoccupiedUnits(estateId: string) {
    const result = await this.prisma.unit.deleteMany({
      where: {
        estateId,
        isOccupied: false,
      },
    });

    this.logger.log(`🗑️ Deleted ${result.count} unoccupied units for estate ${estateId}`);

    return {
      deletedCount: result.count,
      message: `Deleted ${result.count} unoccupied units`,
    };
  }
}