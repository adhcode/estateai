import { Body, Controller, Get, Inject, Param, Post, Query, forwardRef } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { MessengerService } from '../whatsapp/outbound/messenger.service';
import { QrCodeService } from './qr-code.service';
import { VisitorCodeService } from './visitor-code.service';

@Controller('security')
export class SecurityVerificationController {
  constructor(
    private readonly visitorCodeService: VisitorCodeService,
    private readonly qrCodeService: QrCodeService,
    @Inject(forwardRef(() => MessengerService))
    private readonly messengerService: MessengerService,
  ) { }

  @Public()
  @Get('verify/:code')
  async verifyCode(@Param('code') code: string, @Query('visitorName') visitorName?: string) {
    const result = await this.visitorCodeService.validateCode({
      code,
      visitorName: visitorName || 'Visitor',
    });

    // If access is granted, send confirmation to both visitor and resident
    if (result.valid && result.visitorCode) {
      try {
        // Send confirmation to resident (already handled in validateCode)
        // Send confirmation to visitor if they have a phone number
        if (result.visitorCode.visitorPhone) {
          await this.sendAccessGrantedConfirmation(result.visitorCode);
        }
      } catch (error) {
        console.error('Failed to send access confirmation:', error);
      }
    }

    return {
      success: result.valid,
      message: result.message,
      visitorCode: result.valid ? result.visitorCode : null,
      estate: result.valid ? result.visitorCode.occupant.estate : null,
      unit: result.valid ? result.visitorCode.occupant.unit : null,
      occupant: result.valid ? {
        name: result.visitorCode.occupant.name,
        type: result.visitorCode.occupant.type,
      } : null,
    };
  }

  private async sendAccessGrantedConfirmation(visitorCode: any) {
    try {
      const confirmationMessage =
        `🎉 *Access Granted!* 🎉\n\n` +
        `✅ Welcome to ${visitorCode.occupant?.estate?.name || 'the estate'}, ${visitorCode.visitorName}!\n\n` +
        `🏢 You're visiting: ${visitorCode.occupant?.name}\n` +
        `📍 Unit: ${visitorCode.occupant?.unit?.block} ${visitorCode.occupant?.unit?.flat}\n` +
        `⏰ Entry time: ${new Date().toLocaleString()}\n\n` +
        `🚪 Please proceed to the unit. The resident has been notified of your arrival.\n\n` +
        `💬 Have a great visit! Reply if you need any assistance.`;

      await this.messengerService.sendText({
        to: visitorCode.visitorPhone,
        body: confirmationMessage
      });
      console.log(`📱 Access confirmation sent to visitor: ${visitorCode.visitorPhone}`);
    } catch (error) {
      console.error('Failed to send access confirmation to visitor:', error);
    }
  }

  @Public()
  @Post('scan')
  async scanQrCode(@Body() body: { qrData: string }) {
    try {
      // Parse QR data
      const data = JSON.parse(body.qrData);

      if (data.action === 'verify' && data.code) {
        return this.verifyCode(data.code);
      }

      return {
        success: false,
        message: 'Invalid QR code format',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error processing QR code',
        error: error.message,
      };
    }
  }

  @Get('dashboard/:estateId')
  async getSecurityDashboard(@Param('estateId') estateId: string) {
    // Get today's visitor codes
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const codes = await this.visitorCodeService.getEstateCodes(estateId);

    // Filter and group by status
    const active = codes.data.filter(code => code.status === 'ACTIVE');
    const used = codes.data.filter(code => code.status === 'USED');
    const expired = codes.data.filter(code => code.status === 'EXPIRED');
    const revoked = codes.data.filter(code => code.status === 'REVOKED');

    // Get today's codes
    const todayCodes = codes.data.filter(code => {
      const codeDate = new Date(code.createdAt);
      return codeDate >= today;
    });

    return {
      success: true,
      data: {
        summary: {
          total: codes.data.length,
          active: active.length,
          used: used.length,
          expired: expired.length,
          revoked: revoked.length,
          today: todayCodes.length,
        },
        recentCodes: codes.data.slice(0, 10),
      },
    };
  }
}