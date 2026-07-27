# Quick Reference Guide - Where to Find Everything

## 🎯 "I Want to Change..."

### 1. Message Templates (What the bot says)
**File**: `backend/src/whatsapp/domain/estate-whatsapp.service.ts`

| What to Change | Line | Example |
|---------------|------|---------|
| Visitor code message to occupant | ~103 | `Access created for ${params.visitorName}...` |
| Visitor code message to visitor | ~130 | `Hello ${params.visitorName}...` |
| Estate rules response | ~860 | Rule answer format |
| Visitor arrival notification | ~228 | `${params.visitorName} has arrived...` |

### 2. Confirmation Messages & Buttons
**File**: `backend/src/whatsapp/conversation/conversation.service.ts`

| What to Change | Line | Example |
|---------------|------|---------|
| "At the gate" confirmation | ~996 | `Got it! Do you want to generate...` |
| Button labels (Yes/No) | ~1002 | `'Yes ✓'`, `'No'` |
| After "Yes" message | ~551 | `Great! What's ${visitorName}'s phone number?` |
| After "No" message | ~566 | `Okay, no problem!` |

### 3. Intent Detection (What triggers actions)
**File**: `backend/src/whatsapp/conversation/intent.service.ts`

| What Intent | Line | Pattern Example |
|------------|------|----------------|
| Visitor at gate | ~238 | `/at\s+(?:the\s+)?gate/i` |
| Generate code | ~255 | `/generate.*code/i` |
| Estate rules query | ~425 | `/(rule|policy|allowed)/i` |
| Greeting | ~110 | `/^(hi|hello|hey)/i` |

### 4. Add Typing Indicators
**Any service file** - Just add this before sending messages:

```typescript
await this.messengerService.showTypingIndicator(phoneNumber);
// Then send your message
await this.messengerService.sendText({ to: phoneNumber, body: 'Message' });
```

**Location**: Available in any service that injects `MessengerService`

### 5. Estate Rules (CRUD Operations)

#### Via REST API
**File**: `backend/src/estates/estate-rules.controller.ts`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/estates/:estateId/rules` | GET | Get all rules |
| `/estates/:estateId/rules` | POST | Update all rules |
| `/estates/:estateId/rules/add` | POST | Add one rule |
| `/estates/:estateId/rules/:ruleId` | DELETE | Remove rule |
| `/estates/:estateId/rules/search` | POST | Search rules |

#### Via Service
**File**: `backend/src/estates/estate-rules.service.ts`

| Method | Line | Purpose |
|--------|------|---------|
| `getEstateRules()` | ~27 | Get all rules for estate |
| `findMatchingRules()` | ~41 | Search/match rules |
| `updateEstateRules()` | ~103 | Update rules |
| `addRule()` | ~120 | Add a single rule |
| `removeRule()` | ~143 | Remove a rule |

#### Rule Format
```json
{
  "id": "unique-id",
  "category": "pets",
  "title": "Pet Policy",
  "rule": "Pets are not allowed",
  "keywords": ["pet", "pets", "dog", "cat"],
  "answer": "Full answer to display when asked"
}
```

## 📂 File Organization by Purpose

### Intent & Routing (User says something → What happens?)
```
backend/src/whatsapp/conversation/
├── intent.service.ts           ← Detect what user wants
├── conversation.service.ts     ← Route to handlers (MAIN FILE)
└── state.store.ts              ← Remember conversation state
```

### Business Logic (Actually do things)
```
backend/src/whatsapp/domain/
└── estate-whatsapp.service.ts  ← Generate codes, send messages
```

### Messaging (Send messages)
```
backend/src/whatsapp/outbound/
└── messenger.service.ts        ← Send text, media, typing indicators
```

### Estate Rules
```
backend/src/estates/
├── estate-rules.service.ts     ← CRUD operations
└── estate-rules.controller.ts  ← REST API endpoints
```

### Visitor Codes
```
backend/src/visitor-code/
├── visitor-code.service.ts     ← Generate, validate codes
├── qr-code.service.ts          ← Generate QR codes
└── visitor-card.service.ts     ← Generate visitor cards
```

## 🔄 Flow Diagrams

### Message Flow
```
User WhatsApp Message
    ↓
[Inbound Parser] Parse message
    ↓
[Conversation Service] handleIncoming()
    ↓
[State Store] Get conversation state
    ↓
[Intent Service] Detect intent
    ↓
[Conversation Service] routeIntent()
    ↓
[Handler Method] (e.g., handleVisitorAtGate)
    ↓
[Domain Service] (e.g., generateAndSendVisitorCode)
    ↓
[Messenger Service] Send response
    ↓
User receives WhatsApp message
```

### Visitor At Gate Confirmation Flow
```
User: "Olufemi is at the gate"
    ↓
Intent: visitor_at_gate (visitorName: "Olufemi")
    ↓
Handler: handleVisitorAtGate()
    ↓
Set state: awaiting_visitor_code_confirmation
Store: pendingVisitorName = "Olufemi"
    ↓
Send: Confirmation message with [Yes ✓] [No] buttons
    ↓
User clicks: "Yes ✓"
    ↓
Button handler: confirm_visitor_yes
    ↓
Set state: AWAITING_VISITOR_PHONE
Store: visitorName = "Olufemi"
    ↓
Send: "What's Olufemi's phone number?"
    ↓
User provides phone
    ↓
Generate and send visitor code
```

## 🛠️ Common Tasks

### Task 1: Add a New Intent
**Steps**:
1. Open `intent.service.ts`
2. Add pattern in `fallbackIntentDetection()` method (~line 106)
3. Return intent with name and parameters
4. Open `conversation.service.ts`
5. Add case in `routeIntent()` switch statement (~line 619)
6. Create handler method
7. Done!

**Example**:
```typescript
// In intent.service.ts
if (/my\s+gate\s+code/i.test(lowerText)) {
    return {
        name: 'get_my_gate_code',
        displayName: 'Get My Gate Code',
        confidence: 0.9,
        parameters: {}
    };
}

// In conversation.service.ts - routeIntent()
case 'get my gate code':
    await this.handleGetMyGateCode(message.from, responses);
    break;

// Add handler method
private async handleGetMyGateCode(phoneNumber: string, responses: OutgoingMessage[]): Promise<void> {
    // Your logic here
}
```

### Task 2: Add a Confirmation Flow (Like "at the gate")
**Steps**:
1. Add state name (e.g., `awaiting_something_confirmation`)
2. In your handler method, set state and store data in context
3. Send message with buttons
4. Add button handler (button ID handlers ~line 320)
5. Add state handler for text responses (~line 320)
6. Done!

### Task 3: Change a Message Template
**Steps**:
1. Open `estate-whatsapp.service.ts`
2. Search for the message text you want to change
3. Edit the template string
4. Compile: `npm run build`
5. Done!

### Task 4: Add/Edit Estate Rule
**Option A - Via API**:
```bash
POST /estates/{estateId}/rules/add
{
  "id": "parking-policy",
  "category": "parking",
  "title": "Parking Rules",
  "rule": "Visitors park in designated areas",
  "keywords": ["parking", "park", "car", "vehicle"],
  "answer": "Visitors must park in designated visitor parking areas near the main gate."
}
```

**Option B - Via Database**:
Update the `rules` JSONB column in the `estates` table.

### Task 5: Add Typing Indicator
**Any service method**:
```typescript
// Before a slow operation
await this.messengerService.showTypingIndicator(phoneNumber);

// Do slow operation (database query, API call, etc.)
const result = await this.someSlowOperation();

// Send message
await this.messengerService.sendText({
    to: phoneNumber,
    body: 'Your result...'
});
```

## 📊 State Reference

| State Name | Purpose | Next State |
|-----------|---------|------------|
| `idle` | Default, no active conversation | Any |
| `AWAITING_VISITOR_NAME` | Waiting for visitor name input | `AWAITING_VISITOR_PHONE` |
| `AWAITING_VISITOR_PHONE` | Waiting for visitor phone input | `idle` (after code gen) |
| `awaiting_visitor_code_confirmation` | Waiting for yes/no confirmation | `AWAITING_VISITOR_PHONE` or `idle` |
| `AWAITING_HOUSEHOLD_NAME` | Waiting for household member name | `AWAITING_HOUSEHOLD_PHONE` |
| `AWAITING_HOUSEHOLD_PHONE` | Waiting for household member phone | `idle` (after adding member) |
| `AWAITING_CANCEL_INFO` | Waiting for code/name to cancel | `idle` (after cancellation) |
| `AWAITING_RESIDENT_PHOTO` | Waiting for photo upload for ID | `idle` (after photo saved) |
| `AWAITING_PHOTO_UPDATE` | Waiting for photo update | `idle` (after photo updated) |

## 🎨 Button Format

Buttons use this format:
```typescript
{
    kind: 'interactive',
    to: phoneNumber,
    interactive: {
        type: 'button',
        body: { text: 'Your message here' },
        action: {
            buttons: [
                {
                    type: 'reply',
                    reply: {
                        id: 'button_id_here',      // Used in code to identify
                        title: 'Button Label'       // What user sees (max 20 chars)
                    }
                },
                // Max 3 buttons per message
            ]
        }
    }
}
```

## 🔍 Debugging Tips

### See What Intent Was Detected
Check logs for:
```
[IntentService] Intent detected: Visitor At Gate (0.9)
[ConversationService] Intent: Visitor At Gate (0.9), Parameters: {"visitorName":"Olufemi"}
```

### See Current State
Check logs for:
```
[StateStore] Saved context for +2348012345678
```

Add debug logging:
```typescript
this.logger.log(`🔍 Current state: ${context.state}`);
this.logger.log(`🔍 Context data: ${JSON.stringify(context.data, null, 2)}`);
```

### Test Specific Handler
Add at the start of your handler:
```typescript
this.logger.log(`🎯 Handler called: handleVisitorAtGate`);
this.logger.log(`🎯 Parameters: ${JSON.stringify(intent.parameters)}`);
```

## 📞 Support Files

| File | Purpose |
|------|---------|
| `WHATSAPP_CONVERSATION_GUIDE.md` | Comprehensive developer guide |
| `VISITOR_AT_GATE_CONFIRMATION_FLOW.md` | Detailed confirmation flow docs |
| `ESTATE_RULES_FEATURE.md` | Estate rules feature documentation |
| `TIMEZONE_FIX_COMPLETE.md` | Timezone formatting reference |

## ✅ Checklist for New Features

When adding a new conversational feature:

- [ ] Add intent pattern in `intent.service.ts`
- [ ] Add case in `routeIntent()` switch
- [ ] Create handler method
- [ ] Add state (if multi-step conversation)
- [ ] Add button handlers (if using buttons)
- [ ] Add state handler (if waiting for user input)
- [ ] Add typing indicators before slow operations
- [ ] Test with various phrasings
- [ ] Add to this guide!
- [ ] Run `npm run build` to verify compilation

---

**Remember**: 
- `intent.service.ts` = Understand user
- `conversation.service.ts` = Route & orchestrate
- `estate-whatsapp.service.ts` = Do the work
- `messenger.service.ts` = Send messages

Happy coding! 🚀
