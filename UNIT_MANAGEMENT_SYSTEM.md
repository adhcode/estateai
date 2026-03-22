# Unit Management System

## Overview
The unit management system ensures proper organization of estate units with strict constraints to maintain data integrity.

## Key Features

### 1. Bulk Unit Creation
When a super admin creates an estate, they can specify the unit configuration:
- Total number of blocks (1-100)
- Flats per block (1-50)
- Custom naming prefixes (optional)

**Example Configuration:**
```json
{
  "name": "Sunshine Estate",
  "address": "123 Main Street",
  "unitConfig": {
    "totalBlocks": 40,
    "flatsPerBlock": 12,
    "blockPrefix": "Block",
    "flatPrefix": "Flat"
  }
}
```

This will create 480 units (40 blocks × 12 flats):
- Block 1, Flat 1
- Block 1, Flat 2
- ...
- Block 40, Flat 12

### 2. One Primary Resident Per Unit
**Constraint:** Each unit can have ONLY ONE primary resident (type: RESIDENT)

**Enforcement:**
- When adding a primary resident, the system checks if the unit already has one
- If a primary resident exists, the operation is rejected with a clear error message
- When a primary resident is removed, the unit is marked as unoccupied

### 3. Household Members
- Multiple household members can be added to a unit
- Household members must be linked to the primary resident
- Primary residents cannot be deleted if they have active household members
- Household members are automatically removed when their primary resident is removed

### 4. Unit Occupancy Tracking
- Units are marked as `isOccupied: true` when a primary resident is added
- Units are marked as `isOccupied: false` when the primary resident is removed
- Available units can be queried for assignment

## API Endpoints

### Create Estate with Units
```http
POST /estates
Content-Type: application/json

{
  "name": "Estate Name",
  "address": "Estate Address",
  "phoneNumber": "+1234567890",
  "unitConfig": {
    "totalBlocks": 40,
    "flatsPerBlock": 12
  }
}
```

### Bulk Create Units for Existing Estate
```http
POST /estates/:estateId/units/bulk-create
Content-Type: application/json

{
  "totalBlocks": 40,
  "flatsPerBlock": 12,
  "blockPrefix": "Block",
  "flatPrefix": "Flat"
}
```

### Get Available Units
```http
GET /units/available/:estateId
```

### Add Primary Resident
```http
POST /occupants
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "estateId": "estate-id",
  "unitId": "unit-id",
  "type": "RESIDENT"
}
```

**Response if unit already occupied:**
```json
{
  "statusCode": 400,
  "message": "This unit already has a primary resident: Jane Smith. Only one primary resident is allowed per unit."
}
```

## Database Schema

### Unit Model
```prisma
model Unit {
  id         String     @id @default(cuid())
  estateId   String
  block      String     // "Block 1"
  flat       String     // "Flat 4"
  isOccupied Boolean    @default(false)
  
  estate     Estate     @relation(fields: [estateId], references: [id])
  occupants  Occupant[]
  
  @@unique([estateId, block, flat])
}
```

### Occupant Model
```prisma
model Occupant {
  id                String       @id @default(cuid())
  name              String
  phone             String?
  estateId          String
  unitId            String
  type              OccupantType @default(RESIDENT)
  primaryOccupantId String?      // For HOUSEHOLD_MEMBER only
  isActive          Boolean      @default(true)
  
  estate            Estate        @relation(fields: [estateId], references: [id])
  unit              Unit          @relation(fields: [unitId], references: [id])
  primaryOccupant   Occupant?     @relation("PrimaryOccupant", fields: [primaryOccupantId], references: [id])
  householdMembers  Occupant[]    @relation("PrimaryOccupant")
}

enum OccupantType {
  RESIDENT         // Primary resident (ONE per unit)
  HOUSEHOLD_MEMBER // Family members (MANY per unit)
}
```

## Business Rules

1. **Unit Uniqueness:** Each combination of (estateId, block, flat) must be unique
2. **Primary Resident Limit:** Only ONE active primary resident per unit
3. **Household Member Dependency:** Household members must have a valid primary resident
4. **Deletion Protection:** Primary residents with household members cannot be deleted
5. **Occupancy Tracking:** Unit occupancy status is automatically managed

## Frontend Implementation

### Super Admin - Estate Creation
1. Estate details form
2. Unit configuration section:
   - Number of blocks (1-40 for this estate)
   - Flats per block (1-12 for this estate)
   - Preview of total units to be created
3. Submit creates estate + all units in one transaction

### Estate Admin - Add Occupant
1. Select available (unoccupied) unit from dropdown
2. Enter primary resident details
3. System validates unit availability
4. On success, unit is marked as occupied

### Estate Admin - Add Household Member
1. Select existing primary resident
2. Enter household member details
3. System links to primary resident
4. Household member can generate visitor codes

## Error Handling

### Common Errors
- `Unit already has a primary resident` - Attempting to add second primary resident
- `Unit not found in this estate` - Invalid unit ID
- `Primary resident not found` - Invalid primary occupant ID for household member
- `Cannot delete primary resident with active household members` - Deletion protection

## Testing Checklist

- [ ] Create estate with 40 blocks × 12 flats = 480 units
- [ ] Verify all units are created with correct naming
- [ ] Add primary resident to unit - should succeed
- [ ] Try adding second primary resident to same unit - should fail
- [ ] Add household member to primary resident - should succeed
- [ ] Remove primary resident with household members - should fail
- [ ] Remove household members first, then primary resident - should succeed
- [ ] Verify unit is marked as unoccupied after primary resident removal
- [ ] Query available units - should show only unoccupied units
