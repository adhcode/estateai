# WhatsApp Conversation System - Developer Guide

## 🎯 Overview
This guide shows you exactly where to make changes for conversation flows, typing indicators, confirmations, and estate rules.

## 📁 Key Files & Their Roles

### 1. **Intent Detection** - Where messages are understood
**File**: `backend/src/whatsapp/conversation/intent.service.ts`

This is where the system figures out what the user wants. Add new patterns here to recognize different types of requests.

**Example patterns:**
```typescript
// Visitor code generation
if (text.includes('visitor') || text.includes('access') || text.includes('gate')) {
  return 'generate_visitor_code';
}

// Estate rules query
if (text.includes('rule') || text.includes('regulation') || text.includes('allowed')) {
  return 'query_estate_rules';
}
```

**Location**: Line ~15-100

---

### 2. **Conversation State Management** - Tracking conversations
**File**: `backend/src/whatsapp/conversation/state-store.service.ts`

This tracks what state each user is in (e.g., waiting for visitor name, waiting for confirmation, etc.)

**States you can add:**
```typescript
export type ConversationState = 
  | 'IDLE'
  | 'AWAITING_VISITOR_NAME'
  | 'AWAITING_VISITOR_PHONE'
  | 'AWAITING_VISITOR_CODE_CONFIRMATION'  // New state for confirmation
  | 'AWAITING_RESIDENT_PHOTO'
  // ... add more states
```

---

### 3. **Main Conversation Logic** - Where the magic happens
**File**: `backend/src/whatsapp/conversation/conversation.service.ts`

This is the **main orchestrator**. It receives messages, checks state, and decides what to do.

#### Key Methods:

**a) `handleMessage()` - Entry point**
```typescript
async handleMessage(message: IncomingMessage): Promise<OutgoingMessage[]>
```
- **Location**: Line ~200
- **What it does**: Receives incoming WhatsApp message and routes it
- **Edit here to**: Add new message handling logic

**b) `handleIntent()` - Intent router**
```typescript
private async handleIntent(intent: string, phoneNumber: string, message: IncomingMessage): Promise<OutgoingMessage[]>
```
- **Location**: Line ~400
- **What it does**: Routes intents to specific handlers
- **Edit here to**: Add new intent handlers

**c) State-specific handlers**
```typescript
private async handleAwaitingVisitorName(phoneNumber: string, text: string): Promise<OutgoingMessage[]>
private async handleAwaitingVisitorPhone(phoneNumber: string, text: string): Promise<OutgoingMessage[]>
```
- **Location**: Line ~600-1000
- **What it does**: Handles responses when user is in specific states
- **Edit here to**: Add confirmation logic, handle yes/no responses

---

### 4. **Domain Service** - Business logic
**File**: `backend/src/whatsapp/domain/estate-whatsapp.service.ts`

This contains the actual business logic for operations (generate code, send messages, etc.)

#### Key Methods:

**a) `generateAndSendVisitorCode()` - Generate visitor codes**
```typescript
async generateAndSendVisitorCode(params: {
  occupantPhone: string;
  visitorName: string;
  visitorPhone?: string;
  validHours?: number;
}): Promise<{ success: boolean; code?: string; message: string }>
```
- **Location**: Line ~40
- **What it does**: Generates visitor code and sends WhatsApp messages
- **Edit here to**: Change message templates, add typing indicators

**b) `queryEstateRules()` - Query estate rules**
```typescript
async queryEstateRules(params: {
  occupantPhone: string;
  query: string;
}): Promise<{ success: boolean; answer?: string; message: string }>
```
- **Location**: Line ~850
- **What it does**: Searches estate rules and sends answers
- **Edit here to**: Customize rule responses

---

### 5. **Typing Indicators** - Show "typing..."
**File**: `backend/src/whatsapp/outbound/messenger.service.ts`

```typescript
async showTypingIndicator(phoneNumber: string): Promise<void>
```
- **Location**: Line ~100
- **What it does**: Shows typing indicator for 3 seconds
- **Use in any service**: Just call `await this.messengerService.showTypingIndicator(phoneNumber)`

---

### 6. **Estate Rules Management**
**File**: `backend/src/estates/estate-rules.service.ts`

This manages estate rules (CRUD operations).

**Key Methods:**
```typescript
// Get all rules for an estate
async getEstateRules(estateId: string): Promise<EstateRulesData | null>

// Find matching rules
async findMatchingRules(estateId: string, query: string)

// Update rules
async updateEstateRules(estateId: string, rules: EstateRulesData): Promise<boolean>

// Add a rule
async addRule(estateId: string, rule: EstateRule): Promise<boolean>
```

**REST API Endpoints** (`backend/src/estates/estate-rules.controller.ts`):
```
GET    /estates/:estateId/rules          - Get all rules
POST   /estates/:estateId/rules          - Update all rules
POST   /estates/:estateId/rules/search   - Search rules
POST   /estates/:estateId/rules/add      - Add a rule
DELETE /estates/:estateId/rules/:ruleId  - Remove a rule
```

---

## 🔧 How to Add Confirmation Flow

### Step 1: Add new state in `state-store.service.ts`
```typescript
export type ConversationState = 
  | 'IDLE'
  | 'AWAITING_VISITOR_NAME'
  | 'AWAITING_VISITOR_CODE_CONFIRMATION'  // Add this
```

### Step 2: Detect visitor mention in `intent.service.ts`
```typescript
// Check if message mentions someone at the gate
const gatePattern = /(.+?)\s+(?:is )?at the gate/i;
const match = text.match(gatePattern);
if (match) {
  return 'visitor_at_gate';
}
```

### Step 3: Handle intent in `conversation.service.ts`
```typescript
case 'visitor_at_gate':
  // Extract name and ask for confirmation
  return await this.handleVisitorAtGate(phoneNumber, text);
```

### Step 4: Add handler method
```typescript
private async handleVisitorAtGate(phoneNumber: string, text: string): Promise<OutgoingMessage[]> {
  const responses: OutgoingMessage[] = [];
  
  // Extract visitor name
  const match = text.match(/(.+?)\s+(?:is )?at the gate/i);
  const visitorName = match[1].trim();
  
  // Store in context
  await this.stateStore.setContext(phoneNumber, { 
    pendingVisitorName: visitorName 
  });
  await this.stateStore.setState(phoneNumber, 'AWAITING_VISITOR_CODE_CONFIRMATION');
  
  // Ask for confirmation
  responses.push({
    kind: 'text',
    to: phoneNumber,
    body: `Got it! Do you want to generate a visitor code for ${visitorName}?`
  });
  
  // Add Yes/No buttons
  responses.push({
    kind: 'interactive',
    to: phoneNumber,
    interactive: {
      type: 'button',
      body: { text: 'Generate code?' },
      action: {
        buttons: [
          { type: 'reply', reply: { id: 'confirm_visitor_yes', title: 'Yes, generate' } },
          { type: 'reply', reply: { id: 'confirm_visitor_no', title: 'No, cancel' } }
        ]
      }
    }
  });
  
  return responses;
}
```

### Step 5: Handle confirmation response
```typescript
private async handleAwaitingVisitorCodeConfirmation(
  phoneNumber: string, 
  text: string
): Promise<OutgoingMessage[]> {
  const responses: OutgoingMessage[] = [];
  
  // Get stored visitor name
  const context = await this.stateStore.getContext(phoneNumber);
  const visitorName = context?.pendingVisitorName;
  
  // Check if user confirmed
  if (text.toLowerCase().includes('yes') || text === 'confirm_visitor_yes') {
    await this.stateStore.setState(phoneNumber, 'AWAITING_VISITOR_PHONE');
    
    responses.push({
      kind: 'text',
      to: phoneNumber,
      body: `Great! What's ${visitorName}'s phone number? (or reply "skip" if you don't have it)`
    });
  } else {
    // User said no
    await this.stateStore.clearState(phoneNumber);
    
    responses.push({
      kind: 'text',
      to: phoneNumber,
      body: 'Okay, cancelled. Let me know if you need anything else!'
    });
  }
  
  return responses;
}
```

---

## 📝 Message Templates Location

All message templates are **inline** in the code. To change them:

1. **Visitor code messages**: `estate-whatsapp.service.ts` line ~90-130
2. **Rule responses**: `estate-whatsapp.service.ts` line ~850-880
3. **Confirmation messages**: `conversation.service.ts` (various locations)
4. **Button labels**: Search for `interactive: { type: 'button'` in `conversation.service.ts`

---

## 🎨 Adding Typing Indicators

Anywhere in your code, just call:
```typescript
await this.messengerService.showTypingIndicator(phoneNumber);
// Then send your message
await this.messengerService.sendText({ to: phoneNumber, body: 'Your message' });
```

**Example in estate-whatsapp.service.ts:**
```typescript
// Show typing indicator
await this.messengerService.showTypingIndicator(params.occupantPhone);

// Then send the message
await this.messengerService.sendText({
  to: params.occupantPhone,
  body: 'Your visitor code is...'
});
```

---

## 🔍 How to Edit Estate Rules

### Option 1: Via REST API
```bash
# Get all rules for an estate
GET /estates/{estateId}/rules

# Update rules
POST /estates/{estateId}/rules
{
  "rules": [
    {
      "id": "pets-policy",
      "category": "pets",
      "title": "Pet Policy",
      "rule": "Pets are not allowed",
      "keywords": ["pet", "pets", "dog", "cat"],
      "answer": "Pets are not allowed in the estate..."
    }
  ]
}

# Add a single rule
POST /estates/{estateId}/rules/add
{
  "id": "parking-policy",
  "category": "parking",
  "title": "Parking Rules",
  "rule": "Visitors must park in designated areas",
  "keywords": ["parking", "park", "car", "vehicle"],
  "answer": "Visitors must park in the designated visitor parking areas..."
}
```

### Option 2: Directly in Database
Rules are stored in the `estates` table, `rules` column (JSONB).

### Option 3: Via WhatsApp (Future feature)
You can add a WhatsApp command for admins to update rules.

---

## 🗂️ File Structure Summary

```
backend/src/
├── whatsapp/
│   ├── conversation/
│   │   ├── intent.service.ts          ← Detect what user wants
│   │   ├── conversation.service.ts    ← Main orchestrator (MOST IMPORTANT)
│   │   └── state-store.service.ts     ← Track conversation states
│   ├── domain/
│   │   └── estate-whatsapp.service.ts ← Business logic & message templates
│   └── outbound/
│       └── messenger.service.ts       ← Typing indicators, send messages
├── estates/
│   ├── estate-rules.service.ts        ← Estate rules logic
│   └── estate-rules.controller.ts     ← Estate rules REST API
└── visitor-code/
    └── visitor-code.service.ts        ← Visitor code generation
```

---

## 🚀 Quick Reference: Common Changes

| What You Want to Change | File to Edit | Line Range |
|------------------------|--------------|------------|
| Add new intent pattern | `intent.service.ts` | ~20-100 |
| Add confirmation flow | `conversation.service.ts` | ~600-1000 |
| Change message templates | `estate-whatsapp.service.ts` | ~90-130 |
| Add typing indicator | Any service file | Just call `showTypingIndicator()` |
| Add/edit estate rules | `estate-rules.service.ts` or REST API | ~50-170 |
| Add new conversation state | `state-store.service.ts` | ~15-30 |
| Handle button responses | `conversation.service.ts` | ~500-600 |

---

## 💡 Pro Tips

1. **Always add typing indicators** before slow operations (database queries, API calls)
2. **Use buttons for confirmations** - easier for users than typing yes/no
3. **Store context** when waiting for user input (use `stateStore.setContext()`)
4. **Clear state** when conversation ends (use `stateStore.clearState()`)
5. **Test intents** by adding console.log in `intent.service.ts` to see what intent is detected
6. **Message format**: Use `*bold*`, `_italic_`, `~strikethrough~` for WhatsApp formatting

---

## 🐛 Debugging Tips

1. **See detected intent**: Check logs for `[IntentService]`
2. **See current state**: Check logs for `[StateStore]`
3. **See message flow**: Check logs for `[ConversationService]`
4. **See outgoing messages**: Check logs for `[MessengerService]`

Add this to any method:
```typescript
this.logger.log(`🔍 Debug: ${JSON.stringify(yourVariable, null, 2)}`);
```
