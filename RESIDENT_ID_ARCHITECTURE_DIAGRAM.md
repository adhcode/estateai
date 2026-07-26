# Resident ID Card - Architecture Flow Diagram

## 📊 Complete System Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         WHATSAPP USER                                │
│                  (Resident sends "my ID")                            │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     INBOUND LAYER                                    │
│  📥 webhook.controller.ts                                            │
│      └─> Receives WhatsApp webhook                                   │
│  📋 inbound.parser.ts                                                │
│      └─> Parses message format (Meta/Twilio)                         │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CONVERSATION LAYER                                │
│  🧠 conversation.service.ts                                          │
│      ├─> Receives: "my ID"                                           │
│      └─> Detects intent using intent.service.ts                      │
│                                                                       │
│  🎯 intent.service.ts                                                │
│      ├─> Matches text: "my ID", "resident ID", "get ID card"        │
│      └─> Returns intent: "get resident id"                           │
│                                                                       │
│  🔀 conversation.service.ts (Route Intent)                           │
│      └─> case 'get resident id': handleGetResidentId()              │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DOMAIN LAYER                                    │
│  🏢 estate-whatsapp.service.ts                                       │
│      ├─> generateAndSendResidentId()                                 │
│      ├─> Finds occupant by phone                                     │
│      ├─> Calls card generation service                               │
│      ├─> Uploads image to cloud                                      │
│      └─> Sends via WhatsApp                                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   OCCUPANT      │  │  RESIDENT ID    │  │  IMAGE UPLOAD   │
│   SERVICE       │  │  CARD SERVICE   │  │  SERVICE        │
│                 │  │                 │  │                 │
│ Find by phone   │  │ Generate card   │  │ Upload to:      │
│ Get unit info   │  │ ├─ Canvas API   │  │ ├─ ImgBB        │
│ Get estate info │  │ ├─ QR code      │  │ ├─ Imgur        │
│                 │  │ └─ Save file    │  │ ├─ Telegraph    │
│                 │  │                 │  │ └─ Cloudinary   │
└─────────────────┘  └─────────────────┘  └─────────────────┘
        │                     │                     │
        │                     │                     │
        ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATABASE                                     │
│  📊 PostgreSQL + Prisma                                              │
│      ├─> Occupant table (resident data)                              │
│      ├─> Unit table (block, flat)                                    │
│      └─> Estate table (estate name, address)                         │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    OUTBOUND LAYER                                    │
│  📤 messenger.service.ts                                             │
│      ├─> Sends text message (ID card details)                        │
│      └─> Sends media message (ID card image)                         │
│                                                                       │
│  🏭 provider.factory.ts                                              │
│      └─> Selects provider (Meta or Twilio)                           │
│                                                                       │
│  📡 meta.provider.ts / twilio.provider.ts                            │
│      └─> Sends to WhatsApp API                                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        WHATSAPP USER                                 │
│              (Receives ID card image)                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Module Structure Comparison

### Current: Visitor Code Feature
```
backend/src/visitor-code/
├── visitor-code.module.ts
├── visitor-code.service.ts          # Generate & manage codes
├── visitor-code.controller.ts       # REST API
├── visitor-card.service.ts          # Generate card images ✅
├── image-upload.service.ts          # Upload to cloud ✅
├── qr-code.service.ts              # Generate QR codes ✅
└── dto/
    ├── generate-visitor-code.dto.ts
    └── validate-visitor-code.dto.ts
```

### New: Resident ID Feature
```
backend/src/resident-id/
├── resident-id.module.ts           # NEW
├── resident-id-card.service.ts     # NEW (mirrors visitor-card.service.ts)
├── resident-id.controller.ts       # NEW (optional, for admin panel)
└── dto/
    └── generate-id-card.dto.ts     # NEW
```

### Shared Services (Reused)
```
backend/src/
├── visitor-code/
│   └── image-upload.service.ts     # ✅ REUSED for ID cards
├── occupants/
│   └── occupants.service.ts        # ✅ REUSED to get resident data
└── whatsapp/
    ├── conversation/
    │   └── conversation.service.ts  # ✅ ADD new intent handler
    ├── domain/
    │   └── estate-whatsapp.service.ts  # ✅ ADD new method
    └── outbound/
        └── messenger.service.ts     # ✅ REUSED to send messages
```

---

## 🎨 Visual Card Layout Comparison

### Visitor Card (Current)
```
┌─────────────────────────┐
│    V I S I T O R        │  ← Dark gradient header
│                         │
│      [QR CODE]          │  ← Large QR for verification
│                         │
│    SARAH JOHNSON        │  ← Visitor name
│    Code: ABC123         │  ← Access code (large)
│                         │
│    Unit: Block 1, Flat 4│  ← Host unit
│    Host: John Doe       │  ← Host name
│    Valid Until: ...     │  ← Expiry time
│                         │
│    SUNSHINE ESTATE      │  ← Estate name (footer)
└─────────────────────────┘
```

### Resident ID Card (New)
```
┌─────────────────────────┐
│  RESIDENT ID CARD       │  ← Dark gradient header (same style)
│                         │
│   [Resident Photo]      │  ← Placeholder or actual photo
│                         │
│      JOHN DOE           │  ← Resident name (bold, large)
│                         │
│  ID: RES-CL9X7          │  ← Unique resident ID
│  Unit: Block 1, Flat 4  │  ← Resident's unit
│  Type: Primary Resident │  ← RESIDENT or HOUSEHOLD_MEMBER
│  Issued: Jul 26, 2026   │  ← Issue date
│                         │
│      [QR CODE]          │  ← Verification QR (smaller)
│                         │
│  Scan to verify         │  ← Instructions
│                         │
│  SUNSHINE ESTATE        │  ← Estate name (footer, same style)
└─────────────────────────┘
```

**Key Differences:**
1. Visitor cards are temporary (have expiry)
2. Resident ID cards are permanent (have issue date)
3. Visitor cards show host information
4. Resident ID cards show resident type and ID
5. Both share the same visual style and branding

---

## 🔄 Data Flow for ID Card Generation

```
1. WhatsApp Message
   └─> "my ID"
   
2. Find Occupant
   └─> occupantsService.findByPhone('+1234567890')
   └─> Returns: {
         id: 'cl9x7...',
         name: 'John Doe',
         unit: { block: 'Block 1', flat: 'Flat 4' },
         estate: { name: 'Sunshine Estate', address: '...' },
         type: 'RESIDENT',
       }

3. Generate Card
   └─> residentIdCardService.generateResidentIdCard(occupant)
   └─> Creates canvas (800x1100)
   └─> Draws header, photo, info, QR code
   └─> Saves: /uploads/resident-cards/RES-CL9X7-1234567890.png
   └─> Returns: filepath

4. Upload Image
   └─> imageUploadService.uploadImage(filepath)
   └─> Tries: ImgBB → Imgur → Telegraph → Cloudinary
   └─> Returns: 'https://i.ibb.co/abc123/resident-card.png'

5. Send via WhatsApp
   └─> messenger.sendText() → "Your Resident ID Card\nID: RES-CL9X7..."
   └─> messenger.sendMedia() → Image with caption

6. Cleanup
   └─> Delete local file after 24 hours (like visitor cards)
```

---

## 🏗️ Class Relationships (UML-style)

```
┌─────────────────────────┐
│  ConversationService    │
│  (Orchestrator)         │
└───────────┬─────────────┘
            │
            ├─────────────────────────────────┐
            │                                 │
            ▼                                 ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│  IntentService          │     │  EstateWhatsAppService  │
│  - detectIntent()       │     │  (Domain Logic)         │
└─────────────────────────┘     └───────────┬─────────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │                       │                       │
                    ▼                       ▼                       ▼
        ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
        │  OccupantsService │  │ ResidentIdCard    │  │ ImageUpload       │
        │                   │  │ Service (NEW)     │  │ Service           │
        │  - findByPhone()  │  │ - generateCard()  │  │ - uploadImage()   │
        └───────────────────┘  └───────────────────┘  └───────────────────┘
                    │                       │                       │
                    └───────────────────────┴───────────────────────┘
                                            │
                                            ▼
                                ┌───────────────────┐
                                │  MessengerService │
                                │  - sendText()     │
                                │  - sendMedia()    │
                                └───────────────────┘
```

---

## 🔍 QR Code Verification Flow

```
1. User scans QR code on resident ID card
   └─> QR contains: https://your-domain.com/verify-resident?id=RES-CL9X7

2. Browser opens verification page
   └─> GET /verify-resident?id=RES-CL9X7

3. Backend extracts resident ID
   └─> "RES-CL9X7" → "cl9x7..." (occupant ID)

4. Database lookup
   └─> SELECT * FROM occupants WHERE id = 'cl9x7...'

5. Verification checks
   └─> Is occupant found? ✅
   └─> Is occupant active? ✅
   └─> Is occupant in this estate? ✅

6. Return verification result
   └─> Success: Show resident details
   └─> Failure: Show "Invalid ID" message

7. Optional: Log verification
   └─> Track who verified, when, where (future feature)
```

---

## 📦 Dependency Injection

```typescript
// How services are connected

@Injectable()
class EstateWhatsAppService {
  constructor(
    private readonly messengerService: MessengerService,        // Send messages
    private readonly occupantsService: OccupantsService,        // Get resident data
    private readonly residentIdCardService: ResidentIdCardService,  // NEW: Generate cards
    private readonly imageUploadService: ImageUploadService,    // Upload images
  ) {}
}

@Injectable()
class ResidentIdCardService {
  // No dependencies! Just uses Canvas API
  // Pure function: Occupant data → Image file
}

@Injectable()
class ImageUploadService {
  // No dependencies! Just uses HTTP libraries
  // Pure function: Image file → Public URL
}
```

**Benefits:**
- ✅ Clean dependency tree
- ✅ Easy to test (can mock services)
- ✅ No circular dependencies
- ✅ Single responsibility principle

---

## 🎯 Key Design Decisions

### 1. Why a New Module?
- **Separation of Concerns**: Resident IDs are different from visitor codes
- **Reusability**: Can be used by admin panel, mobile app, etc.
- **Testability**: Can test ID generation independently
- **Maintainability**: Changes to visitor system don't affect resident IDs

### 2. Why Reuse ImageUploadService?
- **DRY Principle**: Don't repeat yourself
- **Proven Solution**: Already handles multiple cloud providers
- **Consistent Behavior**: Same upload logic for all cards
- **Less Code to Maintain**: Single service for all image hosting

### 3. Why Reuse MessengerService?
- **Abstraction**: Don't care if it's Meta or Twilio
- **Consistent API**: Same methods for all WhatsApp messages
- **Provider Switching**: Easy to switch providers without changing code

### 4. Why Use Occupant.id as Resident ID?
- **No Migration**: Works immediately with existing data
- **Unique by Design**: Already guaranteed unique by database
- **Simple Implementation**: Just format for display (RES-...)
- **Can Enhance Later**: Add custom IDs later if needed

---

## ✨ Summary

This architecture:
- ✅ Follows existing patterns (visitor cards)
- ✅ Reuses proven services
- ✅ Maintains clean separation
- ✅ Easy to test and maintain
- ✅ Scalable for future features
- ✅ No breaking changes
- ✅ Minimal code duplication

**Total New Code**: ~500 lines (mostly card generation)
**Reused Code**: ~2000 lines (image upload, WhatsApp, etc.)
**Code Reuse**: 80% ✨
