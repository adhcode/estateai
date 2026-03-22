# Unit Setup Testing Guide

## Quick Start

### 1. Create Estate with Units (Super Admin)

**Frontend:**
1. Login as super admin
2. Navigate to "Estates" page
3. Click "Add Estate"
4. Fill in estate details:
   - Name: "Sunshine Estate"
   - Address: "123 Main Street"
   - Phone: "+1234567890"
5. Configure units:
   - Total Blocks: 40
   - Flats per Block: 12
   - Block Prefix: "Block"
   - Flat Prefix: "Flat"
6. Preview shows: "Total Units: 480"
7. Click "Create Estate & Units"

**Expected Result:**
- Estate created successfully
- 480 units created (Block 1-40, Flat 1-12 each)
- All units marked as `isOccupied: false`

**API Test:**
```bash
curl -X POST http://localhost:3000/estates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Sunshine Estate",
    "address": "123 Main Street",
    "phoneNumber": "+1234567890",
    "unitConfig": {
      "totalBlocks": 40,
      "flatsPerBlock": 12,
      "blockPrefix": "Block",
      "flatPrefix": "Flat"
    }
  }'
```

### 2. Add Primary Resident (Estate Admin)

**Frontend:**
1. Login as estate admin
2. Navigate to "Occupants" page
3. Click "Add Occupant"
4. Select unit: "Block 1, Flat 1"
5. Enter details:
   - Name: "John Doe"
   - Phone: "+1234567890"
   - Email: "john@example.com"
   - Type: "Primary Resident"
6. Click "Add Occupant"

**Expected Result:**
- Occupant created successfully
- Unit "Block 1, Flat 1" marked as `isOccupied: true`
- Occupant type: RESIDENT

**API Test:**
```bash
curl -X POST http://localhost:3000/occupants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "estateId": "ESTATE_ID",
    "unitId": "UNIT_ID",
    "type": "RESIDENT"
  }'
```

### 3. Try Adding Second Primary Resident (Should Fail)

**Frontend:**
1. Try to add another primary resident to "Block 1, Flat 1"
2. Enter details for "Jane Smith"
3. Click "Add Occupant"

**Expected Result:**
- Error message: "This unit already has a primary resident: John Doe. Only one primary resident is allowed per unit."
- No occupant created
- Unit remains occupied by John Doe

**API Test:**
```bash
curl -X POST http://localhost:3000/occupants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+0987654321",
    "estateId": "ESTATE_ID",
    "unitId": "SAME_UNIT_ID",
    "type": "RESIDENT"
  }'

# Expected Response:
# {
#   "statusCode": 400,
#   "message": "This unit already has a primary resident: John Doe. Only one primary resident is allowed per unit."
# }
```

### 4. Add Household Member

**Frontend:**
1. Navigate to "Occupants" page
2. Click on John Doe's card
3. Click "Add Household Member"
4. Enter details:
   - Name: "Jane Doe"
   - Phone: "+0987654321"
5. Click "Add Member"

**Expected Result:**
- Household member created successfully
- Linked to John Doe (primary resident)
- Jane Doe can generate visitor codes via WhatsApp

**API Test:**
```bash
curl -X POST http://localhost:3000/occupants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Jane Doe",
    "phone": "+0987654321",
    "estateId": "ESTATE_ID",
    "unitId": "UNIT_ID",
    "type": "HOUSEHOLD_MEMBER",
    "primaryOccupantId": "JOHN_DOE_ID"
  }'
```

### 5. Try Removing Primary Resident with Household Members (Should Fail)

**Frontend:**
1. Try to remove John Doe
2. Click "Remove" button

**Expected Result:**
- Error message: "Cannot delete primary resident with active household members. Please remove household members first."
- John Doe not removed

### 6. Remove Household Member First, Then Primary Resident

**Frontend:**
1. Remove Jane Doe (household member)
2. Confirm removal
3. Now remove John Doe (primary resident)
4. Confirm removal

**Expected Result:**
- Jane Doe removed successfully
- John Doe removed successfully
- Unit "Block 1, Flat 1" marked as `isOccupied: false`
- Unit available for new primary resident

### 7. Query Available Units

**API Test:**
```bash
curl -X GET http://localhost:3000/units/available/ESTATE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected Response:
# {
#   "success": true,
#   "data": [
#     {
#       "id": "unit-id",
#       "block": "Block 1",
#       "flat": "Flat 1",
#       "isOccupied": false,
#       ...
#     },
#     ...
#   ]
# }
```

## Test Scenarios

### Scenario 1: Full Estate Setup
1. Create estate with 40 blocks × 12 flats = 480 units
2. Verify all units created with correct naming
3. Check database: `SELECT COUNT(*) FROM units WHERE estateId = 'ESTATE_ID'` should return 480

### Scenario 2: Unit Assignment
1. Add primary resident to Block 1, Flat 1
2. Verify unit marked as occupied
3. Try adding another primary resident to same unit - should fail
4. Add household member to same unit - should succeed

### Scenario 3: Unit Vacancy
1. Remove all household members from a unit
2. Remove primary resident
3. Verify unit marked as unoccupied
4. Verify unit appears in available units list

### Scenario 4: Bulk Operations
1. Create 10 primary residents in different units
2. Verify 10 units marked as occupied
3. Query available units - should show 470 available

## Database Verification

### Check Unit Count
```sql
SELECT COUNT(*) as total_units FROM units WHERE "estateId" = 'ESTATE_ID';
```

### Check Occupied Units
```sql
SELECT COUNT(*) as occupied_units FROM units 
WHERE "estateId" = 'ESTATE_ID' AND "isOccupied" = true;
```

### Check Primary Residents per Unit
```sql
SELECT u.block, u.flat, COUNT(o.id) as resident_count
FROM units u
LEFT JOIN occupants o ON u.id = o."unitId" AND o.type = 'RESIDENT' AND o."isActive" = true
WHERE u."estateId" = 'ESTATE_ID'
GROUP BY u.id, u.block, u.flat
HAVING COUNT(o.id) > 1;
-- Should return 0 rows (no unit should have more than 1 primary resident)
```

### Check Household Members
```sql
SELECT 
  pr.name as primary_resident,
  u.block,
  u.flat,
  COUNT(hm.id) as household_member_count
FROM occupants pr
JOIN units u ON pr."unitId" = u.id
LEFT JOIN occupants hm ON hm."primaryOccupantId" = pr.id AND hm."isActive" = true
WHERE pr.type = 'RESIDENT' AND pr."isActive" = true
GROUP BY pr.id, pr.name, u.block, u.flat;
```

## Common Issues & Solutions

### Issue: "Unit already has a primary resident"
**Cause:** Trying to add second primary resident to occupied unit
**Solution:** Choose a different unoccupied unit or add as household member

### Issue: "Cannot delete primary resident with active household members"
**Cause:** Trying to remove primary resident before household members
**Solution:** Remove all household members first, then remove primary resident

### Issue: Units not created
**Cause:** Missing unitConfig in estate creation request
**Solution:** Include unitConfig object with totalBlocks and flatsPerBlock

### Issue: Household member creation fails
**Cause:** Invalid primaryOccupantId or primary resident not in same unit
**Solution:** Verify primary resident exists and is in the same unit

## Success Criteria

✅ Estate created with 480 units (40 blocks × 12 flats)
✅ All units have unique (estateId, block, flat) combination
✅ Only one primary resident can be assigned per unit
✅ Multiple household members can be added to a unit
✅ Unit occupancy status updates automatically
✅ Primary resident cannot be deleted with active household members
✅ Unit becomes available after primary resident removal
✅ Available units query returns only unoccupied units
