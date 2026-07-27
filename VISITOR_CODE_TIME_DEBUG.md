# Visitor Code Time Display Issue - Debug Investigation

## Issue Report
User reported that visitor code expiration time displays the same time as creation time instead of 1 hour later.

## Changes Made

### 1. Fixed Missing Logger in `visitor-code.service.ts`
**Problem**: Code referenced `this.logger` but Logger was not imported or initialized.

**Solution**: 
- Added `Logger` to imports from `@nestjs/common`
- Added `private readonly logger = new Logger(VisitorCodeService.name);` to class

### 2. Enhanced Debug Logging in `visitor-code.service.ts`

Added comprehensive logging to track expiration calculation:
```typescript
// Calculate expiration time
const now = new Date();
const expiration = expiresAt
  ? new Date(expiresAt)
  : new Date(Date.now() + validHours * 60 * 60 * 1000);

// Log for debugging
this.logger.log(`⏰ Code expiration calculated:`);
this.logger.log(`  - Now (ISO): ${now.toISOString()}`);
this.logger.log(`  - Now (Locale): ${now.toLocaleString()}`);
this.logger.log(`  - Valid hours: ${validHours}`);
this.logger.log(`  - Calculation: ${Date.now()} + (${validHours} * 60 * 60 * 1000) = ${Date.now() + validHours * 60 * 60 * 1000}`);
this.logger.log(`  - Expires at (ISO): ${expiration.toISOString()}`);
this.logger.log(`  - Expires at (Locale): ${expiration.toLocaleString()}`);
this.logger.log(`  - Difference in ms: ${expiration.getTime() - now.getTime()}`);
this.logger.log(`  - Difference in hours: ${(expiration.getTime() - now.getTime()) / (60 * 60 * 1000)}`);
```

Added logging after database creation:
```typescript
this.logger.log(`📦 Visitor code created in database:`);
this.logger.log(`  - Code: ${visitorCode.code}`);
this.logger.log(`  - ExpiresAt (from DB): ${visitorCode.expiresAt}`);
this.logger.log(`  - ExpiresAt type: ${typeof visitorCode.expiresAt}`);
this.logger.log(`  - ExpiresAt (ISO): ${new Date(visitorCode.expiresAt).toISOString()}`);
this.logger.log(`  - ExpiresAt (Locale): ${new Date(visitorCode.expiresAt).toLocaleString()}`);
```

### 3. Enhanced Debug Logging in `estate-whatsapp.service.ts`

Added logging before sending WhatsApp messages to see what time is being displayed:

**For occupant messages:**
```typescript
const expiryTime = new Date(visitorCode.expiresAt);
this.logger.log(`📱 Preparing message for occupant:`);
this.logger.log(`  - Expiry from visitorCode: ${visitorCode.expiresAt}`);
this.logger.log(`  - Expiry as Date object: ${expiryTime}`);
this.logger.log(`  - Expiry (ISO): ${expiryTime.toISOString()}`);
this.logger.log(`  - Expiry (Locale): ${expiryTime.toLocaleString()}`);
```

**For visitor messages:**
```typescript
const visitorExpiryTime = new Date(visitorCode.expiresAt);
this.logger.log(`📱 Preparing message for visitor:`);
this.logger.log(`  - Expiry (Locale): ${visitorExpiryTime.toLocaleString()}`);
```

### 4. Fixed TypeScript Error in `estate-rules.service.ts`

**Problem**: Type conversion error with Prisma JSON field.

**Solution**: Changed type assertion from `as EstateRulesData` to `as unknown as EstateRulesData` for safe type conversion.

## Code Flow Analysis

### How Visitor Code Expiration Works:

1. **Creation** (`visitor-code.service.ts` line ~45):
   ```typescript
   const expiration = new Date(Date.now() + validHours * 60 * 60 * 1000);
   // Where validHours = 1
   ```

2. **Storage** (line ~76):
   ```typescript
   const visitorCode = await this.prisma.visitorCode.create({
     data: {
       expiresAt: expiration,
       // ...
     }
   });
   ```

3. **Display** (`estate-whatsapp.service.ts` line ~95):
   ```typescript
   Valid until: ${new Date(visitorCode.expiresAt).toLocaleString()}
   ```

## Potential Issues Being Investigated

1. **Timezone Issues**: The `toLocaleString()` method might be displaying times in different timezones
2. **Database Serialization**: PostgreSQL might be storing/returning dates in a way that affects the display
3. **Date Object Creation**: The conversion `new Date(visitorCode.expiresAt)` might not work as expected if the database returns a specific format

## Next Steps for User

1. **Generate a new visitor code** - The new logging will show detailed information about:
   - Current time when code is created
   - Calculated expiration time (1 hour later)
   - What's stored in database
   - What's being displayed to users

2. **Check backend logs** - Look for the debug output with:
   - `⏰ Code expiration calculated:` - Shows the calculation
   - `📦 Visitor code created in database:` - Shows what was stored
   - `📱 Preparing message for occupant:` - Shows what's being sent

3. **Compare times**:
   - Current time (ISO and Locale)
   - Expiration time (ISO and Locale)
   - Difference in hours (should be 1.0)

## Files Modified

1. `backend/src/visitor-code/visitor-code.service.ts` - Added Logger, enhanced debugging
2. `backend/src/whatsapp/domain/estate-whatsapp.service.ts` - Enhanced debugging for message display
3. `backend/src/estates/estate-rules.service.ts` - Fixed TypeScript type conversion error

## Verification

✅ All code compiles successfully (`npm run build` passes)
✅ Logger properly imported and initialized
✅ Comprehensive debug logging added at all critical points
✅ No TypeScript errors

## Expected Debug Output Example

When a visitor code is generated, you should see logs like:
```
⏰ Code expiration calculated:
  - Now (ISO): 2026-07-27T22:30:00.000Z
  - Now (Locale): 7/27/2026, 10:30:00 PM
  - Valid hours: 1
  - Calculation: 1753567800000 + (1 * 60 * 60 * 1000) = 1753571400000
  - Expires at (ISO): 2026-07-27T23:30:00.000Z
  - Expires at (Locale): 7/27/2026, 11:30:00 PM
  - Difference in ms: 3600000
  - Difference in hours: 1
```

This will help identify exactly where the time display issue occurs.
