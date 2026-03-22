# WhatsApp Module

Provider-agnostic WhatsApp integration with Dialogflow NLU and clean architecture.

## Architecture

### 4-Layer Design

```
┌─────────────────────────────────────────────────────────┐
│  Transport Layer (Provider Adapter)                     │
│  ├── Meta Cloud API                                     │
│  ├── Twilio                                             │
│  └── Future: 360Dialog, Sendchamp, etc.                │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Messaging Orchestrator                                 │
│  ├── Retry logic                                        │
│  ├── Rate limiting                                      │
│  ├── Human-feel delays                                  │
│  └── Logging & monitoring                               │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Conversation Engine                                    │
│  ├── State machine                                      │
│  ├── Intent parsing (Dialogflow)                       │
│  ├── Session management                                 │
│  └── Flow routing                                       │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Domain Services                                        │
│  ├── Visitor management                                 │
│  ├── Estate operations                                  │
│  ├── Notifications                                      │
│  └── Business logic                                     │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Install Dependencies
```bash
npm install @google-cloud/dialogflow axios
```

### 2. Configure Environment
```env
# Choose provider
WHATSAPP_PROVIDER=meta

# Meta Cloud API
META_WA_PHONE_NUMBER_ID=your_id
META_WA_TOKEN=your_token
META_WA_VERIFY_TOKEN=your_verify_token

# Dialogflow
DIALOGFLOW_PROJECT_ID=your_project
DIALOGFLOW_CREDENTIALS='{"type":"service_account",...}'
```

### 3. Set Up Webhook
```
URL: https://yourdomain.com/api/whatsapp/webhook
Method: GET (verification) + POST (messages)
```

### 4. Test
```bash
# Health check
curl http://localhost:3001/api/whatsapp/webhook/health

# Webhook verification
curl "http://localhost:3001/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=your_token&hub.challenge=test"
```

## Usage

### Send Text Message
```typescript
import { MessengerService } from './whatsapp/outbound/messenger.service';

await messengerService.sendText({
  to: '+1234567890',
  body: 'Hello from EstateAI!',
});
```

### Send Media
```typescript
await messengerService.sendMedia({
  to: '+1234567890',
  type: 'image',
  url: 'https://example.com/qr-code.png',
  caption: 'Your visitor QR code',
});
```

### Send Interactive Buttons
```typescript
await messengerService.sendInteractive({
  to: '+1234567890',
  type: 'button',
  body: 'What would you like to do?',
  action: {
    buttons: [
      { id: 'gen_code', title: 'Generate Code' },
      { id: 'list_visitors', title: 'List Visitors' },
      { id: 'help', title: 'Help' },
    ],
  },
});
```

## Provider Switching

### Switch to Meta (Production)
```env
WHATSAPP_PROVIDER=meta
META_WA_PHONE_NUMBER_ID=123456789
META_WA_TOKEN=EAAxxxxx
```

### Switch to Twilio (Development)
```env
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
```

### Add New Provider
1. Create `providers/your-provider.provider.ts`
2. Implement `WhatsAppProvider` interface
3. Add to `provider.factory.ts`
4. Set `WHATSAPP_PROVIDER=your-provider`

## Dialogflow Setup

### Create Intents

**greeting**
- Training phrases: "hi", "hello", "hey", "good morning"
- Response: Handled in code

**generate_visitor_code**
- Training phrases: "generate code for John", "Sarah is coming"
- Parameters: `visitorName` (string), `visitorPhone` (phone-number)

**verify_visitor_code**
- Training phrases: "check code ABC123", "is XDF456 valid"
- Parameters: `code` (string)

**list_visitors**
- Training phrases: "list my visitors", "who's coming today"

**cancel_visitor_code**
- Training phrases: "cancel code ABC123", "revoke XDF456"
- Parameters: `code` (string)

**visitor_departure**
- Training phrases: "John has left", "ABC123 departed"
- Parameters: `code` (string), `visitorName` (string)

**help**
- Training phrases: "help", "what can you do"

## Features

✅ **Provider Independence**: Switch providers without code changes  
✅ **Professional NLU**: Dialogflow for intent detection  
✅ **Retry Logic**: Exponential backoff for failed messages  
✅ **Human Delays**: Natural typing simulation  
✅ **Session Management**: Stateful conversations  
✅ **Rate Limiting**: Prevent API abuse  
✅ **Comprehensive Logging**: Debug and monitor easily  
✅ **Type Safety**: Full TypeScript support  

## File Structure

```
whatsapp/
├── interfaces/
│   └── whatsapp-provider.interface.ts  # Provider contract
├── providers/
│   ├── meta.provider.ts                # Meta Cloud API
│   ├── twilio.provider.ts              # Twilio
│   └── provider.factory.ts             # Provider factory
├── inbound/
│   ├── webhook.controller.ts           # Webhook handler
│   └── inbound.parser.ts               # Message parser
├── outbound/
│   └── messenger.service.ts            # Message sender
├── conversation/
│   ├── conversation.service.ts         # Conversation engine
│   ├── intent.service.ts               # Dialogflow integration
│   └── state.store.ts                  # Session store
├── domain/
│   └── estate-whatsapp.service.ts      # Business logic
└── whatsapp.module.ts                  # Module definition
```

## Testing

```bash
# Unit tests
npm test whatsapp

# E2E tests
npm run test:e2e

# Manual testing
curl -X POST http://localhost:3001/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"entry":[{"changes":[{"value":{"messages":[{"from":"1234567890","text":{"body":"hello"}}]}}]}]}'
```

## Monitoring

### Health Check
```bash
GET /api/whatsapp/webhook/health
```

Response:
```json
{
  "status": "healthy",
  "provider": "meta",
  "message": "Connected to EstateAI Business",
  "timestamp": "2025-02-04T..."
}
```

### Logs
```bash
tail -f logs/app.log | grep WhatsApp
```

## Troubleshooting

### Messages not sending
- Check provider credentials
- Verify phone number format (+country code)
- Check rate limits
- Review logs for errors

### Dialogflow not detecting intents
- Verify credentials JSON
- Check project ID
- Train with more examples
- Falls back to regex automatically

### Webhook verification fails
- Check verify token matches
- Ensure URL is publicly accessible
- Review Meta dashboard settings

## Best Practices

1. **Always use MessengerService** - Never call providers directly
2. **Handle errors gracefully** - Retry logic is built-in
3. **Log everything** - Helps with debugging
4. **Test with sandbox first** - Before going to production
5. **Monitor rate limits** - Meta: 80 msg/sec, Twilio: varies
6. **Use templates for notifications** - Better delivery rates
7. **Keep sessions short** - 30 min timeout default

## Next Steps

- [ ] Add Redis for state store (production)
- [ ] Implement message queue (Bull/BullMQ)
- [ ] Add analytics and metrics
- [ ] Create admin dashboard
- [ ] Set up monitoring (Sentry, etc.)
- [ ] Add more providers (360Dialog, Sendchamp)
- [ ] Implement rich media support
- [ ] Add conversation flows

## Support

- **Meta Docs**: https://developers.facebook.com/docs/whatsapp/cloud-api
- **Dialogflow**: https://cloud.google.com/dialogflow/docs
- **Twilio**: https://www.twilio.com/docs/whatsapp

---

Built with ❤️ for EstateAI
