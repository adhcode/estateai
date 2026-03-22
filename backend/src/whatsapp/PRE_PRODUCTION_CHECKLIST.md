# WhatsApp System - Pre-Production Checklist

## 🎯 Complete Testing & Verification Guide

This document provides a comprehensive checklist to ensure your WhatsApp system is production-ready.

---

## ✅ Phase 1: Configuration Verification

### 1.1 Environment Variables
```bash
# Check all required variables are set
□ META_ACCESS_TOKEN (or TWILIO_ACCOUNT_SID)
□ META_PHONE_NUMBER_ID (or TWILIO_AUTH_TOKEN)
□ META_VERIFY_TOKEN
□ BACKEND_URL (public URL for webhooks)
□ DATABASE_URL
□ TELEGRAPH_ENABLED or IMGBB_API_KEY (for image upload)
```

**Test:**
```bash
# Run this to verify
curl http://localhost:3001/api/whatsapp/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "provider": "meta",
  "timestamp": "2024-03-14T..."
}
```

### 1.2 Database Setup
```bash
□ Prisma migrations applied
□ At least one Estate created
□ At least one Unit created
□ At least one Occupant with phone number registered
```

**Test:**
```bash
# Check database
npx prisma studio
# Verify: Estate → Unit → Occupant with phone
```

### 1.3 Webhook Configuration
```bash
□ Webhook URL is publicly accessible (ngrok or production domain)
□ Webhook URL format: https://your-domain.com/api/webhooks/meta/whatsapp
□ Webhook verified in Meta Business Manager
□ Test message received successfully
```

---

## ✅ Phase 2: Core Flow Testing

### 2.1 Greeting Flow
**Test:** Send "Hello"

**Expected:**
```
Kira: Hello I'm Kira, your estate assistant.

You can use me to register visitors for gate access and notify security ahead of their arrival.

Would you like to register a visitor now?

[Register Visitor] [Check Status] [Cancel Access]
```

**Verify:**
- [ ] Message received within 3 seconds
- [ ] All 3 buttons displayed
- [ ] Button titles under 20 characters
- [ ] Friendly, professional tone


### 2.2 Register Visitor Flow (Button)
**Test:** Click "Register Visitor" button

**Expected:**
```
Kira: Please provide the visitor's name:
```

**Then send:** "John Doe"

**Expected:**
```
Kira: Access created for John Doe

Code: ABC123
Valid until: [timestamp]

Access card attached below.

[Image: Visitor card with QR code]

What would you like to do next?
[Cancel Access] [My Visitors] [Done]
```

**Verify:**
- [ ] Code generated (6-8 alphanumeric characters)
- [ ] Expiry time is 24 hours from now
- [ ] Visitor card image sent
- [ ] QR code visible and scannable
- [ ] Follow-up buttons displayed

### 2.3 Register Visitor Flow (Natural Language)
**Test Cases:**

**Test 1:** "Generate code for Sarah"
- [ ] Extracts name "Sarah"
- [ ] Generates code immediately
- [ ] No additional prompts

**Test 2:** "Sarah is coming to visit"
- [ ] Extracts name "Sarah"
- [ ] Generates code immediately

**Test 3:** "I need a visitor code"
- [ ] Asks for visitor name
- [ ] Waits for name input

### 2.4 Visitor At Gate Flow
**Test:** "Seun is at the gate"

**Expected:**
```
Kira: Got it! Seun is at the gate.

What would you like to do?
[Generate Code] [Check Status] [Done]
```

**Then click:** "Generate Code"

**Expected:**
```
Kira: Access created for Seun
Code: XYZ789
...
```

**Verify:**
- [ ] Name "Seun" extracted correctly
- [ ] Stored in context
- [ ] Used automatically when Generate Code clicked
- [ ] No prompt for name


---

### 2.5 List Visitors Flow
**Test:** Click "Check Status" or send "list my visitors"

**Expected:**
```
Kira: Your Active Visitors (2):

1. John Doe
   Code: *ABC123*
   Expires: [timestamp]

2. Sarah Smith
   Code: *XYZ789*
   Expires: [timestamp]

What would you like to do?
[Generate Code] [Cancel Code] [Done]
```

**Verify:**
- [ ] All active visitors displayed
- [ ] Codes formatted with bold
- [ ] Expiry times shown
- [ ] Follow-up buttons displayed

**Test (No Visitors):** When user has no visitors

**Expected:**
```
Kira: You don't have any active visitors.

Would you like to generate a visitor code?
[Generate Code] [Help]
```

---

### 2.6 Cancel Visitor Flow (Smart Cancel)

**Test 1:** Click "Cancel Access" right after generating code

**Expected:**
```
Kira: Would you like to cancel access for John Doe?

[Yes, John Doe] [Cancel another] [Nevermind]
```

**Then click:** "Yes, John Doe"

**Expected:**
```
Kira: Visitor code ABC123 for John Doe has been cancelled.

The code can no longer be used for entry.

[My Visitors] [Generate Code] [Done]
```

**Verify:**
- [ ] System remembers last generated visitor
- [ ] Offers quick cancel option
- [ ] Button title under 20 characters
- [ ] Code successfully cancelled

**Test 2:** Cancel by code

**Send:** "cancel ABC123"

**Expected:**
```
Kira: Visitor code ABC123 for John Doe has been cancelled.

The code can no longer be used for entry.
```

**Verify:**
- [ ] Code extracted correctly
- [ ] Visitor found and cancelled
- [ ] Confirmation message sent

**Test 3:** Cancel by name

**Send:** "cancel John"

**Expected:**
```
Kira: Visitor code ABC123 for John Doe has been cancelled.

The code can no longer be used for entry.
```

**Verify:**
- [ ] Name extracted correctly
- [ ] Partial name matching works
- [ ] Only active codes cancelled

**Test 4:** Cancel without info

**Send:** "cancel code"

**Expected:**
```
Kira: Which visitor code would you like to cancel?

You can provide:
• The visitor code (e.g., "ABC123")
• The visitor name (e.g., "Jackson")
```

**Then send:** "ABC123"

**Expected:**
```
Kira: Visitor code ABC123 for John Doe has been cancelled.
```

**Verify:**
- [ ] System enters AWAITING_CANCEL_INFO state
- [ ] Accepts code in next message
- [ ] State cleared after processing

---

### 2.7 Visitor Departure Flow
**Test:** "John has left"

**Expected:**
```
Kira: John Doe has been marked as departed.

Thank you for updating!

[My Visitors] [Generate Code] [Done]
```

**Verify:**
- [ ] Name extracted correctly
- [ ] Visitor marked as departed
- [ ] Confirmation sent

---

## ✅ Phase 3: Advanced Features Testing

### 3.1 Context Memory
**Test Sequence:**
1. Generate code for "Sarah"
2. Send "Hello" (should reset context but keep last visitor)
3. Click "Cancel Access"
4. Should offer to cancel Sarah

**Verify:**
- [ ] Last generated visitor persists across greetings
- [ ] Context data properly stored
- [ ] Quick cancel still works

### 3.2 Button Interactions
**Test:** Click all buttons in sequence

**Verify:**
- [ ] All button IDs map correctly to commands
- [ ] Button responses processed immediately
- [ ] No duplicate processing

### 3.3 Natural Language Variations
**Test these phrases:**
- "Generate code for Michael"
- "Michael is coming to visit"
- "I need a visitor code"
- "Create access for Sarah"
- "Sarah is at the gate"

**Verify:**
- [ ] All variations detected correctly
- [ ] Names extracted properly
- [ ] Appropriate responses sent

---

## ✅ Phase 4: Error Handling & Edge Cases

### 4.1 Unregistered User
**Test:** Send message from unregistered phone number

**Expected:**
```
Kira: Hello! 👋

It looks like your phone number isn't registered in our system yet.

To get started with visitor management, please contact your facility manager...
```

**Verify:**
- [ ] Friendly error message
- [ ] Clear instructions provided
- [ ] No system crash

### 4.2 Invalid Inputs
**Test Cases:**
- Empty visitor name: ""
- Very long name: "A" * 100
- Special characters: "John@#$%"
- Invalid code: "123" (too short)
- Non-existent code: "ZZZZZZ"

**Verify:**
- [ ] Validation works
- [ ] Appropriate error messages
- [ ] System remains stable

### 4.3 Already Used/Cancelled Codes
**Test:** Try to cancel a code that's already cancelled

**Expected:**
```
Kira: This code has already been cancelled
```

**Test:** Try to cancel a used code

**Expected:**
```
Kira: Cannot cancel a code that has already been used
```

**Verify:**
- [ ] Status checks work
- [ ] Clear error messages
- [ ] No data corruption

### 4.4 Concurrent Requests
**Test:** Send multiple messages rapidly

**Verify:**
- [ ] All messages processed
- [ ] No race conditions
- [ ] Context remains consistent

---

## ✅ Phase 5: Performance & Security

### 5.1 Response Times
**Measure:**
- [ ] Greeting response: < 2 seconds
- [ ] Code generation: < 5 seconds
- [ ] List visitors: < 3 seconds
- [ ] Cancel code: < 2 seconds

### 5.2 Image Upload
**Verify:**
- [ ] Visitor card generated successfully
- [ ] Image uploaded to public hosting
- [ ] URL accessible from WhatsApp
- [ ] QR code scannable

### 5.3 Security Checks
**Verify:**
- [ ] Users can only cancel their own codes
- [ ] Phone number validation works
- [ ] No SQL injection vulnerabilities
- [ ] Sensitive data not logged

### 5.4 Rate Limiting
**Test:** Send 20 messages in 10 seconds

**Verify:**
- [ ] System handles load
- [ ] No crashes
- [ ] Responses still sent

---

## ✅ Phase 6: Production Readiness

### 6.1 Environment Configuration
```bash
□ Production webhook URL configured
□ SSL certificate valid
□ Database backups enabled
□ Monitoring/logging configured
□ Error alerting setup
```

### 6.2 Documentation
```bash
□ README updated
□ API documentation complete
□ Troubleshooting guide available
□ User guide created
```

### 6.3 Monitoring
```bash
□ Health check endpoint working
□ Logs being collected
□ Error tracking enabled
□ Performance metrics tracked
```

### 6.4 Backup & Recovery
```bash
□ Database backup strategy
□ Rollback plan documented
□ Emergency contacts listed
```

---

## 🎯 Recommendations for Improvement

### High Priority
1. **Add visitor photo capture** - Allow residents to upload visitor photos
2. **Implement visitor history** - Track all past visitors with timestamps
3. **Add bulk code generation** - Generate multiple codes at once
4. **Implement code expiry notifications** - Alert residents before codes expire

### Medium Priority
5. **Add visitor check-in/out tracking** - Automatic tracking when codes are used
6. **Implement recurring visitors** - Save frequent visitors for quick access
7. **Add estate-wide announcements** - Broadcast messages to all residents
8. **Implement visitor pre-approval** - Allow residents to pre-approve visitors

### Low Priority
9. **Add multi-language support** - Support multiple languages
10. **Implement voice messages** - Allow voice note responses
11. **Add visitor ratings** - Rate visitor behavior
12. **Implement visitor blacklist** - Block problematic visitors

---

## 📋 Final Checklist

Before going to production:
- [ ] All Phase 1 tests passed
- [ ] All Phase 2 tests passed
- [ ] All Phase 3 tests passed
- [ ] All Phase 4 tests passed
- [ ] All Phase 5 tests passed
- [ ] All Phase 6 items completed
- [ ] Load testing completed
- [ ] Security audit completed
- [ ] User acceptance testing completed
- [ ] Rollback plan documented
- [ ] Team trained on system
- [ ] Support process established

---

## 🚀 Go-Live Steps

1. **Final backup** - Backup all data
2. **Deploy to production** - Deploy code to production server
3. **Verify webhook** - Test webhook with Meta
4. **Send test message** - Verify end-to-end flow
5. **Monitor for 1 hour** - Watch logs and metrics
6. **Announce to users** - Inform residents system is live
7. **Stay on standby** - Monitor for first 24 hours

---

**Status:** Ready for comprehensive testing
**Last Updated:** March 14, 2026
**Version:** 1.0.0
