# Resident ID Card Feature - Design Document

## 📋 Overview

Add a digital ID card system for residents that can be requested via WhatsApp. The system will generate professional ID cards with resident information, QR codes, and estate branding.

---

## 🎯 Requirements

### Functional Requirements
1. Residents can request their ID card via WhatsApp (`"my ID"`, `"resident ID"`, `"get my ID card"`)
2. System generates a professional ID card image with:
   - Resident photo (optional/placeholder)
   - Full name
   - Unit (Block + Flat)
   - Resident ID (unique identifier)
   - QR code (for verification)
   - Estate name and logo
   - Issue date and expiry date (optional)
3. ID card sent as image via WhatsApp
4. ID cards can be regenerated anytime
5. QR code verification endpoint for security staff

### Non-Functional Requirements
- Consistent design with existing visitor cards
- Fast generation (< 3 seconds)
- Reliable image hosting
- Secure QR code with verification endpoint
- Clean architecture following existing patterns

---

## 🏗️ Architecture Analysis

### Current System Patterns

#### 1. **Visual Card Generation** (Visitor Cards)
- **Service**: `VisitorCardService`
- **Technology**: Canvas API for image generation
- **Pattern**: Generate → Upload → Send via WhatsApp
- **Location**: `backend/src/visitor-code/visitor-card.service.ts`

#### 2. **Image Upload**
- **Service**: `ImageUploadService`
- **Providers**: ImgBB (primary), Imgur, Telegraph, Cloudinary
- **Pattern**: Multi-provider fallback
- **Location**: `backend/src/visitor-code/image-upload.service.ts`

#### 3. **WhatsApp Integration**
- **Conversation Layer**: `ConversationService` (intent routing)
- **Domain Layer**: `EstateWhatsAppService` (business logic)
- **Outbound Layer**: `MessengerService` (sending messages)
- **Location**: `backend/src/whatsapp/`

#### 4. **Data Model**
- **Occupant Model**: Contains resident data
- **Fields**: `id`, `name`, `email`, `phone`, `estateId`, `unitId`, `type`
- **Location**: `backend/prisma/schema.prisma`

### Architectural Decision: Follow Existing Patterns ✅

The resident ID card feature should mirror the visitor card implementation:

```
WhatsApp Request → Intent Detection → Domain Service → Card Generation → Image Upload → Send Response
```

---

## 📐 Proposed Architecture

### Module Structure

```
backend/src/
├── resident-id/                        # NEW MODULE
│   ├── resident-id.module.ts           # Module definition
│   ├── resident-id-card.service.ts     # Card generation (like VisitorCardService)
│   ├── resident-id.controller.ts       # REST API endpoints (optional, for admin panel)
│   └── dto/
│       └── generate-id-card.dto.ts     # DTOs for API
│
├── whatsapp/
│   ├── conversation/
│   │   ├── conversation.service.ts     # ADD: Route "get resident id" intent
│   │   └── intent.service.ts           # ADD: Detect "resident ID" intent
│   └── domain/
│       └── estate-whatsapp.service.ts  # ADD: generateAndSendResidentID()
│
└── occupants/
    └── occupants.service.ts            # REUSE: Find occupant by phone
```

### Why This Structure?

1. **Separation of Concerns**: `resident-id` module is independent, just like `visitor-code`
2. **Reusability**: Card service can be used by WhatsApp AND admin panel
3. **Testability**: Each service can be unit tested independently
4. **Maintainability**: Clear boundaries, easy to modify
5. **Consistency**: Follows the existing visitor card pattern

---

## 🎨 ID Card Design

### Visual Layout (800x1100px)

```
┌─────────────────────────────────────────────┐
│  [Estate Logo]       RESIDENT ID CARD       │  ← Dark gradient header
│                                             │
│              [Resident Photo]               │  ← Placeholder or uploaded photo
│                                             │
│           JOHN DOE                          │  ← Name (bold, large)
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  Resident ID:  RES-ABC123                   │  ← Unique ID
│  Unit:         Block 1, Flat 4              │
│  Estate:       Sunshine Estate              │
│  Type:         Primary Resident             │  ← RESIDENT / HOUSEHOLD_MEMBER
│  Issued:       Jul 26, 2026                 │
│                                             │
│         [QR CODE]                           │  ← Verification QR
│                                             │
│  Scan to verify resident status             │
│                                             │
├─────────────────────────────────────────────┤
│      🏢 SUNSHINE ESTATE                     │  ← Footer
│      123 Main Street                        │
└─────────────────────────────────────────────┘
```

### Color Scheme
- **Header**: Dark gradient (`#1e293b` → `#334155`) - matches visitor card
- **Background**: White (`#ffffff`)
- **Text**: Dark slate (`#1e293b`) for primary, gray (`#64748b`) for secondary
- **Accent**: Estate brand color (optional)

### QR Code Content
```json
{
  "type": "resident_verification",
  "residentId": "RES-ABC123",
  "occupantId": "cuid",
  "estateId": "estate-cuid",
  "issuedAt": "2026-07-26T10:30:00Z"
}
```

Or simple URL:
```
https://your-domain.com/verify-resident?id=RES-ABC123
```

---

## 💾 Database Schema Changes

### Option 1: No Schema Changes (Recommended for MVP)
- Use existing `Occupant.id` as resident ID
- Format as `RES-{short-id}` for display
- No migration needed
- **Pros**: Quick implementation, no breaking changes
- **Cons**: Less memorable IDs

### Option 2: Add Resident ID Field (Future Enhancement)
```prisma
model Occupant {
  // ... existing fields
  residentId       String?   @unique  // e.g., "RES-0001", "RES-0042"
  idCardIssuedAt   DateTime?           // Track when ID was issued
  photoUrl         String?             // Optional: resident photo URL
}
```

**Migration**:
```sql
ALTER TABLE occupants
ADD COLUMN resident_id VARCHAR(20) UNIQUE,
ADD COLUMN id_card_issued_at TIMESTAMP,
ADD COLUMN photo_url TEXT;

-- Generate resident IDs for existing occupants
UPDATE occupants
SET resident_id = CONCAT('RES-', LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 4, '0'))
WHERE type = 'RESIDENT' AND is_active = true;
```

**Recommendation**: Start with Option 1, migrate to Option 2 later if needed.

---

## 🔧 Implementation Plan

### Phase 1: Core Services (Day 1-2)

#### 1.1 Create Resident ID Module
```typescript
// backend/src/resident-id/resident-id.module.ts
import { Module } from '@nestjs/common';
import { ResidentIdCardService } from './resident-id-card.service';
import { ImageUploadService } from '../visitor-code/image-upload.service';
import { OccupantsModule } from '../occupants/occupants.module';

@Module({
  imports: [OccupantsModule],
  providers: [ResidentIdCardService, ImageUploadService],
  exports: [ResidentIdCardService],
})
export class ResidentIdModule {}
```

#### 1.2 Create Card Generation Service
```typescript
// backend/src/resident-id/resident-id-card.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { createCanvas, loadImage } from 'canvas';
import * as QRCode from 'qrcode';

@Injectable()
export class ResidentIdCardService {
  private readonly logger = new Logger(ResidentIdCardService.name);

  async generateResidentIdCard(occupant: any): Promise<string> {
    // Similar to VisitorCardService.generateVisitorCard()
    // 1. Create canvas (800x1100)
    // 2. Draw header with estate name
    // 3. Add placeholder photo or actual photo
    // 4. Display resident info (name, unit, ID, type)
    // 5. Generate QR code
    // 6. Save to file
    // 7. Return file path
  }

  private formatResidentId(occupantId: string): string {
    // Convert cuid to readable format
    // e.g., "cl9x7..." → "RES-CL9X7"
    return `RES-${occupantId.substring(0, 8).toUpperCase()}`;
  }

  private generateQRData(occupant: any): string {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const residentId = this.formatResidentId(occupant.id);
    return `${frontendUrl}/verify-resident?id=${residentId}`;
  }
}
```

### Phase 2: WhatsApp Integration (Day 2-3)

#### 2.1 Add Intent Detection
```typescript
// backend/src/whatsapp/conversation/intent.service.ts
// Add to intent patterns:
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
  ],
}
```

#### 2.2 Add Domain Service Method
```typescript
// backend/src/whatsapp/domain/estate-whatsapp.service.ts
import { ResidentIdCardService } from '../../resident-id/resident-id-card.service';

@Injectable()
export class EstateWhatsAppService {
  constructor(
    // ... existing dependencies
    private readonly residentIdCardService: ResidentIdCardService,
  ) {}

  async generateAndSendResidentId(params: {
    occupantPhone: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Find occupant by phone
      const occupant = await this.findOccupantByPhone(params.occupantPhone);
      
      if (!occupant) {
        return { success: false, message: 'Occupant not found' };
      }

      // 2. Generate ID card
      const cardPath = await this.residentIdCardService.generateResidentIdCard(occupant);

      // 3. Upload to cloud
      const cardUrl = await this.imageUploadService.uploadImage(cardPath);

      // 4. Send to resident
      const residentId = this.formatResidentId(occupant.id);
      const message = 
        `*Your Resident ID Card*\n\n` +
        `Name: ${occupant.name}\n` +
        `Resident ID: ${residentId}\n` +
        `Unit: ${occupant.unit?.block} ${occupant.unit?.flat}\n` +
        `Estate: ${occupant.estate?.name}\n\n` +
        `Your ID card is attached below. Show this at security checkpoints.`;

      await this.messengerService.sendText({
        to: params.occupantPhone,
        body: message,
      });

      await this.messengerService.sendMedia({
        to: params.occupantPhone,
        type: 'image',
        url: cardUrl,
        caption: `Resident ID Card - ${occupant.name}`,
      });

      return { success: true, message: 'ID card sent successfully' };
    } catch (error) {
      this.logger.error(`Error generating resident ID: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  private formatResidentId(occupantId: string): string {
    return `RES-${occupantId.substring(0, 8).toUpperCase()}`;
  }
}
```

#### 2.3 Add Conversation Handler
```typescript
// backend/src/whatsapp/conversation/conversation.service.ts
private async routeIntent(...): Promise<OutgoingMessage[]> {
  // ... existing cases

  case 'get resident id':
    await this.handleGetResidentId(message.from, responses);
    break;
}

private async handleGetResidentId(
  phoneNumber: string,
  responses: OutgoingMessage[],
): Promise<void> {
  await this.showTypingIndicator(phoneNumber);

  const result = await this.estateWhatsAppService.generateAndSendResidentId({
    occupantPhone: phoneNumber,
  });

  if (!result.success) {
    responses.push({
      kind: 'text',
      to: phoneNumber,
      body: `Sorry, I couldn't generate your ID card: ${result.message}`,
    });
  }

  // Add follow-up buttons
  responses.push({
    kind: 'interactive',
    to: phoneNumber,
    interactive: {
      type: 'button',
      body: { text: 'What would you like to do next?' },
      action: {
        buttons: [
          { id: 'generate_code', title: 'Visitor Code' },
          { id: 'list_visitors', title: 'My Visitors' },
          { id: 'help', title: 'Menu' },
        ],
      },
    },
  });
}
```

### Phase 3: Verification Endpoint (Day 3)

#### 3.1 REST API Endpoint (Optional)
```typescript
// backend/src/resident-id/resident-id.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';

@Controller('verify-resident')
export class ResidentIdController {
  constructor(private readonly occupantsService: OccupantsService) {}

  @Public()
  @Get()
  async verifyResident(@Query('id') residentId: string) {
    // Extract occupant ID from resident ID format
    const occupantId = this.extractOccupantId(residentId);
    
    // Find occupant
    const occupant = await this.occupantsService.findOne(occupantId);

    if (!occupant || !occupant.isActive) {
      return {
        valid: false,
        message: 'Invalid or inactive resident ID',
      };
    }

    return {
      valid: true,
      resident: {
        name: occupant.name,
        unit: `${occupant.unit?.block} ${occupant.unit?.flat}`,
        estate: occupant.estate?.name,
        type: occupant.type,
      },
    };
  }

  private extractOccupantId(residentId: string): string {
    // "RES-CL9X7" → "cl9x7..."
    // This depends on your ID format
    return residentId.replace('RES-', '').toLowerCase();
  }
}
```

#### 3.2 Frontend Verification Page (Optional)
```tsx
// nextjs-frontend/app/verify-resident/page.tsx
export default async function VerifyResidentPage({
  searchParams,
}: {
  searchParams: { id: string };
}) {
  const resident = await verifyResident(searchParams.id);

  if (!resident.valid) {
    return <div>Invalid Resident ID</div>;
  }

  return (
    <div>
      <h1>Resident Verified ✓</h1>
      <p>Name: {resident.name}</p>
      <p>Unit: {resident.unit}</p>
      <p>Estate: {resident.estate}</p>
    </div>
  );
}
```

### Phase 4: Testing (Day 4)

#### 4.1 Unit Tests
```typescript
// backend/src/resident-id/resident-id-card.service.spec.ts
describe('ResidentIdCardService', () => {
  it('should generate ID card image', async () => {
    const occupant = {
      id: 'cl9x7abc123',
      name: 'John Doe',
      unit: { block: 'Block 1', flat: 'Flat 4' },
      estate: { name: 'Sunshine Estate' },
    };

    const cardPath = await service.generateResidentIdCard(occupant);
    expect(cardPath).toBeDefined();
    expect(fs.existsSync(cardPath)).toBe(true);
  });
});
```

#### 4.2 Integration Tests
```bash
# Test WhatsApp flow
1. Send "my ID" to bot
2. Verify ID card image received
3. Verify QR code works
4. Verify verification endpoint
```

### Phase 5: Documentation (Day 4)

Update `DOCUMENTATION.md` with:
- Resident ID feature description
- WhatsApp commands
- API endpoints
- QR code verification

---

## 🎯 Benefits of This Architecture

### 1. **Follows Existing Patterns**
- Same structure as visitor cards
- Developers already familiar with the pattern
- Easy to understand and maintain

### 2. **Clean Separation**
- `resident-id` module is independent
- Can be used by WhatsApp, admin panel, or mobile app
- Easy to test in isolation

### 3. **Reusable Services**
- `ImageUploadService` already handles cloud hosting
- `MessengerService` handles WhatsApp sending
- `OccupantsService` provides resident data

### 4. **Minimal Database Changes**
- No migration required for MVP
- Can add fields later if needed
- No breaking changes

### 5. **Scalable**
- Easy to add features (photo upload, expiry dates)
- Can add verification logging
- Can add ID card regeneration history

---

## 🚀 Quick Start Implementation

### Step 1: Create Module Structure
```bash
mkdir backend/src/resident-id
touch backend/src/resident-id/resident-id.module.ts
touch backend/src/resident-id/resident-id-card.service.ts
```

### Step 2: Implement Card Generation
- Copy `visitor-card.service.ts` as template
- Modify layout for resident ID
- Add QR code generation

### Step 3: Integrate with WhatsApp
- Add intent to `intent.service.ts`
- Add handler to `conversation.service.ts`
- Add method to `estate-whatsapp.service.ts`

### Step 4: Test
```
User: "my ID"
Bot: [Sends ID card image]
```

---

## 📊 Comparison with Visitor Cards

| Aspect | Visitor Card | Resident ID Card |
|--------|-------------|------------------|
| **Purpose** | Temporary visitor access | Permanent resident identification |
| **Validity** | Time-limited (hours/days) | Permanent (while resident) |
| **QR Content** | Verification URL + code | Verification URL + resident ID |
| **Generation** | Per visitor request | Once per resident (regenerable) |
| **Data Source** | VisitorCode model | Occupant model |
| **Service** | VisitorCardService | ResidentIdCardService |
| **Module** | visitor-code | resident-id |

---

## ✅ Checklist

### MVP (Minimum Viable Product)
- [ ] Create `resident-id` module
- [ ] Implement `ResidentIdCardService`
- [ ] Add "get resident id" intent
- [ ] Add conversation handler
- [ ] Add domain service method
- [ ] Test WhatsApp flow
- [ ] Update documentation

### Future Enhancements
- [ ] Add resident photo upload
- [ ] Add ID card expiry dates
- [ ] Add verification logging
- [ ] Add ID card regeneration history
- [ ] Add admin panel UI for ID management
- [ ] Add batch ID generation for all residents
- [ ] Add physical card printing integration

---

## 🎨 Design Consistency

To maintain visual consistency with visitor cards:

1. **Same Fonts**: DejaVu Sans (normal and bold)
2. **Same Colors**: Dark gradient header, white background
3. **Same Layout**: Header, content, QR code, footer
4. **Same Dimensions**: 800x1100px
5. **Same Image Service**: Use existing `ImageUploadService`

This ensures a cohesive brand experience across all EstateAI cards.

---

## 🔒 Security Considerations

1. **QR Code**: Include timestamp to prevent replay attacks
2. **Verification**: Check `isActive` status of occupant
3. **Rate Limiting**: Limit ID generation requests per user
4. **Image Cleanup**: Auto-delete old ID card images (like visitor cards)
5. **Access Control**: Only the occupant can request their own ID

---

## 📈 Success Metrics

- ID card generation success rate > 95%
- Average generation time < 3 seconds
- WhatsApp delivery success rate > 98%
- User satisfaction (based on feedback)

---

## 🎉 Summary

This design follows your existing architecture perfectly:
- ✅ New module mirrors `visitor-code` structure
- ✅ Reuses existing services (image upload, WhatsApp, occupants)
- ✅ Clean separation of concerns
- ✅ No breaking changes
- ✅ Easy to test and maintain
- ✅ Follows established patterns

**Next Steps**: Start with Phase 1 (Core Services) and iterate based on feedback!
