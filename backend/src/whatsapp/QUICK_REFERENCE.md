# WhatsApp System - Quick Reference

## 📁 File Structure at a Glance

```
whatsapp/
├── inbound/          → Receives webhooks, parses formats
├── conversation/     → Detects intent, manages state, routes
├── domain/           → Business logic (generate codes, etc.)
├── outbound/         → Sends messages with smart features
├── providers/        → Meta/Twilio API implementations
└── interfaces/       → Common contracts
```

## 🔄 Message Flow (Simple)

```
1. Webhook arrives → inbound/webhook.controller.ts
2. Parse format → inbound/inbound.parser.ts
3. Load context → conversation/state.store.ts
4. Detect intent → conversation/intent.service.ts
5. Route & handle → conversation/conversation.service.ts
6. Execute logic → domain/estate-whatsapp.service.ts
7. Send response → outbound/messenger.service.ts
8. Via provider → providers/meta.provider.ts OR twilio.provider.ts
```

## 🎯 Key Files & Their Jobs

| File | What It Does |
|------|--------------|
| `webhook.controller.ts` | Receives WhatsApp webhooks |
| `inbound.parser.ts` | Converts Meta/Twilio → standard format |
| `conversation.service.ts` | **MAIN BRAIN** - orchestrates everything |
| `intent.service.ts` | Understands what user wants |
| `state.store.ts` | Remembers conversation context |
| `estate-whatsapp.service.ts` | Generates codes, sends cards |
| `messenger.service.ts` | Sends messages with typing, delays |
| `provider.factory.ts` | Chooses Meta or Twilio |
| `meta.provider.ts` | Meta WhatsApp Business API |
| `twilio.provider.ts` | Twilio WhatsApp API |

## 🧠 Conversation States

```typescript
'idle'                    // Normal state
'AWAITING_VISITOR_NAME'   // Waiting for name after "Register"
'AWAITING_CANCEL_INFO'    // Waiting for code/name to cancel
```

## 🎭 Supported Intents

- `greeting` - Hi, hello
- `generate visitor code` - Register visitor
- `list visitors` - Show my visitors
- `cancel visitor code` - Cancel access
- `verify visitor code` - Check code
- `visitor departure` - Mark as left
- `visitor at gate` - Notify arrival at gate
- `help` - Show help
- `fallback` - Didn't understand

## 🔧 Environment Variables

```bash
# Meta (recommended)
META_ACCESS_TOKEN=xxx
META_PHONE_NUMBER_ID=xxx

# OR Twilio
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
```

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Button title too long | Max 20 characters |
| Occupant not found | Register phone in database |
| Messages not sending | Check provider credentials |
| State not persisting | In-memory storage (resets on restart) |

## 📚 Full Documentation

- `WHATSAPP_SYSTEM_EXPLAINED.md` - Complete architecture
- `WHATSAPP_SYSTEM_PART2.md` - Features & advanced topics
- `VISITOR_ACCESS_FLOW.md` - End-to-end visitor flow
