import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';

export interface VisitorQRData {
  code: string;
  visitorName: string;
  estateId: string;
  unitInfo: string;
  expiresAt: string;
  purpose?: string;
}

@Injectable()
export class QrCodeService {
  async generateVisitorQRCode(visitorCodeData: any): Promise<{
    qrCodeDataURL: string;
    qrCodeSVG: string;
    shareableData: VisitorQRData;
  }> {
    // Prepare data for QR code
    const qrData: VisitorQRData = {
      code: visitorCodeData.code,
      visitorName: visitorCodeData.visitorName,
      estateId: visitorCodeData.estateId,
      unitInfo: `${visitorCodeData.occupant?.unit?.block} ${visitorCodeData.occupant?.unit?.flat}`,
      expiresAt: visitorCodeData.expiresAt,
      purpose: visitorCodeData.purpose || 'Visit'
    };

    // Create verification URL that can be scanned
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-visitor?` +
      `code=${qrData.code}&visitor=${encodeURIComponent(qrData.visitorName)}&estate=${qrData.estateId}`;

    try {
      // Generate QR code as Data URL (base64 image)
      const qrCodeDataURL = await QRCode.toDataURL(verificationUrl, {
        errorCorrectionLevel: 'M',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });

      // Generate QR code as SVG
      const qrCodeSVG = await QRCode.toString(verificationUrl, {
        type: 'svg',
        errorCorrectionLevel: 'M',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });

      return {
        qrCodeDataURL,
        qrCodeSVG,
        shareableData: qrData
      };
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error.message}`);
    }
  }

  async generateWhatsAppShareableQR(visitorCodeData: any): Promise<{
    qrCodeDataURL: string;
    whatsappShareLink: string;
    shareMessage: string;
  }> {
    // Create a comprehensive share message
    const shareMessage = 
      `🏠 *${visitorCodeData.occupant?.estate?.name}* - Visitor Access\n\n` +
      `👤 Visitor: *${visitorCodeData.visitorName}*\n` +
      `🔑 Access Code: *${visitorCodeData.code}*\n` +
      `🏢 Unit: ${visitorCodeData.occupant?.unit?.block} ${visitorCodeData.occupant?.unit?.flat}\n` +
      `⏰ Valid Until: ${new Date(visitorCodeData.expiresAt).toLocaleString()}\n\n` +
      `📍 Address: ${visitorCodeData.occupant?.estate?.address}\n` +
      `📞 Estate Contact: ${visitorCodeData.occupant?.estate?.phoneNumber}\n\n` +
      `🚪 Present this code at the gate for entry.`;

    // Create WhatsApp share link
    const whatsappShareLink = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;

    // Generate QR code for the WhatsApp share link
    const qrCodeDataURL = await QRCode.toDataURL(whatsappShareLink, {
      errorCorrectionLevel: 'M',
      margin: 1,
      color: {
        dark: '#25D366', // WhatsApp green
        light: '#FFFFFF'
      },
      width: 256
    });

    return {
      qrCodeDataURL,
      whatsappShareLink,
      shareMessage
    };
  }

  // Generate a simple verification QR that security can scan
  async generateSecurityVerificationQR(code: string): Promise<string> {
    const verificationData = {
      action: 'verify',
      code: code,
      timestamp: new Date().toISOString()
    };

    return await QRCode.toDataURL(JSON.stringify(verificationData), {
      errorCorrectionLevel: 'H',
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 200
    });
  }
}