# WhatsApp System - Part 2: Features & Advanced Topics

## 🎯 Key Features (Continued)

### 2. Smart Cancel Flow

**Scenario:** User just generated code for "John", then clicks "Cancel Access"

**Smart Behavior:**
```typescript
// System remembers last generated visitor
const lastVisitor = context.data.lastGeneratedVisitor;
// { name: "John", code: "ABC123" }

// Offers quick cancel
"Would you like to cancel access for John?"
[Yes, John] [Cancel another] [Nevermind]
```

**If user clicks "Yes, John":**
- Immediately cancels code ABC123
- No need to type anything

**If user clicks "Cancel another":**
- Asks for code or name
- Handles different visitor

### 3. Conversation Memory

**Example Flow:**
```
User: "Hi"
Kira: "Hello! I'm Kira..." [buttons]

User: [clicks Register Visitor]
Kira: "What's the visitor's name?"
State: AWAITING_VISITOR_NAME

User: "John"
System: Checks state, knows "John" is visitor name
Kira: "Access created for John. Code: ABC123"
State: idle
Context: Stores { lastGeneratedVisitor: { name: "John", code: "ABC123" } }
```


### 4. Button Click Handling

**When user clicks a button:**
```typescript
// Webhook includes button data
{
  interactive: {
    buttonReply: {
      id: "generate_code",
      title: "Register Visitor"
    }
  }
}

// System maps button ID to command
const buttonMap = {
  'generate_code': 'I want to generate a visitor code',
  'list_visitors': 'list my visitors',
  'cancel_code': 'cancel code'
};

// Processes as if user typed the command
```

**Special Buttons:**
```typescript
// Dynamic button with code
id: `cancel_last_visitor_${code}`  // e.g., "cancel_last_visitor_ABC123"

// Handler checks for pattern
if (buttonId.startsWith('cancel_last_visitor_')) {
  const code = buttonId.replace('cancel_last_visitor_', '');
  // Cancel that specific code
}
```

---

## 🔧 Configuration

### Environment Variables

```bash
# Choose ONE provider

# Option 1: Meta WhatsApp Business API
META_ACCESS_TOKEN=EAAxxxxx
META_PHONE_NUMBER_ID=123456789
META_VERIFY_TOKEN=your_verify_token
META_WEBHOOK_SECRET=your_webhook_secret

# Option 2: Twilio WhatsApp API
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Backend URL (for QR codes)
BACKEND_URL=http://localhost:3001
```


### Module Setup

```typescript
// whatsapp.module.ts
@Module({
  imports: [
    PrismaModule,
    VisitorCodeModule,
    OccupantsModule,
  ],
  controllers: [
    WebhookController,
    MetaWebhookTestController,
    WhatsAppHealthController,
  ],
  providers: [
    // Conversation Layer
    ConversationService,
    IntentService,
    StateStore,
    
    // Domain Layer
    EstateWhatsAppService,
    
    // Outbound Layer
    MessengerService,
    
    // Provider Layer
    WhatsAppProviderFactory,
    MetaWhatsAppProvider,
    TwilioWhatsAppProvider,
  ],
  exports: [
    ConversationService,
    MessengerService,
    EstateWhatsAppService,
  ],
})
export class WhatsAppModule {}
```

---

## 🧪 Testing

### 1. Health Check
```bash
curl http://localhost:3001/api/whatsapp/health
```

Response:
```json
{
  "status": "ok",
  "provider": "meta",
  "timestamp": "2024-03-14T15:26:19Z"
}
```

### 2. Test Webhook (Meta Format)
```bash
curl -X POST http://localhost:3001/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "2348061230727",
            "text": { "body": "Hello" },
            "type": "text"
          }]
        }
      }]
    }]
  }'
```


### 3. Test Specific Intent
```bash
# Test greeting
echo "Hello" | # send to webhook

# Test generate code
echo "Register a visitor" | # send to webhook

# Test list visitors
echo "Show my visitors" | # send to webhook
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Button title length invalid"
**Error:** `Button title length invalid. Min length: 1, Max length: 20`

**Cause:** Button title exceeds 20 characters

**Solution:**
```typescript
// BAD
title: "1️⃣ Register a visitor"  // 23 chars

// GOOD
title: "Register Visitor"  // 16 chars
```

### Issue 2: "Occupant not found"
**Cause:** User's phone number not in database

**Solution:**
```typescript
// Register occupant first
await prisma.occupant.create({
  data: {
    phone: "+2348061230727",
    name: "Test User",
    estateId: "estate-uuid",
    unitId: "unit-uuid",
    type: "OWNER",
    isActive: true
  }
});
```

### Issue 3: Messages not sending
**Cause:** Provider credentials wrong

**Solution:**
- Check environment variables
- Verify Meta/Twilio dashboard
- Check provider health endpoint
- Review logs for API errors


### Issue 4: State not persisting
**Cause:** StateStore using in-memory storage

**Current Implementation:**
```typescript
// state.store.ts
private contexts: Map<string, ConversationContext> = new Map();
```

**Limitation:** Resets on server restart

**Future Solution:** Use Redis or database
```typescript
// Redis implementation
async getContext(userId: string) {
  const data = await redis.get(`context:${userId}`);
  return JSON.parse(data);
}
```

---

## 📊 Data Flow Diagram

```
WhatsApp User
     ↓
Meta/Twilio Webhook
     ↓
┌─────────────────────────────────────┐
│  INBOUND LAYER                      │
│  • webhook.controller.ts            │
│  • inbound.parser.ts                │
│  → Normalize to InboundMessage      │
└─────────────────────────────────────┘
     ↓
┌─────────────────────────────────────┐
│  CONVERSATION LAYER                 │
│  • conversation.service.ts          │
│    1. Load context (state.store)    │
│    2. Detect intent (intent.service)│
│    3. Route to handler              │
│    4. Update state                  │
│  → Array of OutgoingMessage         │
└─────────────────────────────────────┘
     ↓
┌─────────────────────────────────────┐
│  DOMAIN LAYER                       │
│  • estate-whatsapp.service.ts       │
│    • Find occupant                  │
│    • Generate code                  │
│    • Create visitor card            │
│  → Business logic result            │
└─────────────────────────────────────┘
     ↓
┌─────────────────────────────────────┐
│  OUTBOUND LAYER                     │
│  • messenger.service.ts             │
│    • Show typing indicator          │
│    • Add human delays               │
│    • Retry on failure               │
│  → Call provider                    │
└─────────────────────────────────────┘
     ↓
┌─────────────────────────────────────┐
│  PROVIDER LAYER                     │
│  • provider.factory.ts              │
│  • meta.provider.ts OR              │
│  • twilio.provider.ts               │
│  → WhatsApp API call                │
└─────────────────────────────────────┘
     ↓
WhatsApp API
     ↓
User receives message
```


---

## 🎓 Key Design Patterns

### 1. Layered Architecture
Each layer has a specific responsibility:
- **Inbound:** Receive & normalize
- **Conversation:** Understand & route
- **Domain:** Business logic
- **Outbound:** Send with features
- **Provider:** API abstraction

**Benefits:**
- Easy to test each layer
- Can swap providers
- Clear separation of concerns
- Easy to maintain

### 2. Strategy Pattern (Providers)
```typescript
interface WhatsAppProvider {
  sendText(...): Promise<string>;
}

class MetaProvider implements WhatsAppProvider { }
class TwilioProvider implements WhatsAppProvider { }

// Factory chooses strategy
const provider = factory.getProvider();
await provider.sendText(...);
```

### 3. State Machine (Conversation)
```typescript
States: idle → AWAITING_VISITOR_NAME → idle
        idle → AWAITING_CANCEL_INFO → idle

Transitions:
- User clicks "Register" → AWAITING_VISITOR_NAME
- User provides name → idle
- User clicks "Cancel" → AWAITING_CANCEL_INFO
- User provides code → idle
```

### 4. Command Pattern (Button Mapping)
```typescript
// Button ID → Command
const commands = {
  'generate_code': () => handleGenerateCode(),
  'list_visitors': () => handleListVisitors(),
  'cancel_code': () => handleCancelCode()
};

// Execute command
commands[buttonId]();
```


---

## 🚀 Performance Optimizations

### 1. Typing Indicators
Makes the bot feel more human:
```typescript
await showTypingIndicator(to);
await sleep(calculateDelay(message));
await sendText(to, message);
```

### 2. Batch Sending
Send multiple messages efficiently:
```typescript
await sendBatch([
  { type: 'text', data: {...} },
  { type: 'media', data: {...} },
  { type: 'text', data: {...} }
]);
```

### 3. Retry Logic
Handle temporary failures:
```typescript
for (let attempt = 0; attempt < 3; attempt++) {
  try {
    return await provider.sendText(...);
  } catch (error) {
    if (attempt < 2) {
      await exponentialBackoff(attempt);
    }
  }
}
```

### 4. Context Caching
Store conversation context in memory:
```typescript
// Fast lookup
const context = contextMap.get(userId);

// vs slow database query
const context = await db.context.findUnique({ where: { userId } });
```

---

## 📝 Summary

The WhatsApp system is a **production-ready, layered architecture** that:

✅ **Handles:**
- Multi-turn conversations with state
- Interactive buttons
- Multiple WhatsApp providers (Meta/Twilio)
- Smart context-aware responses
- Visitor code generation and management
- Human-like conversation flow

✅ **Features:**
- Conversation memory
- Intent detection
- Multi-step flows
- Button interactions
- Typing indicators
- Retry logic
- Provider abstraction

✅ **Architecture:**
- Clean layered design
- Easy to test
- Easy to extend
- Provider-agnostic
- Well-documented

🎯 **Current Status:**
- **ACTIVE** and handling all WhatsApp interactions
- Supports both Meta and Twilio
- Fully integrated with visitor management
- Production-ready

💡 **Key Takeaway:**
This is a sophisticated conversational system that remembers context, handles complex flows, and provides a great user experience through Kira, your estate assistant.
