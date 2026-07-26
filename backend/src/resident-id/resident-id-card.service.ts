import { Injectable, Logger } from '@nestjs/common';
import { createCanvas, loadImage } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import * as QRCode from 'qrcode';

@Injectable()
export class ResidentIdCardService {
    private readonly logger = new Logger(ResidentIdCardService.name);
    private readonly outputDir = path.join(process.cwd(), 'uploads', 'resident-cards');
    private readonly fontFamily = 'App Sans'; // Same as visitor cards

    constructor() {
        // Create output directory if it doesn't exist
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    /**
     * Generate resident ID card image
     */
    async generateResidentIdCard(occupant: any): Promise<string> {
        try {
            this.logger.log(`🎨 Generating ID card for resident: ${occupant.name}`);

            const width = 800;
            const height = 1100;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');

            // Background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);

            // Header (dark gradient - same as visitor cards)
            const headerHeight = 180;
            const gradient = ctx.createLinearGradient(0, 0, 0, headerHeight);
            gradient.addColorStop(0, '#1e293b');
            gradient.addColorStop(1, '#334155');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, headerHeight);

            // Header text
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold 48px "${this.fontFamily}"`;
            ctx.textAlign = 'center';
            ctx.fillText('RESIDENT ID CARD', width / 2, 110);

            // Photo section
            const photoY = 220;
            const photoRadius = 100;

            if (occupant.photoUrl) {
                // Draw actual photo
                try {
                    const photoImage = await loadImage(occupant.photoUrl);

                    // Create circular clip
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(width / 2, photoY, photoRadius, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.clip();

                    // Draw photo (cover fit)
                    const photoSize = photoRadius * 2;
                    ctx.drawImage(
                        photoImage,
                        width / 2 - photoRadius,
                        photoY - photoRadius,
                        photoSize,
                        photoSize,
                    );

                    ctx.restore();

                    // Border
                    ctx.beginPath();
                    ctx.arc(width / 2, photoY, photoRadius, 0, Math.PI * 2);
                    ctx.strokeStyle = '#cbd5e1';
                    ctx.lineWidth = 4;
                    ctx.stroke();
                } catch (photoError) {
                    this.logger.warn(`Failed to load photo, using placeholder: ${photoError.message}`);
                    // Fall back to placeholder
                    this.drawPlaceholderPhoto(ctx, width, photoY, photoRadius);
                }
            } else {
                // Draw placeholder
                this.drawPlaceholderPhoto(ctx, width, photoY, photoRadius);
            }

            // Resident name (below photo)
            const nameY = photoY + photoRadius + 80;
            ctx.fillStyle = '#1e293b';
            ctx.font = `bold 44px "${this.fontFamily}"`;
            ctx.textAlign = 'center';
            ctx.fillText(String(occupant.name || '').toUpperCase(), width / 2, nameY);

            // Details section
            const detailsY = nameY + 80;
            const lineHeight = 60;
            ctx.textAlign = 'left';

            // Resident ID
            const residentId = this.formatResidentId(occupant.id);
            this.drawDetailRow(ctx, 'Resident ID:', residentId, 120, 380, detailsY);

            // Unit
            const unitInfo = `${occupant.unit?.block || ''} ${occupant.unit?.flat || ''}`.trim();
            this.drawDetailRow(ctx, 'Unit:', unitInfo, 120, 380, detailsY + lineHeight);

            // Estate
            const estateName = occupant.estate?.name || 'Estate';
            this.drawDetailRow(ctx, 'Estate:', estateName, 120, 380, detailsY + lineHeight * 2);

            // Type
            const type = occupant.type === 'RESIDENT' ? 'Primary Resident' : 'Household Member';
            this.drawDetailRow(ctx, 'Type:', type, 120, 380, detailsY + lineHeight * 3);

            // Issue date
            const issueDate = new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });
            this.drawDetailRow(ctx, 'Issued:', issueDate, 120, 380, detailsY + lineHeight * 4);

            // QR Code
            const qrSize = 220;
            const qrY = detailsY + lineHeight * 5 + 40;
            const qrDataUrl = await this.generateQRCode(occupant);
            const qrImage = await loadImage(qrDataUrl);
            const qrX = (width - qrSize) / 2;
            ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

            // QR instruction text
            ctx.fillStyle = '#64748b';
            ctx.font = `18px "${this.fontFamily}"`;
            ctx.textAlign = 'center';
            ctx.fillText('Scan to verify resident status', width / 2, qrY + qrSize + 40);

            // Footer separator
            const footerY = height - 100;
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(80, footerY - 20);
            ctx.lineTo(width - 80, footerY - 20);
            ctx.stroke();

            // Footer - Estate name and address
            ctx.fillStyle = '#1e293b';
            ctx.font = `bold 20px "${this.fontFamily}"`;
            ctx.fillText(String(estateName).toUpperCase(), width / 2, footerY + 15);

            if (occupant.estate?.address) {
                ctx.fillStyle = '#64748b';
                ctx.font = `16px "${this.fontFamily}"`;
                ctx.fillText(occupant.estate.address, width / 2, footerY + 45);
            }

            // Save to file
            const filename = `resident-${residentId}-${Date.now()}.png`;
            const filepath = path.join(this.outputDir, filename);
            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(filepath, buffer);

            this.logger.log(`✅ Generated resident ID card: ${filename} (${buffer.length} bytes)`);
            return filepath;
        } catch (error: any) {
            this.logger.error(`Failed to generate resident ID card: ${error.message}`);
            throw error;
        }
    }

    /**
     * Format resident ID for display
     */
    private formatResidentId(occupantId: string): string {
        // Convert "cl9x7..." to "RES-CL9X7"
        return `RES-${occupantId.substring(0, 8).toUpperCase()}`;
    }

    /**
     * Generate QR code with verification URL
     */
    private async generateQRCode(occupant: any): Promise<string> {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const residentId = this.formatResidentId(occupant.id);
        const verificationUrl = `${frontendUrl}/verify-resident?id=${residentId}`;

        return await QRCode.toDataURL(verificationUrl, {
            errorCorrectionLevel: 'H',
            margin: 1,
            width: 220,
            color: {
                dark: '#1e293b',
                light: '#ffffff',
            },
        });
    }

    /**
     * Draw placeholder photo
     */
    private drawPlaceholderPhoto(
        ctx: any,
        width: number,
        photoY: number,
        photoRadius: number,
    ): void {
        // Circle background
        ctx.beginPath();
        ctx.arc(width / 2, photoY, photoRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#e2e8f0';
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Icon
        ctx.fillStyle = '#94a3b8';
        ctx.font = `80px "${this.fontFamily}"`;
        ctx.textAlign = 'center';
        ctx.fillText('👤', width / 2, photoY + 30);
    }

    /**
     * Draw a detail row (label + value)
     */
    private drawDetailRow(
        ctx: any,
        label: string,
        value: string,
        labelX: number,
        valueX: number,
        y: number,
    ): void {
        // Label
        ctx.fillStyle = '#64748b';
        ctx.font = `20px "${this.fontFamily}"`;
        ctx.fillText(label, labelX, y);

        // Value
        ctx.fillStyle = '#1e293b';
        ctx.font = `bold 22px "${this.fontFamily}"`;
        ctx.fillText(value, valueX, y);
    }

    /**
     * Cleanup old ID card images
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
                this.logger.log(`Cleaned up ${deleted} old resident ID cards`);
            }

            return deleted;
        } catch (error: any) {
            this.logger.error(`Failed to cleanup old cards: ${error.message}`);
            return 0;
        }
    }
}
