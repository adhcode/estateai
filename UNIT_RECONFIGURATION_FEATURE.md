# Unit Reconfiguration Feature

## Overview
Super admins can now edit unit configurations for existing estates. The system safely handles reconfiguration by protecting occupied units while allowing changes to unoccupied ones.

## How It Works

### 1. View Current Configuration
When editing an estate, the system displays:
- Total units
- Number of blocks
- Flats per block
- Occupied units count
- Available units count
- Block and flat prefixes

### 2. Reconfigure Units
The reconfiguration process:
1. **Deletes** all unoccupied units
2. **Preserves** all occupied units (with residents)
3. **Creates** new units based on new configuration

### 3. Safety Measures
- Occupied units are NEVER deleted
- Warning message shows how many occupied units exist
- Confirmation dialog before proceeding
- Clear feedback on what will happen

## API Endpoints

### Get Unit Configuration
```http
GET /estates/:id/units/configuration

Response:
{
  "totalUnits": 480,
  "totalBlocks": 40,
  "flatsPerBlock": 12,
  "occupiedUnits": 25,
  "availableUnits": 455,
  "blockPrefix": "Block",
  "flatPrefix": "Flat"
}
```

### Delete Unoccupied Units
```http
DELETE /estates/:id/units/unoccupied

Response:
{
  "deletedCount": 455,
  "message": "Deleted 455 unoccupied units"
}
```

### Create Units (Existing Endpoint)
```http
POST /estates/:id/units/bulk-create
Content-Type: application/json

{
  "totalBlocks": 50,
  "flatsPerBlock": 15,
  "blockPrefix": "Block",
  "flatPrefix": "Flat"
}
```

## Frontend Flow

### Edit Estate Modal

1. **Estate Details Section**
   - Name, address, phone, description
   - Standard edit fields

2. **Unit Configuration Section** (Collapsible)
   - Shows current configuration
   - "Manage Units" button to expand

3. **Manage Units Section** (When Expanded)
   - Warning message about reconfiguration
   - Input fields for new configuration
   - "Reconfigure Units" button

### User Experience

**Scenario 1: Estate with No Occupied Units**
```
Current: 40 blocks × 12 flats = 480 units (0 occupied)
Action: Change to 50 blocks × 15 flats
Result: Delete 480 units, create 750 new units
```

**Scenario 2: Estate with Occupied Units**
```
Current: 40 blocks × 12 flats = 480 units (25 occupied, 455 available)
Action: Change to 50 blocks × 15 flats
Warning: "This estate has 25 occupied units. This will DELETE all 455 unoccupied units..."
Result: Keep 25 occupied units, delete 455 available, create 750 new units
Total: 775 units (25 old occupied + 750 new)
```

## Important Notes

### What Gets Preserved
✅ All occupied units (units with primary residents)
✅ All occupants in those units
✅ All household members
✅ All visitor codes

### What Gets Deleted
❌ Only unoccupied units (units without primary residents)

### Limitations
- Cannot change block/flat prefixes for existing units
- Cannot rename existing units
- Cannot delete occupied units
- Reconfiguration creates entirely new unit structure

## Use Cases

### 1. Initial Setup Mistake
Estate created with wrong configuration (e.g., 30 blocks instead of 40).
Solution: Reconfigure before any residents move in.

### 2. Estate Expansion
Estate adds new blocks or flats.
Solution: Reconfigure to add more units while keeping existing residents.

### 3. Reorganization
Estate wants different unit structure.
Solution: Reconfigure, but occupied units remain with old naming.

## Testing Checklist

### Basic Reconfiguration
- [ ] Edit estate with no occupied units
- [ ] Click "Manage Units"
- [ ] Change configuration (e.g., 40→50 blocks)
- [ ] Click "Reconfigure Units"
- [ ] Verify old units deleted
- [ ] Verify new units created
- [ ] Verify total count correct

### With Occupied Units
- [ ] Create estate with units
- [ ] Add primary resident to some units
- [ ] Edit estate
- [ ] View current configuration showing occupied count
- [ ] Click "Manage Units"
- [ ] See warning about occupied units
- [ ] Change configuration
- [ ] Click "Reconfigure Units"
- [ ] Confirm warning dialog
- [ ] Verify occupied units preserved
- [ ] Verify unoccupied units deleted
- [ ] Verify new units created
- [ ] Verify residents still in their units

### Edge Cases
- [ ] Reconfigure with all units occupied
- [ ] Reconfigure to smaller configuration
- [ ] Reconfigure multiple times
- [ ] Cancel reconfiguration
- [ ] Error handling (network failure)

## Database Impact

### Before Reconfiguration
```sql
SELECT COUNT(*) FROM units WHERE "estateId" = 'X';
-- Result: 480

SELECT COUNT(*) FROM units WHERE "estateId" = 'X' AND "isOccupied" = true;
-- Result: 25
```

### After Reconfiguration (40→50 blocks, 12→15 flats)
```sql
SELECT COUNT(*) FROM units WHERE "estateId" = 'X';
-- Result: 775 (25 old + 750 new)

SELECT COUNT(*) FROM units WHERE "estateId" = 'X' AND "isOccupied" = true;
-- Result: 25 (same occupied units)
```

## Security Considerations

1. **Authorization**: Only super admins can reconfigure units
2. **Data Protection**: Occupied units cannot be deleted
3. **Confirmation**: User must confirm before proceeding
4. **Audit Trail**: All operations logged
5. **Transaction Safety**: Operations are atomic

## Future Enhancements

Potential improvements:
1. Rename existing units without deleting
2. Merge/split units
3. Bulk unit operations
4. Unit templates
5. Undo reconfiguration
6. Preview before applying changes
7. Schedule reconfiguration for future date

## Error Messages

### Common Errors

**"Failed to reconfigure units"**
- Network error or server issue
- Check backend logs
- Retry operation

**"Estate not found"**
- Invalid estate ID
- Estate may have been deleted

**"Insufficient permissions"**
- User is not super admin
- Check user role

## Best Practices

1. **Before Reconfiguration**
   - Review current occupancy
   - Notify estate admin
   - Backup database
   - Plan new structure

2. **During Reconfiguration**
   - Avoid during peak hours
   - Monitor for errors
   - Verify completion

3. **After Reconfiguration**
   - Verify unit counts
   - Check occupied units intact
   - Test adding new residents
   - Update documentation

## Support

If issues occur:
1. Check browser console for errors
2. Check backend logs
3. Verify database state
4. Contact system administrator
