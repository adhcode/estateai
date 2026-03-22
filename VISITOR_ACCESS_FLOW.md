# Visitor Access System - Complete Flow Documentation

## Overview
This document maps out how the visitor access system works from WhatsApp message to database and back.

---

## 🏗️ Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    WhatsApp User                             │
│              (Resident sends message)                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              INBOUND LAYER (Entry Point)                     │
│  • webhook.controller.ts - Receives WhatsApp webhooks       │
│  • inbound.parser.ts - Parses Meta/Twilio format            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│           CONVERSATION LAYER (Brain)                         │
│  • conversation.service.ts - Main orchestrator              │
│  • intent.service.ts - Detects user intent                  │
│  • state.store.ts - Manages conversation state              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│            DOMAIN LAYER (Business Logic)                     │
│  • estate-whatsapp.service.ts - Estate operations           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          SERVICE LAYER (Core Operations)                     │
│  • visitor-code.service.ts - Code generation/validation     │
│  • visitor-card.service.ts - Visual card generation         │
│  • image-upload.service.ts - Upload to hosting              │
│  • qr-code.service.ts - QR code generation                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              DATABASE (Prisma)                               │
│  • VisitorCode, Occupant, Unit, Estate tables               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│           OUTBOUND LAYER (Response)                          │
│  • messenger.service.ts - Sends messages                    │
│  • provider.factory.ts - Chooses Meta/Twilio               │
│  • meta.provider.ts / twilio.provider.ts                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    WhatsApp User                             │
│           (Receives code + visitor card)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flow 1: Register a Visitor (Generate Code)

### Step-by-Step Flow

**1. User Interaction**
```
User clicks: "1️⃣ Register a visitor"
OR types: "Generate code for John"
```

**2. Webhook Reception** (`webhook.controller.ts`)
```typescript
@Post('webhook')
async handleWebhook(@Body() body: any) {
  // Receives webhook from Meta/Twilio
  const message = this.inboundParser.parse(body);
  // Passes to conversation service
  return this.conversationService.handleIncoming(message);
}
```

**3. Intent Detection** (`conversation.service.ts` → `intent.service.ts`)
```typescript
// Detects intent from message
const intent = await this.intentService.detectIntent({
  text: "I want to generate a visitor code",
  sessionId: context.sessionId
});
// Result: { displayName: "generate visitor code", parameters: {} }
```

**4. State Management** (`conversation.service.ts`)
```typescript
// Check if we're waiting for visitor name
if (context.state === 'AWAITING_VISITOR_NAME') {
  // User just sent the name
  const visitorName = message.text.trim();
  await this.handleGenerateCodeWithName(visitorName, phoneNumber);
}
```

**5. Name Collection** (if not provided)
```typescript
if (!visitorName) {
  // Set state to await name
  await this.updateState(phoneNumber, 'AWAITING_VISITOR_NAME');
  
  // Ask for name
  responses.push({
    kind: 'text',
    to: phoneNumber,
    body: "Please provide the visitor's name:"
  });
}
```

**6. Domain Service Call** (`estate-whatsapp.service.ts`)
```typescript
const result = await this.estateWhatsAppService.generateAndSendVisitorCode({
  occupantPhone: phoneNumber,
  visitorName: visitorName,
  validHours: 24
});
```

**7. Occupant Lookup** (`estate-whatsapp.service.ts`)
```typescript
// Find occupant by phone number
const occupant = await this.findOccupantByPhone(params.occupantPhone);

// Query: SELECT * FROM Occupant WHERE phone = '+1234567890'
// Includes: estate, unit, primaryOccupant relations
```

**8. Code Generation** (`visitor-code.service.ts`)
```typescript
// Generate unique 6-8 character code
const code = generateCode(); // e.g., "ABC123"

// Create in database
const visitorCode = await this.prisma.visitorCode.create({
  data: {
    code: code,
    visitorName: "John",
    occupantId: occupant.id,
    estateId: occupant.estateId,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    status: 'ACTIVE'
  }
});
```

**9. Visual Card Generation** (`visitor-card.service.ts`)
```typescript
// Generate beautiful visitor card with QR code
const cardPath = await this.visitorCardService.generateVisitorCard(visitorCode);
// Creates: /tmp/visitor-card-ABC123.png
```

**10. Image Upload** (`image-upload.service.ts`)
```typescript
// Upload to public hosting (Telegraph/ImgBB/Cloudinary)
const cardUrl = await this.imageUploadService.uploadImage(cardPath);
// Returns: https://telegra.ph/file/abc123.png
```

**11. Send to Occupant** (`messenger.service.ts`)
```typescript
// Send text message
await this.messengerService.sendText({
  to: occupantPhone,
  body: `Access created for John\n\nCode: *ABC123*\nValid until: ...`
});

// Send visitor card image
await this.messengerService.sendMedia({
  to: occupantPhone,
  type: 'image',
  url: cardUrl,
  caption: 'Visitor Access Card for John'
});
```

**12. Send to Visitor** (if phone provided)
```typescript
if (params.visitorPhone) {
  await this.messengerService.sendText({
    to: visitorPhone,
    body: `Your Access Code: *ABC123*\n...`
  });
  
  await this.messengerService.sendMedia({
    to: visitorPhone,
    type: 'image',
    url: cardUrl
  });
}
```

**13. Follow-up Buttons** (`conversation.service.ts`)
```typescript
responses.push({
  kind: 'interactive',
  to: phoneNumber,
  interactive: {
    type: 'button',
    body: { text: 'What would you like to do next?' },
    action: {
      buttons: [
        { id: 'generate_code', title: 'Generate Another' },
        { id: 'list_visitors', title: 'My Visitors' },
        { id: 'help', title: 'Done' }
      ]
    }
  }
});
```

---

## 🔄 Flow 2: Check Visitor Status (List Visitors)

**1. User clicks:** "2️⃣ Check visitor status"

**2. Intent detected:** "list visitors"

**3. Domain service call:**
```typescript
const result = await this.estateWhatsAppService.listVisitorCodes(occupantPhone);
```

**4. Database query:**
```typescript
const visitors = await this.visitorCodeService.findByOccupant(occupant.id);
// Returns all visitor codes for this occupant
```

**5. Format and send:**
```typescript
// Group by status: ACTIVE, USED, EXPIRED, REVOKED
// Send formatted list with interactive buttons for each visitor
```

---

## 🔄 Flow 3: Cancel Visitor Access

**1. User clicks:** "3️⃣ Cancel visitor access"

**2. Intent detected:** "cancel visitor code"

**3. Check for code/name:**
```typescript
if (!code && !visitorName) {
  // Set state to await cancel info
  await this.updateState(phoneNumber, 'AWAITING_CANCEL_INFO');
  
  responses.push({
    kind: 'text',
    body: 'Which visitor code would you like to cancel?\n\nYou can provide:\n• The visitor code (e.g., "ABC123")\n• The visitor name (e.g., "Jackson")'
  });
}
```

**4. User provides code or name:**
```typescript
// Next message is treated as cancel info
if (context.state === 'AWAITING_CANCEL_INFO') {
  const input = message.text.trim();
  const isCode = /^[A-Z0-9]{6,8}$/i.test(input);
  
  await this.handleCancelWithInfo(
    isCode ? input.toUpperCase() : undefined,
    isCode ? undefined : input,
    phoneNumber
  );
}
```

**5. Domain service call:**
```typescript
const result = await this.estateWhatsAppService.cancelVisitorCode({
  occupantPhone: phoneNumber,
  code: code,
  visitorName: visitorName
});
```

**6. Find visitor code:**
```typescript
if (params.code) {
  visitorCode = await this.visitorCodeService.findByCode(params.code);
} else if (params.visitorName) {
  const visitors = await this.visitorCodeService.findByOccupant(occupant.id);
  visitorCode = visitors.find(v => 
    v.visitorName.toLowerCase().includes(params.visitorName.toLowerCase()) &&
    v.status === 'ACTIVE'
  );
}
```

**7. Verify ownership:**
```typescript
if (visitorCode.occupantId !== occupant.id) {
  return { success: false, message: 'You can only cancel your own visitor codes' };
}
```

**8. Cancel code:**
```typescript
await this.visitorCodeService.cancelCode(visitorCode.id);
// Updates: status = 'REVOKED'
```

**9. Confirm to user:**
```typescript
responses.push({
  kind: 'interactive',
  body: {
    text: `Visitor code ${code} for ${visitorName} has been cancelled.\n\nThe code can no longer be used for entry.`
  },
  action: {
    buttons: [
      { id: 'list_visitors', title: 'My Visitors' },
      { id: 'generate_code', title: 'Generate Code' },
      { id: 'help', title: 'Done' }
    ]
  }
});
```

---

## 📊 Database Schema (Relevant Tables)

```prisma
model VisitorCode {
  id            String   @id @default(uuid())
  code          String   @unique
  visitorName   String
  visitorPhone  String?
  status        String   @default("ACTIVE") // ACTIVE, USED, EXPIRED, REVOKED
  expiresAt     DateTime
  usedAt        DateTime?
  
  occupantId    String
  occupant      Occupant @relation(fields: [occupantId], references: [id])
  
  estateId      String
  estate        Estate   @relation(fields: [estateId], references: [id])
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Occupant {
  id            String   @id @default(uuid())
  phone         String   @unique
  name          String
  email         String?
  type          String   // OWNER, TENANT, FAMILY_MEMBER
  isActive      Boolean  @default(true)
  
  unitId        String
  unit          Unit     @relation(fields: [unitId], references: [id])
  
  estateId      String
  estate        Estate   @relation(fields: [estateId], references: [id])
  
  visitorCodes  VisitorCode[]
}
```

---

## 🔑 Key Components & Their Roles

### Essential (Core Functionality)

1. **webhook.controller.ts** - Entry point for WhatsApp messages
2. **conversation.service.ts** - Main orchestrator, routes all intents
3. **intent.service.ts** - Detects what user wants to do
4. **state.store.ts** - Remembers conversation context
5. **estate-whatsapp.service.ts** - Business logic for estate operations
6. **visitor-code.service.ts** - Core code generation/validation
7. **messenger.service.ts** - Sends messages back to WhatsApp
8. **provider.factory.ts** - Chooses Meta or Twilio provider

### Important (Enhanced Experience)

9. **visitor-card.service.ts** - Creates beautiful visual cards
10. **image-upload.service.ts** - Uploads cards to public hosting
11. **qr-code.service.ts** - Generates QR codes for verification
12. **inbound.parser.ts** - Normalizes different webhook formats

### Optional (Nice to Have)

13. **meta-webhook-test.controller.ts** - Testing endpoint
14. **whatsapp-health.controller.ts** - Health checks

---

## 🎯 What You Need for Visitor Access to Work

### Minimum Requirements:

1. ✅ **Database setup** - Occupant, VisitorCode, Estate, Unit tables
2. ✅ **WhatsApp provider** - Meta or Twilio configured
3. ✅ **Webhook endpoint** - Public URL receiving webhooks
4. ✅ **Occupant registration** - User's phone must be in database
5. ✅ **Code generation logic** - Unique code creation
6. ✅ **Message sending** - Ability to send WhatsApp messages

### For Full Experience:

7. ✅ **Visitor card generation** - Visual cards with QR codes
8. ✅ **Image hosting** - Telegraph/ImgBB/Cloudinary
9. ✅ **Intent detection** - Natural language understanding
10. ✅ **State management** - Multi-step conversations
11. ✅ **Button interactions** - Interactive WhatsApp buttons

---

## 🐛 Common Issues & Solutions

### Issue: "Occupant not found"
**Cause:** User's phone number not in database
**Solution:** Register occupant first via admin panel or API

### Issue: Code generation fails
**Cause:** Unable to generate unique code after 10 attempts
**Solution:** Check database for duplicate codes, increase retry limit

### Issue: Visitor card not sending
**Cause:** Image upload service failing
**Solution:** Check Telegraph/ImgBB/Cloudinary credentials

### Issue: WhatsApp messages not received
**Cause:** Webhook not configured or provider credentials wrong
**Solution:** Verify webhook URL and provider API keys

### Issue: Button clicks not working
**Cause:** Button ID not mapped in mapButtonToCommand()
**Solution:** Add button ID to mapping in conversation.service.ts

---

## 🔧 Configuration Checklist

- [ ] WhatsApp provider configured (Meta or Twilio)
- [ ] Webhook URL set up and publicly accessible
- [ ] Database migrations run
- [ ] At least one estate created
- [ ] At least one unit created
- [ ] At least one occupant registered with phone
- [ ] Image upload service configured (optional but recommended)
- [ ] Environment variables set (.env file)

---

## 📝 Testing the Flow

1. **Register test occupant:**
   ```bash
   npm run create-occupant -- --phone=+1234567890 --name="Test User"
   ```

2. **Send WhatsApp message:**
   - Text: "Hi" → Should get welcome message with buttons
   - Click: "1️⃣ Register a visitor"
   - Type: "John Doe"
   - Should receive visitor code and card

3. **Check visitor status:**
   - Click: "2️⃣ Check visitor status"
   - Should see list of active visitors

4. **Cancel access:**
   - Click: "3️⃣ Cancel visitor access"
   - Type: "John Doe" or the code
   - Should confirm cancellation

---

## 🚀 Next Steps for Optimization

1. Add caching for occupant lookups (Redis)
2. Implement rate limiting per user
3. Add analytics tracking
4. Implement visitor arrival notifications
5. Add bulk code generation
6. Implement scheduled code expiration cleanup
7. Add visitor history and reports
