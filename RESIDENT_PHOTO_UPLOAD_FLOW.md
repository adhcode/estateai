# Resident Photo Upload Flow - Design Document

## 🎯 Feature Overview

Allow residents to upload their photo via WhatsApp, which gets:
1. Saved to their profile
2. Automatically included in their ID card
3. Reused for future ID card generations

---

## 🔄 User Flows

### Flow 1: First-Time ID Request (No Photo)

```
User: "my ID"

Bot: "I'll generate your ID card!
     
     To include your photo, please send a photo now.
     Or click 'Skip' to use a placeholder."
     
     [Send Photo] [Skip for Now]

--- Option A: User sends photo ---
User: [Sends photo via WhatsApp]

Bot: [Typing indicator]
     "✅ Photo received! Generating your ID card..."
     [Shows ID card with their photo]

--- Option B: User clicks Skip ---
User: [Clicks "Skip for Now"]

Bot: "Generating your ID card with placeholder..."
     [Shows ID card with placeholder avatar]
     
     "💡 Tip: Send 'update photo' anytime to add your photo!"
```

### Flow 2: Update Photo Later

```
User: "update photo" or "change my photo"

Bot: "Please send your new photo now."

User: [Sends photo]

Bot: "✅ Photo updated! Your ID card will now use this photo.
     
     Want to see your updated ID card?"
     
     [Yes, Show ID] [No, Later]

User: [Clicks "Yes, Show ID"]

Bot: [Sends updated ID card with new photo]
```

### Flow 3: Subsequent ID Requests (Photo Already Saved)

```
User: "my ID"

Bot: [Generates ID card with saved photo]
     [Sends ID card image]
     
     "Your ID card with saved photo ✅"
```

---

## 💾 Database Schema Changes

### Add Photo Field to Occupant Model

```prisma
model Occupant {
  id                String       @id @default(cuid())
  name              String
  email             String?
  phone             String?
  photoUrl          String?      // NEW: URL to uploaded photo
  photoUploadedAt   DateTime?    // NEW: Track when photo was uploaded
  estateId          String
  unitId            String
  type              OccupantType @default(RESIDENT)
  primaryOccupantId String?
  isActive          Boolean      @default(true)
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  // ... relations
}
```

### Migration

```sql
-- Add photo fields to occupants table
ALTER TABLE occupants
ADD COLUMN photo_url TEXT,
ADD COLUMN photo_uploaded_at TIMESTAMP;

-- Add index for quick lookup
CREATE INDEX idx_occupants_photo_url ON occupants(photo_url)
WHERE photo_url IS NOT NULL;
```

---

## 🏗️ Architecture Implementation

### 1. Photo Service (New)

Create `backend/src/resident-id/resident-photo.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { ImageUploadService } from '../visitor-code/image-upload.service';

@Injectable()
export class ResidentPhotoService {
  private readonly logger = new Logger(ResidentPhotoService.name);
  private readonly tempDir = path.join(process.cwd(), 'uploads', 'temp-photos');

  constructor(
    private readonly imageUploadService: ImageUploadService,
  ) {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Download photo from WhatsApp Media API
   * Works for both Meta and Twilio
   */
  async downloadPhotoFromWhatsApp(params: {
    mediaId?: string;      // Meta Cloud API
    mediaUrl?: string;     // Twilio
    provider: 'meta' | 'twilio';
  }): Promise<string> {
    try {
      let downloadUrl: string;
      let headers: any = {};

      if (params.provider === 'meta') {
        // Meta Cloud API
        const metaToken = process.env.META_WA_TOKEN;
        downloadUrl = `https://graph.facebook.com/v17.0/${params.mediaId}`;
        headers = { Authorization: `Bearer ${metaToken}` };

        // First, get the media URL
        const mediaResponse = await axios.get(downloadUrl, { headers });
        downloadUrl = mediaResponse.data.url;
      } else {
        // Twilio
        downloadUrl = params.mediaUrl;
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        headers = { Authorization: `Basic ${auth}` };
      }

      // Download the image
      const response = await axios.get(downloadUrl, {
        headers,
        responseType: 'arraybuffer',
      });

      // Save temporarily
      const filename = `photo-${Date.now()}.jpg`;
      const filepath = path.join(this.tempDir, filename);
      fs.writeFileSync(filepath, response.data);

      this.logger.log(`✅ Downloaded photo: ${filename}`);
      return filepath;
    } catch (error) {
      this.logger.error(`Failed to download photo: ${error.message}`);
      throw new Error('Failed to download photo from WhatsApp');
    }
  }

  /**
   * Process and upload photo
   * - Resize to reasonable dimensions
   * - Upload to cloud
   * - Return public URL
   */
  async processAndUploadPhoto(localPath: string): Promise<string> {
    try {
      // TODO: Optional - resize/compress image here using sharp
      // const sharp = require('sharp');
      // await sharp(localPath)
      //   .resize(800, 800, { fit: 'cover' })
      //   .jpeg({ quality: 85 })
      //   .toFile(processedPath);

      // Upload to cloud (ImgBB, Imgur, etc.)
      const publicUrl = await this.imageUploadService.uploadImage(localPath);

      // Cleanup local file
      fs.unlinkSync(localPath);

      this.logger.log(`✅ Photo uploaded to cloud: ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      this.logger.error(`Failed to process photo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Complete photo upload flow
   */
  async handlePhotoUpload(params: {
    mediaId?: string;
    mediaUrl?: string;
    provider: 'meta' | 'twilio';
  }): Promise<string> {
    // Download from WhatsApp
    const localPath = await this.downloadPhotoFromWhatsApp(params);

    // Process and upload to cloud
    const publicUrl = await this.processAndUploadPhoto(localPath);

    return publicUrl;
  }
}
```

### 2. Update Occupants Service

Add method to `backend/src/occupants/occupants.service.ts`:

```typescript
/**
 * Update occupant photo
 */
async updatePhoto(occupantId: string, photoUrl: string): Promise<Occupant> {
  return this.prisma.occupant.update({
    where: { id: occupantId },
    data: {
      photoUrl: photoUrl,
      photoUploadedAt: new Date(),
    },
  });
}

/**
 * Get occupant with photo
 */
async findOneWithPhoto(occupantId: string): Promise<Occupant | null> {
  return this.prisma.occupant.findUnique({
    where: { id: occupantId },
    select: {
      id: true,
      name: true,
      photoUrl: true,
      photoUploadedAt: true,
      // ... other fields
    },
  });
}
```

### 3. Update Estate WhatsApp Service

Add to `backend/src/whatsapp/domain/estate-whatsapp.service.ts`:

```typescript
import { ResidentPhotoService } from '../../resident-id/resident-photo.service';

@Injectable()
export class EstateWhatsAppService {
  constructor(
    // ... existing dependencies
    private readonly residentPhotoService: ResidentPhotoService,
  ) {}

  /**
   * Handle photo upload from WhatsApp
   */
  async handleResidentPhotoUpload(params: {
    occupantPhone: string;
    mediaId?: string;
    mediaUrl?: string;
    provider: 'meta' | 'twilio';
  }): Promise<{ success: boolean; photoUrl?: string; message: string }> {
    try {
      this.logger.log(`Processing photo upload for ${params.occupantPhone}`);

      // Find occupant
      const occupant = await this.findOccupantByPhone(params.occupantPhone);
      if (!occupant) {
        return { success: false, message: 'Occupant not found' };
      }

      // Download and upload photo
      const photoUrl = await this.residentPhotoService.handlePhotoUpload({
        mediaId: params.mediaId,
        mediaUrl: params.mediaUrl,
        provider: params.provider,
      });

      // Save to occupant profile
      await this.occupantsService.updatePhoto(occupant.id, photoUrl);

      this.logger.log(`✅ Photo saved for ${occupant.name}: ${photoUrl}`);

      return {
        success: true,
        photoUrl: photoUrl,
        message: 'Photo uploaded successfully',
      };
    } catch (error) {
      this.logger.error(`Error uploading photo: ${error.message}`);
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
```

### 4. Update Conversation Service

Add conversation states and handlers to `backend/src/whatsapp/conversation/conversation.service.ts`:

```typescript
// Add new states
type ConversationState = 
  | 'idle'
  | 'AWAITING_VISITOR_NAME'
  | 'AWAITING_RESIDENT_PHOTO'     // NEW
  | 'AWAITING_PHOTO_UPDATE'       // NEW
  // ... other states

/**
 * Handle incoming message (UPDATE)
 */
async handleIncoming(message: InboundMessage): Promise<OutgoingMessage[]> {
  try {
    // ... existing code

    // Check if user is in photo upload state
    if (context.state === 'AWAITING_RESIDENT_PHOTO') {
      return await this.handlePhotoUploadForId(message, context);
    }

    if (context.state === 'AWAITING_PHOTO_UPDATE') {
      return await this.handlePhotoUpdate(message, context);
    }

    // ... rest of existing code
  } catch (error) {
    // ... error handling
  }
}

/**
 * Handle photo upload when generating ID
 */
private async handlePhotoUploadForId(
  message: InboundMessage,
  context: ConversationContext,
): Promise<OutgoingMessage[]> {
  const responses: OutgoingMessage[] = [];

  // Check if user sent a photo
  if (message.media?.type === 'image') {
    await this.showTypingIndicator(message.from);

    // Process photo
    const result = await this.estateWhatsAppService.handleResidentPhotoUpload({
      occupantPhone: message.from,
      mediaId: message.media.id,
      mediaUrl: message.media.url,
      provider: message.media.provider || 'meta',
    });

    if (!result.success) {
      responses.push({
        kind: 'text',
        to: message.from,
        body: `Sorry, I couldn't process your photo: ${result.message}\n\nPlease try again or click Skip.`,
      });
      return responses;
    }

    // Clear state
    context.state = 'idle';
    await this.stateStore.saveContext(context);

    // Generate ID card with photo
    responses.push({
      kind: 'text',
      to: message.from,
      body: '✅ Photo received! Generating your ID card...',
    });

    await this.showTypingIndicator(message.from);

    const idResult = await this.estateWhatsAppService.generateAndSendResidentId({
      occupantPhone: message.from,
    });

    if (idResult.success) {
      responses.push({
        kind: 'text',
        to: message.from,
        body: 'Your ID card with your photo is ready! ✨',
      });
    }

    // Add follow-up buttons
    this.addFollowUpButtons(message.from, responses);

    return responses;
  }

  // User didn't send a photo (sent text instead)
  responses.push({
    kind: 'text',
    to: message.from,
    body: 'Please send a photo (not text) or click "Skip for Now" button.',
  });

  return responses;
}

/**
 * Handle photo update request
 */
private async handlePhotoUpdate(
  message: InboundMessage,
  context: ConversationContext,
): Promise<OutgoingMessage[]> {
  const responses: OutgoingMessage[] = [];

  if (message.media?.type === 'image') {
    await this.showTypingIndicator(message.from);

    const result = await this.estateWhatsAppService.handleResidentPhotoUpload({
      occupantPhone: message.from,
      mediaId: message.media.id,
      mediaUrl: message.media.url,
      provider: message.media.provider || 'meta',
    });

    // Clear state
    context.state = 'idle';
    await this.stateStore.saveContext(context);

    if (!result.success) {
      responses.push({
        kind: 'text',
        to: message.from,
        body: `Sorry, I couldn't update your photo: ${result.message}`,
      });
      return responses;
    }

    // Photo updated successfully
    responses.push({
      kind: 'interactive',
      to: message.from,
      interactive: {
        type: 'button',
        body: {
          text: '✅ Photo updated successfully!\n\nYour ID card will now use this photo.\n\nWould you like to see your updated ID card?',
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: {
                id: 'get_resident_id',
                title: 'Yes, Show ID',
              },
            },
            {
              type: 'reply',
              reply: {
                id: 'help',
                title: 'No, Later',
              },
            },
          ],
        },
      },
    });

    return responses;
  }

  // Not a photo
  responses.push({
    kind: 'text',
    to: message.from,
    body: 'Please send a photo (not text).',
  });

  return responses;
}

/**
 * Handle get resident ID - UPDATED to check for photo
 */
private async handleGetResidentId(
  phoneNumber: string,
  responses: OutgoingMessage[],
): Promise<void> {
  await this.showTypingIndicator(phoneNumber);

  // Check if occupant has a photo
  const occupant = await this.estateWhatsAppService.findOccupantByPhone(phoneNumber);
  
  if (!occupant) {
    responses.push({
      kind: 'text',
      to: phoneNumber,
      body: "Sorry, I couldn't find your account.",
    });
    return;
  }

  // No photo - ask if they want to add one
  if (!occupant.photoUrl) {
    responses.push({
      kind: 'interactive',
      to: phoneNumber,
      interactive: {
        type: 'button',
        body: {
          text: "I'll generate your ID card!\n\nTo include your photo, please send a photo now.\n\nOr click 'Skip' to use a placeholder.",
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: {
                id: 'skip_photo',
                title: 'Skip for Now',
              },
            },
          ],
        },
      },
    });

    // Set state to await photo
    await this.updateState(phoneNumber, 'AWAITING_RESIDENT_PHOTO');
    return;
  }

  // Has photo - generate ID with photo
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
    return;
  }

  // Add follow-up buttons
  this.addFollowUpButtons(phoneNumber, responses);
}

/**
 * Route intent - ADD photo update intent
 */
private async routeIntent(...): Promise<OutgoingMessage[]> {
  // ... existing cases

  case 'update resident photo':
    await this.handleUpdatePhoto(message.from, responses);
    break;
}

/**
 * Handle update photo intent
 */
private async handleUpdatePhoto(
  phoneNumber: string,
  responses: OutgoingMessage[],
): Promise<void> {
  responses.push({
    kind: 'text',
    to: phoneNumber,
    body: 'Please send your new photo now. 📸',
  });

  // Set state to await photo
  await this.updateState(phoneNumber, 'AWAITING_PHOTO_UPDATE');
}

/**
 * Map button to command - ADD skip photo button
 */
private mapButtonToCommand(buttonId: string): string {
  const buttonMap: Record<string, string> = {
    // ... existing mappings
    'skip_photo': 'skip photo',
    'get_resident_id': 'my ID',
  };

  return buttonMap[buttonId] || buttonId;
}
```

### 5. Update Intent Service

Add to `backend/src/whatsapp/conversation/intent.service.ts`:

```typescript
// Add new intent for photo updates
{
  displayName: 'update resident photo',
  trainingPhrases: [
    'update photo',
    'change my photo',
    'update my photo',
    'change photo',
    'new photo',
    'upload photo',
    'add photo',
    'update picture',
  ],
  responses: [
    'Please send your new photo.',
  ],
},
```

### 6. Update Resident ID Card Service

Modify `backend/src/resident-id/resident-id-card.service.ts` to handle photos:

```typescript
async generateResidentIdCard(occupant: any): Promise<string> {
  try {
    // ... existing canvas setup

    // Photo section - UPDATED
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

    // ... rest of existing code
  } catch (error) {
    // ... error handling
  }
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
  ctx.font = `80px "App Sans"`;
  ctx.textAlign = 'center';
  ctx.fillText('👤', width / 2, photoY + 30);
}
```

---

## 📊 Complete Flow Diagram

```
┌─────────────────────────────────────────┐
│  User: "my ID"                          │
└──────────────┬──────────────────────────┘
               │
               ▼
       ┌───────────────┐
       │ Has Photo?    │
       └───────┬───────┘
               │
        ┌──────┴──────┐
        │             │
        NO            YES
        │             │
        ▼             ▼
┌───────────────┐  ┌────────────────┐
│ Ask for photo │  │ Generate ID    │
│               │  │ with photo     │
│ [Skip] button │  └────────────────┘
└───────┬───────┘
        │
   ┌────┴────┐
   │         │
  SKIP     PHOTO
   │         │
   ▼         ▼
   │   ┌──────────────┐
   │   │ Download from│
   │   │ WhatsApp     │
   │   └──────┬───────┘
   │          │
   │          ▼
   │   ┌──────────────┐
   │   │ Upload to    │
   │   │ ImgBB/Cloud  │
   │   └──────┬───────┘
   │          │
   │          ▼
   │   ┌──────────────┐
   │   │ Save URL to  │
   │   │ database     │
   │   └──────┬───────┘
   │          │
   └──────────┴───────┐
                      │
                      ▼
              ┌───────────────┐
              │ Generate ID   │
              │ card (with or │
              │ without photo)│
              └───────┬───────┘
                      │
                      ▼
              ┌───────────────┐
              │ Send to user  │
              └───────────────┘
```

---

## 🎯 Message Parsing Updates

Update `backend/src/whatsapp/inbound/inbound.parser.ts` to handle media:

```typescript
export interface InboundMessage {
  from: string;
  text?: string;
  media?: {
    type: 'image' | 'audio' | 'video' | 'document';
    id?: string;      // Meta media ID
    url?: string;     // Twilio media URL
    mimeType?: string;
    provider: 'meta' | 'twilio';
  };
  interactive?: {
    type: 'button_reply' | 'list_reply';
    buttonReply?: {
      id: string;
      title: string;
    };
  };
}

/**
 * Parse Meta Cloud API message
 */
parseMetaMessage(body: any): InboundMessage {
  // ... existing text parsing

  // Parse media (image)
  const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  
  if (message?.image) {
    return {
      from: message.from,
      media: {
        type: 'image',
        id: message.image.id,
        mimeType: message.image.mime_type,
        provider: 'meta',
      },
    };
  }

  // ... rest of parsing
}

/**
 * Parse Twilio message
 */
parseTwilioMessage(body: any): InboundMessage {
  // ... existing text parsing

  // Parse media
  if (body.MediaContentType0?.startsWith('image/')) {
    return {
      from: body.From,
      media: {
        type: 'image',
        url: body.MediaUrl0,
        mimeType: body.MediaContentType0,
        provider: 'twilio',
      },
    };
  }

  // ... rest of parsing
}
```

---

## ✅ Implementation Checklist

### Phase 1: Database (1 hour)
- [ ] Add `photoUrl` and `photoUploadedAt` to Occupant model
- [ ] Run migration: `npx prisma migrate dev --name add_resident_photo`
- [ ] Update occupants service with photo methods

### Phase 2: Photo Service (2 hours)
- [ ] Create `ResidentPhotoService`
- [ ] Implement WhatsApp media download (Meta)
- [ ] Implement WhatsApp media download (Twilio)
- [ ] Test photo download locally

### Phase 3: Message Parsing (1 hour)
- [ ] Update `InboundMessage` interface
- [ ] Parse image messages from Meta
- [ ] Parse image messages from Twilio
- [ ] Test message parsing

### Phase 4: Conversation Flow (3 hours)
- [ ] Add `AWAITING_RESIDENT_PHOTO` state
- [ ] Add `AWAITING_PHOTO_UPDATE` state
- [ ] Handle photo upload in conversation
- [ ] Add "skip photo" button handling
- [ ] Add "update photo" intent

### Phase 5: ID Card Generation (1 hour)
- [ ] Update `generateResidentIdCard` to use photo
- [ ] Handle photo loading errors
- [ ] Test with placeholder vs real photo

### Phase 6: Testing (2 hours)
- [ ] Test first-time ID request (no photo)
- [ ] Test photo upload flow
- [ ] Test skip photo flow
- [ ] Test photo update flow
- [ ] Test subsequent ID requests with photo
- [ ] Test photo loading failures

**Total: ~10 hours (1-2 days)**

---

## 🎨 UI/UX Considerations

### Photo Guidelines for Users

Send via WhatsApp after photo upload:

```
✅ Photo uploaded successfully!

📸 Photo Tips:
• Use a clear, well-lit photo
• Face should be clearly visible
• Plain background works best
• Passport-style photo ideal

Your ID card will look professional! 
```

### Photo Requirements (Optional)

You can add validation:
- Minimum size: 400x400px
- Maximum size: 5MB
- Format: JPEG, PNG
- Aspect ratio: Square preferred

---

## 🔒 Security Considerations

1. **Media Access**
   - WhatsApp media URLs expire after ~2 hours
   - Must download and reupload to permanent storage

2. **Privacy**
   - Photos stored in cloud (ImgBB) - check terms
   - Consider adding photo deletion option
   - GDPR compliance if applicable

3. **Validation**
   - Verify image format (no malicious files)
   - Check file size limits
   - Consider face detection (optional)

---

## 📈 Future Enhancements

1. **Photo Editing**
   - Crop to square before upload
   - Apply filters/adjustments
   - Background removal (AI)

2. **Multiple Photos**
   - Allow retakes before confirming
   - Photo approval workflow
   - Admin review before accepting

3. **Photo Management**
   - View current photo
   - Delete photo
   - Photo history

4. **Bulk Upload**
   - Admin uploads all resident photos
   - CSV import with photo URLs

---

## 💡 Example Messages

### Success Messages

```
✅ Photo uploaded!
Generating your ID card with your photo...

✅ Photo updated!
Your future ID cards will use this photo.

✅ ID card ready!
Your photo looks great! Show this at security checkpoints.
```

### Error Messages

```
❌ Photo upload failed
Please try again or skip for now.

❌ Could not download photo
WhatsApp media may have expired. Please send again.

⚠️ Photo too large
Please send a photo under 5MB.
```

---

## 🎯 Key Benefits

1. **User Convenience**
   - Upload photo directly via WhatsApp
   - No need to visit office or use web portal
   - Instant ID card with real photo

2. **System Integration**
   - Photo saved to profile for reuse
   - Works with existing WhatsApp flow
   - Minimal code changes

3. **Professional Results**
   - Real photos look much better than placeholders
   - Increases trust and authenticity
   - Better for security verification

4. **Flexibility**
   - Users can skip if not ready
   - Can update photo anytime
   - Placeholder works if no photo

---

## 🚀 Summary

**Photo upload flow integrates seamlessly with your existing system:**

- ✅ Natural conversation flow
- ✅ Reuses existing services (ImageUploadService)
- ✅ Saves to database for future use
- ✅ Works with both Meta and Twilio
- ✅ Graceful fallback to placeholder
- ✅ Easy to update later

**Timeline: 1-2 days to add photo support**

The photo feature makes the ID cards truly professional and personalized! 📸✨
