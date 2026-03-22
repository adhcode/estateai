import { BadRequestException, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessengerService } from '../whatsapp/outbound/messenger.service';
import { GenerateVisitorCodeDto } from './dto/generate-visitor-code.dto';
import { ValidateVisitorCodeDto } from './dto/validate-visitor-code.dto';
import { QrCodeService } from './qr-code.service';
import { generateCode } from './utils/generate-code';

@Injectable()
export class VisitorCodeService {
  constructor(
    private prisma: PrismaService,
    private qrCodeService: QrCodeService,
    @Inject(forwardRef(() => MessengerService))
    private messengerService: MessengerService
  ) { }

  async generateCode(generateVisitorCodeDto: GenerateVisitorCodeDto) {
    const { occupantId, validHours = 2, expiresAt, ...codeData } = generateVisitorCodeDto;

    if (!occupantId) {
      throw new BadRequestException('occupantId must be provided');
    }

    // Get occupant details
    const occupant = await this.prisma.occupant.findUnique({
      where: { id: occupantId },
      include: { estate: true, unit: true, primaryOccupant: true },
    });

    if (!occupant) {
      throw new NotFoundException('Occupant not found');
    }

    if (!occupant.isActive) {
      throw new BadRequestException('Occupant is not active');
    }

    const estateId = occupant.estateId;
    const unitId = occupant.unitId;

    // Calculate expiration time
    const expiration = expiresAt
      ? new Date(expiresAt)
      : new Date(Date.now() + validHours * 60 * 60 * 1000);

    // Generate unique code
    let code: string;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      code = generateCode();
      const existingCode = await this.prisma.visitorCode.findUnique({
        where: { code },
      });
      isUnique = !existingCode;
      attempts++;
    }

    if (!isUnique) {
      throw new BadRequestException('Unable to generate unique code. Please try again.');
    }

    const visitorCode = await this.prisma.visitorCode.create({
      data: {
        code,
        ...codeData,
        estateId,
        occupantId,
        expiresAt: expiration,
      },
      include: {
        occupant: {
          include: {
            unit: true,
            estate: true,
            primaryOccupant: true,
          },
        },
      },
    });

    // Generate QR codes for the visitor code
    const qrCodes = await this.qrCodeService.generateVisitorQRCode(visitorCode);
    const whatsappQR = await this.qrCodeService.generateWhatsAppShareableQR(visitorCode);

    // Send visitor code via WhatsApp if visitor phone is provided
    let whatsappSent = false;
    if (visitorCode.visitorPhone) {
      console.log(`📱 Visitor phone provided: ${visitorCode.visitorPhone}`);
      console.log(`📱 Attempting to send WhatsApp to visitor...`);
      try {
        const message =
          `🎉 *Visitor Code Generated!*\n\n` +
          `👤 Name: ${visitorCode.visitorName}\n` +
          `🔑 Code: *${visitorCode.code}*\n` +
          `🏢 Estate: ${occupant.estate.name}\n` +
          `📍 Unit: ${occupant.unit?.block} ${occupant.unit?.flat}\n` +
          `⏰ Valid until: ${expiration.toLocaleString()}\n\n` +
          `Show this code at the gate for entry.`;

        const messageId = await this.messengerService.sendText({
          to: visitorCode.visitorPhone,
          body: message
        });
        whatsappSent = !!messageId;
        console.log(`📱 Visitor WhatsApp send result: ${whatsappSent ? 'SUCCESS' : 'FAILED'}`);
      } catch (error) {
        console.error('❌ Failed to send WhatsApp message to visitor:', error);
        whatsappSent = false;
      }
    } else {
      console.log('📱 No visitor phone provided, skipping visitor WhatsApp send');
    }

    // QR code will be included in the main WhatsApp response, not sent separately
    console.log(`📱 QR code will be included in main response (not sent separately)`);

    return {
      ...visitorCode,
      generatedBy: occupant.type.toLowerCase(),
      message: `Visitor code generated successfully. Valid until ${expiration.toLocaleString()}${whatsappSent ? ' (WhatsApp sent to visitor)' : ''}`,
      whatsappSent,
      qrCodes: {
        verification: qrCodes.qrCodeDataURL,
        verificationSVG: qrCodes.qrCodeSVG,
        whatsappShare: whatsappQR.qrCodeDataURL,
        whatsappShareLink: whatsappQR.whatsappShareLink,
        shareMessage: whatsappQR.shareMessage
      }
    };
  }

  async validateCode(validateVisitorCodeDto: ValidateVisitorCodeDto) {
    const { code, visitorName } = validateVisitorCodeDto;

    console.log('🔍 Validating visitor code:', { code, visitorName });
    console.log('🔍 Full validation DTO:', validateVisitorCodeDto);

    const visitorCode = await this.prisma.visitorCode.findUnique({
      where: { code },
      include: {
        occupant: {
          include: {
            unit: true,
            estate: true,
            primaryOccupant: true,
          },
        },
      },
    });

    console.log('📋 Found visitor code:', visitorCode ? {
      id: visitorCode.id,
      code: visitorCode.code,
      visitorName: visitorCode.visitorName,
      status: visitorCode.status,
      expiresAt: visitorCode.expiresAt,
      occupantName: visitorCode.occupant?.name
    } : 'NOT FOUND');

    if (!visitorCode) {
      console.log('❌ Validation failed: Code not found');
      return {
        valid: false,
        message: 'Invalid visitor code',
      };
    }

    // Check if code is expired
    const now = new Date();
    const expiresAt = new Date(visitorCode.expiresAt);
    const DEBUG_MODE = process.env.NODE_ENV === 'development';

    console.log('⏰ Time check:', { now: now.toISOString(), expiresAt: expiresAt.toISOString(), expired: now > expiresAt, debugMode: DEBUG_MODE });

    if (now > expiresAt && !DEBUG_MODE) {
      console.log('❌ Validation failed: Code expired');
      await this.prisma.visitorCode.update({
        where: { id: visitorCode.id },
        data: { status: 'EXPIRED' },
      });

      return {
        valid: false,
        message: 'Visitor code has expired',
      };
    }

    if (DEBUG_MODE && now > expiresAt) {
      console.log('🐛 DEBUG MODE: Expired code allowed for testing');
    }

    // Check if code is already used
    console.log('🔄 Status check:', { status: visitorCode.status });
    if (visitorCode.status === 'USED') {
      console.log('❌ Validation failed: Code already used');
      return {
        valid: false,
        message: 'Visitor code has already been used',
      };
    }

    // Check if code is revoked
    if (visitorCode.status === 'REVOKED') {
      console.log('❌ Validation failed: Code revoked');
      return {
        valid: false,
        message: 'Visitor code has been revoked',
      };
    }

    // Check visitor name (case insensitive and flexible matching) - OPTIONAL
    if (visitorName) {
      const codeVisitorName = visitorCode.visitorName.toLowerCase().trim();
      const inputVisitorName = visitorName.toLowerCase().trim();

      console.log('👤 Name comparison:', {
        codeVisitorName,
        inputVisitorName,
        exactMatch: codeVisitorName === inputVisitorName,
        codeIncludesInput: codeVisitorName.includes(inputVisitorName),
        inputIncludesCode: inputVisitorName.includes(codeVisitorName),
        firstNameMatch: codeVisitorName.split(' ')[0] === inputVisitorName.split(' ')[0]
      });

      // Allow partial matches and common variations
      const isNameMatch = DEBUG_MODE || // Skip name check in debug mode
        codeVisitorName === inputVisitorName ||
        codeVisitorName.includes(inputVisitorName) ||
        inputVisitorName.includes(codeVisitorName) ||
        codeVisitorName.split(' ')[0] === inputVisitorName.split(' ')[0]; // First name match

      if (!isNameMatch) {
        console.log('❌ Validation failed: Name mismatch');
        return {
          valid: false,
          message: `Visitor name does not match. Expected: ${visitorCode.visitorName}`,
        };
      }

      if (DEBUG_MODE && codeVisitorName !== inputVisitorName) {
        console.log('🐛 DEBUG MODE: Name check bypassed');
      }
    } else {
      console.log('ℹ️ Name check skipped (name not provided)');
    }

    console.log('✅ All validation checks passed, marking code as used');

    // Mark code as used
    const updatedCode = await this.prisma.visitorCode.update({
      where: { id: visitorCode.id },
      data: {
        status: 'USED',
        usedAt: new Date(),
      },
    });

    console.log('📝 Code marked as used:', { id: updatedCode.id, status: updatedCode.status });

    // Notify resident via WhatsApp when visitor enters
    if (visitorCode.occupant?.phone) {
      try {
        console.log('📱 Sending WhatsApp notification to resident');
        const message =
          `${visitorCode.visitorName} is on the way to your place.\n\n` +
          `Please notify us when they're leaving.`;

        await this.messengerService.sendText({
          to: visitorCode.occupant.phone,
          body: message
        });
        console.log('✅ Resident notification sent successfully');
      } catch (error) {
        console.error('Failed to notify resident of visitor entry:', error);
      }
    }

    console.log('✅ Validation successful - Access granted');
    return {
      valid: true,
      message: `✅ Access granted! ${visitorCode.visitorName} is now entering the estate. The resident has been notified.`,
      visitorCode: {
        ...visitorCode,
        status: 'USED',
        usedAt: new Date(),
      },
    };
  }

  async findByOccupant(occupantId: string) {
    return this.prisma.visitorCode.findMany({
      where: { occupantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async findByEstate(estateId: string, status?: string) {
    const where: any = { estateId };

    if (status) {
      where.status = status.toUpperCase();
    }

    return this.prisma.visitorCode.findMany({
      where,
      include: {
        occupant: {
          include: {
            unit: true,
            primaryOccupant: {
              select: { name: true, phone: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async findOne(id: string) {
    return this.prisma.visitorCode.findUnique({
      where: { id },
      include: {
        occupant: {
          include: {
            unit: true,
            estate: true,
            primaryOccupant: true,
          },
        },
      },
    });
  }

  async findByCode(code: string) {
    return this.prisma.visitorCode.findUnique({
      where: { code },
      include: {
        occupant: {
          include: {
            unit: true,
            estate: true,
            primaryOccupant: true,
          },
        },
      },
    });
  }

  async revokeCode(id: string) {
    return this.prisma.visitorCode.update({
      where: { id },
      data: { status: 'REVOKED' },
    });
  }

  async remove(id: string) {
    return this.prisma.visitorCode.delete({
      where: { id },
    });
  }

  async getOccupantCodes(occupantId: string) {
    const codes = await this.prisma.visitorCode.findMany({
      where: { occupantId },
      orderBy: { createdAt: 'desc' },
      include: {
        estate: { select: { name: true } },
        occupant: {
          select: { name: true, type: true },
        },
      },
    });

    return {
      success: true,
      data: codes,
    };
  }

  async getEstateCodes(estateId: string, status?: string) {
    const where: any = { estateId };

    if (status && ['ACTIVE', 'USED', 'EXPIRED', 'REVOKED'].includes(status)) {
      where.status = status;
    }

    const codes = await this.prisma.visitorCode.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        occupant: {
          include: {
            unit: true,
            primaryOccupant: {
              select: { name: true, phone: true },
            },
          },
        },
      },
    });

    return {
      success: true,
      data: codes,
    };
  }

  async cancelCode(id: string) {
    const visitorCode = await this.prisma.visitorCode.findUnique({
      where: { id },
    });

    if (!visitorCode) {
      throw new NotFoundException('Visitor code not found');
    }

    if (visitorCode.status === 'USED') {
      throw new BadRequestException('Cannot cancel a used visitor code');
    }

    const updated = await this.prisma.visitorCode.update({
      where: { id },
      data: { status: 'REVOKED' },
    });

    return {
      success: true,
      message: 'Visitor code cancelled successfully',
      data: updated,
    };
  }

  async getCodeDetails(id: string) {
    const visitorCode = await this.prisma.visitorCode.findUnique({
      where: { id },
      include: {
        occupant: {
          include: {
            unit: true,
            primaryOccupant: true,
          },
        },
        estate: true,
      },
    });

    if (!visitorCode) {
      throw new NotFoundException('Visitor code not found');
    }

    return {
      success: true,
      data: visitorCode,
    };
  }

  async markVisitorDeparture(id: string) {
    const visitorCode = await this.prisma.visitorCode.findUnique({
      where: { id },
      include: {
        occupant: {
          include: {
            unit: true,
            estate: true,
          },
        },
      },
    });

    if (!visitorCode) {
      throw new NotFoundException('Visitor code not found');
    }

    if (visitorCode.status !== 'USED') {
      throw new BadRequestException('Visitor must enter first before departure can be recorded');
    }

    // Check if departure already recorded (using purpose field as temporary storage)
    if (visitorCode.purpose && visitorCode.purpose.includes('DEPARTED:')) {
      throw new BadRequestException('Visitor departure already recorded');
    }

    // Store departure time in purpose field temporarily
    const departureTime = new Date().toISOString();
    const updatedPurpose = visitorCode.purpose
      ? `${visitorCode.purpose} | DEPARTED:${departureTime}`
      : `DEPARTED:${departureTime}`;

    const updated = await this.prisma.visitorCode.update({
      where: { id },
      data: { purpose: updatedPurpose },
      include: {
        occupant: {
          include: {
            unit: true,
            estate: true,
          },
        },
      },
    });

    // Send WhatsApp notification to resident about departure
    if (visitorCode.occupant?.phone) {
      try {
        const departureMessage =
          `${visitorCode.visitorName} has left. Thank you for notifying us!`;

        await this.messengerService.sendText({
          to: visitorCode.occupant.phone,
          body: departureMessage
        });
      } catch (error) {
        console.error('Failed to send departure notification:', error);
      }
    }

    return {
      success: true,
      message: 'Visitor departure recorded successfully',
      data: updated,
    };
  }

  // Cleanup expired codes (can be called by a cron job)
  async cleanupExpiredCodes() {
    const result = await this.prisma.visitorCode.updateMany({
      where: {
        expiresAt: { lt: new Date() },
        status: 'ACTIVE',
      },
      data: { status: 'EXPIRED' },
    });

    return {
      message: `${result.count} expired codes updated`,
      count: result.count,
    };
  }
}