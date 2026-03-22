# Household Member Management Feature

## Overview
Allow primary residents to add, edit, and remove household members via WhatsApp. Household members can also generate visitor codes.

## Backend Status
✅ **Already Implemented**
- Occupant model with `type` (RESIDENT | HOUSEHOLD_MEMBER)
- `primaryOccupantId` field for linking household members
- Service methods for creating/managing household members
- API endpoints ready

## Frontend Status
✅ **Already Implemented**
- Occupants page shows both residents and household members
- Can add household members via admin panel
- Shows relationship (Under: [Primary Resident])

## WhatsApp Feature (TO IMPLEMENT)

### New Intent: "Add Household Member"
**Trigger Phrases:**
- "Add household member"
- "Add family member"
- "Register household member"
- "Add [Name] to my household"

### Flow:
1. User: "Add household member"
2. Kira: "What's their full name?"
3. User: "John Doe"
4. Kira: "What's their WhatsApp number?"
5. User: "+1234567890"
6. Kira: "John Doe has been added to your household. They can now generate visitor codes."

### Additional Intents:

**List Household Members:**
- "List my household"
- "Show household members"
- "My family members"

**Remove Household Member:**
- "Remove [Name] from household"
- "Delete household member"

## Implementation Steps

### 1. Backend (WhatsApp)
- [ ] Add `add_household_member` intent to intent.service.ts
- [ ] Add conversation states: AWAITING_HOUSEHOLD_NAME, AWAITING_HOUSEHOLD_PHONE
- [ ] Create handler in conversation.service.ts
- [ ] Add method in estate-whatsapp.service.ts to create household member
- [ ] Add list/remove household member handlers

### 2. Frontend
- [ ] Improve occupants page UI (minimal design)
- [ ] Group by primary resident with expandable household members
- [ ] Add quick actions for household management

### 3. Testing
- [ ] Test WhatsApp flow end-to-end
- [ ] Verify household member can generate codes
- [ ] Test edit/remove functionality

## Data Flow

```
WhatsApp Message → Intent Detection → Conversation Handler → Estate WhatsApp Service → Occupants Service → Database
```

## Security
- Only primary residents can add household members to their unit
- Household members are linked to specific primary resident
- Phone number validation required
- WhatsApp number must be unique

## Benefits
1. Residents can self-manage household members
2. No admin intervention needed
3. Household members get full visitor code access
4. Maintains proper hierarchy (primary → household)
