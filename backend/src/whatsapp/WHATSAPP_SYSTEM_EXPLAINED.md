# WhatsApp System - Complete Architecture Guide

## 🎯 Overview

The `whatsapp` folder contains your **production-ready conversational WhatsApp system** for managing visitor access through natural language conversations with state management and interactive buttons.

This is the **ACTIVE SYSTEM** currently handling all WhatsApp interactions with Kira, your estate assistant.

---

## 📁 Folder Structure (Layered Architecture)

```
whatsapp/
├── 📥 INBOUND LAYER (Entry Point)
│   ├── webhook.controller.ts           # Receives webhooks from Meta/Twilio
│   ├── inbound.parser.ts               # Normalizes different webhook formats
│   └── meta-webhook-test.controller.ts # Testing endpoint
│
├── 🧠 CONVERSATION LAYER (Brain)
│   ├── conversation.service.ts         # Main orchestrator & flow manager
│   ├── intent.service.ts               # Detects what user wants
│   └── state.store.ts                  # Remembers conversation context
│
├── 🏢 DOMAIN LAYER (Business Logic)
│   └── estate-whatsapp.service.ts      # Estate-specific operations
│
├── 📤 OUTBOUND LAYER (Sending Messages)
│   └── messenger.service.ts            # Sends messages via providers
│
├── 🔌 PROVIDER LAYER (WhatsApp APIs)
│   ├── provider.factory.ts             # Chooses Meta or Twilio
│   ├── meta.provider.ts                # Meta WhatsApp Business API
│   └── twilio.provider.ts              # Twilio WhatsApp API
│
├── 📋 INTERFACES
│   └── whatsapp-provider.interface.ts  # Common interface for providers
│
├── 🏥 HEALTH & MODULE
│   ├── whatsapp-health.controller.ts   # Health check endpoint
│   ├── whatsapp.module.ts              # NestJS module definition
│   └── README.md                       # Documentation
```

---

## 🔄 Complete Message Flow (Step by Step)


### 📥 Step 1: Message Arrives (INBOUND LAYER)

**File:** `inbound/webhook.controller.ts`

```typescript
@Post('webhook')
async handleWebhook(@Body() body: any) {
  // Receives webhook from Meta or Twilio
}
```

**What happens:**
- WhatsApp sends webhook to your server
- Meta format: Complex nested JSON
- Twilio format: Simpler flat structure
- Both arrive at the same endpoint

**Example Meta Webhook:**
```json
{
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
}
```

**Example Twilio Webhook:**
```json
{
  "From": "whatsapp:+2348061230727",
  "Body": "Hello",
  "MessageSid": "SM..."
}
```

---

### 🔄 Step 2: Parse & Normalize (INBOUND LAYER)

**File:** `inbound/inbound.parser.ts`

```typescript
parse(webhookBody: any): InboundMessage[]
```

**Purpose:** Convert different webhook formats into a standard format

**Output (Normalized):**
```typescript
{
  from: "2348061230727",
  text: "Hello",
  timestamp: "2024-03-14T15:26:19Z",
  messageId: "wamid.xxx",
  interactive: null  // or button data if clicked
}
```

**Why this matters:**
- Your code doesn't care if it's Meta or Twilio
- Easy to add new providers later
- Single format throughout the system


---

### 🧠 Step 3: Load Conversation Context (CONVERSATION LAYER)

**File:** `conversation/state.store.ts`

```typescript
getContext(userId: string): ConversationContext
```

**What it stores:**
```typescript
{
  userId: "2348061230727",
  sessionId: "session-uuid",
  state: "AWAITING_VISITOR_NAME",  // or "idle"
  data: {
    lastIntent: "generate visitor code",
    lastGeneratedVisitor: {
      name: "John",
      code: "ABC123"
    }
  },
  lastActivity: Date
}
```

**Why this matters:**
- Remembers where you are in the conversation
- Enables multi-step flows
- Stores temporary data between messages

**Example Flow:**
1. User: "Register a visitor"
2. Kira: "What's the visitor's name?" (state = AWAITING_VISITOR_NAME)
3. User: "John"
4. System checks state, knows "John" is the visitor name

---

### 🎯 Step 4: Detect Intent (CONVERSATION LAYER)

**File:** `conversation/intent.service.ts`

```typescript
detectIntent(input: { text: string; sessionId: string }): DetectedIntent
```

**How it works:**
Uses pattern matching to understand what the user wants:

```typescript
// Example patterns
const patterns = {
  greeting: /^(hi|hello|hey)/i,
  generateCode: /generate|create|register.*visitor/i,
  listVisitors: /list|show.*visitors/i,
  cancelCode: /cancel.*access/i
};
```

**Output:**
```typescript
{
  displayName: "generate visitor code",
  confidence: 0.95,
  parameters: {
    visitorName: "John"  // extracted if mentioned
  }
}
```


**Supported Intents:**
- `greeting` - Hi, hello, hey
- `help` - Help, what can you do
- `generate visitor code` - Register/create visitor
- `list visitors` - Show my visitors
- `cancel visitor code` - Cancel access
- `verify visitor code` - Check if code is valid
- `visitor departure` - Mark visitor as left
- `visitor at gate` - Notify that visitor has arrived
- `fallback` - Didn't understand

---

### 🎭 Step 5: Route to Handler (CONVERSATION LAYER)

**File:** `conversation/conversation.service.ts`

```typescript
private async routeIntent(intent, context, message): Promise<OutgoingMessage[]>
```

**Routing Logic:**
```typescript
switch (intent.displayName.toLowerCase()) {
  case 'greeting':
    this.getGreetingWithButtons(phoneNumber, responses);
    break;
    
  case 'generate visitor code':
    await this.handleGenerateCode(intent, phoneNumber, responses);
    break;
    
  case 'list visitors':
    await this.getListVisitorsWithButtons(phoneNumber, responses);
    break;
    
  case 'cancel visitor code':
    await this.getCancelCodeWithButtons(intent, phoneNumber, responses);
    break;
}
```

**Each handler:**
1. Checks if required info is available
2. Updates conversation state if needed
3. Calls domain service for business logic
4. Formats response with buttons
5. Returns array of messages to send


---

### 🏢 Step 6: Execute Business Logic (DOMAIN LAYER)

**File:** `domain/estate-whatsapp.service.ts`

This is where the actual work happens:

**Example: Generate Visitor Code**
```typescript
async generateAndSendVisitorCode(params) {
  // 1. Find occupant by phone
  const occupant = await this.findOccupantByPhone(params.occupantPhone);
  
  // 2. Generate visitor code
  const visitorCode = await this.visitorCodeService.generateCode({
    visitorName: params.visitorName,
    occupantId: occupant.id,
    validHours: 24
  });
  
  // 3. Generate visitor card with QR code
  const cardPath = await this.visitorCardService.generateVisitorCard(visitorCode);
  
  // 4. Upload to public hosting
  const cardUrl = await this.imageUploadService.uploadImage(cardPath);
  
  // 5. Send to occupant
  await this.messengerService.sendText({
    to: params.occupantPhone,
    body: `Access created for ${params.visitorName}\nCode: ${visitorCode.code}`
  });
  
  await this.messengerService.sendMedia({
    to: params.occupantPhone,
    type: 'image',
    url: cardUrl
  });
  
  // 6. Send to visitor if phone provided
  if (params.visitorPhone) {
    await this.messengerService.sendText({
      to: params.visitorPhone,
      body: `Your access code: ${visitorCode.code}`
    });
  }
  
  return { success: true, code: visitorCode.code };
}
```

**Other Operations:**
- `listVisitorCodes()` - Get all visitor codes for occupant
- `cancelVisitorCode()` - Revoke a code
- `markVisitorDeparted()` - Record departure
- `notifyVisitorArrival()` - Alert occupant when visitor enters


---

### 📤 Step 7: Send Response (OUTBOUND LAYER)

**File:** `outbound/messenger.service.ts`

This service handles ALL outgoing messages:

**Methods:**
```typescript
// Send text message
async sendText(input: SendTextInput): Promise<string | null>

// Send image/video/document
async sendMedia(input: SendMediaInput): Promise<string | null>

// Send interactive buttons
async sendInteractive(input: SendInteractiveInput): Promise<string | null>

// Send template message
async sendTemplate(input: SendTemplateInput): Promise<string | null>

// Send multiple messages
async sendBatch(messages: Array<...>): Promise<string[]>
```

**Features:**
- Typing indicators (shows "typing..." before sending)
- Human-like delays (random 1-3 seconds)
- Retry logic with exponential backoff
- Mark messages as read
- Error handling

**Example:**
```typescript
await messengerService.sendText({
  to: "2348061230727",
  body: "Hello! I'm Kira, your estate assistant."
}, {
  showTyping: true,  // Show typing indicator
  retries: 3         // Retry up to 3 times
});
```

---

### 🔌 Step 8: Choose Provider (PROVIDER LAYER)

**File:** `providers/provider.factory.ts`

```typescript
getProvider(): WhatsAppProvider {
  if (process.env.META_ACCESS_TOKEN) {
    return new MetaWhatsAppProvider();
  } else if (process.env.TWILIO_ACCOUNT_SID) {
    return new TwilioWhatsAppProvider();
  }
  throw new Error('No WhatsApp provider configured');
}
```

**Why this matters:**
- Switch between Meta and Twilio without code changes
- Just change environment variables
- Both providers implement the same interface


---

### 📡 Step 9: Send via WhatsApp API (PROVIDER LAYER)

**Meta Provider** (`providers/meta.provider.ts`):
```typescript
async sendText(to: string, body: string): Promise<string> {
  const response = await axios.post(
    `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
    {
      messaging_product: "whatsapp",
      to: to,
      type: "text",
      text: { body: body }
    },
    {
      headers: {
        'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data.messages[0].id;
}
```

**Twilio Provider** (`providers/twilio.provider.ts`):
```typescript
async sendText(to: string, body: string): Promise<string> {
  const message = await twilioClient.messages.create({
    from: `whatsapp:${TWILIO_PHONE}`,
    to: `whatsapp:${to}`,
    body: body
  });
  
  return message.sid;
}
```

**Both return:** Message ID for tracking

---

## 🎨 Layer-by-Layer Breakdown

### 📥 INBOUND LAYER
**Purpose:** Receive and normalize incoming messages

**Files:**
- `webhook.controller.ts` - HTTP endpoint
- `inbound.parser.ts` - Format converter
- `meta-webhook-test.controller.ts` - Testing

**Responsibilities:**
- Verify webhook signatures
- Parse different formats
- Extract message data
- Handle status updates
- Return 200 OK quickly


---

### 🧠 CONVERSATION LAYER
**Purpose:** Manage conversation flow and state

**Files:**
- `conversation.service.ts` - Main orchestrator (900+ lines!)
- `intent.service.ts` - Intent detection
- `state.store.ts` - State management

**Responsibilities:**
- Detect user intent
- Remember conversation context
- Handle multi-step flows
- Route to appropriate handlers
- Format responses with buttons
- Manage conversation state transitions

**Key Concepts:**

**1. Conversation State:**
```typescript
'idle'                    // No active flow
'AWAITING_VISITOR_NAME'   // Waiting for visitor name
'AWAITING_CANCEL_INFO'    // Waiting for code/name to cancel
```

**2. Context Data:**
```typescript
{
  lastIntent: "generate visitor code",
  lastIntentParams: { visitorName: "John" },
  lastGeneratedVisitor: {
    name: "John",
    code: "ABC123"
  }
}
```

**3. Multi-Step Flow Example:**
```
User: "Register a visitor"
  → State: AWAITING_VISITOR_NAME
  → Response: "What's the visitor's name?"

User: "John"
  → Check state: AWAITING_VISITOR_NAME
  → Extract name: "John"
  → Generate code
  → State: idle
  → Response: "Code created for John: ABC123"
```


---

### 🏢 DOMAIN LAYER
**Purpose:** Estate-specific business logic

**File:**
- `estate-whatsapp.service.ts` - All estate operations

**Responsibilities:**
- Find occupant by phone
- Generate visitor codes
- Send visitor cards
- Notify arrivals/departures
- Cancel codes
- List visitors

**Why separate domain layer:**
- Business logic isolated from WhatsApp details
- Can be reused by other interfaces (SMS, web, etc.)
- Easier to test
- Clear separation of concerns

---

### 📤 OUTBOUND LAYER
**Purpose:** Send messages with smart features

**File:**
- `messenger.service.ts` - Message sending orchestrator

**Features:**

**1. Typing Indicators:**
```typescript
await showTypingIndicator(to);
// User sees "Kira is typing..."
await sleep(2000);
await sendText(to, message);
```

**2. Human-like Delays:**
```typescript
// Random delay based on message length
const delay = Math.min(message.length * 50, 3000);
await sleep(delay);
```

**3. Retry Logic:**
```typescript
for (let attempt = 0; attempt < retries; attempt++) {
  try {
    return await provider.sendText(to, body);
  } catch (error) {
    if (attempt < retries - 1) {
      await exponentialBackoff(attempt);
    }
  }
}
```

**4. Batch Sending:**
```typescript
await sendBatch([
  { type: 'text', data: { to, body: "Message 1" } },
  { type: 'media', data: { to, url: "image.jpg" } },
  { type: 'text', data: { to, body: "Message 2" } }
]);
```


---

### 🔌 PROVIDER LAYER
**Purpose:** Abstract WhatsApp API differences

**Files:**
- `provider.factory.ts` - Provider selector
- `meta.provider.ts` - Meta WhatsApp Business API
- `twilio.provider.ts` - Twilio WhatsApp API
- `whatsapp-provider.interface.ts` - Common interface

**Interface (Contract):**
```typescript
interface WhatsAppProvider {
  sendText(to: string, body: string): Promise<string>;
  sendMedia(to: string, type: string, url: string): Promise<string>;
  sendInteractive(to: string, interactive: any): Promise<string>;
  markAsRead(messageId: string): Promise<void>;
  healthCheck(): Promise<{ healthy: boolean }>;
}
```

**Why this matters:**
- Both providers implement same interface
- Easy to switch providers
- Easy to add new providers (e.g., 360Dialog, MessageBird)
- Code doesn't care which provider is used

**Provider Comparison:**

| Feature | Meta | Twilio |
|---------|------|--------|
| Interactive Buttons | ✅ Yes | ✅ Yes |
| Media Messages | ✅ Yes | ✅ Yes |
| Templates | ✅ Yes | ✅ Yes |
| Typing Indicator | ✅ Yes | ❌ No |
| Read Receipts | ✅ Yes | ❌ No |
| Setup Complexity | High | Low |
| Cost | Lower | Higher |
| Sandbox | No | Yes |

---

## 🎯 Key Features Explained

### 1. Interactive Buttons

**Code:**
```typescript
responses.push({
  kind: 'interactive',
  to: phoneNumber,
  interactive: {
    type: 'button',
    body: {
      text: "Hello I'm Kira, your estate assistant.\n\nWould you like to register a visitor now?"
    },
    action: {
      buttons: [
        { type: 'reply', reply: { id: 'generate_code', title: 'Register Visitor' } },
        { type: 'reply', reply: { id: 'list_visitors', title: 'Check Status' } },
        { type: 'reply', reply: { id: 'cancel_code', title: 'Cancel Access' } }
      ]
    }
  }
});
```

**User sees:**
```
Hello I'm Kira, your estate assistant.

Would you like to register a visitor now?

[Register Visitor] [Check Status] [Cancel Access]
```

