# Debug Visitor Name Collection Issue

## Current Status
The visitor name collection flow is implemented correctly in the code, but names are not being saved properly.

## Debugging Steps

### 1. Check Backend Logs
Look for these specific log messages when you test:

```
[ConversationService] Processing message from 2348061230727: Generate Code
[ConversationService] Current context state: idle
[ConversationService] Updating state for 2348061230727: AWAITING_VISITOR_NAME
[ConversationService] State updated successfully for 2348061230727: AWAITING_VISITOR_NAME
```

Then when you send the name:

```
[ConversationService] Processing message from 2348061230727: Aleem
[ConversationService] Current context state: AWAITING_VISITOR_NAME
[ConversationService] User is in AWAITING_VISITOR_NAME state, treating message as visitor name
[ConversationService] Visitor name received: "Aleem"
[ConversationService] State cleared, generating code for visitor: Aleem
[EstateWhatsAppService] Generating visitor code for: Aleem (requested by 2348061230727)
```

### 2. Test the Flow

**Step 1:** Send "Generate Code" to WhatsApp
- Expected response: "Please provide the visitor's name:"
- Check logs for state update

**Step 2:** Send "Aleem" to WhatsApp
- Expected response: Visitor code with card
- Check logs for visitor name

### 3. Common Issues

#### Issue A: State Not Persisting
**Symptom:** Logs show state is "idle" when you send the name
**Cause:** State not being saved or different phone number
**Solution:** 
- Verify same phone number in both requests
- Check StateStore is working (in-memory Map)

#### Issue B: Text Not Being Extracted
**Symptom:** Logs show "Processing message from XXX: undefined"
**Cause:** Webhook payload not parsed correctly
**Solution:**
- Check webhook payload structure
- Verify Meta API version compatibility

#### Issue C: Intent Detection Overriding State
**Symptom:** State check is bypassed
**Cause:** Code flow issue
**Solution:**
- Verify state check happens BEFORE intent detection (line 53)
- Verify early return when state is AWAITING_VISITOR_NAME

#### Issue D: Multiple Requests
**Symptom:** Multiple webhook calls for same message
**Cause:** Meta sends status updates separately
**Solution:**
- Already handled - parser filters out status updates

### 4. Manual Test

Run this in your terminal to see the exact flow:

```bash
# Watch the backend logs
tail -f backend/logs/*.log

# Or if running in terminal, just watch the output
```

Then test via WhatsApp and watch for the log messages above.

### 5. Database Check

After testing, check what was actually saved:

```bash
cd backend
npx prisma studio
```

Look at the VisitorCode table and check the `visitorName` field.

### 6. Quick Fix Test

If the issue persists, try this simple test:

1. Stop the backend (Ctrl+C)
2. Clear any cached state: `rm -rf backend/dist`
3. Rebuild: `cd backend && npm run build`
4. Start again: `npm run start:dev`
5. Test the flow again

### 7. Alternative: Direct Database Insert Test

To verify the database is working:

```javascript
// Create a test visitor code directly
const testCode = await prisma.visitorCode.create({
  data: {
    code: 'TEST123',
    visitorName: 'Test Visitor',
    occupantId: 'your-occupant-id',
    estateId: 'your-estate-id',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  },
});
console.log('Test code created:', testCode.visitorName);
```

If this works, the issue is in the WhatsApp flow, not the database.

## Next Steps

1. Test the flow and capture the exact logs
2. Share the logs showing:
   - The "Generate Code" request
   - The "Aleem" request
   - Any error messages
3. Check the database to see what name was actually saved

## Expected vs Actual

**Expected:**
- State: idle → AWAITING_VISITOR_NAME → idle
- Name: "Aleem" → saved as "Aleem"

**Actual (if broken):**
- State: ??? (check logs)
- Name: ??? (check database)

Share the actual values and we can pinpoint the exact issue.
