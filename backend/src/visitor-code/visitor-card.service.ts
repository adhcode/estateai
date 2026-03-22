import { Injectable, Logger } from '@nestjs/common';
import { createCanvas, loadImage, registerFont } from 'canvas';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as QRCode from 'qrcode';

// Initialize fontconfig and register system fonts BEFORE Canvas is used
try {
    process.env.FONTCONFIG_PATH = process.env.FONTCONFIG_PATH || '/etc/fonts';
    process.env.FONTCONFIG_FILE = process.env.FONTCONFIG_FILE || '/etc/fonts/fonts.conf';

    // Rebuild font cache at module load time
    execSync('fc-cache -f', { stdio: 'ignore' });

    // Register system-installed Liberation Sans fonts explicitly
    const systemFontPaths = [
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    ];

    for (const fontPath of systemFontPaths) {
        if (fs.existsSync(fontPath)) {
            const weight = fontPath.includes('Bold') ? 'bold' : 'normal';
            registerFont(fontPath, { family: 'Liberation Sans', weight });
            console.log(`✅ Registered system font: ${fontPath}`);
        }
    }
} catch (error) {
    console.error('Warning: Could not initialize fonts:', error.message);
}

/**
 * Visitor Card Service
 * Generates beautiful, branded visitor access cards with QR codes
 */
@Injectable()
export class VisitorCardService {
    private readonly logger = new Logger(VisitorCardService.name);
    private readonly outputDir = path.join(process.cwd(), 'uploads', 'visitor-cards');

    constructor() {
        // Ensure output directory exists
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    /**
     * Generate a beautiful visitor access card with QR code
     * Badge-style design with dark gradient top and clean white bottom
     */
    async generateVisitorCard(visitorCodeData: any): Promise<string> {
        try {
            this.logger.log(`🎨 Starting card generation for visitor: ${visitorCodeData.visitorName}`);

            // Card dimensions - Badge style (portrait)
            const width = 800;
            const height = 1100;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');
            const cornerRadius = 0;

            // Main card background (white)
            ctx.fillStyle = '#ffffff';
            this.roundRect(ctx, 0, 0, width, height, cornerRadius);
            ctx.fill();

            // Top section - Dark gradient with rounded top corners
            const topHeight = 520;
            const gradient = ctx.createLinearGradient(0, 0, 0, topHeight);
            gradient.addColorStop(0, '#1e293b'); // Dark slate
            gradient.addColorStop(1, '#334155'); // Lighter slate
            ctx.fillStyle = gradient;
            this.roundRect(ctx, 0, 0, width, topHeight, cornerRadius, true, false);
            ctx.fill();



            // QR Code section
            const qrSize = 300;
            const qrY = 110;
            const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-visitor?` +
                `code=${visitorCodeData.code}&visitor=${encodeURIComponent(visitorCodeData.visitorName)}`;

            const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
                errorCorrectionLevel: 'H',
                margin: 1,
                width: qrSize,
                color: {
                    dark: '#ffffff',
                    light: '#1e293b'
                }
            });

            // Load and draw QR code
            const qrImage = await loadImage(qrDataUrl);
            const qrX = (width - qrSize) / 2;
            ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

            this.logger.debug('QR code drawn successfully');

            // "VISITOR" text below QR (with manual letter spacing)
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 56px Liberation Sans';
            ctx.textAlign = 'center';
            const visitorText = 'V I S I T O R'; // Manual spacing

            // Test if font is working by measuring text
            const metrics = ctx.measureText(visitorText);
            this.logger.debug(`Text metrics - width: ${metrics.width}, font: ${ctx.font}`);

            ctx.fillText(visitorText, width / 2, qrY + qrSize + 70);

            this.logger.debug('VISITOR text drawn');

            // Bottom white section starts here
            const bottomY = topHeight + 40;

            // Visitor Name - Large and prominent
            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 42px Liberation Sans';
            ctx.textAlign = 'center';
            ctx.fillText(visitorCodeData.visitorName.toUpperCase(), width / 2, bottomY);

            this.logger.debug(`Visitor name drawn: ${visitorCodeData.visitorName}`);

            // Access Code with label
            const codeY = bottomY + 70;
            ctx.fillStyle = '#64748b';
            ctx.font = '20px Liberation Sans';
            ctx.fillText('ACCESS CODE', width / 2, codeY);

            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 52px Liberation Sans';
            ctx.fillText(visitorCodeData.code, width / 2, codeY + 55);

            this.logger.debug(`Access code drawn: ${visitorCodeData.code}`);

            // Details section with clean layout
            const detailsY = codeY + 120;
            const lineHeight = 50;
            ctx.textAlign = 'left';
            const labelX = 100;
            const valueX = 350;

            // Unit
            const unitInfo = `${visitorCodeData.occupant?.unit?.block || ''} ${visitorCodeData.occupant?.unit?.flat || ''}`.trim();
            if (unitInfo) {
                ctx.fillStyle = '#64748b';
                ctx.font = '22px Liberation Sans';
                ctx.fillText('Unit:', labelX, detailsY);
                ctx.fillStyle = '#1e293b';
                ctx.font = 'bold 24px Liberation Sans';
                ctx.fillText(unitInfo, valueX, detailsY);
                this.logger.debug(`Unit info drawn: ${unitInfo}`);
            }

            // Host
            const hostName = visitorCodeData.occupant?.primaryOccupant?.name ||
                visitorCodeData.occupant?.name || 'Resident';
            ctx.fillStyle = '#64748b';
            ctx.font = '22px Liberation Sans';
            ctx.fillText('Host:', labelX, detailsY + lineHeight);
            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 24px Liberation Sans';
            ctx.fillText(hostName, valueX, detailsY + lineHeight);

            this.logger.debug(`Host name drawn: ${hostName}`);

            // Valid Until
            const expiryDate = new Date(visitorCodeData.expiresAt);
            ctx.fillStyle = '#64748b';
            ctx.font = '22px Liberation Sans';
            ctx.fillText('Valid Until:', labelX, detailsY + lineHeight * 2);
            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 24px Liberation Sans';
            const expiryText = expiryDate.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            ctx.fillText(expiryText, valueX, detailsY + lineHeight * 2);

            this.logger.debug(`Expiry date drawn: ${expiryText}`);

            // Footer section
            const footerY = height - 120;

            // Divider line
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(80, footerY - 30);
            ctx.lineTo(width - 80, footerY - 30);
            ctx.stroke();

            // Footer text
            ctx.fillStyle = '#64748b';
            ctx.font = '18px Liberation Sans';
            ctx.textAlign = 'center';
            ctx.fillText('', width / 2, footerY);

            // Estate logo placeholder (circles like in the image)
            const logoY = footerY + 40;
            const circleRadius = 35;
            const circleSpacing = 10;





            // Estate name in logo - FIXED to show properly
            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 14px Liberation Sans';
            const estateName = visitorCodeData.occupant?.estate?.name || '';
            ctx.fillText(estateName.toUpperCase(), width / 2, logoY + 5);

            this.logger.debug(`Estate name drawn: ${estateName}`);

            // Save to file
            const filename = `visitor-${visitorCodeData.code}-${Date.now()}.png`;
            const filepath = path.join(this.outputDir, filename);
            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(filepath, buffer);

            this.logger.log(`✅ Generated visitor card: ${filename} (${buffer.length} bytes)`);
            return filepath;
        } catch (error) {
            this.logger.error(`Failed to generate visitor card: ${error.message}`);
            throw error;
        }
    }

    /**
     * Generate a simple barcode card (alternative to QR)
     */
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

            // Border
            ctx.strokeStyle = '#667eea';
            ctx.lineWidth = 3;
            this.roundRect(ctx, 20, 20, width - 40, height - 40, 15);
            ctx.stroke();

            // Title
            ctx.fillStyle = '#667eea';
            ctx.font = 'bold 28px Montserrat';
            ctx.textAlign = 'center';
            ctx.fillText('VISITOR ACCESS CODE', width / 2, 80);

            // Visitor name
            ctx.fillStyle = '#1a202c';
            ctx.font = 'bold 24px Montserrat';
            ctx.fillText(visitorCodeData.visitorName, width / 2, 130);

            // Code - Barcode style
            const code = visitorCodeData.code;
            const barcodeY = 180;
            const barWidth = 8;
            const barSpacing = 4;
            const totalWidth = code.length * (barWidth + barSpacing);
            let startX = (width - totalWidth) / 2;

            ctx.fillStyle = '#1a202c';
            for (let i = 0; i < code.length; i++) {
                const charCode = code.charCodeAt(i);
                const barHeight = 80 + (charCode % 40); // Variable height for visual effect
                ctx.fillRect(startX, barcodeY, barWidth, barHeight);
                startX += barWidth + barSpacing;
            }

            // Code text
            ctx.font = 'bold 36px monospace';
            ctx.fillText(code, width / 2, barcodeY + 120);

            // Expiry
            ctx.fillStyle = '#718096';
            ctx.font = '16px Montserrat';
            const expiryDate = new Date(visitorCodeData.expiresAt);
            ctx.fillText(`Valid until: ${expiryDate.toLocaleString()}`, width / 2, barcodeY + 160);

            // Save
            const filename = `barcode-${visitorCodeData.code}-${Date.now()}.png`;
            const filepath = path.join(this.outputDir, filename);
            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(filepath, buffer);

            this.logger.log(`Generated barcode card: ${filename}`);
            return filepath;
        } catch (error) {
            this.logger.error(`Failed to generate barcode card: ${error.message}`);
            throw error;
        }
    }

    /**
     * Helper to draw rounded rectangles
     */
    private roundRect(
        ctx: any,
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number,
        topOnly: boolean = false,
        bottomOnly: boolean = false
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

    /**
     * Clean up old visitor cards (older than 24 hours)
     */
    async cleanupOldCards(): Promise<number> {
        try {
            const files = fs.readdirSync(this.outputDir);
            const now = Date.now();
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
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
        } catch (error) {
            this.logger.error(`Failed to cleanup old cards: ${error.message}`);
            return 0;
        }
    }
}
