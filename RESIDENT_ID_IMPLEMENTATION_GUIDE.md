# Resident ID Card - Implementation Guide

## 🎯 Quick Overview

**Goal**: Add a resident ID card feature that residents can request via WhatsApp.

**Architecture**: Follows the existing visitor card pattern - clean, modular, and maintainable.

**Complexity**: Low - Most services already exist, just need to add card generation and wire it up.

**Time Estimate**: 2-3 days for MVP

---

## 📋 Prerequisites

Before starting, make sure you have:
- ✅ Existing visitor card system working
- ✅ Image upload service configured (ImgBB key)
- ✅ WhatsApp integration functional
- ✅ Database with Occupant model

---

## 🚀 Step-by-Step Implementation

### Phase 1: Create the Module Structure (30 mins)

```bash
# 1. Create the module directory
cd backend/src
mkdir resident-id
cd resident-id

# 2. Create the files
touch resident-id.module.ts
touch resident-id-card.service.ts
touch resident-id.controller.ts
mkdir dto
touch dto/generate-id-card.dto.ts
```

### Phase 2: Implement Card Generation Service (2-3 hours)

Create `backend/src/resident-id/resident-id-card.service.ts`:

```typescript
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

      // Placeholder for photo (circular)
      const photoY = 220;
      const photoRadius = 100;
      ctx.beginPath();
      ctx.arc(width / 2, photoY, photoRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#e2e8f0';
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Photo placeholder icon (simplified person)
      ctx.fillStyle = '#94a3b8';
      ctx.font = `80px "${this.fontFamily}"`;
      ctx.fillText('👤', width / 2, photoY + 30);

      // Resident name (below photo)
      const nameY = photoY + photoRadius + 80;
      ctx.fillStyle = '#1e293b';
      ctx.font = `bold 44px "${this.fontFamily}"`;
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
```

### Phase 3: Create the Module (15 mins)

Create `backend/src/resident-id/resident-id.module.ts`:

```typescript
import { Module, forwardRef } from '@nestjs/common';
import { ResidentIdCardService } from './resident-id-card.service';
import { ResidentIdController } from './resident-id.controller';
import { ImageUploadService } from '../visitor-code/image-upload.service';
import { OccupantsModule } from '../occupants/occupants.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    forwardRef(() => OccupantsModule),
    PrismaModule,
  ],
  providers: [
    ResidentIdCardService,
    ImageUploadService, // Reuse from visitor-code
  ],
  controllers: [ResidentIdController],
  exports: [ResidentIdCardService],
})
export class ResidentIdModule {}
```

### Phase 4: Add to App Module (5 mins)

Update `backend/src/app.module.ts`:

```typescript
import { ResidentIdModule } from './resident-id/resident-id.module';

@Module({
  imports: [
    // ... existing modules
    ResidentIdModule, // ADD THIS
  ],
})
export class AppModule {}
```

### Phase 5: Add WhatsApp Intent (30 mins)

Update `backend/src/whatsapp/conversation/intent.service.ts`:

```typescript
// Add to the intents array
{
  displayName: 'get resident id',
  trainingPhrases: [
    'my ID',
    'resident ID',
    'get my ID card',
    'show my ID',
    'ID card',
    'my resident card',
    'generate ID',
    'request ID',
    'my identification',
  ],
  responses: [
    'Generating your resident ID card...',
  ],
},
```

### Phase 6: Add Domain Service Method (45 mins)

Update `backend/src/whatsapp/domain/estate-whatsapp.service.ts`:

```typescript
import { ResidentIdCardService } from '../../resident-id/resident-id-card.service';

@Injectable()
export class EstateWhatsAppService {
  constructor(
    // ... existing dependencies
    private readonly residentIdCardService: ResidentIdCardService,
  ) {}

  /**
   * Generate and send resident ID card via WhatsApp
   */
  async generateAndSendResidentId(params: {
    occupantPhone: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`Generating resident ID card for: ${params.occupantPhone}`);

      // Find occupant by phone
      const occupant = await this.findOccupantByPhone(params.occupantPhone);

      if (!occupant) {
        await this.messengerService.sendText({
          to: params.occupantPhone,
          body: "Sorry, I couldn't find your account. Please make sure you're registered as a resident.",
        });

        return {
          success: false,
          message: 'Occupant not found',
        };
      }

      this.logger.log(`Found occupant: ${occupant.id}, generating ID card`);

      // Generate resident ID card
      const cardPath = await this.residentIdCardService.generateResidentIdCard(occupant);

      // Upload to public image hosting
      let cardUrl: string | null = null;
      try {
        this.logger.log(`Uploading resident ID card to cloud...`);
        cardUrl = await this.imageUploadService.uploadImage(cardPath);
        this.logger.log(`✅ Resident ID card uploaded: ${cardUrl}`);
      } catch (uploadError) {
        this.logger.error(`Failed to upload resident ID card: ${uploadError.message}`);
        this.logger.warn(`Continuing without image`);
        // Continue without image - better to send text than fail completely
      }

      // Format resident ID for display
      const residentId = this.formatResidentId(occupant.id);

      // Send details to resident
      const message =
        `*Your Resident ID Card*\n\n` +
        `Name: ${occupant.name}\n` +
        `Resident ID: *${residentId}*\n` +
        `Unit: ${occupant.unit?.block} ${occupant.unit?.flat}\n` +
        `Estate: ${occupant.estate?.name}\n` +
        `Type: ${occupant.type === 'RESIDENT' ? 'Primary Resident' : 'Household Member'}\n\n` +
        (cardUrl ? `Your ID card is attached below. Show this at security checkpoints.` : `Your ID details above. Please contact admin for physical ID card.`);

      await this.messengerService.sendText({
        to: params.occupantPhone,
        body: message,
      });

      // Send ID card image if upload succeeded
      if (cardUrl) {
        try {
          await this.messengerService.sendMedia({
            to: params.occupantPhone,
            type: 'image',
            url: cardUrl,
            caption: `Resident ID Card - ${occupant.name}`,
          });
        } catch (mediaError) {
          this.logger.error(`Failed to send media: ${mediaError.message}`);
          // Already sent text with details, so this is not critical
        }
      }

      this.logger.log(`✅ Resident ID card sent successfully to ${params.occupantPhone}`);

      return {
        success: true,
        message: 'Resident ID card sent successfully',
      };
    } catch (error: any) {
      this.logger.error(`Error generating resident ID card: ${error.message}`);

      await this.messengerService.sendText({
        to: params.occupantPhone,
        body: `Sorry, there was an error generating your ID card: ${error.message}`,
      });

      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Format resident ID for display
   */
  private formatResidentId(occupantId: string): string {
    return `RES-${occupantId.substring(0, 8).toUpperCase()}`;
  }
}
```

Don't forget to inject the new service in the constructor!

### Phase 7: Add Conversation Handler (30 mins)

Update `backend/src/whatsapp/conversation/conversation.service.ts`:

```typescript
// In the routeIntent method, add this case:

case 'get resident id':
  await this.handleGetResidentId(message.from, responses);
  break;

// Add the handler method:

/**
 * Handle get resident ID request
 */
private async handleGetResidentId(
  phoneNumber: string,
  responses: OutgoingMessage[],
): Promise<void> {
  // Show typing indicator
  await this.showTypingIndicator(phoneNumber);

  this.logger.log(`Generating resident ID for ${phoneNumber}`);

  // Call domain service to generate and send ID
  const result = await this.estateWhatsAppService.generateAndSendResidentId({
    occupantPhone: phoneNumber,
  });

  // If failed, send error message
  if (!result.success) {
    responses.push({
      kind: 'text',
      to: phoneNumber,
      body: `Sorry, I couldn't generate your ID card. ${result.message}`,
    });
    return;
  }

  // Success! Show follow-up options
  responses.push({
    kind: 'interactive',
    to: phoneNumber,
    interactive: {
      type: 'button',
      body: {
        text: 'What would you like to do next?',
      },
      action: {
        buttons: [
          {
            type: 'reply',
            reply: {
              id: 'generate_code',
              title: 'Visitor Code',
            },
          },
          {
            type: 'reply',
            reply: {
              id: 'list_visitors',
              title: 'My Visitors',
            },
          },
          {
            type: 'reply',
            reply: {
              id: 'help',
              title: 'Menu',
            },
          },
        ],
      },
    },
  });
}
```

### Phase 8: Update WhatsApp Module (10 mins)

Update `backend/src/whatsapp/whatsapp.module.ts` to import ResidentIdModule:

```typescript
import { ResidentIdModule } from '../resident-id/resident-id.module';

@Module({
  imports: [
    // ... existing imports
    ResidentIdModule,
  ],
  // ...
})
export class WhatsAppModule {}
```

### Phase 9: Test! (1 hour)

```bash
# 1. Restart your backend
npm run start:dev

# 2. Send WhatsApp message
# Text: "my ID" or "get my ID card"

# 3. Expected result:
# - Bot responds with typing indicator
# - Receives text message with ID details
# - Receives ID card image
# - Receives follow-up menu buttons

# 4. Verify ID card image contains:
# - Resident name
# - Resident ID (RES-...)
# - Unit information
# - Estate name
# - QR code
# - Professional design
```

### Phase 10: Optional - Add Verification Endpoint (30 mins)

Create `backend/src/resident-id/resident-id.controller.ts`:

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { OccupantsService } from '../occupants/occupants.service';

@Controller('verify-resident')
export class ResidentIdController {
  constructor(private readonly occupantsService: OccupantsService) {}

  @Public()
  @Get()
  async verifyResident(@Query('id') residentId: string) {
    try {
      // Extract occupant ID from resident ID format
      // "RES-CL9X7" → find occupant with ID starting with "cl9x7"
      const occupantIdPrefix = residentId.replace('RES-', '').toLowerCase();

      // Find occupant
      const occupants = await this.occupantsService.findAll();
      const occupant = occupants.find(
        (o) => o.id.toLowerCase().startsWith(occupantIdPrefix) && o.isActive,
      );

      if (!occupant) {
        return {
          valid: false,
          message: 'Invalid or inactive resident ID',
        };
      }

      return {
        valid: true,
        resident: {
          id: residentId,
          name: occupant.name,
          unit: `${occupant.unit?.block} ${occupant.unit?.flat}`,
          estate: occupant.estate?.name,
          type: occupant.type === 'RESIDENT' ? 'Primary Resident' : 'Household Member',
        },
      };
    } catch (error) {
      return {
        valid: false,
        message: 'Error verifying resident ID',
        error: error.message,
      };
    }
  }
}
```

---

## ✅ Testing Checklist

- [ ] Module compiles without errors
- [ ] Service generates ID card image
- [ ] Image uploads to ImgBB/Imgur successfully
- [ ] WhatsApp intent is detected ("my ID")
- [ ] Bot responds with ID card image
- [ ] ID card contains all required information
- [ ] QR code is scannable
- [ ] Verification endpoint works (optional)
- [ ] Error handling works (no crashes)
- [ ] Follow-up buttons appear after ID is sent

---

## 🐛 Troubleshooting

### Problem: Card generation fails
**Solution**: Check font registration (DejaVu Sans must be installed)

### Problem: Image upload fails
**Solution**: Verify IMGBB_API_KEY is set in .env

### Problem: Intent not detected
**Solution**: Check intent.service.ts training phrases, add more variations

### Problem: Module import errors
**Solution**: Make sure ResidentIdModule is imported in WhatsAppModule

### Problem: QR code doesn't work
**Solution**: Check FRONTEND_URL is set correctly in .env

---

## 📊 Code Statistics

- **New files**: 4
- **Modified files**: 5
- **New lines of code**: ~500
- **Reused services**: 4 (ImageUpload, Messenger, Occupants, QRCode)
- **Time to implement**: 2-3 days
- **Code reuse**: 80%

---

## 🎉 Success Criteria

Your implementation is successful when:
1. ✅ Resident sends "my ID" via WhatsApp
2. ✅ Bot generates professional ID card with photo, details, QR code
3. ✅ Image uploads to cloud successfully
4. ✅ ID card is sent via WhatsApp within 3 seconds
5. ✅ QR code can be scanned and verified
6. ✅ Follow-up menu appears after ID is sent
7. ✅ No errors in logs

---

## 🚀 Next Steps After MVP

Once basic feature works:
1. Add resident photo upload capability
2. Add ID card regeneration with reason tracking
3. Add verification logging (who verified, when, where)
4. Add admin panel UI for ID management
5. Add batch ID generation for all residents
6. Add expiry dates (optional)
7. Add physical card printing integration

---

## 📚 Additional Resources

- [Canvas API Documentation](https://github.com/Automattic/node-canvas)
- [QR Code Library](https://github.com/soldair/node-qrcode)
- [ImgBB API](https://api.imgbb.com/)
- [Existing Visitor Card Implementation](./backend/src/visitor-code/visitor-card.service.ts)

---

## 💡 Pro Tips

1. **Test incrementally**: Test each phase before moving to the next
2. **Use existing code**: Copy from visitor-card.service.ts as a starting point
3. **Check logs**: Backend logs show detailed error messages
4. **Reuse services**: Don't reinvent the wheel, use existing services
5. **Keep it simple**: Start with MVP, add features later
6. **Document as you go**: Update DOCUMENTATION.md with new commands

---

## 🎯 Final Checklist

Before deploying to production:
- [ ] All tests passing
- [ ] Error handling implemented
- [ ] Logs are informative
- [ ] Image cleanup scheduled
- [ ] Documentation updated
- [ ] Environment variables documented
- [ ] Security review done (QR code, verification)
- [ ] Performance tested (generation time < 3s)
- [ ] Deployed to staging and tested
- [ ] User feedback collected

---

**Good luck with the implementation! Follow the phases systematically and you'll have a working resident ID system in no time.** 🚀
