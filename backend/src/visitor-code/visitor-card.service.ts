import { Injectable, Logger } from '@nestjs/common';
import { createCanvas, loadImage, registerFont } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import * as QRCode from 'qrcode';

type FontWeight = 'normal' | 'bold';

function registerFontIfExists(
    fontPath: string,
    family: string,
    weight: FontWeight = 'normal',
) {
    if (!fs.existsSync(fontPath)) {
        console.warn(`⚠️ Font not found: ${fontPath}`);
        return;
    }

    registerFont(fontPath, { family, weight });
    console.log(`✅ Registered font: ${family} (${weight}) -> ${fontPath}`);
}

// Register fonts once at module load
try {
    registerFontIfExists(
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        'App Sans',
        'normal',
    );
    registerFontIfExists(
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
        'App Sans',
        'bold',
    );
} catch (error: any) {
    console.error('Warning: Could not initialize fonts:', error.message);
}

@Injectable()
export class VisitorCardService {
    private readonly logger = new Logger(VisitorCardService.name);
    private readonly outputDir = path.join(process.cwd(), 'uploads', 'visitor-cards');
    private readonly fontFamily = 'App Sans';

    constructor() {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    async generateVisitorCard(visitorCodeData: any): Promise<string> {
        try {
            this.logger.log(
                `🎨 Starting card generation for visitor: ${visitorCodeData.visitorName}`,
            );

            const width = 800;
            const height = 1100;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');
            const cornerRadius = 0;

            // Background
            ctx.fillStyle = '#ffffff';
            this.roundRect(ctx, 0, 0, width, height, cornerRadius);
            ctx.fill();

            // Top gradient section
            const topHeight = 520;
            const gradient = ctx.createLinearGradient(0, 0, 0, topHeight);
            gradient.addColorStop(0, '#1e293b');
            gradient.addColorStop(1, '#334155');
            ctx.fillStyle = gradient;
            this.roundRect(ctx, 0, 0, width, topHeight, cornerRadius, true, false);
            ctx.fill();

            // QR section
            const qrSize = 300;
            const qrY = 110;
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const verificationUrl =
                `${frontendUrl}/verify-visitor?` +
                `code=${visitorCodeData.code}&visitor=${encodeURIComponent(
                    visitorCodeData.visitorName,
                )}`;

            const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
                errorCorrectionLevel: 'H',
                margin: 1,
                width: qrSize,
                color: {
                    dark: '#ffffff',
                    light: '#1e293b',
                },
            });

            const qrImage = await loadImage(qrDataUrl);
            const qrX = (width - qrSize) / 2;
            ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
            this.logger.debug('QR code drawn successfully');

            // VISITOR
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold 56px "${this.fontFamily}"`;
            ctx.textAlign = 'center';
            ctx.fillText('V I S I T O R', width / 2, qrY + qrSize + 70);

            // Bottom content
            const bottomY = topHeight + 40;

            // Visitor name
            ctx.fillStyle = '#1e293b';
            ctx.font = `bold 42px "${this.fontFamily}"`;
            ctx.textAlign = 'center';
            ctx.fillText(
                String(visitorCodeData.visitorName || '').toUpperCase(),
                width / 2,
                bottomY,
            );

            // Access code
            const codeY = bottomY + 70;
            ctx.fillStyle = '#64748b';
            ctx.font = `20px "${this.fontFamily}"`;
            ctx.fillText('ACCESS CODE', width / 2, codeY);

            ctx.fillStyle = '#1e293b';
            ctx.font = `bold 52px "${this.fontFamily}"`;
            ctx.fillText(String(visitorCodeData.code || ''), width / 2, codeY + 55);

            // Details
            const detailsY = codeY + 120;
            const lineHeight = 50;
            const labelX = 100;
            const valueX = 350;

            ctx.textAlign = 'left';

            const unitInfo = `${visitorCodeData.occupant?.unit?.block || ''} ${visitorCodeData.occupant?.unit?.flat || ''
                }`.trim();

            if (unitInfo) {
                this.drawDetailRow(ctx, 'Unit:', unitInfo, labelX, valueX, detailsY);
            }

            const hostName =
                visitorCodeData.occupant?.primaryOccupant?.name ||
                visitorCodeData.occupant?.name ||
                'Resident';

            this.drawDetailRow(
                ctx,
                'Host:',
                hostName,
                labelX,
                valueX,
                detailsY + lineHeight,
            );

            const expiryDate = new Date(visitorCodeData.expiresAt);
            const expiryText = expiryDate.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });

            this.drawDetailRow(
                ctx,
                'Valid Until:',
                expiryText,
                labelX,
                valueX,
                detailsY + lineHeight * 2,
            );

            // Footer
            const footerY = height - 120;

            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(80, footerY - 30);
            ctx.lineTo(width - 80, footerY - 30);
            ctx.stroke();

            const estateName = String(visitorCodeData.occupant?.estate?.name || '').toUpperCase();
            if (estateName) {
                ctx.fillStyle = '#1e293b';
                ctx.font = `bold 14px "${this.fontFamily}"`;
                ctx.textAlign = 'center';
                ctx.fillText(estateName, width / 2, footerY + 45);
            }

            // Save file
            const filename = `visitor-${visitorCodeData.code}-${Date.now()}.png`;
            const filepath = path.join(this.outputDir, filename);
            const buffer = canvas.toBuffer('image/png');

            fs.writeFileSync(filepath, buffer);

            this.logger.log(`✅ Generated visitor card: ${filename} (${buffer.length} bytes)`);
            return filepath;
        } catch (error: any) {
            this.logger.error(`Failed to generate visitor card: ${error.message}`);
            throw error;
        }
    }

    async generateBarcodeCard(visitorCodeData: any): Promise<string> {
        try {
            const width = 800;
            const height = 400;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');

            // Background
            ctx.fillStyle = '#f7fafc';
            ctx.fillRect(0, 0, width, height);

            // Card
            ctx.fillStyle = '#ffffff';
            this.roundRect(ctx, 20, 20, width - 40, height - 40, 15);
            ctx.fill();

            ctx.strokeStyle = '#667eea';
            ctx.lineWidth = 3;
            this.roundRect(ctx, 20, 20, width - 40, height - 40, 15);
            ctx.stroke();

            // Title
            ctx.fillStyle = '#667eea';
            ctx.font = `bold 28px "${this.fontFamily}"`;
            ctx.textAlign = 'center';
            ctx.fillText('VISITOR ACCESS CODE', width / 2, 80);

            // Visitor name
            ctx.fillStyle = '#1a202c';
            ctx.font = `bold 24px "${this.fontFamily}"`;
            ctx.fillText(String(visitorCodeData.visitorName || ''), width / 2, 130);

            // Barcode-style code
            const code = String(visitorCodeData.code || '');
            const barcodeY = 180;
            const barWidth = 8;
            const barSpacing = 4;
            const totalWidth = code.length * (barWidth + barSpacing);
            let startX = (width - totalWidth) / 2;

            ctx.fillStyle = '#1a202c';
            for (let i = 0; i < code.length; i++) {
                const charCode = code.charCodeAt(i);
                const barHeight = 80 + (charCode % 40);
                ctx.fillRect(startX, barcodeY, barWidth, barHeight);
                startX += barWidth + barSpacing;
            }

            // Code text
            ctx.font = `bold 36px "${this.fontFamily}"`;
            ctx.fillText(code, width / 2, barcodeY + 120);

            // Expiry
            const expiryDate = new Date(visitorCodeData.expiresAt);
            ctx.fillStyle = '#718096';
            ctx.font = `16px "${this.fontFamily}"`;
            ctx.fillText(
                `Valid until: ${expiryDate.toLocaleString()}`,
                width / 2,
                barcodeY + 160,
            );

            // Save file
            const filename = `barcode-${visitorCodeData.code}-${Date.now()}.png`;
            const filepath = path.join(this.outputDir, filename);
            const buffer = canvas.toBuffer('image/png');

            fs.writeFileSync(filepath, buffer);

            this.logger.log(`✅ Generated barcode card: ${filename}`);
            return filepath;
        } catch (error: any) {
            this.logger.error(`Failed to generate barcode card: ${error.message}`);
            throw error;
        }
    }

    async cleanupOldCards(): Promise<number> {
        try {
            const files = fs.readdirSync(this.outputDir);
            const now = Date.now();
            const maxAge = 24 * 60 * 60 * 1000;
            let deleted = 0;

            for (const file of files) {
                const filepath = path.join(this.outputDir, file);
                const stats = fs.statSync(filepath);
                const age = now - stats.mtimeMs;

                if (age > maxAge) {
                    fs.unlinkSync(filepath);
                    deleted++;
                }
            }

            if (deleted > 0) {
                this.logger.log(`Cleaned up ${deleted} old visitor cards`);
            }

            return deleted;
        } catch (error: any) {
            this.logger.error(`Failed to cleanup old cards: ${error.message}`);
            return 0;
        }
    }

    private drawDetailRow(
        ctx: CanvasRenderingContext2D | any,
        label: string,
        value: string,
        labelX: number,
        valueX: number,
        y: number,
    ) {
        ctx.fillStyle = '#64748b';
        ctx.font = `22px "${this.fontFamily}"`;
        ctx.fillText(label, labelX, y);

        ctx.fillStyle = '#1e293b';
        ctx.font = `bold 24px "${this.fontFamily}"`;
        ctx.fillText(value, valueX, y);
    }

    private roundRect(
        ctx: any,
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number,
        topOnly = false,
        bottomOnly = false,
    ) {
        ctx.beginPath();

        if (topOnly) {
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height);
            ctx.lineTo(x, y + height);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
        } else if (bottomOnly) {
            ctx.moveTo(x, y);
            ctx.lineTo(x + width, y);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y);
        } else {
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
        }

        ctx.closePath();
    }
}